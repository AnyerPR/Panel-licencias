/**
 * Tipos e Interfaces para el Panel Maestro de Licencias
 */

export type RolAdmin = 'super_admin' | 'admin';

export interface AdminUser {
  uid: string;
  nombre: string;
  correo: string;
  rol: RolAdmin;
  activo: boolean;
  fechaCreacion: string | Date;
  ultimoAcceso: string | Date;
}

export type EstadoCliente = 'activo' | 'suspendido' | 'cancelado' | 'vencido' | 'mantenimiento';

export interface Cliente {
  id?: string;
  uuidCliente: string; // ej: cli_8f3d9a71b2 (UUID permanente e inmutable)
  uuid?: string; // alias opcional para compatibilidad
  nombreEmpresa: string;
  nombreComercial: string;
  rnc: string;
  telefono: string;
  correo: string;
  direccion: string;
  ciudad: string;
  pais: string;
  personaContacto: string;
  estado: EstadoCliente;
  plan: 'mensual' | 'anual' | 'vitalicio' | 'demo';
  fechaCreacion: string | Date;
  ultimaModificacion?: string | Date;
  cantidadLicencias: number;
  cantidadInstalaciones: number;
  observaciones?: string;

  // Campos opcionales para compatibilidad y datos de infraestructura
  tipo?: 'hospital' | 'farmacia' | 'clinica' | 'otro';
  firebaseProjectId?: string;
  dominio?: string;
  canalActualizacion?: 'estable' | 'beta' | 'lts';
  versionInstalada?: string;
  versionMinimaRequerida?: string;
  ultimaConexion?: string | Date;
  ultimaValidacion?: string | Date;
  ultimaIp?: string;
  notasInternas?: string;
}

export type EstadoLicencia = 'activa' | 'suspendida' | 'expirada' | 'revocada' | 'pendiente';

export type TipoLicencia = 'mensual' | 'trimestral' | 'semestral' | 'anual' | 'permanente' | 'prueba' | 'personalizada';

export interface RenovacionLicencia {
  id?: string;
  fecha: string | Date;
  diasAnadidos: number;
  renovadoPor: string;
  nuevoVencimiento: string | Date;
  observaciones?: string;
}

export interface Licencia {
  id?: string;
  licenseKey: string; // Ej: DELI-8F3D-9A71-B24C
  clienteId: string;
  uuidCliente: string;
  clienteUuid?: string; // Alias de compatibilidad
  nombreEmpresa?: string; // Nombre denormalizado del cliente para listados rápidos
  tipoLicencia: TipoLicencia;
  plan?: 'mensual' | 'anual' | 'vitalicio' | 'demo'; // Alias de compatibilidad
  estado: EstadoLicencia;
  versionMinima: string;
  versionMaxima: string;
  fechaCreacion: string | Date;
  fechaActivacion?: string | Date;
  fechaExpiracion: string | Date;
  fechaVencimiento?: string | Date; // Alias de compatibilidad
  diasRestantes: number;
  cantidadInstalacionesPermitidas: number;
  cantidadInstalacionesUsadas: number;
  instalacionesMaximas?: number; // Alias de compatibilidad
  renovaciones: RenovacionLicencia[];
  ultimaValidacion?: string | Date;
  ultimaConexion?: string | Date;
  installationIds: string[];
  observaciones?: string;
  notas?: string;
  creadoPor: string;
  creadoPorUid?: string;
  ultimaModificacion?: string | Date;
  historialCambios?: Array<{
    fecha: string | Date;
    adminUid: string;
    accion: string;
    detalles: string;
  }>;
}

export interface VersionSistema {
  id?: string;
  version: string;
  obligatoria: boolean;
  fechaLanzamiento: string | Date;
  notasCambio: string;
  urlDescarga?: string;
  canal: 'estable' | 'beta' | 'lts';
}

export interface Instalacion {
  id?: string;
  clienteUuid: string;
  installationId: string;
  dispositivo: string;
  ip?: string;
  ultimaConexion: string | Date;
  estado: 'activa' | 'bloqueada';
  versionActual: string;
}

export interface ConfiguracionGlobal {
  id?: string;
  modoMantenimientoGlobal: boolean;
  mensajeMantenimientoGlobal: string;
  versionMinimaObligatoria: string;
  versionUltimaDisponible: string;
}

export interface LogAuditoria {
  id?: string;
  fecha: string | Date;
  usuarioUid: string;
  usuarioCorreo: string;
  accion: string;
  modulo: string;
  detalles: string;
  ip?: string;
  exito: boolean;
}

export interface DashboardStats {
  clientesTotales: number;
  clientesActivos: number;
  clientesSuspendidos: number;
  clientesVencidos: number;
  clientesProximosVencer: number;
  instalacionesTotales: number;
  licenciasTotales: number;
  versionesRegistradas: number;
}
