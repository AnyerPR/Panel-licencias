import { Request, Response } from 'express';
import { FirestoreAdminService } from '../services/FirestoreAdminService';

// Tipos de licencia y helpers
type TipoLicencia = 'mensual' | 'trimestral' | 'semestral' | 'anual' | 'permanente' | 'prueba' | 'personalizada';

function generarLicenseKeySync(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const frag = (len = 4) => {
    let s = '';
    for (let i = 0; i < len; i++) {
      s += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return s;
  };
  return `DELI-${frag(4)}-${frag(4)}-${frag(4)}-${frag(4)}`;
}

function calcularFechaExpiracion(tipo: TipoLicencia, duracionDiasPersonalizada?: number): Date {
  const fecha = new Date();
  switch (tipo) {
    case 'mensual':
      fecha.setMonth(fecha.getMonth() + 1);
      break;
    case 'trimestral':
      fecha.setMonth(fecha.getMonth() + 3);
      break;
    case 'semestral':
      fecha.setMonth(fecha.getMonth() + 6);
      break;
    case 'anual':
      fecha.setFullYear(fecha.getFullYear() + 1);
      break;
    case 'permanente':
      fecha.setFullYear(fecha.getFullYear() + 99);
      break;
    case 'prueba':
      fecha.setDate(fecha.getDate() + 14);
      break;
    case 'personalizada':
      fecha.setDate(fecha.getDate() + (duracionDiasPersonalizada && duracionDiasPersonalizada > 0 ? duracionDiasPersonalizada : 30));
      break;
    default:
      fecha.setFullYear(fecha.getFullYear() + 1);
  }
  return fecha;
}

function calcularDiasRestantes(fechaExpIso: string): number {
  try {
    const exp = new Date(fechaExpIso);
    const ahora = new Date();
    const diffMs = exp.getTime() - ahora.getTime();
    const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return dias > 0 ? dias : 0;
  } catch {
    return 0;
  }
}

function evaluarEstado(estadoActual: string, fechaExpIso: string, tipo: string): string {
  if (estadoActual === 'suspendida' || estadoActual === 'revocada' || estadoActual === 'inactiva') {
    return estadoActual;
  }
  if (tipo === 'permanente') {
    return 'activa';
  }
  const dias = calcularDiasRestantes(fechaExpIso);
  if (dias <= 0) {
    return 'expirada';
  }
  return estadoActual;
}

export const licenseAdminController = {
  /**
   * Obtiene la lista completa de licencias (con filtrado opcional)
   * GET /api/v1/licenses
   */
  async listarLicencias(req: Request, res: Response): Promise<void> {
    try {
      const { clienteId, estado } = req.query;

      const conditions: Array<{ field: string; op: any; value: any }> = [];
      if (clienteId && typeof clienteId === 'string') {
        conditions.push({ field: 'clienteId', op: '==', value: clienteId });
      }
      if (estado && typeof estado === 'string') {
        conditions.push({ field: 'estado', op: '==', value: estado });
      }

      const docs = await FirestoreAdminService.queryCollection('licencias', conditions, {
        orderBy: 'fechaCreacion',
        orderDir: 'desc',
      });

      const licencias = docs.map((data) => {
        const fechaExpIso = data.fechaExpiracion
          ? typeof data.fechaExpiracion === 'string'
            ? data.fechaExpiracion
            : data.fechaExpiracion.toDate
            ? data.fechaExpiracion.toDate().toISOString()
            : new Date().toISOString()
          : new Date().toISOString();

        const tipoLic = (data.tipoLicencia || data.plan || 'anual') as string;
        const estadoEvaluado = evaluarEstado(data.estado || 'activa', fechaExpIso, tipoLic);
        const diasRestantes = calcularDiasRestantes(fechaExpIso);

        const fechaCreacionStr = data.fechaCreacion
          ? typeof data.fechaCreacion === 'string'
            ? data.fechaCreacion
            : data.fechaCreacion.toDate
            ? data.fechaCreacion.toDate().toISOString()
            : data.fechaCreacionIso || new Date().toISOString()
          : new Date().toISOString();

        const fechaActStr = data.fechaActivacion
          ? typeof data.fechaActivacion === 'string'
            ? data.fechaActivacion
            : data.fechaActivacion.toDate
            ? data.fechaActivacion.toDate().toISOString()
            : data.fechaActivacionIso
          : undefined;

        const ultimaValidacionStr = data.ultimaValidacion
          ? typeof data.ultimaValidacion === 'string'
            ? data.ultimaValidacion
            : data.ultimaValidacion.toDate
            ? data.ultimaValidacion.toDate().toISOString()
            : undefined
          : undefined;

        const ultimaConexionStr = data.ultimaConexion
          ? typeof data.ultimaConexion === 'string'
            ? data.ultimaConexion
            : data.ultimaConexion.toDate
            ? data.ultimaConexion.toDate().toISOString()
            : undefined
          : undefined;

        return {
          id: data.id,
          licenseKey: data.licenseKey || 'SIN-CLAVE',
          clienteId: data.clienteId || '',
          uuidCliente: data.uuidCliente || data.clienteUuid || '',
          clienteUuid: data.uuidCliente || data.clienteUuid || '',
          nombreEmpresa: data.nombreEmpresa || 'Cliente sin asignar',
          tipoLicencia: tipoLic,
          plan: data.plan || tipoLic,
          estado: estadoEvaluado,
          versionMinima: data.versionMinima || '1.0.0',
          versionMaxima: data.versionMaxima || '9.9.9',
          fechaCreacion: fechaCreacionStr,
          fechaActivacion: fechaActStr,
          fechaExpiracion: fechaExpIso,
          fechaVencimiento: fechaExpIso,
          diasRestantes,
          cantidadInstalacionesPermitidas: data.cantidadInstalacionesPermitidas ?? data.instalacionesMaximas ?? 1,
          cantidadInstalacionesUsadas: Array.isArray(data.installationIds) ? data.installationIds.length : data.cantidadInstalacionesUsadas ?? 0,
          instalacionesMaximas: data.cantidadInstalacionesPermitidas ?? data.instalacionesMaximas ?? 1,
          renovaciones: Array.isArray(data.renovaciones) ? data.renovaciones : [],
          ultimaValidacion: ultimaValidacionStr,
          ultimaConexion: ultimaConexionStr,
          installationIds: Array.isArray(data.installationIds) ? data.installationIds : [],
          observaciones: data.observaciones || data.notas || '',
          notas: data.observaciones || data.notas || '',
          creadoPor: data.creadoPor || data.creadoPorUid || 'Administrador',
          creadoPorUid: data.creadoPorUid || '',
        };
      });

      res.status(200).json({
        exito: true,
        data: licencias,
        total: licencias.length,
      });
    } catch (error: any) {
      console.error('[licenseAdminController.listarLicencias] Error:', error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || 'Error al listar las licencias.',
      });
    }
  },

  /**
   * Obtiene el detalle de una licencia por su ID o clave
   * GET /api/v1/licenses/:id
   */
  async obtenerLicencia(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      let data = await FirestoreAdminService.getDoc('licencias', id);

      if (!data) {
        // Intentar buscar por licenseKey
        const docs = await FirestoreAdminService.queryCollection('licencias', [
          { field: 'licenseKey', op: '==', value: id },
        ]);
        if (docs.length > 0) {
          data = docs[0];
        }
      }

      if (!data) {
        res.status(404).json({
          exito: false,
          mensaje: `Licencia con identificador '${id}' no encontrada.`,
        });
        return;
      }

      const fechaExpIso = data.fechaExpiracion
        ? typeof data.fechaExpiracion === 'string'
          ? data.fechaExpiracion
          : data.fechaExpiracion.toDate
          ? data.fechaExpiracion.toDate().toISOString()
          : new Date().toISOString()
        : new Date().toISOString();

      const tipoLic = (data.tipoLicencia || data.plan || 'anual') as string;
      const estadoEvaluado = evaluarEstado(data.estado || 'activa', fechaExpIso, tipoLic);
      const diasRestantes = calcularDiasRestantes(fechaExpIso);

      res.status(200).json({
        exito: true,
        data: {
          id: data.id,
          licenseKey: data.licenseKey || 'SIN-CLAVE',
          clienteId: data.clienteId || '',
          uuidCliente: data.uuidCliente || data.clienteUuid || '',
          clienteUuid: data.uuidCliente || data.clienteUuid || '',
          nombreEmpresa: data.nombreEmpresa || 'Cliente sin asignar',
          tipoLicencia: tipoLic,
          plan: data.plan || tipoLic,
          estado: estadoEvaluado,
          versionMinima: data.versionMinima || '1.0.0',
          versionMaxima: data.versionMaxima || '9.9.9',
          fechaCreacion: data.fechaCreacion ? (typeof data.fechaCreacion === 'string' ? data.fechaCreacion : data.fechaCreacion.toDate ? data.fechaCreacion.toDate().toISOString() : data.fechaCreacionIso || new Date().toISOString()) : new Date().toISOString(),
          fechaActivacion: data.fechaActivacion ? (typeof data.fechaActivacion === 'string' ? data.fechaActivacion : data.fechaActivacion.toDate ? data.fechaActivacion.toDate().toISOString() : data.fechaActivacionIso) : undefined,
          fechaExpiracion: fechaExpIso,
          fechaVencimiento: fechaExpIso,
          diasRestantes,
          cantidadInstalacionesPermitidas: data.cantidadInstalacionesPermitidas ?? data.instalacionesMaximas ?? 1,
          cantidadInstalacionesUsadas: Array.isArray(data.installationIds) ? data.installationIds.length : data.cantidadInstalacionesUsadas ?? 0,
          instalacionesMaximas: data.cantidadInstalacionesPermitidas ?? data.instalacionesMaximas ?? 1,
          renovaciones: Array.isArray(data.renovaciones) ? data.renovaciones : [],
          installationIds: Array.isArray(data.installationIds) ? data.installationIds : [],
          observaciones: data.observaciones || data.notas || '',
          notas: data.observaciones || data.notas || '',
          creadoPor: data.creadoPor || data.creadoPorUid || 'Administrador',
          creadoPorUid: data.creadoPorUid || '',
        },
      });
    } catch (error: any) {
      console.error('[licenseAdminController.obtenerLicencia] Error:', error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || 'Error al obtener la licencia.',
      });
    }
  },

  /**
   * Genera y crea una nueva licencia asociada a un cliente
   * POST /api/v1/licenses
   */
  async crearLicencia(req: Request, res: Response): Promise<void> {
    try {
      const {
        clienteId,
        uuidCliente,
        nombreEmpresa,
        tipoLicencia,
        versionMinima,
        versionMaxima,
        cantidadInstalacionesPermitidas,
        duracionDiasPersonalizada,
        observaciones,
        userUid,
        userCorreo,
      } = req.body;

      if (!clienteId) {
        res.status(400).json({
          exito: false,
          mensaje: 'Debe especificar el clienteId para vincular la licencia.',
        });
        return;
      }

      if (!cantidadInstalacionesPermitidas || Number(cantidadInstalacionesPermitidas) <= 0) {
        res.status(400).json({
          exito: false,
          mensaje: 'La cantidad de instalaciones permitidas debe ser un número entero mayor a 0.',
        });
        return;
      }

      // Validar existencia de cliente
      const clienteDoc = await FirestoreAdminService.getDoc('clientes', clienteId);
      if (!clienteDoc) {
        res.status(404).json({
          exito: false,
          mensaje: 'El cliente seleccionado no existe en el sistema.',
        });
        return;
      }

      // Generar licenseKey única
      let keyGenerada = '';
      let intentos = 0;
      let existeKey = true;

      while (existeKey && intentos < 10) {
        intentos++;
        keyGenerada = generarLicenseKeySync();
        const existentes = await FirestoreAdminService.queryCollection('licencias', [
          { field: 'licenseKey', op: '==', value: keyGenerada },
        ]);
        if (existentes.length === 0) {
          existeKey = false;
        }
      }

      const tipoFinal = (tipoLicencia || 'anual') as TipoLicencia;
      const fechaExpDate = calcularFechaExpiracion(tipoFinal, duracionDiasPersonalizada);
      const fechaExpIso = fechaExpDate.toISOString();
      const fechaHoraActual = new Date().toISOString();
      const diasRestantes = calcularDiasRestantes(fechaExpIso);

      const resolvedUuidCliente = uuidCliente || clienteDoc.uuidCliente || clienteDoc.uuid || clienteId;
      const resolvedNombreEmpresa = nombreEmpresa || clienteDoc.nombreEmpresa || 'Cliente';

      const payloadLicencia = {
        licenseKey: keyGenerada,
        clienteId,
        uuidCliente: resolvedUuidCliente,
        clienteUuid: resolvedUuidCliente,
        nombreEmpresa: resolvedNombreEmpresa,
        tipoLicencia: tipoFinal,
        plan: tipoFinal,
        estado: 'activa',
        versionMinima: (versionMinima || '1.0.0').trim(),
        versionMaxima: (versionMaxima || '9.9.9').trim(),
        fechaCreacion: FirestoreAdminService.serverTimestamp(),
        fechaCreacionIso: fechaHoraActual,
        fechaActivacion: FirestoreAdminService.serverTimestamp(),
        fechaActivacionIso: fechaHoraActual,
        fechaExpiracion: fechaExpIso,
        fechaVencimiento: fechaExpIso,
        diasRestantes,
        cantidadInstalacionesPermitidas: Number(cantidadInstalacionesPermitidas),
        cantidadInstalacionesUsadas: 0,
        instalacionesMaximas: Number(cantidadInstalacionesPermitidas),
        renovaciones: [],
        installationIds: [],
        observaciones: (observaciones || '').trim(),
        notas: (observaciones || '').trim(),
        creadoPor: userCorreo || 'Administrador',
        creadoPorUid: userUid || 'system',
        ultimaModificacion: FirestoreAdminService.serverTimestamp(),
      };

      const { id } = await FirestoreAdminService.addDoc('licencias', payloadLicencia);

      // Incrementar contador de licencias en el cliente
      const licActuales = (clienteDoc.cantidadLicencias && typeof clienteDoc.cantidadLicencias === 'number') ? clienteDoc.cantidadLicencias : 0;
      await FirestoreAdminService.updateDoc('clientes', clienteId, {
        cantidadLicencias: licActuales + 1,
        ultimaModificacion: FirestoreAdminService.serverTimestamp(),
      });

      // Registrar auditoría
      await FirestoreAdminService.addDoc('auditoria', {
        fecha: FirestoreAdminService.serverTimestamp(),
        usuarioUid: userUid || 'system',
        usuarioCorreo: userCorreo || 'admin@sistema.local',
        accion: 'Emisión de Licencia',
        modulo: 'Licencias',
        detalles: `Se emitió la licencia ${keyGenerada} de tipo '${tipoFinal}' para el cliente ${resolvedNombreEmpresa} (ID: ${id})`,
        exito: true,
      });

      res.status(201).json({
        exito: true,
        mensaje: `Licencia ${keyGenerada} emitida con éxito.`,
        data: {
          id,
          ...payloadLicencia,
          fechaCreacion: fechaHoraActual,
          fechaActivacion: fechaHoraActual,
        },
      });
    } catch (error: any) {
      console.error('[licenseAdminController.crearLicencia] Error:', error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || 'Error al emitir la licencia.',
      });
    }
  },

  /**
   * Actualiza parámetros de configuración de una licencia
   * PUT /api/v1/licenses/:id
   */
  async actualizarLicencia(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        versionMinima,
        versionMaxima,
        cantidadInstalacionesPermitidas,
        observaciones,
        userUid,
        userCorreo,
      } = req.body;

      const licencia = await FirestoreAdminService.getDoc('licencias', id);
      if (!licencia) {
        res.status(404).json({
          exito: false,
          mensaje: 'La licencia especificada no existe.',
        });
        return;
      }

      const instalacionesUsadas = Array.isArray(licencia.installationIds)
        ? licencia.installationIds.length
        : licencia.cantidadInstalacionesUsadas || 0;

      if (cantidadInstalacionesPermitidas !== undefined && Number(cantidadInstalacionesPermitidas) < instalacionesUsadas) {
        res.status(400).json({
          exito: false,
          mensaje: `La cantidad de instalaciones permitidas (${cantidadInstalacionesPermitidas}) no puede ser menor a las ya registradas (${instalacionesUsadas}).`,
        });
        return;
      }

      const updatePayload: Record<string, any> = {
        versionMinima: versionMinima !== undefined ? versionMinima.trim() : licencia.versionMinima || '1.0.0',
        versionMaxima: versionMaxima !== undefined ? versionMaxima.trim() : licencia.versionMaxima || '9.9.9',
        cantidadInstalacionesPermitidas: cantidadInstalacionesPermitidas !== undefined ? Number(cantidadInstalacionesPermitidas) : licencia.cantidadInstalacionesPermitidas,
        instalacionesMaximas: cantidadInstalacionesPermitidas !== undefined ? Number(cantidadInstalacionesPermitidas) : licencia.cantidadInstalacionesPermitidas,
        observaciones: observaciones !== undefined ? observaciones.trim() : (licencia.observaciones || ''),
        notas: observaciones !== undefined ? observaciones.trim() : (licencia.observaciones || ''),
        ultimaModificacion: FirestoreAdminService.serverTimestamp(),
      };

      await FirestoreAdminService.updateDoc('licencias', id, updatePayload);

      await FirestoreAdminService.addDoc('auditoria', {
        fecha: FirestoreAdminService.serverTimestamp(),
        usuarioUid: userUid || 'system',
        usuarioCorreo: userCorreo || 'admin@sistema.local',
        accion: 'Actualización de Licencia',
        modulo: 'Licencias',
        detalles: `Se actualizaron los parámetros de la licencia ${licencia.licenseKey} (ID: ${id})`,
        exito: true,
      });

      res.status(200).json({
        exito: true,
        mensaje: 'Licencia actualizada exitosamente.',
      });
    } catch (error: any) {
      console.error('[licenseAdminController.actualizarLicencia] Error:', error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || 'Error al actualizar la licencia.',
      });
    }
  },

  /**
   * Cambia el estado operativo de una licencia (activa, suspendida, revocada)
   * PATCH /api/v1/licenses/:id/status
   */
  async cambiarEstadoLicencia(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nuevoEstado, userUid, userCorreo } = req.body;

      if (!nuevoEstado) {
        res.status(400).json({
          exito: false,
          mensaje: 'El campo nuevoEstado es obligatorio.',
        });
        return;
      }

      const licencia = await FirestoreAdminService.getDoc('licencias', id);
      if (!licencia) {
        res.status(404).json({
          exito: false,
          mensaje: 'La licencia especificada no existe.',
        });
        return;
      }

      await FirestoreAdminService.updateDoc('licencias', id, {
        estado: nuevoEstado,
        ultimaModificacion: FirestoreAdminService.serverTimestamp(),
      });

      const accionStr =
        nuevoEstado === 'suspendida'
          ? 'Suspensión de Licencia'
          : nuevoEstado === 'activa'
          ? 'Reactivación de Licencia'
          : nuevoEstado === 'revocada'
          ? 'Revocación de Licencia'
          : 'Cambio de Estado de Licencia';

      await FirestoreAdminService.addDoc('auditoria', {
        fecha: FirestoreAdminService.serverTimestamp(),
        usuarioUid: userUid || 'system',
        usuarioCorreo: userCorreo || 'admin@sistema.local',
        accion: accionStr,
        modulo: 'Licencias',
        detalles: `Se cambió el estado de la licencia ${licencia.licenseKey} a '${nuevoEstado}'`,
        exito: true,
      });

      res.status(200).json({
        exito: true,
        mensaje: `Estado de la licencia actualizado a '${nuevoEstado}'.`,
      });
    } catch (error: any) {
      console.error('[licenseAdminController.cambiarEstadoLicencia] Error:', error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || 'Error al cambiar el estado de la licencia.',
      });
    }
  },

  /**
   * Renueva el tiempo de vigencia de una licencia
   * POST /api/v1/licenses/:id/renew
   */
  async renovarLicencia(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { diasAnadidos, observaciones, userUid, userCorreo } = req.body;

      if (!diasAnadidos || Number(diasAnadidos) <= 0) {
        res.status(400).json({
          exito: false,
          mensaje: 'La cantidad de días añadidos debe ser mayor a 0.',
        });
        return;
      }

      const licencia = await FirestoreAdminService.getDoc('licencias', id);
      if (!licencia) {
        res.status(404).json({
          exito: false,
          mensaje: 'La licencia especificada no existe.',
        });
        return;
      }

      const expActualDate = licencia.fechaExpiracion ? new Date(licencia.fechaExpiracion) : new Date();
      const baseDate = expActualDate.getTime() > Date.now() ? expActualDate : new Date();
      const nuevaExpDate = new Date(baseDate.getTime() + Number(diasAnadidos) * 24 * 60 * 60 * 1000);
      const nuevaExpIso = nuevaExpDate.toISOString();

      const registroRenovacion = {
        fecha: new Date().toISOString(),
        diasAnadidos: Number(diasAnadidos),
        renovadoPor: userCorreo || 'Administrador',
        nuevoVencimiento: nuevaExpIso,
        observaciones: (observaciones || '').trim(),
      };

      const renovacionesExistentes = Array.isArray(licencia.renovaciones) ? licencia.renovaciones : [];

      await FirestoreAdminService.updateDoc('licencias', id, {
        fechaExpiracion: nuevaExpIso,
        fechaVencimiento: nuevaExpIso,
        diasRestantes: calcularDiasRestantes(nuevaExpIso),
        estado: 'activa',
        renovaciones: [...renovacionesExistentes, registroRenovacion],
        ultimaModificacion: FirestoreAdminService.serverTimestamp(),
      });

      await FirestoreAdminService.addDoc('auditoria', {
        fecha: FirestoreAdminService.serverTimestamp(),
        usuarioUid: userUid || 'system',
        usuarioCorreo: userCorreo || 'admin@sistema.local',
        accion: 'Renovación de Licencia',
        modulo: 'Licencias',
        detalles: `Se renovó la licencia ${licencia.licenseKey} sumando ${diasAnadidos} días. Nuevo vencimiento: ${nuevaExpDate.toLocaleDateString('es-ES')}`,
        exito: true,
      });

      res.status(200).json({
        exito: true,
        mensaje: `Licencia renovada por ${diasAnadidos} días con éxito.`,
        data: {
          id,
          nuevaFechaExpiracion: nuevaExpIso,
          diasRestantes: calcularDiasRestantes(nuevaExpIso),
          estado: 'activa',
        },
      });
    } catch (error: any) {
      console.error('[licenseAdminController.renovarLicencia] Error:', error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || 'Error al renovar la licencia.',
      });
    }
  },

  /**
   * Elimina una licencia que nunca haya sido activada
   * DELETE /api/v1/licenses/:id
   */
  async eliminarLicencia(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userUid, userCorreo } = req.body;

      const licencia = await FirestoreAdminService.getDoc('licencias', id);
      if (!licencia) {
        res.status(404).json({
          exito: false,
          mensaje: 'La licencia que intenta eliminar no existe.',
        });
        return;
      }

      const instalacionesUsadas = Array.isArray(licencia.installationIds)
        ? licencia.installationIds.length
        : licencia.cantidadInstalacionesUsadas || 0;

      if (instalacionesUsadas > 0) {
        res.status(409).json({
          exito: false,
          mensaje: `No es posible eliminar la licencia "${licencia.licenseKey}" porque ya fue activada en ${instalacionesUsadas} instalación(es). Para deshabilitarla, utilice la opción de "Revocar" o "Suspender".`,
        });
        return;
      }

      await FirestoreAdminService.deleteDoc('licencias', id);

      if (licencia.clienteId) {
        try {
          const cliDoc = await FirestoreAdminService.getDoc('clientes', licencia.clienteId);
          if (cliDoc) {
            const licActuales = (cliDoc.cantidadLicencias && typeof cliDoc.cantidadLicencias === 'number') ? cliDoc.cantidadLicencias : 1;
            await FirestoreAdminService.updateDoc('clientes', licencia.clienteId, {
              cantidadLicencias: Math.max(0, licActuales - 1),
              ultimaModificacion: FirestoreAdminService.serverTimestamp(),
            });
          }
        } catch (err) {
          console.warn('No se pudo decrementar contador en cliente:', err);
        }
      }

      await FirestoreAdminService.addDoc('auditoria', {
        fecha: FirestoreAdminService.serverTimestamp(),
        usuarioUid: userUid || 'system',
        usuarioCorreo: userCorreo || 'admin@sistema.local',
        accion: 'Eliminación de Licencia',
        modulo: 'Licencias',
        detalles: `Se eliminó la licencia no utilizada ${licencia.licenseKey} (ID: ${id})`,
        exito: true,
      });

      res.status(200).json({
        exito: true,
        mensaje: `Licencia ${licencia.licenseKey} eliminada correctamente.`,
      });
    } catch (error: any) {
      console.error('[licenseAdminController.eliminarLicencia] Error:', error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || 'Error al eliminar la licencia.',
      });
    }
  },

  /**
   * Obtiene la lista de instalaciones de una licencia
   * GET /api/v1/licenses/:id/installations
   */
  async obtenerInstalacionesLicencia(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      let licencia = await FirestoreAdminService.getDoc('licencias', id);
      if (!licencia) {
        const docs = await FirestoreAdminService.queryCollection('licencias', [
          { field: 'licenseKey', op: '==', value: id },
        ]);
        if (docs.length > 0) licencia = docs[0];
      }

      if (!licencia) {
        res.status(404).json({
          exito: false,
          mensaje: 'Licencia no encontrada.',
        });
        return;
      }

      const instalaciones = await FirestoreAdminService.queryCollection('instalaciones', [
        { field: 'licenseKey', op: '==', value: licencia.licenseKey },
      ]);

      res.status(200).json({
        exito: true,
        data: instalaciones,
        total: instalaciones.length,
      });
    } catch (error: any) {
      console.error('[licenseAdminController.obtenerInstalacionesLicencia] Error:', error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || 'Error al obtener las instalaciones de la licencia.',
      });
    }
  },
};
