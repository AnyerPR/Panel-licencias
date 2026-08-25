import crypto from 'crypto';

const getSecret = (): string => {
  const secret = process.env.LICENSE_HMAC_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[FATAL SECURITY ERROR] LICENSE_HMAC_SECRET must be configured in environment variables.');
    }
    return 'panel-maestro-deli-secret-key-2026-enterprise';
  }
  return secret;
};

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutos de ventana de tolerancia
const noncesVistos = new Map<string, number>();

// Limpieza periódica de nonces expirados cada 2 minutos
setInterval(() => {
  const ahora = Date.now();
  for (const [nonce, ts] of noncesVistos.entries()) {
    if (ahora - ts > NONCE_TTL_MS) {
      noncesVistos.delete(nonce);
    }
  }
}, 2 * 60 * 1000);

export const cryptoUtils = {
  /**
   * Genera la firma HMAC SHA-256 para una petición determinada
   */
  generarFirma(metodo: string, path: string, timestamp: string, nonce: string, bodyObj: any, secret = getSecret()): string {
    const bodyStr = bodyObj ? JSON.stringify(bodyObj) : '';
    const payload = `${metodo.toUpperCase()}:${path}:${timestamp}:${nonce}:${bodyStr}`;
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  },

  /**
   * Valida la firma HMAC recibida en los headers
   */
  validarFirma(
    metodo: string,
    path: string,
    timestamp: string,
    nonce: string,
    firmaRecibida: string,
    bodyObj: any,
    secret = getSecret()
  ): boolean {
    if (!firmaRecibida || typeof firmaRecibida !== 'string') return false;
    const firmaCalculada = this.generarFirma(metodo, path, timestamp, nonce, bodyObj, secret);
    
    try {
      return crypto.timingSafeEqual(
        Buffer.from(firmaCalculada, 'hex'),
        Buffer.from(firmaRecibida, 'hex')
      );
    } catch {
      return false;
    }
  },

  /**
   * Valida que el timestamp esté dentro del rango de tolerancia (5 minutos)
   */
  validarTimestamp(timestampStr: string): boolean {
    if (!timestampStr) return false;
    const ts = Number(timestampStr);
    if (isNaN(ts)) return false;

    const ahora = Date.now();
    const diferencia = Math.abs(ahora - ts);
    return diferencia <= NONCE_TTL_MS;
  },

  /**
   * Detecta y previene Replay Attacks registrando los nonces utilizados
   */
  esNonceReutilizado(nonce: string, timestampStr: string): boolean {
    if (!nonce || typeof nonce !== 'string') return true;

    if (noncesVistos.has(nonce)) {
      return true; // Ya fue utilizado -> Replay attack
    }

    const ts = Number(timestampStr) || Date.now();
    noncesVistos.set(nonce, ts);
    return false;
  }
};
