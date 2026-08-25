import { DashboardStats, LogAuditoria } from '../types';

const API_BASE = '/api/v1/dashboard';

/**
 * Servicio para consultar métricas y estado del Dashboard.
 * Se comunica exclusivamente a través de la API Express centralizada (/api/v1/dashboard).
 */
export const dashboardService = {
  /**
   * Obtiene estadísticas globales consolidadas desde la API del backend
   */
  async obtenerEstadisticas(): Promise<DashboardStats> {
    try {
      const response = await fetch(`${API_BASE}/stats`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const resData = await response.json();
      if (!response.ok || !resData.exito) {
        throw new Error(resData.mensaje || 'Error al obtener estadísticas del servidor.');
      }

      return resData.data as DashboardStats;
    } catch (error) {
      console.error('Error obteniendo estadísticas del Dashboard desde la API:', error);
      return {
        clientesTotales: 0,
        clientesActivos: 0,
        clientesSuspendidos: 0,
        clientesVencidos: 0,
        clientesProximosVencer: 0,
        instalacionesTotales: 0,
        licenciasTotales: 0,
        versionesRegistradas: 0,
      };
    }
  },

  /**
   * Obtiene los registros de auditoría más recientes
   */
  async obtenerActividadReciente(limiteAuditoria: number = 5): Promise<LogAuditoria[]> {
    try {
      const response = await fetch(`${API_BASE}/activity?limit=${limiteAuditoria}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const resData = await response.json();
      if (!response.ok || !resData.exito) {
        throw new Error(resData.mensaje || 'Error al obtener actividad reciente.');
      }

      return resData.data as LogAuditoria[];
    } catch (error) {
      console.error('Error obteniendo registros de auditoría reciente:', error);
      return [];
    }
  },
};
