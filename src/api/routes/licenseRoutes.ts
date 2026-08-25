import { Router } from 'express';
import { licenseController } from '../controllers/licenseController';
import { securityMiddleware } from '../middlewares/securityMiddleware';

const router = Router();

// Aplicar Rate Limiting a todas las peticiones
router.use(securityMiddleware.rateLimiter);

// Aplicar Validación de Firma HMAC SHA-256, Timestamps y Replay Attacks
router.use(securityMiddleware.validarHmacYReplay);

// Endpoints Empresariales de Licencias
router.post('/validate', licenseController.validateLicense);
router.post('/activate', licenseController.activateInstallation);
router.post('/heartbeat', licenseController.heartbeat);
router.post('/deactivate', licenseController.deactivateInstallation);
router.post('/renew', licenseController.renewLicense);
router.get('/status', licenseController.getLicenseStatus);

export default router;
