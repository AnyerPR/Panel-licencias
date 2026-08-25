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
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Cliente, EstadoCliente } from '../types';
import { auditService } from './auditService';
import { isStaticHost } from '../utils/envHelper';

function formatearCliente(docId: string, data: any): Cliente {
  return {
    id: docId,
    uuidCliente: data.uuidCliente || docId,
    nombreEmpresa: data.nombreEmpresa || 'Empresa Sin Nombre',
    nombreComercial: data.nombreComercial || '',
    rnc: data.rnc || '',
    telefono: data.telefono || '',
    correo: data.correo || '',
    direccion: data.direccion || '',
    ciudad: data.ciudad || '',
    pais: data.pais || '',
    personaContacto: data.personaContacto || '',
    plan: data.plan || 'anual',
    tipo: data.tipo || 'hospital',
    estado: data.estado || 'activo',
    firebaseProjectId: data.firebaseProjectId || '',
    dominio: data.dominio || '',
    cantidadLicencias: data.cantidadLicencias || 0,
    cantidadInstalaciones: data.cantidadInstalaciones || 0,
    observaciones: data.observaciones || '',
    fechaCreacion: data.fechaCreacion || new Date().toISOString(),
    ultimaModificacion: data.fechaActualizacion || data.ultimaModificacion || new Date().toISOString(),
  };
}

export const clientService = {
  /**
   * Genera un UUID estándar para cliente
   */
  generarUuidCliente(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let randomStr = '';
    for (let i = 0; i < 10; i++) {
      randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `cli_${randomStr}`;
  },

  /**
   * Obtiene el listado completo de clientes directamente desde Firestore
   */
  async obtenerClientes(): Promise<Cliente[]> {
    try {
      // 1. Intentar API solo si no es un host estático
      if (!isStaticHost()) {
        try {
          const response = await fetch('/api/v1/clients', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          if (response.ok) {
            const resData = await response.json();
            if (resData.exito && Array.isArray(resData.data)) {
              return resData.data as Cliente[];
            }
          }
        } catch {
          // Fallback a Firestore directo
        }
      }

      // 2. Conexión Directa a Firestore
      const clRef = collection(db, 'clientes');
      try {
        const q = query(clRef, orderBy('fechaCreacion', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(docSnap => formatearCliente(docSnap.id, docSnap.data()));
      } catch {
        const snap = await getDocs(clRef);
        return snap.docs.map(docSnap => formatearCliente(docSnap.id, docSnap.data()));
      }
    } catch (error: any) {
      console.error('Error al obtener lista de clientes:', error);
      throw new Error(error.message || 'No se pudo cargar la lista de clientes desde Firestore.');
    }
  },

  /**
   * Obtiene la información detallada de un cliente por su ID o UUID
   */
  async obtenerClientePorId(id: string): Promise<Cliente | null> {
    try {
      const docSnap = await getDoc(doc(db, 'clientes', id));
      if (docSnap.exists()) {
        return formatearCliente(docSnap.id, docSnap.data());
      }

      // Buscar por uuidCliente
      const q = query(collection(db, 'clientes'), where('uuidCliente', '==', id));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return formatearCliente(snap.docs[0].id, snap.docs[0].data());
      }

      return null;
    } catch (error: any) {
      console.error(`Error obteniendo cliente ${id}:`, error);
      return null;
    }
  },

  /**
   * Crea un nuevo cliente con UUID inmutable y datos auditados
   */
  async crearCliente(
    nuevoCliente: {
      nombreEmpresa: string;
      nombreComercial: string;
      rnc: string;
      telefono: string;
      correo: string;
      direccion: string;
      ciudad: string;
      pais: string;
      personaContacto: string;
      plan: 'mensual' | 'anual' | 'vitalicio' | 'demo';
      tipo?: 'hospital' | 'farmacia' | 'clinica' | 'otro';
      firebaseProjectId?: string;
      dominio?: string;
      observaciones?: string;
    },
    userUid: string,
    userCorreo: string
  ): Promise<Cliente> {
    try {
      const uuidCliente = this.generarUuidCliente();
      const clientId = doc(collection(db, 'clientes')).id;

      const dataToSave = {
        uuidCliente,
        nombreEmpresa: nuevoCliente.nombreEmpresa,
        nombreComercial: nuevoCliente.nombreComercial || '',
        rnc: nuevoCliente.rnc || '',
        telefono: nuevoCliente.telefono || '',
        correo: nuevoCliente.correo || '',
        direccion: nuevoCliente.direccion || '',
        ciudad: nuevoCliente.ciudad || '',
        pais: nuevoCliente.pais || '',
        personaContacto: nuevoCliente.personaContacto || '',
        plan: nuevoCliente.plan || 'anual',
        tipo: nuevoCliente.tipo || 'hospital',
        estado: 'activo',
        firebaseProjectId: nuevoCliente.firebaseProjectId || '',
        dominio: nuevoCliente.dominio || '',
        cantidadLicencias: 0,
        observaciones: nuevoCliente.observaciones || '',
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        creadoPor: userCorreo,
      };

      await setDoc(doc(db, 'clientes', clientId), {
        ...dataToSave,
        fechaCreacionTimestamp: serverTimestamp(),
      });

      try {
        await auditService.registrarAccion(
          userUid,
          userCorreo,
          'Creación de Cliente',
          'Clientes',
          `Se registró el cliente ${nuevoCliente.nombreEmpresa} (UUID: ${uuidCliente})`
        );
      } catch (e) {
        // No bloqueante
      }

      return formatearCliente(clientId, dataToSave);
    } catch (error: any) {
      console.error('Error al crear cliente:', error);
      throw error;
    }
  },

  /**
   * Actualiza la información de un cliente existente
   */
  async actualizarCliente(
    id: string,
    datosActualizados: {
      nombreEmpresa: string;
      nombreComercial: string;
      rnc: string;
      telefono: string;
      correo: string;
      direccion: string;
      ciudad: string;
      pais: string;
      personaContacto: string;
      plan: 'mensual' | 'anual' | 'vitalicio' | 'demo';
      tipo?: 'hospital' | 'farmacia' | 'clinica' | 'otro';
      firebaseProjectId?: string;
      dominio?: string;
      observaciones?: string;
    },
    userUid: string,
    userCorreo: string
  ): Promise<void> {
    try {
      await updateDoc(doc(db, 'clientes', id), {
        ...datosActualizados,
        fechaActualizacion: new Date().toISOString(),
      });

      try {
        await auditService.registrarAccion(
          userUid,
          userCorreo,
          'Actualización de Cliente',
          'Clientes',
          `Se actualizaron los datos del cliente ${datosActualizados.nombreEmpresa}`
        );
      } catch (e) {
        // No bloqueante
      }
    } catch (error: any) {
      console.error('Error al actualizar cliente:', error);
      throw error;
    }
  },

  /**
   * Cambia el estado de un cliente (Desactivar/Suspender, Reactivar, Cancelar)
   */
  async cambiarEstadoCliente(
    id: string,
    nuevoEstado: EstadoCliente,
    nombreEmpresa: string,
    userUid: string,
    userCorreo: string
  ): Promise<void> {
    try {
      await updateDoc(doc(db, 'clientes', id), {
        estado: nuevoEstado,
        fechaActualizacion: new Date().toISOString(),
      });

      try {
        await auditService.registrarAccion(
          userUid,
          userCorreo,
          'Cambio de Estado de Cliente',
          'Clientes',
          `Cliente ${nombreEmpresa} (${id}) cambió a estado: ${nuevoEstado}`
        );
      } catch (e) {
        // No bloqueante
      }
    } catch (error: any) {
      console.error('Error al cambiar estado del cliente:', error);
      throw error;
    }
  },

  /**
   * Elimina permanentemente un cliente únicamente si no posee licencias asociadas
   */
  async eliminarCliente(
    id: string,
    uuidCliente: string,
    nombreEmpresa: string,
    cantidadLicencias: number,
    userUid: string,
    userCorreo: string
  ): Promise<void> {
    try {
      if (cantidadLicencias > 0) {
        throw new Error('No se puede eliminar un cliente con licencias activas asociadas.');
      }

      await deleteDoc(doc(db, 'clientes', id));

      try {
        await auditService.registrarAccion(
          userUid,
          userCorreo,
          'Eliminación de Cliente',
          'Clientes',
          `Se eliminó permanentemente el cliente ${nombreEmpresa} (UUID: ${uuidCliente})`
        );
      } catch (e) {
        // No bloqueante
      }
    } catch (error: any) {
      console.error('Error al eliminar cliente:', error);
      throw error;
    }
  },
};
