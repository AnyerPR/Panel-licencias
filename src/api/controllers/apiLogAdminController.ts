import { Request, Response } from 'express';
import { FirestoreAdminService } from '../services/FirestoreAdminService';

export const apiLogAdminController = {
  /**
   * Obtiene los últimos logs de actividad de la API
   * GET /api/v1/apilogs
   */
  async listarLogs(req: Request, res: Response): Promise<void> {
    try {
      const limitParam = Number(req.query.limit) || 20;
      const docs = await FirestoreAdminService.queryCollection('apiLogs', [], {
        orderBy: 'timestamp',
        orderDir: 'desc',
        limit: limitParam,
      });

      res.status(200).json({
        exito: true,
        data: docs,
        total: docs.length,
      });
    } catch (error: any) {
      console.error('[apiLogAdminController.listarLogs] Error:', error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || 'Error al obtener los logs de la API.',
        data: [],
      });
    }
  },
};
