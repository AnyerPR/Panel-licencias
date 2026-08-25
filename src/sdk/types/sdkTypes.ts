/**
 * Tipos e Interfaces Oficiales para el SDK del Sistema de Inventario
 */

export interface RetryConfig {
  maxRetries?: number;        // Número máximo de reintentos (def: 3)
  initialDelayMs?: number;    // Tiempo inicial de espera en ms (def: 1000)
  maxDelayMs?: number;        // Tiempo máximo de espera en ms (def: 8000)
  backoffFactor?: number;     // Factor de incremento exponencial (def: 2)
}

export interface CacheConfig {
  enabled?: boolean;          // Habilitar caché de respuestas (def: true)
  ttlMs?: number;             // Tiempo de vida en ms (def: 300,000 = 5 min)
  storageType?: 'memory' | 'localStorage'; // Almacenamiento preferido
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

export interface LoggerConfig {
  enabled?: boolean;
  level?: LogLevel;
  customLogger?: (level: LogLevel, message: string, data?: any) => void;
}

export interface ClientConfig {
  baseUrl?: string;           // URL Base de la API (def: '/api/v1/license')
  licenseKey: string;         // Clave de Licencia del Cliente
  uuidCliente: string;        // UUID Único del Cliente
  installationId: string;     // ID Único de la Instalación/Hardware
  versionSistema: string;     // Versión actual del Sistema de Inventario
  nombreEquipo?: string;      // Nombre de la terminal / equipo
  secretKey?: string;         // Clave secreta para firmas HMAC SHA-256
  useAdminBypass?: boolean;   // Utilizar Bypass de desarrollo (def: false)
  timeoutMs?: number;         // Timeout por petición en ms (def: 10000)
  retryOptions?: RetryConfig;
  cacheOptions?: CacheConfig;
  loggerOptions?: LoggerConfig;
}

export interface SdkResponse<T = any> {
  exito: boolean;
  codigoEstado: number;
  codigoError?: string;
  mensaje: string;
  timestamp: string;
  desdeCache?: boolean;
  data?: T;
}

export interface ValidateLicenseResultData {
  licenciaValida: boolean;
  licenseKey: string;
  uuidCliente: string;
  nombreEmpresa: string;
  estadoLicencia: string;
  tipoLicencia: string;
  versionMinima: string;
  versionMaxima: string;
  fechaExpiracion: string;
  diasRestantes: number;
  cantidadInstalacionesPermitidas: number;
  cantidadInstalacionesUsadas: number;
  installationIdRegistrado?: boolean;
}

export interface ActivateInstallationResultData {
  installationId: string;
  licenseKey: string;
  uuidCliente: string;
  nombreEquipo: string;
  estado: string;
  fechaActivacion: string;
  instalacionesUsadas: number;
  instalacionesPermitidas: number;
}

export interface HeartbeatResultData {
  installationId: string;
  estado: string;
  ultimaConexion: string;
  diasRestantes?: number;
}

export interface DeactivationResultData {
  installationId: string;
  licenseKey: string;
  estado: string;
}

export interface RenewResultData {
  licenseKey: string;
  nuevaFechaExpiracion: string;
  diasAnadidos: number;
  estado: string;
}

export interface LicenseStatusResultData extends ValidateLicenseResultData {}

export type LicenseValidationResult = SdkResponse<ValidateLicenseResultData>;
export type InstallationActivationResult = SdkResponse<ActivateInstallationResultData>;
export type HeartbeatResult = SdkResponse<HeartbeatResultData>;
export type DeactivationResult = SdkResponse<DeactivationResultData>;
export type RenewResult = SdkResponse<RenewResultData>;
export type LicenseStatusResult = SdkResponse<LicenseStatusResultData>;
