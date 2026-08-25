import { Router } from 'express';
import { auditAdminController } from '../controllers/auditAdminController';

const router = Router();

// GET /api/v1/audit - Listar registros de auditoría
router.get('/', auditAdminController.listarLogs);

// POST /api/v1/audit - Guardar un nuevo evento de auditoría
router.post('/', auditAdminController.registrarLog);

export default router;
