import { Request, Response } from 'express';
import { FirestoreAdminService } from '../services/FirestoreAdminService';

export const dashboardAdminController = {
  /**
   * Obtiene estadísticas agregadas globales calculadas en el backend
   * GET /api/v1/dashboard/stats
   */
  async obtenerEstadisticas(req: Request, res: Response): Promise<void> {
    try {
      const clientesDocs = await FirestoreAdminService.queryCollection('clientes');
      const licenciasDocs = await FirestoreAdminService.queryCollection('licencias');
      const instalacionesDocs = await FirestoreAdminService.queryCollection('instalaciones');
      const versionesDocs = await FirestoreAdminService.queryCollection('versiones');

      let clientesTotales = clientesDocs.length;
      let clientesActivos = 0;
      let clientesSuspendidos = 0;
      let clientesVencidos = 0;
      let clientesProximosVencer = 0;

      const ahora = new Date();
      const limite15Dias = new Date();
      limite15Dias.setDate(ahora.getDate() + 15);

      clientesDocs.forEach((cliente) => {
        if (cliente.estado === 'activo') clientesActivos++;
        if (cliente.estado === 'suspendido') clientesSuspendidos++;
        if (cliente.estado === 'vencido') clientesVencidos++;

        if (cliente.vencimientoLicencia) {
          const fechaVenc = new Date(cliente.vencimientoLicencia);
          if (fechaVenc > ahora && fechaVenc <= limite15Dias && cliente.estado === 'activo') {
            clientesProximosVencer++;
          }
        }
      });

      res.status(200).json({
        exito: true,
        data: {
          clientesTotales,
          clientesActivos,
          clientesSuspendidos,
          clientesVencidos,
          clientesProximosVencer,
          instalacionesTotales: instalacionesDocs.length,
          licenciasTotales: licenciasDocs.length,
          versionesRegistradas: versionesDocs.length,
        },
      });
    } catch (error: any) {
      console.error('[dashboardAdminController.obtenerEstadisticas] Error:', error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || 'Error al calcular estadísticas del dashboard.',
        data: {
          clientesTotales: 0,
          clientesActivos: 0,
          clientesSuspendidos: 0,
          clientesVencidos: 0,
          clientesProximosVencer: 0,
          instalacionesTotales: 0,
          licenciasTotales: 0,
          versionesRegistradas: 0,
        },
      });
    }
  },

  /**
   * Obtiene los logs de actividad reciente para el dashboard
   * GET /api/v1/dashboard/activity
   */
  async obtenerActividadReciente(req: Request, res: Response): Promise<void> {
    try {
      const limitParam = Number(req.query.limit) || 10;
      const logs = await FirestoreAdminService.queryCollection('auditoria', [], {
        orderBy: 'fecha',
        orderDir: 'desc',
        limit: limitParam,
      });

      res.status(200).json({
        exito: true,
        data: logs,
        total: logs.length,
      });
    } catch (error: any) {
      console.error('[dashboardAdminController.obtenerActividadReciente] Error:', error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || 'Error al obtener actividad reciente.',
        data: [],
      });
    }
  },
};
