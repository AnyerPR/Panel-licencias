import { Router } from 'express';
import { licenseAdminController } from '../controllers/licenseAdminController';

const router = Router();

// GET /api/v1/licenses - Listar licencias
router.get('/', licenseAdminController.listarLicencias);

// GET /api/v1/licenses/:id - Obtener detalle de una licencia
router.get('/:id', licenseAdminController.obtenerLicencia);

// GET /api/v1/licenses/:id/installations - Obtener instalaciones de una licencia
router.get('/:id/installations', licenseAdminController.obtenerInstalacionesLicencia);

// POST /api/v1/licenses - Crear/Emitir licencia
router.post('/', licenseAdminController.crearLicencia);

// PUT /api/v1/licenses/:id - Actualizar límites/parámetros de licencia
router.put('/:id', licenseAdminController.actualizarLicencia);

// PATCH /api/v1/licenses/:id/status - Cambiar estado (activa, suspendida, revocada)
router.patch('/:id/status', licenseAdminController.cambiarEstadoLicencia);

// POST /api/v1/licenses/:id/renew - Renovar vigencia de licencia
router.post('/:id/renew', licenseAdminController.renovarLicencia);

// DELETE /api/v1/licenses/:id - Eliminar licencia no utilizada
router.delete('/:id', licenseAdminController.eliminarLicencia);

export default router;
