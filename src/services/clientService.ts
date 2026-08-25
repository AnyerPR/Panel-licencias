import { Cliente, EstadoCliente } from '../types';

const API_BASE = '/api/v1/clients';

/**
 * Servicio de Clientes para el Panel Maestro.
 * Se comunica exclusivamente a través de la API Express centralizada (/api/v1/clients),
 * garantizando que el navegador nunca acceda directamente a Firestore.
 */
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
   * Obtiene el listado completo de clientes
   */
  async obtenerClientes(): Promise<Cliente[]> {
    try {
      const response = await fetch(API_BASE, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const resData = await response.json();
      if (!response.ok || !resData.exito) {
        throw new Error(resData.mensaje || 'Error al obtener clientes desde la API.');
      }

      return resData.data as Cliente[];
    } catch (error: any) {
      console.error('Error al obtener lista de clientes:', error);
      throw new Error(error.message || 'No se pudo cargar la lista de clientes desde el servidor.');
    }
  },

  /**
   * Obtiene la información detallada de un cliente por su ID o UUID
   */
  async obtenerClientePorId(id: string): Promise<Cliente | null> {
    try {
      const response = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 404) {
        return null;
      }

      const resData = await response.json();
      if (!response.ok || !resData.exito) {
        throw new Error(resData.mensaje || 'Error al obtener cliente.');
      }

      return resData.data as Cliente;
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
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nuevoCliente,
          userUid,
          userCorreo,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.exito) {
        throw new Error(resData.mensaje || 'Error al crear el cliente.');
      }

      return resData.data as Cliente;
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
      const response = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...datosActualizados,
          userUid,
          userCorreo,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.exito) {
        throw new Error(resData.mensaje || 'Error al actualizar el cliente.');
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
      const response = await fetch(`${API_BASE}/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nuevoEstado,
          nombreEmpresa,
          userUid,
          userCorreo,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.exito) {
        throw new Error(resData.mensaje || 'Error al cambiar estado del cliente.');
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
      const response = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uuidCliente,
          nombreEmpresa,
          cantidadLicencias,
          userUid,
          userCorreo,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.exito) {
        throw new Error(resData.mensaje || 'Error al eliminar cliente.');
      }
    } catch (error: any) {
      console.error('Error al eliminar cliente:', error);
      throw error;
    }
  },
};
