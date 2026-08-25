import { Router } from 'express';
import { dashboardAdminController } from '../controllers/dashboardAdminController';

const router = Router();

// GET /api/v1/dashboard/stats - Métricas generales del Dashboard
router.get('/stats', dashboardAdminController.obtenerEstadisticas);

// GET /api/v1/dashboard/activity - Registros recientes de auditoría para el Dashboard
router.get('/activity', dashboardAdminController.obtenerActividadReciente);

export default router;
