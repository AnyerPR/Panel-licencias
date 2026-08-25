import { ClientConfig, RetryConfig } from '../types/sdkTypes';
import { SDKLicenseError } from '../types/sdkErrors';
import { SdkLogger } from './sdkLogger';
import { SdkCache } from './sdkCache';
import { SdkCrypto } from './sdkCrypto';

export class HttpClient {
  private config: ClientConfig;
  private logger: SdkLogger;
  private cache: SdkCache;

  constructor(config: ClientConfig, logger: SdkLogger, cache: SdkCache) {
    this.config = config;
    this.logger = logger;
    this.cache = cache;
  }

  public updateConfig(config: ClientConfig): void {
    this.config = config;
  }

  /**
   * Ejecuta una petición HTTP con reintentos automáticos, timeouts y caché
   */
  public async request<T>(
    path: string,
    metodo: 'GET' | 'POST' = 'POST',
    bodyData?: any,
    options?: { useCache?: boolean; ttlMs?: number }
  ): Promise<T> {
    const baseUrl = (this.config.baseUrl || '/api/v1/license').replace(/\/$/, '');
    const fullUrl = `${baseUrl}${path}`;
    const cacheKey = `${metodo}_${path}_${JSON.stringify(bodyData || {})}`;

    // 1. Verificar Caché Temporal
    if (options?.useCache && metodo === 'GET') {
      const cached = this.cache.get<T>(cacheKey);
      if (cached) {
        this.logger.debug(`Respuesta recuperada desde caché para ${path}`);
        return { ...(cached as any), desdeCache: true };
      }
    }

    const retryConfig: RetryConfig = {
      maxRetries: this.config.retryOptions?.maxRetries ?? 3,
      initialDelayMs: this.config.retryOptions?.initialDelayMs ?? 1000,
      maxDelayMs: this.config.retryOptions?.maxDelayMs ?? 8000,
      backoffFactor: this.config.retryOptions?.backoffFactor ?? 2,
    };

    let intento = 0;
    let ultimoError: any = null;

    while (intento <= (retryConfig.maxRetries || 3)) {
      try {
        if (intento > 0) {
          const delay = Math.min(
            (retryConfig.initialDelayMs || 1000) * Math.pow(retryConfig.backoffFactor || 2, intento - 1),
            retryConfig.maxDelayMs || 8000
          );
          this.logger.warn(`Reintentando petición (${intento}/${retryConfig.maxRetries}) a ${path} tras ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        const respuesta = await this.ejecutarPeticionFetch<T>(fullUrl, path, metodo, bodyData);

        // Guardar en caché si la respuesta es exitosa y se solicitó uso de caché
        if (options?.useCache && respuesta && (respuesta as any).exito) {
          this.cache.set(cacheKey, respuesta, options.ttlMs);
        }

        return respuesta;
      } catch (err: any) {
        intento++;
        ultimoError = err;

        // No reintentar si es un error de negocio del cliente (400, 401, 403, 404)
        if (err instanceof SDKLicenseError && err.codigoEstado >= 400 && err.codigoEstado < 500) {
          this.logger.error(`Error no recuperable (${err.codigoEstado}): ${err.message}`);
          throw err;
        }

        this.logger.warn(`Fallo en el intento ${intento} para ${path}: ${err.message}`);
      }
    }

    this.logger.error(`Agotados todos los reintentos (${retryConfig.maxRetries}) para ${path}`);
    throw ultimoError || new SDKLicenseError('Agotados los reintentos de conexión con la API de Licencias.', 'NETWORK_ERROR', 503);
  }

  private async ejecutarPeticionFetch<T>(
    fullUrl: string,
    path: string,
    metodo: string,
    bodyData?: any
  ): Promise<T> {
    const timeoutMs = this.config.timeoutMs || 10000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const securityHeaders = await SdkCrypto.generarCabecerasSeguridad(
        metodo,
        `/api/v1/license${path}`,
        bodyData,
        this.config.secretKey,
        this.config.useAdminBypass ?? true
      );

      const requestOptions: RequestInit = {
        method: metodo,
        headers: securityHeaders,
        signal: controller.signal,
      };

      if (metodo === 'POST' && bodyData) {
        requestOptions.body = JSON.stringify(bodyData);
      }

      this.logger.debug(`Enviando ${metodo} a ${fullUrl}`);
      const response = await fetch(fullUrl, requestOptions);
      clearTimeout(timeoutId);

      const json = await response.json();

      if (!response.ok || !json.exito) {
        throw new SDKLicenseError(
          json.mensaje || `Error HTTP ${response.status} recibido desde el servidor de licencias.`,
          json.codigoError || 'API_ERROR',
          response.status,
          json
        );
      }

      return json as T;
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        throw new SDKLicenseError(
          `La petición excedió el tiempo límite de ${timeoutMs}ms.`,
          'TIMEOUT_ERROR',
          408
        );
      }

      if (err instanceof SDKLicenseError) {
        throw err;
      }

      throw new SDKLicenseError(
        err.message || 'Error de red o comunicación con el servidor de licencias.',
        'CONNECTION_ERROR',
        500,
        err
      );
    }
  }
}
