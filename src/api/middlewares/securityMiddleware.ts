import { Request, Response, NextFunction } from 'express';
import { cryptoUtils } from '../utils/cryptoUtils';
import { responseUtils } from '../utils/responseUtils';

// Almacenamiento en memoria para Rate Limiting (Token Bucket por IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const MAX_PETICIONES_POR_MINUTO = 60;
const VENTANA_RATE_LIMIT_MS = 60 * 1000;

export const securityMiddleware = {
  /**
   * Middleware de Rate Limiting para prevenir ataques de fuerza bruta o saturación
   */
  rateLimiter(req: Request, res: Response, next: NextFunction) {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
    const ahora = Date.now();

    let record = rateLimitMap.get(clientIp);

    if (!record || ahora > record.resetTime) {
      record = { count: 1, resetTime: ahora + VENTANA_RATE_LIMIT_MS };
      rateLimitMap.set(clientIp, record);
      return next();
    }

    record.count++;

    if (record.count > MAX_PETICIONES_POR_MINUTO) {
      const resp = responseUtils.error(
        'RATE_LIMIT_EXCEEDED',
        `Se ha superado el límite de ${MAX_PETICIONES_POR_MINUTO} peticiones por minuto. Intente de nuevo más tarde.`,
        429
      );
      return res.status(resp.status).json(resp.body);
    }

    next();
  },

  /**
   * Middleware de Seguridad HMAC, Timestamp y Replay Attacks
   */
  validarHmacYReplay(req: Request, res: Response, next: NextFunction) {
    const timestampHeader = (req.headers['x-timestamp'] as string) || '';
    const nonceHeader = (req.headers['x-nonce'] as string) || '';
    const signatureHeader =
      (req.headers['x-signature'] as string) || (req.headers['x-hmac-signature'] as string) || '';

    // Permitir bypass explícito de firmas SOLO en desarrollo si está explícitamente habilitado en variables de entorno.
    // En producción (process.env.NODE_ENV === 'production') el bypass 'x-admin-bypass' está COMPLETAMENTE ELIMINADO.
    const isDevAdminBypass =
      process.env.NODE_ENV !== 'production' &&
      req.headers['x-admin-bypass'] === 'true' &&
      process.env.ALLOW_ADMIN_BYPASS === 'true';
    if (isDevAdminBypass) {
      return next();
    }

    // 1. Validar presencia de cabeceras de seguridad
    if (!timestampHeader || !nonceHeader || !signatureHeader) {
      const resp = responseUtils.error(
        'FIRMA_HMAC_INVALIDA',
        'Faltan cabeceras de seguridad obligatorias (x-timestamp, x-nonce, x-signature).',
        401
      );
      return res.status(resp.status).json(resp.body);
    }

    // 2. Validar ventana de tiempo (Anti-Replay por Expiración)
    if (!cryptoUtils.validarTimestamp(timestampHeader)) {
      const resp = responseUtils.error(
        'TIMESTAMP_EXPIRADO',
        'El timestamp de la petición difiere en más de 5 minutos del tiempo del servidor.',
        401
      );
      return res.status(resp.status).json(resp.body);
    }

    // 3. Validar reutilización de Nonce (Anti-Replay por Duplicación)
    if (cryptoUtils.esNonceReutilizado(nonceHeader, timestampHeader)) {
      const resp = responseUtils.error(
        'REPLAY_ATTACK_DETECTADO',
        'El nonce de esta petición ya ha sido utilizado. Petición rechazada por seguridad.',
        401
      );
      return res.status(resp.status).json(resp.body);
    }

    // 4. Validar Firma HMAC SHA-256
    const path = req.originalUrl || req.url;
    const esFirmaValida = cryptoUtils.validarFirma(
      req.method,
      path,
      timestampHeader,
      nonceHeader,
      signatureHeader,
      req.body
    );

    if (!esFirmaValida) {
      const resp = responseUtils.error(
        'FIRMA_HMAC_INVALIDA',
        'La firma HMAC de la petición es inválida o el contenido ha sido alterado.',
        401
      );
      return res.status(resp.status).json(resp.body);
    }

    next();
  }
};
