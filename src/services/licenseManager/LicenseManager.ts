import { LicenseClient, SDKLicenseError, ValidateLicenseResultData } from '../../sdk';
import { SystemLicenseState, LocalLicenseStorage, LicenseManagerOptions } from './LicenseManagerTypes';

const STORAGE_KEY = 'deli_inventory_license_data_v1';

export class LicenseManager {
  private static instance: LicenseManager | null = null;

  private sdk: LicenseClient;
  private stateData: LocalLicenseStorage;
  private options: LicenseManagerOptions;
  private subscribers: Array<(data: LocalLicenseStorage) => void> = [];
  private heartbeatTimer: any = null;

  private constructor(options?: LicenseManagerOptions) {
    this.sdk = LicenseClient.getInstance();
    this.options = {
      diasGraciaDefault: 7,
      heartbeatIntervalMs: 15 * 60 * 1000, // 15 minutos
      autoValidateOnInit: true,
      ...options,
    };

    // Cargar datos locales previamente guardados o usar valores por defecto
    this.stateData = this.cargarEstadoLocal();

    // Inicializar el SDK con los datos locales
    this.sincronizarConSDK();
  }

  public static getInstance(options?: LicenseManagerOptions): LicenseManager {
    if (!LicenseManager.instance) {
      LicenseManager.instance = new LicenseManager(options);
    }
    return LicenseManager.instance;
  }

  /**
   * Genera una firma/checksum de integridad para detectar manipulaciones en localStorage
   */
  public static calcularFirmaIntegridad(data: LocalLicenseStorage): string {
    const rawData = [
      data.licenseKey || '',
      data.uuidCliente || '',
      data.installationId || '',
      data.fechaUltimoExito || '',
      data.diasGraciaPermitidos || 7,
      data.diasGraciaRestantes ?? 0,
      data.ultimoEstado || '',
    ].join('::');

    const SALT = 'DELI_LICENSE_LOCAL_INTEGRITY_SALT_2026';
    let hash = 0x811c9dc5;
    const combined = rawData + '::' + SALT;
    for (let i = 0; i < combined.length; i++) {
      hash ^= combined.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
  }

  /**
   * Carga el almacenamiento local persistente
   */
  private cargarEstadoLocal(): LocalLicenseStorage {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: LocalLicenseStorage = JSON.parse(raw);
          // Verificar firma de integridad si existen datos de gracia o éxito guardados
          if (parsed.fechaUltimoExito || parsed._checksum) {
            const expected = LicenseManager.calcularFirmaIntegridad(parsed);
            if (parsed._checksum !== expected) {
              console.warn('[SEGURIDAD] Se detectó alteración manual en el almacenamiento local de licencias.');
              return {
                ...parsed,
                ultimoEstado: 'BLOQUEADO',
                fechaUltimoExito: undefined,
                diasGraciaRestantes: 0,
                mensajeUsuario: 'Atención: Se ha detectado manipulación no autorizada en el almacenamiento local de licencias. Acceso bloqueado por seguridad.',
                codigoError: 'ALTERACION_LOCAL_DETECTADA',
              };
            }
          }
          return parsed;
        }
      } catch {
        // En caso de fallo de lectura
      }
    }

    // Valores iniciales por defecto para el Sistema de Inventario
    return {
      licenseKey: 'DELI-8472-9103-4581-2026',
      uuidCliente: 'CLI-839210',
      installationId: 'INST-INV-PHARMA-01',
      nombreEquipo: 'Servidor Central de Farmacia',
      versionSistema: '2.1.0-MED',
      nombreEmpresa: 'Farmacias y Suministros Deli S.A.',
      tipoLicencia: 'Empresarial Multi-Terminal',
      ultimoEstado: 'SIN_ACTIVAR',
      diasGraciaPermitidos: this.options.diasGraciaDefault || 7,
      diasGraciaRestantes: 7,
      mensajeUsuario: 'El sistema de inventario requiere validación de licencia.',
    };
  }

  /**
   * Sincroniza la configuración actual con el SDK Oficial
   */
  private sincronizarConSDK(): void {
    this.sdk.initialize({
      licenseKey: this.stateData.licenseKey,
      uuidCliente: this.stateData.uuidCliente,
      installationId: this.stateData.installationId,
      versionSistema: this.stateData.versionSistema,
      nombreEquipo: this.stateData.nombreEquipo,
      useAdminBypass: false,
      loggerOptions: { enabled: true, level: 'warn' },
      cacheOptions: { enabled: true, ttlMs: 300000 },
    });
  }

  /**
   * Guarda el estado actual en almacenamiento local y notifica a los suscriptores
   */
  private guardarYNotificar(): void {
    // Generar firma de integridad local antes de persistir
    this.stateData._checksum = LicenseManager.calcularFirmaIntegridad(this.stateData);

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.stateData));
      } catch {
        // Ignorar errores de almacenamiento
      }
    }
    this.subscribers.forEach((cb) => cb({ ...this.stateData }));
  }

  /**
   * Permite que componentes React se suscriban a cambios de estado de la licencia
   */
  public subscribe(callback: (data: LocalLicenseStorage) => void): () => void {
    this.subscribers.push(callback);
    callback({ ...this.stateData }); // Notificar estado inicial

    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  /**
   * Inicia el proceso de validación automática al arrancar el Sistema de Inventario
   */
  public async inicializarYValidar(): Promise<LocalLicenseStorage> {
    this.sincronizarConSDK();
    this.actualizarEstado('VALIDANDO', 'Comprobando la validez de la licencia con el Panel Maestro...');

    try {
      // 1. Intentar validar mediante el SDK
      const respuestaSDK = await this.sdk.validateLicense();

      if (respuestaSDK.exito && respuestaSDK.data) {
        const data = respuestaSDK.data;

        // Comprobar si la instalación actual está registrada
        if (!data.installationIdRegistrado) {
          // Intentar activar instalación automáticamente
          this.actualizarEstado('ACTIVANDO', 'Registrando esta terminal en el Panel Maestro...');
          const resActivacion = await this.sdk.activateInstallation();

          if (!resActivacion.exito) {
            return this.manejarFalloValidacion(
              resActivacion.codigoError || 'ERROR_ACTIVACION',
              resActivacion.mensaje
            );
          }
        }

        // Éxito total: Licencia válida y conectada
        const ahora = new Date().toISOString();
        this.stateData = {
          ...this.stateData,
          nombreEmpresa: data.nombreEmpresa || this.stateData.nombreEmpresa,
          tipoLicencia: data.tipoLicencia || this.stateData.tipoLicencia,
          fechaExpiracion: data.fechaExpiracion,
          diasRestantes: data.diasRestantes,
          ultimaValidacion: ahora,
          fechaUltimoExito: ahora,
          ultimoEstado: 'CONECTADO',
          diasGraciaRestantes: this.stateData.diasGraciaPermitidos,
          mensajeUsuario: 'Sistema validado y conectado correctamente con el Panel Maestro.',
          codigoError: undefined,
        };

        this.guardarYNotificar();

        // Iniciar Heartbeat automático en segundo plano
        this.iniciarHeartbeatSegundoPlano();

        return { ...this.stateData };
      } else {
        return this.manejarFalloValidacion(
          respuestaSDK.codigoError || 'LICENCIA_INVALIDA',
          respuestaSDK.mensaje
        );
      }
    } catch (err: any) {
      // Manejar fallos de red o errores específicos lanzados por el SDK
      if (err instanceof SDKLicenseError) {
        return this.manejarFalloValidacion(err.codigoError, err.message);
      }
      return this.manejarFalloConexion('No fue posible contactar con el servidor maestro de licencias.');
    }
  }

  /**
   * Procesa respuestas fallidas o códigos de error específicos devueltos por el SDK
   */
  private manejarFalloValidacion(codigoError: string, mensajeServidor: string): LocalLicenseStorage {
    let nuevoEstado: SystemLicenseState = 'BLOQUEADO';
    let mensajeAmigable = mensajeServidor;

    switch (codigoError) {
      case 'LICENCIA_SUSPENDIDA':
        nuevoEstado = 'LICENCIA_SUSPENDIDA';
        mensajeAmigable = 'Su licencia se encuentra temporalmente suspendida. Por favor, contacte a soporte comercial.';
        break;
      case 'LICENCIA_EXPIRADA':
        nuevoEstado = 'LICENCIA_EXPIRADA';
        mensajeAmigable = 'Su suscripción ha vencido. Renueve su licencia para continuar operando en el sistema de inventario.';
        break;
      case 'LICENCIA_REVOCADA':
        nuevoEstado = 'LICENCIA_REVOCADA';
        mensajeAmigable = 'Esta licencia ha sido cancelada o revocada definitivamente.';
        break;
      case 'EXCESO_INSTALACIONES':
        nuevoEstado = 'BLOQUEADO';
        mensajeAmigable = 'Ha superado la cantidad de terminales/instalaciones permitidas para esta licencia.';
        break;
      case 'VERSION_NO_PERMITIDA':
        nuevoEstado = 'BLOQUEADO';
        mensajeAmigable = 'Su versión actual de software no está autorizada para esta licencia. Requiere actualización.';
        break;
      default:
        nuevoEstado = 'BLOQUEADO';
        mensajeAmigable = mensajeServidor || 'Acceso denegado por el servidor de licencias.';
        break;
    }

    this.stateData = {
      ...this.stateData,
      ultimoEstado: nuevoEstado,
      ultimaValidacion: new Date().toISOString(),
      mensajeUsuario: mensajeAmigable,
      codigoError,
    };

    this.detenerHeartbeat();
    this.guardarYNotificar();
    return { ...this.stateData };
  }

  /**
   * Evalúa el MODO DE GRACIA si hay pérdida de conexión a Internet o falla la API
   */
  private manejarFalloConexion(mensaje: string): LocalLicenseStorage {
    const ahora = new Date();

    if (this.stateData.fechaUltimoExito) {
      const ultimaFechaExito = new Date(this.stateData.fechaUltimoExito);
      const diferenciaMs = ahora.getTime() - ultimaFechaExito.getTime();
      const diasTranscurridos = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
      const diasGraciaPermitidos = this.stateData.diasGraciaPermitidos || 7;
      const diasGraciaRestantes = Math.max(0, diasGraciaPermitidos - diasTranscurridos);

      if (diasGraciaRestantes > 0) {
        this.stateData = {
          ...this.stateData,
          ultimoEstado: 'MODO_GRACIA',
          diasGraciaRestantes,
          mensajeUsuario: `Sin conexión con el servidor. Modo de Gracia activo: dispone de ${diasGraciaRestantes} día(s) para restablecer la conexión.`,
          codigoError: 'SIN_CONEXION_GRACIA',
        };
        this.guardarYNotificar();
        return { ...this.stateData };
      }
    }

    // Período de gracia agotado o nunca se ha validado con éxito -> BLOQUEADO
    this.stateData = {
      ...this.stateData,
      ultimoEstado: 'BLOQUEADO',
      diasGraciaRestantes: 0,
      mensajeUsuario: 'Sin conexión con el servidor de licencias y el período de gracia de 7 días ha expirado. El sistema ha sido bloqueado por seguridad.',
      codigoError: 'GRACIA_EXPIRADA',
    };

    this.detenerHeartbeat();
    this.guardarYNotificar();
    return { ...this.stateData };
  }

  /**
   * Envía un Heartbeat en segundo plano
   */
  public async enviarHeartbeat(): Promise<void> {
    try {
      const res = await this.sdk.heartbeat();
      if (res.exito) {
        this.stateData.ultimoHeartbeat = new Date().toISOString();
        this.guardarYNotificar();
      }
    } catch {
      // Ignorar fallos de heartbeat en segundo plano para no interrumpir al usuario
    }
  }

  /**
   * Inicia el temporizador de Heartbeat periódico
   */
  private iniciarHeartbeatSegundoPlano(): void {
    this.detenerHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.enviarHeartbeat();
    }, this.options.heartbeatIntervalMs || 900000);
  }

  /**
   * Detiene el Heartbeat en segundo plano
   */
  private detenerHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Actualiza los campos de configuración local (ej. si el usuario cambia la clave de licencia)
   */
  public async actualizarConfiguracion(nuevaConfig: Partial<LocalLicenseStorage>): Promise<LocalLicenseStorage> {
    this.stateData = {
      ...this.stateData,
      ...nuevaConfig,
    };
    this.guardarYNotificar();
    return this.inicializarYValidar();
  }

  /**
   * Desactiva esta instalación liberando el slot en la licencia
   */
  public async desactivarInstalacionActual(motivo = 'Desactivación voluntaria desde el cliente'): Promise<boolean> {
    try {
      const res = await this.sdk.deactivate(motivo);
      if (res.exito) {
        this.stateData.ultimoEstado = 'SIN_ACTIVAR';
        this.stateData.mensajeUsuario = 'Instalación desactivada correctamente de esta terminal.';
        this.detenerHeartbeat();
        this.guardarYNotificar();
        return true;
      }
    } catch (err: any) {
      this.actualizarEstado('BLOQUEADO', err.message || 'Error al intentar desactivar la instalación.');
    }
    return false;
  }

  /**
   * Simula un corte de conexión para probar el Modo de Gracia en la interfaz
   */
  public simularCorteConexion(): void {
    this.detenerHeartbeat();
    this.manejarFalloConexion('Simulación de fallo de red generada por el usuario.');
  }

  private actualizarEstado(estado: SystemLicenseState, mensaje: string): void {
    this.stateData.ultimoEstado = estado;
    this.stateData.mensajeUsuario = mensaje;
    this.guardarYNotificar();
  }

  public getStateData(): LocalLicenseStorage {
    return { ...this.stateData };
  }
}

export const licenseManager = LicenseManager.getInstance();
