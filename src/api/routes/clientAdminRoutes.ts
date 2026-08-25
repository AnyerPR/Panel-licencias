import { Router } from 'express';
import { clientAdminController } from '../controllers/clientAdminController';

const router = Router();

// GET /api/v1/clients - Listar todos los clientes
router.get('/', clientAdminController.listarClientes);

// GET /api/v1/clients/:id - Obtener detalle de un cliente
router.get('/:id', clientAdminController.obtenerCliente);

// POST /api/v1/clients - Crear un nuevo cliente
router.post('/', clientAdminController.crearCliente);

// PUT /api/v1/clients/:id - Actualizar datos de un cliente
router.put('/:id', clientAdminController.actualizarCliente);

// PATCH /api/v1/clients/:id/status - Cambiar estado de un cliente
router.patch('/:id/status', clientAdminController.cambiarEstadoCliente);

// DELETE /api/v1/clients/:id - Eliminar cliente
router.delete('/:id', clientAdminController.eliminarCliente);

export default router;
