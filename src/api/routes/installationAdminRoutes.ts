import { Router } from 'express';
import { installationAdminController } from '../controllers/installationAdminController';

const router = Router();

// GET /api/v1/installations - Listar instalaciones
router.get('/', installationAdminController.listarInstalaciones);

export default router;
