import { FirestoreAdminService, adminDb } from './FirestoreAdminService';
import {
  ValidateLicenseRequest,
  ValidateLicenseData,
  ActivateInstallationRequest,
  HeartbeatRequest,
  DeactivateInstallationRequest,
  RenewLicenseApiRequest,
  ApiLogEntry,
  ApiErrorCode
} from '../types/apiTypes';

// Helper para parsear versiones de software "X.Y.Z"
function compararVersiones(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  const len = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < len; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

export const validationService = {
  /**
   * Valida integralmente una licencia para el sistema de inventario utilizando Firebase Admin SDK
   */
  async validarLicencia(
    reqData: ValidateLicenseRequest,
    clientIp: string
  ): Promise<{ exito: boolean; data?: ValidateLicenseData; codigoError?: ApiErrorCode; mensaje: string; status: number }> {
    const { licenseKey, uuidCliente, versionSistema, installationId } = reqData;

    if (!licenseKey || !uuidCliente || !versionSistema) {
      return {
        exito: false,
        status: 400,
        codigoError: 'DATOS_INVALIDOS',
        mensaje: 'Los campos licenseKey, uuidCliente y versionSistema son obligatorios.'
      };
    }

    // 1. Buscar Cliente por UUID o ID utilizando FirestoreAdminService
    const snapCliente = await adminDb
      .collection('clientes')
      .where('uuidCliente', '==', uuidCliente)
      .get();

    let clienteDoc = snapCliente.docs[0];
    if (!clienteDoc) {
      // Intentar por ID directo de Firestore
      const snapDoc = await adminDb.collection('clientes').doc(uuidCliente).get();
      if (snapDoc.exists) {
        clienteDoc = snapDoc as any;
      }
    }

    if (!clienteDoc) {
      return {
        exito: false,
        status: 404,
        codigoError: 'CLIENTE_NO_ENCONTRADO',
        mensaje: `No se encontró ningún cliente registrado con el UUID: ${uuidCliente}`
      };
    }

    const clienteData = clienteDoc.data() || {};
    if (clienteData.estado !== 'activo') {
      return {
        exito: false,
        status: 403,
        codigoError: 'CLIENTE_INACTIVO',
        mensaje: `El cliente '${clienteData.nombreEmpresa || uuidCliente}' se encuentra inactivo o desactivado.`
      };
    }

    // 2. Buscar Licencia utilizando FirestoreAdminService
    const snapLicencia = await adminDb
      .collection('licencias')
      .where('licenseKey', '==', licenseKey)
      .get();

    let licenciaDoc = snapLicencia.docs[0];
    if (!licenciaDoc) {
      // Intentar por ID directo
      const snapDoc = await adminDb.collection('licencias').doc(licenseKey).get();
      if (snapDoc.exists) {
        licenciaDoc = snapDoc as any;
      }
    }

    if (!licenciaDoc) {
      return {
        exito: false,
        status: 404,
        codigoError: 'LICENCIA_NO_ENCONTRADA',
        mensaje: `La clave de licencia '${licenseKey}' no existe en el sistema maestro.`
      };
    }

    const licenciaData = licenciaDoc.data() || {};

    // 3. Validar coincidencia de Cliente
    if (licenciaData.uuidCliente !== uuidCliente && licenciaData.clienteId !== clienteDoc.id) {
      return {
        exito: false,
        status: 403,
        codigoError: 'UUID_CLIENTE_INVALIDO',
        mensaje: 'La licencia especificada no pertenece al cliente solicitante.'
      };
    }

    // 4. Validar Estado de la Licencia
    const estado = licenciaData.estado;
    if (estado === 'suspendida') {
      return {
        exito: false,
        status: 403,
        codigoError: 'LICENCIA_SUSPENDIDA',
        mensaje: 'La licencia se encuentra suspendida temporalmente por administración.'
      };
    }
    if (estado === 'revocada') {
      return {
        exito: false,
        status: 403,
        codigoError: 'LICENCIA_REVOCADA',
        mensaje: 'La licencia ha sido revocada de forma permanente.'
      };
    }
    if (estado === 'inactiva') {
      return {
        exito: false,
        status: 403,
        codigoError: 'LICENCIA_INACTIVA',
        mensaje: 'La licencia aún no ha sido activada o se encuentra inactiva.'
      };
    }

    // 5. Validar Expiración de Licencia
    const fechaExpiracion = new Date(licenciaData.fechaExpiracion);
    const ahora = new Date();
    if (ahora > fechaExpiracion) {
      // Actualizar estado en Firestore a expirada si aún no lo estaba
      if (estado !== 'expirada') {
        await FirestoreAdminService.updateDoc('licencias', licenciaDoc.id, { estado: 'expirada' });
      }
      return {
        exito: false,
        status: 403,
        codigoError: 'LICENCIA_EXPIRADA',
        mensaje: `La licencia expiró el ${fechaExpiracion.toLocaleDateString('es-ES')}. Por favor, solicite una renovación.`
      };
    }

    // 6. Validar Versión de Sistema
    const vMin = licenciaData.versionMinima || '1.0.0';
    const vMax = licenciaData.versionMaxima || '99.99.99';

    if (compararVersiones(versionSistema, vMin) < 0 || compararVersiones(versionSistema, vMax) > 0) {
      return {
        exito: false,
        status: 403,
        codigoError: 'VERSION_NO_PERMITIDA',
        mensaje: `La versión del sistema (${versionSistema}) no está dentro del rango permitido (${vMin} - ${vMax}).`
      };
    }

    // Cálculo de Días Restantes
    const diffTime = fechaExpiracion.getTime() - ahora.getTime();
    const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const instalacionesUsadas = Array.isArray(licenciaData.installationIds)
      ? licenciaData.installationIds.length
      : 0;

    const estaInstalado = installationId && Array.isArray(licenciaData.installationIds)
      ? licenciaData.installationIds.includes(installationId)
      : false;

    // Actualizar última validación mediante FirestoreAdminService
    await FirestoreAdminService.updateDoc('licencias', licenciaDoc.id, {
      ultimaValidacion: new Date().toISOString(),
      ipUltimaConexion: clientIp
    });

    return {
      exito: true,
      status: 200,
      mensaje: 'Licencia válida y autorizada.',
      data: {
        licenciaValida: true,
        licenseKey: licenciaData.licenseKey,
        uuidCliente: clienteData.uuidCliente || uuidCliente,
        nombreEmpresa: clienteData.nombreEmpresa || 'Cliente Empresarial',
        estadoLicencia: licenciaData.estado,
        tipoLicencia: licenciaData.tipoLicencia,
        versionMinima: vMin,
        versionMaxima: vMax,
        fechaExpiracion: licenciaData.fechaExpiracion,
        diasRestantes,
        cantidadInstalacionesPermitidas: licenciaData.cantidadInstalacionesPermitidas || 1,
        cantidadInstalacionesUsadas: instalacionesUsadas,
        installationIdRegistrado: estaInstalado
      }
    };
  },

  /**
   * Registra y activa una instalación mediante su Installation ID permanente
   */
  async activarInstalacion(
    reqData: ActivateInstallationRequest,
    clientIp: string
  ): Promise<{ exito: boolean; data?: any; codigoError?: ApiErrorCode; mensaje: string; status: number }> {
    const { licenseKey, uuidCliente, installationId, nombreEquipo, versionSistema, detallesHardware } = reqData;

    if (!licenseKey || !uuidCliente || !installationId || !nombreEquipo) {
      return {
        exito: false,
        status: 400,
        codigoError: 'DATOS_INVALIDOS',
        mensaje: 'licenseKey, uuidCliente, installationId y nombreEquipo son obligatorios.'
      };
    }

    // Primero validar la licencia
    const val = await this.validarLicencia(
      { licenseKey, uuidCliente, versionSistema: versionSistema || '1.0.0', installationId, nombreEquipo },
      clientIp
    );

    if (!val.exito) {
      return val;
    }

    // Buscar documento de licencia
    const snapLicencia = await adminDb
      .collection('licencias')
      .where('licenseKey', '==', licenseKey)
      .get();
    const licenciaDoc = snapLicencia.docs[0];
    const licenciaData = licenciaDoc.data();

    const installationIds: string[] = Array.isArray(licenciaData.installationIds)
      ? licenciaData.installationIds
      : [];

    const limiteInstalaciones = licenciaData.cantidadInstalacionesPermitidas || 1;

    // Verificar si ya está registrada
    const yaRegistrada = installationIds.includes(installationId);

    if (!yaRegistrada) {
      if (installationIds.length >= limiteInstalaciones) {
        return {
          exito: false,
          status: 409,
          codigoError: 'MAXIMA_INSTALACIONES_ALCANZADO',
          mensaje: `Se ha alcanzado el límite máximo de ${limiteInstalaciones} instalaciones permitidas para esta licencia.`
        };
      }

      // Agregar a la lista de instalaciones de la licencia
      await FirestoreAdminService.updateDoc('licencias', licenciaDoc.id, {
        installationIds: FirestoreAdminService.arrayUnion(installationId),
        ultimaConexion: new Date().toISOString()
      });
    }

    // Guardar/Actualizar registro en la colección 'instalaciones'
    const snapInst = await adminDb
      .collection('instalaciones')
      .where('installationId', '==', installationId)
      .where('licenseKey', '==', licenseKey)
      .get();

    const ahoraIso = new Date().toISOString();

    if (snapInst.empty) {
      await FirestoreAdminService.addDoc('instalaciones', {
        installationId,
        licenseKey,
        uuidCliente,
        nombreEquipo,
        versionSistema: versionSistema || '1.0.0',
        ip: clientIp,
        estado: 'activa',
        fechaActivacion: ahoraIso,
        ultimaConexion: ahoraIso,
        detallesHardware: detallesHardware || {}
      });
    } else {
      const instDoc = snapInst.docs[0];
      await FirestoreAdminService.updateDoc('instalaciones', instDoc.id, {
        nombreEquipo,
        versionSistema: versionSistema || '1.0.0',
        ip: clientIp,
        estado: 'activa',
        ultimaConexion: ahoraIso
      });
    }

    return {
      exito: true,
      status: 201,
      mensaje: yaRegistrada
        ? 'Instalación revalidada y actualizada correctamente.'
        : 'Nueva instalación activada y vinculada a la licencia exitosamente.',
      data: {
        installationId,
        licenseKey,
        uuidCliente,
        nombreEquipo,
        estado: 'activa',
        fechaActivacion: ahoraIso,
        instalacionesUsadas: yaRegistrada ? installationIds.length : installationIds.length + 1,
        instalacionesPermitidas: limiteInstalaciones
      }
    };
  },

  /**
   * Recibe el Heartbeat periódico del sistema de inventario
   */
  async procesarHeartbeat(
    reqData: HeartbeatRequest,
    clientIp: string
  ): Promise<{ exito: boolean; data?: any; codigoError?: ApiErrorCode; mensaje: string; status: number }> {
    const { licenseKey, uuidCliente, installationId, versionSistema, estadoEquipo } = reqData;

    if (!licenseKey || !uuidCliente || !installationId) {
      return {
        exito: false,
        status: 400,
        codigoError: 'DATOS_INVALIDOS',
        mensaje: 'licenseKey, uuidCliente e installationId son obligatorios.'
      };
    }

    // Validar estado de licencia
    const val = await this.validarLicencia(
      { licenseKey, uuidCliente, versionSistema: versionSistema || '1.0.0', installationId },
      clientIp
    );

    if (!val.exito) {
      return val;
    }

    // Buscar la instalación
    const snapInst = await adminDb
      .collection('instalaciones')
      .where('installationId', '==', installationId)
      .where('licenseKey', '==', licenseKey)
      .get();

    if (snapInst.empty) {
      return {
        exito: false,
        status: 404,
        codigoError: 'INSTALACION_NO_ENCONTRADA',
        mensaje: `La instalación '${installationId}' no se encuentra registrada para esta licencia.`
      };
    }

    const instDoc = snapInst.docs[0];
    const ahoraIso = new Date().toISOString();

    await FirestoreAdminService.updateDoc('instalaciones', instDoc.id, {
      ultimaConexion: ahoraIso,
      versionSistema: versionSistema || '1.0.0',
      ip: clientIp,
      estadoEquipo: estadoEquipo || 'online'
    });

    return {
      exito: true,
      status: 200,
      mensaje: 'Heartbeat procesado correctamente.',
      data: {
        installationId,
        estado: 'activa',
        ultimaConexion: ahoraIso,
        diasRestantes: val.data?.diasRestantes
      }
    };
  },

  /**
   * Desactiva un Installation ID de una licencia
   */
  async desactivarInstalacion(
    reqData: DeactivateInstallationRequest,
    clientIp: string
  ): Promise<{ exito: boolean; data?: any; codigoError?: ApiErrorCode; mensaje: string; status: number }> {
    const { licenseKey, uuidCliente, installationId, motivo } = reqData;

    if (!licenseKey || !uuidCliente || !installationId) {
      return {
        exito: false,
        status: 400,
        codigoError: 'DATOS_INVALIDOS',
        mensaje: 'licenseKey, uuidCliente e installationId son campos requeridos.'
      };
    }

    const snapLic = await adminDb
      .collection('licencias')
      .where('licenseKey', '==', licenseKey)
      .get();

    if (snapLic.empty) {
      return {
        exito: false,
        status: 404,
        codigoError: 'LICENCIA_NO_ENCONTRADA',
        mensaje: 'La licencia especificada no existe.'
      };
    }

    const licDoc = snapLic.docs[0];

    // Remover installationId del array en la licencia mediante FirestoreAdminService
    await FirestoreAdminService.updateDoc('licencias', licDoc.id, {
      installationIds: FirestoreAdminService.arrayRemove(installationId)
    });

    // Actualizar colección de instalaciones
    const snapInst = await adminDb
      .collection('instalaciones')
      .where('installationId', '==', installationId)
      .where('licenseKey', '==', licenseKey)
      .get();

    if (!snapInst.empty) {
      await FirestoreAdminService.updateDoc('instalaciones', snapInst.docs[0].id, {
        estado: 'desactivada',
        motivoDesactivacion: motivo || 'Desactivación solicitada por API',
        fechaDesactivacion: new Date().toISOString()
      });
    }

    return {
      exito: true,
      status: 200,
      mensaje: `La instalación '${installationId}' fue desactivada exitosamente.`,
      data: {
        installationId,
        licenseKey,
        estado: 'desactivada'
      }
    };
  },

  /**
   * Renueva el tiempo de vigencia de una licencia
   */
  async renovarLicencia(
    reqData: RenewLicenseApiRequest,
    clientIp: string
  ): Promise<{ exito: boolean; data?: any; codigoError?: ApiErrorCode; mensaje: string; status: number }> {
    const { licenseKey, uuidCliente, diasAnadidos } = reqData;

    if (!licenseKey || !uuidCliente || !diasAnadidos || diasAnadidos <= 0) {
      return {
        exito: false,
        status: 400,
        codigoError: 'DATOS_INVALIDOS',
        mensaje: 'licenseKey, uuidCliente y diasAnadidos (> 0) son obligatorios.'
      };
    }

    const snapLic = await adminDb
      .collection('licencias')
      .where('licenseKey', '==', licenseKey)
      .get();

    if (snapLic.empty) {
      return {
        exito: false,
        status: 404,
        codigoError: 'LICENCIA_NO_ENCONTRADA',
        mensaje: 'Licencia no encontrada.'
      };
    }

    const licDoc = snapLic.docs[0];
    const licData = licDoc.data();

    const actualExp = new Date(licData.fechaExpiracion);
    const baseDate = actualExp > new Date() ? actualExp : new Date();
    baseDate.setDate(baseDate.getDate() + Number(diasAnadidos));

    const nuevaExpiracion = baseDate.toISOString();

    await FirestoreAdminService.updateDoc('licencias', licDoc.id, {
      fechaExpiracion: nuevaExpiracion,
      estado: 'activa',
      ultimaRenovacion: new Date().toISOString()
    });

    return {
      exito: true,
      status: 200,
      mensaje: `Licencia renovada por ${diasAnadidos} días con éxito.`,
      data: {
        licenseKey,
        nuevaFechaExpiracion: nuevaExpiracion,
        diasAnadidos,
        estado: 'activa'
      }
    };
  },

  /**
   * Obtiene el estado detallado de una licencia sin alterar contadores
   */
  async obtenerEstadoLicencia(
    licenseKey: string,
    uuidCliente: string,
    clientIp: string
  ): Promise<{ exito: boolean; data?: any; codigoError?: ApiErrorCode; mensaje: string; status: number }> {
    return this.validarLicencia(
      { licenseKey, uuidCliente, versionSistema: '1.0.0' },
      clientIp
    );
  },

  /**
   * Guarda un log detallado de cada llamada a la API en la colección 'apiLogs' utilizando Firebase Admin SDK
   */
  async registrarApiLog(logData: ApiLogEntry): Promise<void> {
    try {
      await FirestoreAdminService.addDoc('apiLogs', {
        ...logData,
        createdAt: FirestoreAdminService.serverTimestamp()
      });
    } catch (err) {
      console.error('Error registrando log de API:', err);
    }
  }
};
