import { Licencia, EstadoLicencia, TipoLicencia } from '../types';

const API_BASE = '/api/v1/licenses';

/**
 * Servicio de Licencias para el Panel Maestro.
 * Se comunica exclusivamente a través de la API Express (/api/v1/licenses),
 * garantizando que el navegador nunca acceda directamente a Firestore.
 */
export const licenseService = {
  /**
   * Genera una clave de licencia referencial
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

  /**
   * Calcula los días restantes hasta la fecha de expiración
   */
  calcularDiasRestantes(fechaExpiracion: string | Date): number {
    try {
      const exp = typeof fechaExpiracion === 'string' ? new Date(fechaExpiracion) : fechaExpiracion;
      const ahora = new Date();
      const diffMs = exp.getTime() - ahora.getTime();
      const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return dias > 0 ? dias : 0;
    } catch {
      return 0;
    }
  },

  /**
   * Obtiene la lista completa de licencias
   */
  async obtenerLicencias(clienteId?: string): Promise<Licencia[]> {
    try {
      const url = clienteId ? `${API_BASE}?clienteId=${encodeURIComponent(clienteId)}` : API_BASE;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const resData = await response.json();
      if (!response.ok || !resData.exito) {
        throw new Error(resData.mensaje || 'Error al obtener licencias desde la API.');
      }

      return resData.data as Licencia[];
    } catch (error: any) {
      console.error('Error al obtener licencias:', error);
      throw new Error(error.message || 'No se pudieron obtener las licencias desde el servidor.');
    }
  },

  /**
   * Obtiene los detalles de una licencia específica
   */
  async obtenerLicenciaPorId(id: string): Promise<Licencia | null> {
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
        throw new Error(resData.mensaje || 'Error al obtener la licencia.');
      }

      return resData.data as Licencia;
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
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nuevaLicencia,
          userUid,
          userCorreo,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.exito) {
        throw new Error(resData.mensaje || 'Error al crear la licencia.');
      }

      return resData.data as Licencia;
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
      const response = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...datos,
          userUid,
          userCorreo,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.exito) {
        throw new Error(resData.mensaje || 'Error al actualizar la licencia.');
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
      const response = await fetch(`${API_BASE}/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nuevoEstado,
          userUid,
          userCorreo,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.exito) {
        throw new Error(resData.mensaje || 'Error al cambiar el estado de la licencia.');
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
      const response = await fetch(`${API_BASE}/${encodeURIComponent(id)}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diasAnadidos,
          observaciones,
          userUid,
          userCorreo,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.exito) {
        throw new Error(resData.mensaje || 'Error al renovar la licencia.');
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
      const response = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userUid,
          userCorreo,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.exito) {
        throw new Error(resData.mensaje || 'Error al eliminar la licencia.');
      }
    } catch (error: any) {
      console.error('Error al eliminar licencia:', error);
      throw error;
    }
  },
};
