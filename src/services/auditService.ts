import { LogAuditoria } from '../types';

const API_BASE = '/api/v1/audit';

/**
 * Servicio de Auditoría para registrar y consultar acciones del sistema.
 * Se comunica exclusivamente a través de la API Express (/api/v1/audit).
 */
export const auditService = {
  /**
   * Obtiene la lista de registros de auditoría
   */
  async obtenerLogs(limite: number = 100): Promise<LogAuditoria[]> {
    try {
      const response = await fetch(`${API_BASE}?limit=${limite}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const resData = await response.json();
      if (!response.ok || !resData.exito) {
        throw new Error(resData.mensaje || 'Error al obtener registros de auditoría.');
      }

      return resData.data as LogAuditoria[];
    } catch (error) {
      console.error('Error consultando registros de auditoría:', error);
      return [];
    }
  },

  /**
   * Registra un evento en la colección de auditoría a través de la API
   */
  async registrarAccion(
    usuarioUid: string,
    usuarioCorreo: string,
    accion: string,
    modulo: string,
    detalles: string,
    exito: boolean = true
  ): Promise<void> {
    try {
      await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioUid,
          usuarioCorreo,
          accion,
          modulo,
          detalles,
          exito,
        }),
      });
    } catch (error) {
      console.error('Error guardando registro de auditoría en la API:', error);
    }
  },
};
