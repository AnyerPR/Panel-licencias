import { Request, Response } from 'express';
import { FirestoreAdminService } from '../services/FirestoreAdminService';

export const installationAdminController = {
  /**
   * Obtiene la lista completa de instalaciones registradas en el sistema
   * GET /api/v1/installations
   */
  async listarInstalaciones(req: Request, res: Response): Promise<void> {
    try {
      const docs = await FirestoreAdminService.queryCollection('instalaciones', [], {
        orderBy: 'ultimaConexion',
        orderDir: 'desc',
      });

      res.status(200).json({
        exito: true,
        data: docs,
        total: docs.length,
      });
    } catch (error: any) {
      console.error('[installationAdminController.listarInstalaciones] Error:', error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || 'Error al obtener la lista de instalaciones.',
        data: [],
      });
    }
  },
};
