/**
 * Tipos e Interfaces para el Administrador de Licencias del Sistema de Inventario
 */

export type SystemLicenseState =
  | 'SIN_ACTIVAR'
  | 'ACTIVANDO'
  | 'VALIDANDO'
  | 'CONECTADO'
  | 'SIN_CONEXION'
  | 'LICENCIA_SUSPENDIDA'
  | 'LICENCIA_EXPIRADA'
  | 'LICENCIA_REVOCADA'
  | 'MODO_GRACIA'
  | 'BLOQUEADO';

export interface LocalLicenseStorage {
  licenseKey: string;
  uuidCliente: string;
  installationId: string;
  nombreEquipo: string;
  versionSistema: string;
  nombreEmpresa?: string;
  tipoLicencia?: string;
  fechaExpiracion?: string;
  diasRestantes?: number;
  ultimaValidacion?: string;
  ultimoHeartbeat?: string;
  ultimoEstado: SystemLicenseState;
  fechaUltimoExito?: string;
  diasGraciaPermitidos: number;
  diasGraciaRestantes?: number;
  mensajeUsuario?: string;
  codigoError?: string;
  _checksum?: string;
}

export interface LicenseManagerOptions {
  diasGraciaDefault?: number; // Por defecto: 7 días
  heartbeatIntervalMs?: number; // Por defecto: 15 minutos
  autoValidateOnInit?: boolean;
}
