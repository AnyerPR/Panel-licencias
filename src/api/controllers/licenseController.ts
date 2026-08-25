import { Request, Response } from 'express';
import { validationService } from '../services/validationService';
import { responseUtils } from '../utils/responseUtils';
import { ApiLogEntry } from '../types/apiTypes';

export const licenseController = {
  /**
   * Endpoint: POST /api/v1/license/validate
   */
  async validateLicense(req: Request, res: Response) {
    const inicio = Date.now();
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    try {
      const resultado = await validationService.validarLicencia(req.body, clientIp);
      const duracionMs = Date.now() - inicio;

      // Registrar log de auditoría
      await validationService.registrarApiLog({
        fecha: new Date().toISOString(),
        timestamp: inicio,
        cliente: req.body?.uuidCliente || 'Anónimo',
        uuidCliente: req.body?.uuidCliente || '',
        licencia: req.body?.licenseKey || '',
        installationId: req.body?.installationId || '',
        endpoint: '/api/v1/license/validate',
        metodo: 'POST',
        codigoEstado: resultado.status,
        exito: resultado.exito,
        codigoError: resultado.codigoError,
        mensaje: resultado.mensaje,
        ip: clientIp,
        userAgent,
        duracionMs
      });

      if (!resultado.exito) {
        const errResp = responseUtils.error(
          resultado.codigoError || 'ERROR_INTERNO',
          resultado.mensaje,
          resultado.status
        );
        return res.status(errResp.status).json(errResp.body);
      }

      const okResp = responseUtils.exito(resultado.data, resultado.mensaje, resultado.status);
      return res.status(okResp.status).json(okResp.body);
    } catch (error: any) {
      const duracionMs = Date.now() - inicio;
      const errResp = responseUtils.error(
        'ERROR_INTERNO',
        error.message || 'Error no controlado procesando la validación de licencia.',
        500
      );
      return res.status(errResp.status).json(errResp.body);
    }
  },

  /**
   * Endpoint: POST /api/v1/license/activate
   */
  async activateInstallation(req: Request, res: Response) {
    const inicio = Date.now();
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    try {
      const resultado = await validationService.activarInstalacion(req.body, clientIp);
      const duracionMs = Date.now() - inicio;

      await validationService.registrarApiLog({
        fecha: new Date().toISOString(),
        timestamp: inicio,
        cliente: req.body?.uuidCliente || 'Anónimo',
        uuidCliente: req.body?.uuidCliente || '',
        licencia: req.body?.licenseKey || '',
        installationId: req.body?.installationId || '',
        endpoint: '/api/v1/license/activate',
        metodo: 'POST',
        codigoEstado: resultado.status,
        exito: resultado.exito,
        codigoError: resultado.codigoError,
        mensaje: resultado.mensaje,
        ip: clientIp,
        userAgent,
        duracionMs
      });

      if (!resultado.exito) {
        const errResp = responseUtils.error(
          resultado.codigoError || 'ERROR_INTERNO',
          resultado.mensaje,
          resultado.status
        );
        return res.status(errResp.status).json(errResp.body);
      }

      const okResp = responseUtils.exito(resultado.data, resultado.mensaje, resultado.status);
      return res.status(okResp.status).json(okResp.body);
    } catch (error: any) {
      const errResp = responseUtils.error('ERROR_INTERNO', error.message || 'Error inesperado.', 500);
      return res.status(errResp.status).json(errResp.body);
    }
  },

  /**
   * Endpoint: POST /api/v1/license/heartbeat
   */
  async heartbeat(req: Request, res: Response) {
    const inicio = Date.now();
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    try {
      const resultado = await validationService.procesarHeartbeat(req.body, clientIp);
      const duracionMs = Date.now() - inicio;

      await validationService.registrarApiLog({
        fecha: new Date().toISOString(),
        timestamp: inicio,
        cliente: req.body?.uuidCliente || 'Anónimo',
        uuidCliente: req.body?.uuidCliente || '',
        licencia: req.body?.licenseKey || '',
        installationId: req.body?.installationId || '',
        endpoint: '/api/v1/license/heartbeat',
        metodo: 'POST',
        codigoEstado: resultado.status,
        exito: resultado.exito,
        codigoError: resultado.codigoError,
        mensaje: resultado.mensaje,
        ip: clientIp,
        userAgent,
        duracionMs
      });

      if (!resultado.exito) {
        const errResp = responseUtils.error(
          resultado.codigoError || 'ERROR_INTERNO',
          resultado.mensaje,
          resultado.status
        );
        return res.status(errResp.status).json(errResp.body);
      }

      const okResp = responseUtils.exito(resultado.data, resultado.mensaje, resultado.status);
      return res.status(okResp.status).json(okResp.body);
    } catch (error: any) {
      const errResp = responseUtils.error('ERROR_INTERNO', error.message || 'Error inesperado.', 500);
      return res.status(errResp.status).json(errResp.body);
    }
  },

  /**
   * Endpoint: POST /api/v1/license/deactivate
   */
  async deactivateInstallation(req: Request, res: Response) {
    const inicio = Date.now();
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    try {
      const resultado = await validationService.desactivarInstalacion(req.body, clientIp);
      const duracionMs = Date.now() - inicio;

      await validationService.registrarApiLog({
        fecha: new Date().toISOString(),
        timestamp: inicio,
        cliente: req.body?.uuidCliente || 'Anónimo',
        uuidCliente: req.body?.uuidCliente || '',
        licencia: req.body?.licenseKey || '',
        installationId: req.body?.installationId || '',
        endpoint: '/api/v1/license/deactivate',
        metodo: 'POST',
        codigoEstado: resultado.status,
        exito: resultado.exito,
        codigoError: resultado.codigoError,
        mensaje: resultado.mensaje,
        ip: clientIp,
        userAgent,
        duracionMs
      });

      if (!resultado.exito) {
        const errResp = responseUtils.error(
          resultado.codigoError || 'ERROR_INTERNO',
          resultado.mensaje,
          resultado.status
        );
        return res.status(errResp.status).json(errResp.body);
      }

      const okResp = responseUtils.exito(resultado.data, resultado.mensaje, resultado.status);
      return res.status(okResp.status).json(okResp.body);
    } catch (error: any) {
      const errResp = responseUtils.error('ERROR_INTERNO', error.message || 'Error inesperado.', 500);
      return res.status(errResp.status).json(errResp.body);
    }
  },

  /**
   * Endpoint: POST /api/v1/license/renew
   */
  async renewLicense(req: Request, res: Response) {
    const inicio = Date.now();
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    try {
      const resultado = await validationService.renovarLicencia(req.body, clientIp);
      const duracionMs = Date.now() - inicio;

      await validationService.registrarApiLog({
        fecha: new Date().toISOString(),
        timestamp: inicio,
        cliente: req.body?.uuidCliente || 'Anónimo',
        uuidCliente: req.body?.uuidCliente || '',
        licencia: req.body?.licenseKey || '',
        endpoint: '/api/v1/license/renew',
        metodo: 'POST',
        codigoEstado: resultado.status,
        exito: resultado.exito,
        codigoError: resultado.codigoError,
        mensaje: resultado.mensaje,
        ip: clientIp,
        userAgent,
        duracionMs
      });

      if (!resultado.exito) {
        const errResp = responseUtils.error(
          resultado.codigoError || 'ERROR_INTERNO',
          resultado.mensaje,
          resultado.status
        );
        return res.status(errResp.status).json(errResp.body);
      }

      const okResp = responseUtils.exito(resultado.data, resultado.mensaje, resultado.status);
      return res.status(okResp.status).json(okResp.body);
    } catch (error: any) {
      const errResp = responseUtils.error('ERROR_INTERNO', error.message || 'Error inesperado.', 500);
      return res.status(errResp.status).json(errResp.body);
    }
  },

  /**
   * Endpoint: GET /api/v1/license/status
   */
  async getLicenseStatus(req: Request, res: Response) {
    const inicio = Date.now();
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const licenseKey = (req.query.licenseKey as string) || '';
    const uuidCliente = (req.query.uuidCliente as string) || '';

    try {
      const resultado = await validationService.obtenerEstadoLicencia(licenseKey, uuidCliente, clientIp);
      const duracionMs = Date.now() - inicio;

      await validationService.registrarApiLog({
        fecha: new Date().toISOString(),
        timestamp: inicio,
        cliente: uuidCliente || 'Anónimo',
        uuidCliente,
        licencia: licenseKey,
        endpoint: '/api/v1/license/status',
        metodo: 'GET',
        codigoEstado: resultado.status,
        exito: resultado.exito,
        codigoError: resultado.codigoError,
        mensaje: resultado.mensaje,
        ip: clientIp,
        userAgent,
        duracionMs
      });

      if (!resultado.exito) {
        const errResp = responseUtils.error(
          resultado.codigoError || 'ERROR_INTERNO',
          resultado.mensaje,
          resultado.status
        );
        return res.status(errResp.status).json(errResp.body);
      }

      const okResp = responseUtils.exito(resultado.data, resultado.mensaje, resultado.status);
      return res.status(okResp.status).json(okResp.body);
    } catch (error: any) {
      const errResp = responseUtils.error('ERROR_INTERNO', error.message || 'Error inesperado.', 500);
      return res.status(errResp.status).json(errResp.body);
    }
  }
};
