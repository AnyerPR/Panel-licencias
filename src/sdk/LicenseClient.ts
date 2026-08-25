import {
  ClientConfig,
  LicenseValidationResult,
  InstallationActivationResult,
  HeartbeatResult,
  DeactivationResult,
  RenewResult,
  LicenseStatusResult,
} from './types/sdkTypes';
import { SDKLicenseError } from './types/sdkErrors';
import { SdkLogger } from './utils/sdkLogger';
import { SdkCache } from './utils/sdkCache';
import { HttpClient } from './utils/httpClient';

/**
 * Cliente Oficial del SDK de Validación de Licencias para el Sistema de Gestión de Inventario.
 * Arquitectura desacoplada, única y segura para interacción con el Panel Maestro.
 */
export class LicenseClient {
  private static instance: LicenseClient | null = null;

  private config: ClientConfig | null = null;
  private logger: SdkLogger;
  private cache: SdkCache;
  private httpClient: HttpClient | null = null;
  private heartbeatTimer: any = null;

  constructor(config?: ClientConfig) {
    this.logger = new SdkLogger(config?.loggerOptions);
    this.cache = new SdkCache(config?.cacheOptions);

    if (config) {
      this.initialize(config);
    }
  }

  /**
   * Obtiene la instancia Singleton del cliente
   */
  public static getInstance(): LicenseClient {
    if (!LicenseClient.instance) {
      LicenseClient.instance = new LicenseClient();
    }
    return LicenseClient.instance;
  }

  /**
   * Inicializa la configuración global del SDK.
   * Debe llamarse al arrancar el Sistema de Inventario.
   */
  public initialize(config: ClientConfig): void {
    if (!config.licenseKey || !config.uuidCliente || !config.installationId || !config.versionSistema) {
      throw new SDKLicenseError(
        'Configuración incompleta: licenseKey, uuidCliente, installationId y versionSistema son campos obligatorios.',
        'CONFIGURACION_INVALIDA',
        400
      );
    }

    this.config = {
      baseUrl: config.baseUrl || '/api/v1/license',
      useAdminBypass: config.useAdminBypass ?? true,
      timeoutMs: config.timeoutMs || 10000,
      nombreEquipo: config.nombreEquipo || 'Terminal de Inventario',
      ...config,
    };

    this.logger.updateConfig(config.loggerOptions || {});
    this.cache.updateConfig(config.cacheOptions || {});

    if (this.httpClient) {
      this.httpClient.updateConfig(this.config);
    } else {
      this.httpClient = new HttpClient(this.config, this.logger, this.cache);
    }

    this.logger.info(`SDK de Licencias inicializado correctamente para Cliente: ${this.config.uuidCliente}`);
  }

  /**
   * Verifica si el SDK ha sido inicializado
   */
  public isInitialized(): boolean {
    return this.config !== null && this.httpClient !== null;
  }

  /**
   * Asegura que el cliente esté inicializado antes de realizar llamadas
   */
  private checkInitialized(): void {
    if (!this.isInitialized() || !this.config || !this.httpClient) {
      throw new SDKLicenseError(
        'El SDK de Licencias no ha sido inicializado. Llame a initialize() antes de realizar peticiones.',
        'NO_INICIALIZADO',
        400
      );
    }
  }

  /**
   * Valida integralmente la licencia con el servidor maestro
   */
  public async validateLicense(
    overrideOptions?: Partial<ClientConfig>
  ): Promise<LicenseValidationResult> {
    this.checkInitialized();
    const activeConfig = { ...this.config!, ...overrideOptions };

    this.logger.info(`Validando licencia: ${activeConfig.licenseKey}`);

    const payload = {
      licenseKey: activeConfig.licenseKey,
      uuidCliente: activeConfig.uuidCliente,
      installationId: activeConfig.installationId,
      versionSistema: activeConfig.versionSistema,
      nombreEquipo: activeConfig.nombreEquipo,
    };

    const resultado = await this.httpClient!.request<LicenseValidationResult>(
      '/validate',
      'POST',
      payload
    );

    this.logger.info(`Resultado de validación: ${resultado.mensaje}`);
    return resultado;
  }

  /**
   * Registra y activa la instalación del equipo/terminal actual
   */
  public async activateInstallation(
    overrideOptions?: Partial<ClientConfig> & { detallesHardware?: Record<string, any> }
  ): Promise<InstallationActivationResult> {
    this.checkInitialized();
    const activeConfig = { ...this.config!, ...overrideOptions };

    this.logger.info(`Activando instalación para ID: ${activeConfig.installationId}`);

    const payload = {
      licenseKey: activeConfig.licenseKey,
      uuidCliente: activeConfig.uuidCliente,
      installationId: activeConfig.installationId,
      nombreEquipo: activeConfig.nombreEquipo,
      versionSistema: activeConfig.versionSistema,
      detallesHardware: overrideOptions?.detallesHardware || {},
    };

    const resultado = await this.httpClient!.request<InstallationActivationResult>(
      '/activate',
      'POST',
      payload
    );

    this.logger.info(`Resultado de activación: ${resultado.mensaje}`);
    return resultado;
  }

  /**
   * Envía la señal periódica de presencia (Heartbeat) del sistema
   */
  public async heartbeat(
    overrideOptions?: Partial<ClientConfig> & { estadoEquipo?: string }
  ): Promise<HeartbeatResult> {
    this.checkInitialized();
    const activeConfig = { ...this.config!, ...overrideOptions };

    this.logger.debug(`Enviando heartbeat para Installation ID: ${activeConfig.installationId}`);

    const payload = {
      licenseKey: activeConfig.licenseKey,
      uuidCliente: activeConfig.uuidCliente,
      installationId: activeConfig.installationId,
      versionSistema: activeConfig.versionSistema,
      estadoEquipo: overrideOptions?.estadoEquipo || 'online',
    };

    return await this.httpClient!.request<HeartbeatResult>('/heartbeat', 'POST', payload);
  }

  /**
   * Renueva los días de vigencia de la licencia
   */
  public async renew(
    diasAnadidos: number,
    overrideOptions?: Partial<ClientConfig>
  ): Promise<RenewResult> {
    this.checkInitialized();
    const activeConfig = { ...this.config!, ...overrideOptions };

    this.logger.info(`Solicitando renovación de ${diasAnadidos} días para la licencia ${activeConfig.licenseKey}`);

    const payload = {
      licenseKey: activeConfig.licenseKey,
      uuidCliente: activeConfig.uuidCliente,
      diasAnadidos,
    };

    return await this.httpClient!.request<RenewResult>('/renew', 'POST', payload);
  }

  /**
   * Desactiva la instalación actual liberando el cupo en la licencia
   */
  public async deactivate(
    motivo = 'Desactivación solicitada desde el SDK de cliente',
    overrideOptions?: Partial<ClientConfig>
  ): Promise<DeactivationResult> {
    this.checkInitialized();
    const activeConfig = { ...this.config!, ...overrideOptions };

    this.logger.info(`Desactivando installation ID: ${activeConfig.installationId}`);

    const payload = {
      licenseKey: activeConfig.licenseKey,
      uuidCliente: activeConfig.uuidCliente,
      installationId: activeConfig.installationId,
      motivo,
    };

    const resultado = await this.httpClient!.request<DeactivationResult>('/deactivate', 'POST', payload);

    // Detener auto heartbeat si estaba corriendo
    this.stopAutoHeartbeat();

    return resultado;
  }

  /**
   * Consulta el estado en tiempo real de la licencia (con soporte de caché rápida)
   */
  public async getStatus(
    overrideOptions?: Partial<ClientConfig> & { useCache?: boolean }
  ): Promise<LicenseStatusResult> {
    this.checkInitialized();
    const activeConfig = { ...this.config!, ...overrideOptions };

    const useCache = overrideOptions?.useCache ?? true;

    this.logger.debug(`Consultando estado de licencia: ${activeConfig.licenseKey}`);

    const queryParams = new URLSearchParams({
      licenseKey: activeConfig.licenseKey,
      uuidCliente: activeConfig.uuidCliente,
    });

    return await this.httpClient!.request<LicenseStatusResult>(
      `/status?${queryParams.toString()}`,
      'GET',
      undefined,
      { useCache }
    );
  }

  /**
   * Inicia el envío automático en segundo plano de Heartbeat cada X minutos/segundos
   */
  public startAutoHeartbeat(intervalMs = 15 * 60 * 1000): void {
    this.stopAutoHeartbeat();

    this.logger.info(`Iniciando Heartbeat automático cada ${intervalMs / 1000}s`);

    // Ejecutar un primer heartbeat de inmediato
    this.heartbeat().catch((err) => {
      this.logger.warn(`Error en Heartbeat inicial automático: ${err.message}`);
    });

    this.heartbeatTimer = setInterval(() => {
      this.heartbeat().catch((err) => {
        this.logger.warn(`Error enviando Heartbeat automático: ${err.message}`);
      });
    }, intervalMs);
  }

  /**
   * Detiene el Heartbeat automático
   */
  public stopAutoHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
      this.logger.info('Heartbeat automático detenido.');
    }
  }

  /**
   * Limpia la memoria caché local del SDK
   */
  public clearCache(): void {
    this.cache.clear();
    this.logger.info('Caché del SDK de licencias limpiado.');
  }

  /**
   * Retorna la configuración activa
   */
  public getConfig(): ClientConfig | null {
    return this.config ? { ...this.config } : null;
  }
}

// Exportar una instancia por defecto
export const licenseClient = LicenseClient.getInstance();
