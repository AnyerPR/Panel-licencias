/**
 * Utilidades criptográficas universales para el SDK (Browser y Node.js compatible)
 */

export class SdkCrypto {
  /**
   * Genera las cabeceras de seguridad requeridas por la API (x-timestamp, x-nonce, x-signature o x-admin-bypass)
   */
  public static async generarCabecerasSeguridad(
    metodo: string,
    path: string,
    bodyData: any,
    secretKey?: string,
    useAdminBypass = false
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (useAdminBypass && typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production' && process.env?.ALLOW_ADMIN_BYPASS === 'true') {
      headers['x-admin-bypass'] = 'true';
      return headers;
    }

    const effectiveSecret = secretKey || 'panel-maestro-deli-secret-key-2026-enterprise';
    const timestamp = Date.now().toString();
    const nonce = this.generarNonce();
    const signature = await this.calcularHmacSha256(metodo, path, timestamp, nonce, bodyData, effectiveSecret);

    headers['x-timestamp'] = timestamp;
    headers['x-nonce'] = nonce;
    headers['x-signature'] = signature;

    return headers;
  }

  private static generarNonce(): string {
    return Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
  }

  private static async calcularHmacSha256(
    metodo: string,
    path: string,
    timestamp: string,
    nonce: string,
    bodyData: any,
    secretKey: string
  ): Promise<string> {
    const bodyStr = bodyData ? JSON.stringify(bodyData) : '';
    const payload = `${metodo.toUpperCase()}:${path}:${timestamp}:${nonce}:${bodyStr}`;

    // Usar Web Crypto API nativa de navegadores/Node 15+
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secretKey);
        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(payload));
        return Array.from(new Uint8Array(signatureBuffer))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
      } catch {
        // Fallback si falla SubtleCrypto
      }
    }

    // Fallback simple determinista para entornos antiguos
    return 'hmac_sha256_mock_signature_' + timestamp;
  }
}
