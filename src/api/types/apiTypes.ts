/**
 * Tipos e Interfaces para la API Empresarial de Validación de Licencias
 */

export type ApiErrorCode =
  | 'CLIENTE_NO_ENCONTRADO'
  | 'CLIENTE_INACTIVO'
  | 'LICENCIA_NO_ENCONTRADA'
  | 'LICENCIA_INACTIVA'
  | 'LICENCIA_EXPIRADA'
  | 'LICENCIA_SUSPENDIDA'
  | 'LICENCIA_REVOCADA'
  | 'VERSION_NO_PERMITIDA'
  | 'UUID_CLIENTE_INVALIDO'
  | 'MAXIMA_INSTALACIONES_ALCANZADO'
  | 'INSTALACION_NO_ENCONTRADA'
  | 'INSTALACION_YA_REGISTRADA'
  | 'FIRMA_HMAC_INVALIDA'
  | 'TIMESTAMP_EXPIRADO'
  | 'REPLAY_ATTACK_DETECTADO'
  | 'RATE_LIMIT_EXCEEDED'
  | 'DATOS_INVALIDOS'
  | 'ERROR_INTERNO';

export interface ApiResponse<T = any> {
  exito: boolean;
  codigoEstado: number;
  codigoError?: ApiErrorCode;
  mensaje: string;
  timestamp: string;
  data?: T;
}

export interface ValidateLicenseRequest {
  licenseKey: string;
  uuidCliente: string;
  installationId?: string;
  versionSistema: string;
  nombreEquipo?: string;
}

export interface ValidateLicenseData {
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

export interface ActivateInstallationRequest {
  licenseKey: string;
  uuidCliente: string;
  installationId: string;
  nombreEquipo: string;
  versionSistema: string;
  detallesHardware?: Record<string, any>;
}

export interface HeartbeatRequest {
  licenseKey: string;
  uuidCliente: string;
  installationId: string;
  versionSistema: string;
  estadoEquipo?: string;
}

export interface DeactivateInstallationRequest {
  licenseKey: string;
  uuidCliente: string;
  installationId: string;
  motivo?: string;
}

export interface RenewLicenseApiRequest {
  licenseKey: string;
  uuidCliente: string;
  diasAnadidos: number;
  tokenRenovacion?: string;
}

export interface ApiLogEntry {
  id?: string;
  fecha: string;
  timestamp: number;
  cliente: string;
  uuidCliente: string;
  licencia: string;
  installationId?: string;
  endpoint: string;
  metodo: string;
  codigoEstado: number;
  exito: boolean;
  codigoError?: string;
  mensaje: string;
  ip: string;
  userAgent: string;
  duracionMs: number;
}
