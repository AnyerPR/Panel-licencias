import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Licencia, EstadoLicencia, TipoLicencia } from '../types';
import { auditService } from './auditService';
import { isStaticHost } from '../utils/envHelper';

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

function calcularDiasRestantesHelper(fechaExpiracion: string | Date): number {
  try {
    const exp = typeof fechaExpiracion === 'string' ? new Date(fechaExpiracion) : fechaExpiracion;
    const ahora = new Date();
    const diffMs = exp.getTime() - ahora.getTime();
    const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return dias > 0 ? dias : 0;
  } catch {
    return 0;
  }
}

function formatearLicencia(docId: string, data: any): Licencia {
  const fechaExpIso = data.fechaExpiracion
    ? typeof data.fechaExpiracion === 'string'
      ? data.fechaExpiracion
      : data.fechaExpiracion.toDate
      ? data.fechaExpiracion.toDate().toISOString()
      : new Date(data.fechaExpiracion).toISOString()
    : new Date().toISOString();

  const fechaCreaIso = data.fechaCreacion
    ? typeof data.fechaCreacion === 'string'
      ? data.fechaCreacion
      : data.fechaCreacion.toDate
    ? data.fechaCreacion.toDate().toISOString()
      : new Date(data.fechaCreacion).toISOString()
    : new Date().toISOString();

  const dias = calcularDiasRestantesHelper(fechaExpIso);
  let estado = data.estado || 'activa';
  if (estado !== 'suspendida' && estado !== 'revocada' && estado !== 'inactiva') {
    if (data.tipoLicencia !== 'permanente' && dias <= 0) {
      estado = 'expirada';
    }
  }

  return {
    id: docId,
    licenseKey: data.licenseKey || '',
    clienteId: data.clienteId || '',
    uuidCliente: data.uuidCliente || '',
    clienteUuid: data.uuidCliente || data.clienteUuid || '',
    nombreEmpresa: data.nombreEmpresa || 'Cliente Sin Nombre',
    tipoLicencia: data.tipoLicencia || 'anual',
    estado: estado as EstadoLicencia,
    fechaCreacion: fechaCreaIso,
    fechaExpiracion: fechaExpIso,
    fechaVencimiento: fechaExpIso,
    diasRestantes: dias,
    cantidadInstalacionesPermitidas: data.cantidadInstalacionesPermitidas ?? data.maxInstalaciones ?? 1,
    cantidadInstalacionesUsadas: data.cantidadInstalacionesUsadas ?? data.instalacionesActivas ?? data.instalacionesUsadas ?? 0,
    versionMinima: data.versionMinima || '1.0.0',
    versionMaxima: data.versionMaxima || '99.9.9',
    renovaciones: data.renovaciones || data.historialRenovaciones || [],
    installationIds: data.installationIds || [],
    observaciones: data.observaciones || '',
    creadoPor: data.creadoPor || 'Sistema',
    ultimaModificacion: data.fechaActualizacion || data.ultimaModificacion || fechaCreaIso,
  };
}

export const licenseService = {
  /**
   * Genera una clave de licencia referencial con formato DELI-XXXX-XXXX-XXXX-XXXX
   */
  async generarLicenseKey(): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const frag = (len = 4) => {
      let s = '';
      for (let i = 0; i < len; i++) {
        s += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return s;
    };
    return `DELI-${frag(4)}-${frag(4)}-${frag(4)}-${frag(4)}`;
  },

  calcularDiasRestantes(fechaExpiracion: string | Date): number {
    return calcularDiasRestantesHelper(fechaExpiracion);
  },

  /**
   * Obtiene la lista completa de licencias directamente desde Firestore
   */
  async obtenerLicencias(clienteId?: string): Promise<Licencia[]> {
    try {
      // 1. Intentar API backend solo si no estamos en un host estático
      if (!isStaticHost()) {
        try {
          const url = clienteId ? `/api/v1/licenses?clienteId=${encodeURIComponent(clienteId)}` : '/api/v1/licenses';
          const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
          if (res.ok) {
            const resData = await res.json();
            if (resData.exito && Array.isArray(resData.data)) {
              return resData.data as Licencia[];
            }
          }
        } catch {
          // Fallback a Firestore directo
        }
      }

      // 2. Conexión Directa a Firestore
      const licRef = collection(db, 'licencias');
      let q = query(licRef, orderBy('fechaCreacion', 'desc'));
      if (clienteId) {
        q = query(licRef, where('clienteId', '==', clienteId), orderBy('fechaCreacion', 'desc'));
      }

      const snap = await getDocs(q);
      return snap.docs.map(docSnap => formatearLicencia(docSnap.id, docSnap.data()));
    } catch (error: any) {
      console.warn('Error con query ordenado, intentando query simple de licencias:', error);
      try {
        const licRef = collection(db, 'licencias');
        const snap = await getDocs(licRef);
        return snap.docs.map(docSnap => formatearLicencia(docSnap.id, docSnap.data()));
      } catch (directErr: any) {
        console.error('Error definitivo obteniendo licencias:', directErr);
        throw new Error(directErr.message || 'No se pudieron obtener las licencias desde Firestore.');
      }
    }
  },

  /**
   * Obtiene los detalles de una licencia específica
   */
  async obtenerLicenciaPorId(id: string): Promise<Licencia | null> {
    try {
      const docSnap = await getDoc(doc(db, 'licencias', id));
      if (!docSnap.exists()) return null;
      return formatearLicencia(docSnap.id, docSnap.data());
    } catch (error: any) {
      console.error(`Error al obtener licencia ${id}:`, error);
      return null;
    }
  },

  /**
   * Crea una nueva licencia asociada a un cliente activo
   */
  async crearLicencia(
    nuevaLicencia: {
      clienteId: string;
      uuidCliente: string;
      nombreEmpresa: string;
      tipoLicencia: TipoLicencia;
      versionMinima: string;
      versionMaxima: string;
      cantidadInstalacionesPermitidas: number;
      duracionDiasPersonalizada?: number;
      observaciones?: string;
    },
    userUid: string,
    userCorreo: string
  ): Promise<Licencia> {
    try {
      const licenseKey = await this.generarLicenseKey();
      const fechaExp = calcularFechaExpiracion(
        nuevaLicencia.tipoLicencia,
        nuevaLicencia.duracionDiasPersonalizada
      );

      const licId = doc(collection(db, 'licencias')).id;
      const dataToSave = {
        licenseKey,
        clienteId: nuevaLicencia.clienteId,
        uuidCliente: nuevaLicencia.uuidCliente,
        nombreEmpresa: nuevaLicencia.nombreEmpresa,
        tipoLicencia: nuevaLicencia.tipoLicencia,
        estado: 'activa',
        fechaEmision: new Date().toISOString(),
        fechaExpiracion: fechaExp.toISOString(),
        maxInstalaciones: Number(nuevaLicencia.cantidadInstalacionesPermitidas) || 1,
        instalacionesActivas: 0,
        versionMinima: nuevaLicencia.versionMinima || '1.0.0',
        versionMaxima: nuevaLicencia.versionMaxima || '99.9.9',
        modulosHabilitados: {
          inventario: true,
          ventas: true,
          reportes: true,
          usuarios: true,
          hospital: true,
        },
        observaciones: nuevaLicencia.observaciones || '',
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        creadoPor: userCorreo,
      };

      await setDoc(doc(db, 'licencias', licId), {
        ...dataToSave,
        fechaCreacionTimestamp: serverTimestamp(),
      });

      // Actualizar contador en cliente
      try {
        await updateDoc(doc(db, 'clientes', nuevaLicencia.clienteId), {
          cantidadLicencias: increment(1),
          fechaActualizacion: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('No se pudo incrementar el contador del cliente:', e);
      }

      // Registrar Auditoría
      try {
        await auditService.registrarAccion(
          userUid,
          userCorreo,
          'Creación de Licencia',
          'Licencias',
          `Se creó la licencia ${licenseKey} para ${nuevaLicencia.nombreEmpresa}`
        );
      } catch (e) {
        console.warn('Error registrando auditoría:', e);
      }

      return formatearLicencia(licId, dataToSave);
    } catch (error: any) {
      console.error('Error al crear licencia:', error);
      throw error;
    }
  },

  /**
   * Actualiza los parámetros configurables de una licencia
   */
  async actualizarLicencia(
    id: string,
    datos: {
      versionMinima: string;
      versionMaxima: string;
      cantidadInstalacionesPermitidas: number;
      observaciones?: string;
    },
    userUid: string,
    userCorreo: string
  ): Promise<void> {
    try {
      await updateDoc(doc(db, 'licencias', id), {
        versionMinima: datos.versionMinima,
        versionMaxima: datos.versionMaxima,
        maxInstalaciones: Number(datos.cantidadInstalacionesPermitidas) || 1,
        observaciones: datos.observaciones || '',
        fechaActualizacion: new Date().toISOString(),
      });

      try {
        await auditService.registrarAccion(
          userUid,
          userCorreo,
          'Actualización de Licencia',
          'Licencias',
          `Se modificaron los parámetros de la licencia ID: ${id}`
        );
      } catch (e) {
        // No bloqueante
      }
    } catch (error: any) {
      console.error('Error al actualizar licencia:', error);
      throw error;
    }
  },

  /**
   * Cambia el estado operativo de una licencia (Suspender, Reactivar, Revocar)
   */
  async cambiarEstadoLicencia(
    id: string,
    nuevoEstado: EstadoLicencia,
    userUid: string,
    userCorreo: string
  ): Promise<void> {
    try {
      await updateDoc(doc(db, 'licencias', id), {
        estado: nuevoEstado,
        fechaActualizacion: new Date().toISOString(),
      });

      try {
        await auditService.registrarAccion(
          userUid,
          userCorreo,
          'Cambio de Estado de Licencia',
          'Licencias',
          `Licencia ${id} cambió a estado: ${nuevoEstado}`
        );
      } catch (e) {
        // No bloqueante
      }
    } catch (error: any) {
      console.error('Error al cambiar estado de licencia:', error);
      throw error;
    }
  },

  /**
   * Extiende / Renueva la validez de una licencia agregando días al plazo
   */
  async renovarLicencia(
    id: string,
    diasAnadidos: number,
    observaciones: string,
    userUid: string,
    userCorreo: string
  ): Promise<void> {
    try {
      const licSnap = await getDoc(doc(db, 'licencias', id));
      if (!licSnap.exists()) throw new Error('Licencia no encontrada');
      const data = licSnap.data();

      const expActual = new Date(data.fechaExpiracion || new Date());
      const baseFecha = expActual > new Date() ? expActual : new Date();
      baseFecha.setDate(baseFecha.getDate() + Number(diasAnadidos));

      const renovacion = {
        fecha: new Date().toISOString(),
        diasAnadidos: Number(diasAnadidos),
        observaciones: observaciones || 'Renovación estándar',
        renovadoPor: userCorreo,
      };

      const historial = data.historialRenovaciones || [];
      historial.push(renovacion);

      await updateDoc(doc(db, 'licencias', id), {
        fechaExpiracion: baseFecha.toISOString(),
        estado: 'activa',
        historialRenovaciones: historial,
        fechaActualizacion: new Date().toISOString(),
      });

      try {
        await auditService.registrarAccion(
          userUid,
          userCorreo,
          'Renovación de Licencia',
          'Licencias',
          `Se añadieron ${diasAnadidos} días a la licencia ${id}. Nueva expiración: ${baseFecha.toISOString().split('T')[0]}`
        );
      } catch (e) {
        // No bloqueante
      }
    } catch (error: any) {
      console.error('Error al renovar licencia:', error);
      throw error;
    }
  },

  /**
   * Elimina una licencia únicamente si nunca ha sido utilizada
   */
  async eliminarLicencia(
    id: string,
    userUid: string,
    userCorreo: string
  ): Promise<void> {
    try {
      const licSnap = await getDoc(doc(db, 'licencias', id));
      if (!licSnap.exists()) return;
      const data = licSnap.data();

      await deleteDoc(doc(db, 'licencias', id));

      if (data.clienteId) {
        try {
          await updateDoc(doc(db, 'clientes', data.clienteId), {
            cantidadLicencias: increment(-1),
            fechaActualizacion: new Date().toISOString(),
          });
        } catch (e) {
          // No bloqueante
        }
      }

      try {
        await auditService.registrarAccion(
          userUid,
          userCorreo,
          'Eliminación de Licencia',
          'Licencias',
          `Se eliminó la licencia ${data.licenseKey || id}`
        );
      } catch (e) {
        // No bloqueante
      }
    } catch (error: any) {
      console.error('Error al eliminar licencia:', error);
      throw error;
    }
  },
};
