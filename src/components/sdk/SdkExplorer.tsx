import React, { useState, useEffect } from 'react';
import { LicenseClient, SDKLicenseError, LogLevel } from '../../sdk';
import {
  Layers,
  Terminal,
  Play,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Code2,
  BookOpen,
  Copy,
  Check,
  Zap,
  Activity,
  HardDrive,
  Key,
  ShieldCheck,
  Clock
} from 'lucide-react';

export const SdkExplorer: React.FC = () => {
  const [tab, setTab] = useState<'tester' | 'docs' | 'logs'>('tester');

  // Configuración del cliente SDK de prueba
  const [licenseKey, setLicenseKey] = useState<string>('DELI-8472-9103-4581-2026');
  const [uuidCliente, setUuidCliente] = useState<string>('CLI-839210');
  const [installationId, setInstallationId] = useState<string>('INST-POS-01');
  const [versionSistema, setVersionSistema] = useState<string>('2.1.0');
  const [nombreEquipo, setNombreEquipo] = useState<string>('Terminal Caja Central');

  // Estado del SDK
  const [sdkInicializado, setSdkInicializado] = useState<boolean>(false);
  const [autoHeartbeatActivo, setAutoHeartbeatActivo] = useState<boolean>(false);
  const [ejecutando, setEjecutando] = useState<boolean>(false);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<string>('validateLicense');
  const [diasRenovacion, setDiasRenovacion] = useState<number>(30);
  const [motivoDesactivacion, setMotivoDesactivacion] = useState<string>('Mantenimiento programado de hardware');

  // Resultado y Logs del SDK
  const [ultimoResultado, setUltimoResultado] = useState<any>(null);
  const [sdkLogs, setSdkLogs] = useState<Array<{ timestamp: string; level: LogLevel; message: string; data?: any }>>([]);
  const [copiado, setCopiado] = useState<boolean>(false);

  // Inicializar SDK para la prueba
  const handleInicializarSdk = () => {
    try {
      const client = LicenseClient.getInstance();

      // Configurar logger personalizado para capturar eventos en la UI
      client.initialize({
        licenseKey,
        uuidCliente,
        installationId,
        versionSistema,
        nombreEquipo,
        useAdminBypass: true,
        loggerOptions: {
          enabled: true,
          level: 'debug',
          customLogger: (level, message, data) => {
            const timestamp = new Date().toLocaleTimeString('es-ES');
            setSdkLogs((prev) => [{ timestamp, level, message, data }, ...prev.slice(0, 49)]);
          },
        },
        cacheOptions: {
          enabled: true,
          ttlMs: 300000,
        },
      });

      setSdkInicializado(true);
      setUltimoResultado({
        exito: true,
        mensaje: 'SDK oficial inicializado exitosamente con LicenseClient.getInstance().'
      });
    } catch (err: any) {
      setUltimoResultado({
        exito: false,
        mensaje: err.message || 'Error al inicializar el SDK'
      });
    }
  };

  // Ejecutar método seleccionado del SDK
  const handleEjecutarMetodo = async () => {
    if (!sdkInicializado) {
      handleInicializarSdk();
    }

    setEjecutando(true);
    setUltimoResultado(null);

    const client = LicenseClient.getInstance();

    try {
      let res: any = null;

      switch (metodoSeleccionado) {
        case 'validateLicense':
          res = await client.validateLicense();
          break;
        case 'activateInstallation':
          res = await client.activateInstallation();
          break;
        case 'heartbeat':
          res = await client.heartbeat();
          break;
        case 'renew':
          res = await client.renew(diasRenovacion);
          break;
        case 'deactivate':
          res = await client.deactivate(motivoDesactivacion);
          break;
        case 'getStatus':
          res = await client.getStatus({ useCache: true });
          break;
      }

      setUltimoResultado(res);
    } catch (err: any) {
      if (err instanceof SDKLicenseError) {
        setUltimoResultado({
          exito: false,
          codigoError: err.codigoError,
          codigoEstado: err.codigoEstado,
          mensaje: err.message,
          detalles: err.detalles
        });
      } else {
        setUltimoResultado({
          exito: false,
          mensaje: err.message || 'Error inesperado durante la ejecución del SDK.'
        });
      }
    } finally {
      setEjecutando(false);
    }
  };

  // Conmutar Auto-Heartbeat
  const toggleAutoHeartbeat = () => {
    const client = LicenseClient.getInstance();
    if (!sdkInicializado) {
      handleInicializarSdk();
    }

    if (autoHeartbeatActivo) {
      client.stopAutoHeartbeat();
      setAutoHeartbeatActivo(false);
    } else {
      client.startAutoHeartbeat(5000); // 5s para pruebas rápidas
      setAutoHeartbeatActivo(true);
    }
  };

  // Copiar código de ejemplo
  const copiarCodigo = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const snippetEjemplo = `import { LicenseClient } from './sdk';

// 1. Inicializar el cliente del SDK al arrancar el sistema
const licenseClient = LicenseClient.getInstance();

licenseClient.initialize({
  licenseKey: '${licenseKey}',
  uuidCliente: '${uuidCliente}',
  installationId: '${installationId}',
  versionSistema: '${versionSistema}',
  nombreEquipo: '${nombreEquipo}',
  baseUrl: 'https://tu-dominio.com/api/v1/license'
});

// 2. Validar Licencia antes de permitir uso del sistema
const validacion = await licenseClient.validateLicense();
if (validacion.exito && validacion.data?.licenciaValida) {
  console.log('Licencia válida. Días restantes:', validacion.data.diasRestantes);
  
  // Activar instalación o enviar heartbeat
  await licenseClient.activateInstallation();
  
  // Iniciar Heartbeat automático cada 15 minutos
  licenseClient.startAutoHeartbeat(15 * 60 * 1000);
} else {
  console.error('Error de licencia:', validacion.mensaje);
}`;

  return (
    <div className="space-y-6">
      {/* Header FASE 5 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">SDK Oficial de Inventario</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Fase 5 - Implementado
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Librería cliente desacoplada <code className="text-indigo-300 font-mono">LicenseClient</code> con reintentos automáticos, timeouts, caché y tipado estricto.
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-xl">
          <button
            onClick={() => setTab('tester')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === 'tester'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Consola SDK
          </button>
          <button
            onClick={() => setTab('docs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === 'docs'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Guía & Snippet
          </button>
          <button
            onClick={() => setTab('logs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === 'logs'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            Events Logger
          </button>
        </div>
      </div>

      {tab === 'tester' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Panel de prueba del SDK */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-400" />
                Instancia LicenseClient
              </h2>
              {sdkInicializado ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  Inicializado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Pendiente init
                </span>
              )}
            </div>

            {/* Formulario de Configuración del SDK */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">licenseKey</label>
                <input
                  type="text"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">uuidCliente</label>
                <input
                  type="text"
                  value={uuidCliente}
                  onChange={(e) => setUuidCliente(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-400">installationId</label>
                  <input
                    type="text"
                    value={installationId}
                    onChange={(e) => setInstallationId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-indigo-400 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-400">versionSistema</label>
                  <input
                    type="text"
                    value={versionSistema}
                    onChange={(e) => setVersionSistema(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">nombreEquipo</label>
                <input
                  type="text"
                  value={nombreEquipo}
                  onChange={(e) => setNombreEquipo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>
            </div>

            {/* Selector de Método del SDK */}
            <div className="pt-2 space-y-1.5 border-t border-slate-800">
              <label className="text-xs font-bold text-slate-200">Método a Invocar</label>
              <select
                value={metodoSeleccionado}
                onChange={(e) => setMetodoSeleccionado(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-indigo-300 font-bold focus:outline-none focus:border-indigo-500"
              >
                <option value="validateLicense">licenseClient.validateLicense()</option>
                <option value="activateInstallation">licenseClient.activateInstallation()</option>
                <option value="heartbeat">licenseClient.heartbeat()</option>
                <option value="getStatus">licenseClient.getStatus() [con Caché]</option>
                <option value="renew">licenseClient.renew(dias)</option>
                <option value="deactivate">licenseClient.deactivate(motivo)</option>
              </select>
            </div>

            {metodoSeleccionado === 'renew' && (
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">Días a Añadir</label>
                <input
                  type="number"
                  value={diasRenovacion}
                  onChange={(e) => setDiasRenovacion(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>
            )}

            {metodoSeleccionado === 'deactivate' && (
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">Motivo de Desactivación</label>
                <input
                  type="text"
                  value={motivoDesactivacion}
                  onChange={(e) => setMotivoDesactivacion(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>
            )}

            {/* Botones de Acción */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleEjecutarMetodo}
                disabled={ejecutando}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                {ejecutando ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Ejecutando {metodoSeleccionado}()...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Ejecutar {metodoSeleccionado}()</span>
                  </>
                )}
              </button>

              <button
                onClick={toggleAutoHeartbeat}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  autoHeartbeatActivo
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>{autoHeartbeatActivo ? 'Detener Auto-Heartbeat (5s)' : 'Iniciar Auto-Heartbeat (Prueba 5s)'}</span>
              </button>
            </div>
          </div>

          {/* Visor de Respuestas del SDK */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                Retorno de Método SDK
              </h2>

              {ultimoResultado && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    ultimoResultado.exito
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {ultimoResultado.exito ? 'Exitoso (exito: true)' : 'Error (exito: false)'}
                </span>
              )}
            </div>

            {ultimoResultado ? (
              <div className="flex-1 space-y-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto text-emerald-300 max-h-[420px]">
                  <pre>{JSON.stringify(ultimoResultado, null, 2)}</pre>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-3">
                <Terminal className="w-10 h-10 text-slate-700" />
                <p className="text-sm text-slate-400 font-semibold">Esperando llamada al SDK...</p>
                <p className="text-xs text-slate-600 max-w-sm">
                  Haz clic en "Ejecutar" para interactuar con la librería oficial en vivo.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : tab === 'docs' ? (
        /* Documentación y Snippet de integración */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                Instrucciones de Integración en el Sistema de Inventario
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Guía oficial para conectar el Sistema de Inventario al Panel Maestro de Licencias.
              </p>
            </div>

            <button
              onClick={() => copiarCodigo(snippetEjemplo)}
              className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition-all"
            >
              {copiado ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiado ? '¡Copiado!' : 'Copiar Código'}</span>
            </button>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl font-mono text-xs text-indigo-300 overflow-x-auto">
            <pre>{snippetEjemplo}</pre>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                <RefreshCw className="w-4 h-4" />
                <span>Reintentos Automáticos</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Estrategia de Exponential Backoff con hasta 3 reintentos antes de declarar fallo de conexión.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Clock className="w-4 h-4" />
                <span>Caché Temporal TTL</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Almacenamiento de respuestas en memoria/localStorage por 5 minutos para operaciones ultrarrápidas.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>HMAC SHA-256</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Firmas criptográficas automáticas en cada petición con protección anti-replay por timestamp y nonce.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Event Logs de la Consola del SDK */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                Logs Internos del SDK (Logger de Memoria)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Trazabilidad interna producida por <code className="text-indigo-300 font-mono">SdkLogger</code> en tiempo de ejecución.
              </p>
            </div>

            <button
              onClick={() => setSdkLogs([])}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 text-xs rounded-xl border border-slate-800"
            >
              Limpiar Logs
            </button>
          </div>

          {sdkLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No hay logs registrados en esta sesión. Ejecuta métodos del SDK en la consola para generar trazas.
            </div>
          ) : (
            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2">
              {sdkLogs.map((log, i) => (
                <div key={i} className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl font-mono text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">{log.timestamp}</span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold uppercase ${
                        log.level === 'error'
                          ? 'bg-rose-500/10 text-rose-400'
                          : log.level === 'warn'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-indigo-500/10 text-indigo-400'
                      }`}
                    >
                      {log.level}
                    </span>
                  </div>
                  <p className="text-slate-200">{log.message}</p>
                  {log.data && (
                    <pre className="text-[10px] text-slate-400 bg-slate-900/50 p-2 rounded border border-slate-800 overflow-x-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
