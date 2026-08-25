import { Router } from 'express';
import { apiLogAdminController } from '../controllers/apiLogAdminController';

const router = Router();

// GET /api/v1/apilogs - Listar logs de peticiones a la API
router.get('/', apiLogAdminController.listarLogs);

export default router;
