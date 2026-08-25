import { Request, Response } from 'express';
import { FirestoreAdminService } from '../services/FirestoreAdminService';

// Helper para generar UUID único de cliente
function generarUuidCliente(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let randomStr = '';
  for (let i = 0; i < 10; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `cli_${randomStr}`;
}

export const clientAdminController = {
  /**
   * Obtiene la lista completa de clientes
   * GET /api/v1/clients
   */
  async listarClientes(req: Request, res: Response): Promise<void> {
    try {
      const docs = await FirestoreAdminService.queryCollection('clientes', [], {
        orderBy: 'fechaCreacion',
        orderDir: 'desc',
      });

      const clientes = docs.map((data) => {
        const fechaCreacionStr = data.fechaCreacion
          ? (typeof data.fechaCreacion === 'string'
              ? data.fechaCreacion
              : data.fechaCreacion.toDate
              ? data.fechaCreacion.toDate().toISOString()
              : data.fechaCreacionIso || new Date().toISOString())
          : new Date().toISOString();

        const ultimaModStr = data.ultimaModificacion
          ? (typeof data.ultimaModificacion === 'string'
              ? data.ultimaModificacion
              : data.ultimaModificacion.toDate
              ? data.ultimaModificacion.toDate().toISOString()
              : undefined)
          : undefined;

        return {
          id: data.id,
          uuidCliente: data.uuidCliente || data.uuid || data.id,
          uuid: data.uuidCliente || data.uuid || data.id,
          nombreEmpresa: data.nombreEmpresa || data.nombre || 'Sin nombre',
          nombreComercial: data.nombreComercial || data.nombreEmpresa || data.nombre || 'Sin nombre comercial',
          rnc: data.rnc || 'N/A',
          telefono: data.telefono || 'N/A',
          correo: data.correo || 'N/A',
          direccion: data.direccion || 'N/A',
          ciudad: data.ciudad || 'N/A',
          pais: data.pais || 'N/A',
          personaContacto: data.personaContacto || data.contacto || 'N/A',
          estado: data.estado || 'activo',
          plan: data.plan || 'mensual',
          fechaCreacion: fechaCreacionStr,
          ultimaModificacion: ultimaModStr,
          cantidadLicencias: data.cantidadLicencias ?? 0,
          cantidadInstalaciones: data.cantidadInstalaciones ?? 0,
          observaciones: data.observaciones || '',
          tipo: data.tipo || 'hospital',
          firebaseProjectId: data.firebaseProjectId || '',
          dominio: data.dominio || '',
        };
      });

      res.status(200).json({
        exito: true,
        data: clientes,
        total: clientes.length,
      });
    } catch (error: any) {
      console.error('[clientAdminController.listarClientes] Error:', error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || 'Error al obtener la lista de clientes.',
      });
    }
  },

  /**
   * Obtiene un cliente por su ID o UUID
   * GET /api/v1/clients/:id
   */
  async obtenerCliente(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      let cliente = await FirestoreAdminService.getDoc('clientes', id);

      if (!cliente) {
        // Buscar por uuidCliente
        const docs = await FirestoreAdminService.queryCollection('clientes', [
          { field: 'uuidCliente', op: '==', value: id },
        ]);
        if (docs.length > 0) {
          cliente = docs[0];
        }
      }

      if (!cliente) {
        res.status(404).json({
          exito: false,
          mensaje: `Cliente con ID o UUID '${id}' no encontrado.`,
        });
        return;
      }

      res.status(200).json({
        exito: true,
        data: {
          id: cliente.id,
          uuidCliente: cliente.uuidCliente || cliente.uuid || cliente.id,
          uuid: cliente.uuidCliente || cliente.uuid || cliente.id,
          nombreEmpresa: cliente.nombreEmpresa || cliente.nombre || 'Sin nombre',
          nombreComercial: cliente.nombreComercial || cliente.nombreEmpresa || cliente.nombre || 'Sin nombre comercial',
          rnc: cliente.rnc || 'N/A',
          telefono: cliente.telefono || 'N/A',
          correo: cliente.correo || 'N/A',
          direccion: cliente.direccion || 'N/A',
          ciudad: cliente.ciudad || 'N/A',
          pais: cliente.pais || 'N/A',
          personaContacto: cliente.personaContacto || cliente.contacto || 'N/A',
          estado: cliente.estado || 'activo',
          plan: cliente.plan || 'mensual',
          fechaCreacion: cliente.fechaCreacion ? (typeof cliente.fechaCreacion === 'string' ? cliente.fechaCreacion : cliente.fechaCreacion.toDate ? cliente.fechaCreacion.toDate().toISOString() : cliente.fechaCreacionIso || new Date().toISOString()) : new Date().toISOString(),
          ultimaModificacion: cliente.ultimaModificacion ? (typeof cliente.ultimaModificacion === 'string' ? cliente.ultimaModificacion : cliente.ultimaModificacion.toDate ? cliente.ultimaModificacion.toDate().toISOString() : undefined) : undefined,
          cantidadLicencias: cliente.cantidadLicencias ?? 0,
          cantidadInstalaciones: cliente.cantidadInstalaciones ?? 0,
          observaciones: cliente.observaciones || '',
          tipo: cliente.tipo || 'hospital',
          firebaseProjectId: cliente.firebaseProjectId || '',
          dominio: cliente.dominio || '',
        },
      });
    } catch (error: any) {
      console.error('[clientAdminController.obtenerCliente] Error:', error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || 'Error al obtener el cliente.',
      });
    }
  },

  /**
   * Crea un nuevo cliente con UUID único y validación de duplicados
   * POST /api/v1/clients
   */
  async crearCliente(req: Request, res: Response): Promise<void> {
    try {
      const {
        nombreEmpresa,
        nombreComercial,
        rnc,
        telefono,
        correo,
        direccion,
        ciudad,
        pais,
        personaContacto,
        plan,
        tipo,
        firebaseProjectId,
        dominio,
        observaciones,
        userUid,
        userCorreo,
      } = req.body;

      if (!nombreEmpresa || !correo) {
        res.status(400).json({
          exito: false,
          mensaje: 'El nombre de la empresa y el correo electrónico son obligatorios.',
        });
        return;
      }

      const correoLimpio = correo.trim().toLowerCase();
      const rncLimpio = (rnc || '').trim();

      // Validar duplicados de RNC si fue proporcionado
      if (rncLimpio.length > 0) {
        const docsRnc = await FirestoreAdminService.queryCollection('clientes', [
          { field: 'rnc', op: '==', value: rncLimpio },
        ]);
        if (docsRnc.length > 0) {
          res.status(409).json({
            exito: false,
            mensaje: `El RNC/Identificación "${rncLimpio}" ya se encuentra registrado para otro cliente.`,
          });
          return;
        }
      }

      // Validar duplicados de correo
      const docsCorreo = await FirestoreAdminService.queryCollection('clientes', [
        { field: 'correo', op: '==', value: correoLimpio },
      ]);
      if (docsCorreo.length > 0) {
        res.status(409).json({
          exito: false,
          mensaje: `El correo electrónico "${correoLimpio}" ya está en uso por otro cliente.`,
        });
        return;
      }

      const uuidGenerado = generarUuidCliente();
      const fechaHora = new Date().toISOString();

      const payloadCliente = {
        uuidCliente: uuidGenerado,
        uuid: uuidGenerado,
        nombreEmpresa: nombreEmpresa.trim(),
        nombreComercial: (nombreComercial || nombreEmpresa).trim(),
        rnc: rncLimpio || 'N/A',
        telefono: (telefono || '').trim(),
        correo: correoLimpio,
        direccion: (direccion || '').trim(),
        ciudad: (ciudad || '').trim(),
        pais: (pais || '').trim(),
        personaContacto: (personaContacto || '').trim(),
        estado: 'activo',
        plan: plan || 'mensual',
        fechaCreacion: FirestoreAdminService.serverTimestamp(),
        fechaCreacionIso: fechaHora,
        ultimaModificacion: FirestoreAdminService.serverTimestamp(),
        cantidadLicencias: 0,
        cantidadInstalaciones: 0,
        observaciones: (observaciones || '').trim(),
        tipo: tipo || 'hospital',
        firebaseProjectId: (firebaseProjectId || '').trim(),
        dominio: (dominio || '').trim(),
      };

      const { id } = await FirestoreAdminService.addDoc('clientes', payloadCliente);

      // Registrar auditoría
      await FirestoreAdminService.addDoc('auditoria', {
        fecha: FirestoreAdminService.serverTimestamp(),
        usuarioUid: userUid || 'system',
        usuarioCorreo: userCorreo || 'admin@sistema.local',
        accion: 'Creación de Cliente',
        modulo: 'Clientes',
        detalles: `Se creó el cliente ${nombreEmpresa} con UUID ${uuidGenerado} (ID: ${id})`,
        exito: true,
      });

      res.status(201).json({
        exito: true,
        mensaje: `Cliente ${nombreEmpresa} creado exitosamente.`,
        data: {
          id,
          uuidCliente: uuidGenerado,
          uuid: uuidGenerado,
          ...payloadCliente,
          fechaCreacion: fechaHora,
          ultimaModificacion: fechaHora,
        },
      });
    } catch (error: any) {
      console.error('[clientAdminController.crearCliente] Error:', error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || 'Error al crear el cliente.',
      });
    }
  },

  /**
   * Actualiza un cliente existente
   * PUT /api/v1/clients/:id
   */
  async actualizarCliente(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        nombreEmpresa,
        nombreComercial,
        rnc,
        telefono,
        correo,
        direccion,
        ciudad,
        pais,
        personaContacto,
        plan,
        tipo,
        firebaseProjectId,
        dominio,
        observaciones,
        userUid,
        userCorreo,
      } = req.body;

      const clienteExistente = await FirestoreAdminService.getDoc('clientes', id);
      if (!clienteExistente) {
        res.status(404).json({
          exito: false,
          mensaje: 'El cliente especificado no existe.',
        });
        return;
      }

      const correoLimpio = correo ? correo.trim().toLowerCase() : clienteExistente.correo;
      const rncLimpio = rnc !== undefined ? rnc.trim() : clienteExistente.rnc;

      // Validar RNC duplicado excluyendo el actual
      if (rncLimpio && rncLimpio.length > 0 && rncLimpio !== 'N/A') {
        const docsRnc = await FirestoreAdminService.queryCollection('clientes', [
          { field: 'rnc', op: '==', value: rncLimpio },
        ]);
        const existeOtro = docsRnc.some((d) => d.id !== id);
        if (existeOtro) {
          res.status(409).json({
            exito: false,
            mensaje: `El RNC/Identificación "${rncLimpio}" ya se encuentra registrado para otro cliente.`,
          });
          return;
        }
      }

      // Validar correo duplicado excluyendo el actual
      if (correoLimpio && correoLimpio.length > 0) {
        const docsCorreo = await FirestoreAdminService.queryCollection('clientes', [
          { field: 'correo', op: '==', value: correoLimpio },
        ]);
        const existeOtro = docsCorreo.some((d) => d.id !== id);
        if (existeOtro) {
          res.status(409).json({
            exito: false,
            mensaje: `El correo electrónico "${correoLimpio}" ya está en uso por otro cliente.`,
          });
          return;
        }
      }

      const updatePayload: Record<string, any> = {
        nombreEmpresa: (nombreEmpresa || clienteExistente.nombreEmpresa).trim(),
        nombreComercial: (nombreComercial || clienteExistente.nombreComercial || nombreEmpresa).trim(),
        rnc: rncLimpio,
        telefono: telefono !== undefined ? telefono.trim() : clienteExistente.telefono,
        correo: correoLimpio,
        direccion: direccion !== undefined ? direccion.trim() : clienteExistente.direccion,
        ciudad: ciudad !== undefined ? ciudad.trim() : clienteExistente.ciudad,
        pais: pais !== undefined ? pais.trim() : clienteExistente.pais,
        personaContacto: personaContacto !== undefined ? personaContacto.trim() : clienteExistente.personaContacto,
        plan: plan || clienteExistente.plan,
        tipo: tipo || clienteExistente.tipo || 'hospital',
        firebaseProjectId: firebaseProjectId !== undefined ? firebaseProjectId.trim() : (clienteExistente.firebaseProjectId || ''),
        dominio: dominio !== undefined ? dominio.trim() : (clienteExistente.dominio || ''),
        observaciones: observaciones !== undefined ? observaciones.trim() : (clienteExistente.observaciones || ''),
        ultimaModificacion: FirestoreAdminService.serverTimestamp(),
      };

      await FirestoreAdminService.updateDoc('clientes', id, updatePayload);

      // Registrar auditoría
      await FirestoreAdminService.addDoc('auditoria', {
        fecha: FirestoreAdminService.serverTimestamp(),
        usuarioUid: userUid || 'system',
        usuarioCorreo: userCorreo || 'admin@sistema.local',
        accion: 'Actualización de Cliente',
        modulo: 'Clientes',
        detalles: `Se actualizó la información del cliente ${updatePayload.nombreEmpresa} (ID: ${id})`,
        exito: true,
      });

      res.status(200).json({
        exito: true,
        mensaje: 'Cliente actualizado exitosamente.',
      });
    } catch (error: any) {
      console.error('[clientAdminController.actualizarCliente] Error:', error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || 'Error al actualizar el cliente.',
      });
    }
  },

  /**
   * Cambia el estado de un cliente (activo, suspendido, cancelado)
   * PATCH /api/v1/clients/:id/status
   */
  async cambiarEstadoCliente(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nuevoEstado, userUid, userCorreo } = req.body;

      if (!nuevoEstado) {
        res.status(400).json({
          exito: false,
          mensaje: 'El campo nuevoEstado es obligatorio.',
        });
        return;
      }

      const cliente = await FirestoreAdminService.getDoc('clientes', id);
      if (!cliente) {
        res.status(404).json({
          exito: false,
          mensaje: 'El cliente no existe.',
        });
        return;
      }

      await FirestoreAdminService.updateDoc('clientes', id, {
        estado: nuevoEstado,
        ultimaModificacion: FirestoreAdminService.serverTimestamp(),
      });

      const accionStr =
        nuevoEstado === 'suspendido'
          ? 'Suspensión de Cliente'
          : nuevoEstado === 'activo'
          ? 'Reactivación de Cliente'
          : nuevoEstado === 'cancelado'
          ? 'Cancelación de Cliente'
          : 'Cambio de Estado de Cliente';

      await FirestoreAdminService.addDoc('auditoria', {
        fecha: FirestoreAdminService.serverTimestamp(),
        usuarioUid: userUid || 'system',
        usuarioCorreo: userCorreo || 'admin@sistema.local',
        accion: accionStr,
        modulo: 'Clientes',
        detalles: `Se cambió el estado del cliente ${cliente.nombreEmpresa || id} a '${nuevoEstado}'`,
        exito: true,
      });

      res.status(200).json({
        exito: true,
        mensaje: `Estado del cliente actualizado a '${nuevoEstado}'.`,
      });
    } catch (error: any) {
      console.error('[clientAdminController.cambiarEstadoCliente] Error:', error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || 'Error al cambiar estado del cliente.',
      });
    }
  },

  /**
   * Elimina un cliente permanentemente si no posee licencias vinculadas
   * DELETE /api/v1/clients/:id
   */
  async eliminarCliente(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userUid, userCorreo } = req.body;

      const cliente = await FirestoreAdminService.getDoc('clientes', id);
      if (!cliente) {
        res.status(404).json({
          exito: false,
          mensaje: 'El cliente que intenta eliminar no existe.',
        });
        return;
      }

      const uuidCliente = cliente.uuidCliente || cliente.uuid || id;
      const nombreEmpresa = cliente.nombreEmpresa || 'Cliente';

      // 1. Validar contador
      if ((cliente.cantidadLicencias || 0) > 0) {
        res.status(409).json({
          exito: false,
          mensaje: `No es posible eliminar el cliente "${nombreEmpresa}" porque posee ${cliente.cantidadLicencias} licencia(s) registrada(s).`,
        });
        return;
      }

      // 2. Validar en colección licencias por si acaso
      const licenciasVinculadas = await FirestoreAdminService.queryCollection('licencias', [
        { field: 'clienteUuid', op: '==', value: uuidCliente },
      ]);
      const licenciasPorId = await FirestoreAdminService.queryCollection('licencias', [
        { field: 'clienteId', op: '==', value: id },
      ]);

      if (licenciasVinculadas.length > 0 || licenciasPorId.length > 0) {
        res.status(409).json({
          exito: false,
          mensaje: `No se puede eliminar el cliente "${nombreEmpresa}" porque existen registros de licencias activas o históricas vinculadas.`,
        });
        return;
      }

      await FirestoreAdminService.deleteDoc('clientes', id);

      await FirestoreAdminService.addDoc('auditoria', {
        fecha: FirestoreAdminService.serverTimestamp(),
        usuarioUid: userUid || 'system',
        usuarioCorreo: userCorreo || 'admin@sistema.local',
        accion: 'Eliminación de Cliente',
        modulo: 'Clientes',
        detalles: `Se eliminó permanentemente el cliente ${nombreEmpresa} (UUID: ${uuidCliente}, ID: ${id})`,
        exito: true,
      });

      res.status(200).json({
        exito: true,
        mensaje: `Cliente "${nombreEmpresa}" eliminado correctamente.`,
      });
    } catch (error: any) {
      console.error('[clientAdminController.eliminarCliente] Error:', error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || 'Error al eliminar el cliente.',
      });
    }
  },
};
