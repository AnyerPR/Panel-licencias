import { Request, Response } from 'express';
import { FirestoreAdminService } from '../services/FirestoreAdminService';

export const auditAdminController = {
  /**
   * Lista los registros de auditoría
   * GET /api/v1/audit
   */
  async listarLogs(req: Request, res: Response): Promise<void> {
    try {
      const limitParam = Number(req.query.limit) || 100;
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
      console.error('[auditAdminController.listarLogs] Error:', error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || 'Error al obtener registros de auditoría.',
        data: [],
      });
    }
  },

  /**
   * Registra un nuevo evento de auditoría
   * POST /api/v1/audit
   */
  async registrarLog(req: Request, res: Response): Promise<void> {
    try {
      const { usuarioUid, usuarioCorreo, accion, modulo, detalles, exito } = req.body;

      const { id } = await FirestoreAdminService.addDoc('auditoria', {
        fecha: FirestoreAdminService.serverTimestamp(),
        usuarioUid: usuarioUid || 'system',
        usuarioCorreo: usuarioCorreo || 'admin@sistema.local',
        accion: accion || 'Acción del Sistema',
        modulo: modulo || 'General',
        detalles: detalles || '',
        exito: exito !== undefined ? exito : true,
      });

      res.status(201).json({
        exito: true,
        mensaje: 'Registro de auditoría guardado exitosamente.',
        id,
      });
    } catch (error: any) {
      console.error('[auditAdminController.registrarLog] Error:', error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || 'Error al guardar log de auditoría.',
      });
    }
  },
};
