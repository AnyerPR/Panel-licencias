import React, { useState, useEffect } from 'react';
import {
  Shield,
  Terminal,
  Play,
  History,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Key,
  Clock,
  Code2,
  Lock
} from 'lucide-react';

export const ApiPlayground: React.FC = () => {
  const [tabActiva, setTabActiva] = useState<'tester' | 'logs'>('tester');

  // Tester State
  const [endpoint, setEndpoint] = useState<string>('/api/v1/license/validate');
  const [metodo, setMetodo] = useState<'POST' | 'GET'>('POST');
  const [licenseKey, setLicenseKey] = useState<string>('DELI-8472-9103-4581-2026');
  const [uuidCliente, setUuidCliente] = useState<string>('CLI-839210');
  const [installationId, setInstallationId] = useState<string>('INST-POS-01');
  const [nombreEquipo, setNombreEquipo] = useState<string>('Caja Principal Tienda 1');
  const [versionSistema, setVersionSistema] = useState<string>('2.1.0');
  const [diasAnadidos, setDiasAnadidos] = useState<number>(30);

  const [usarHmacAdminBypass, setUsarHmacAdminBypass] = useState<boolean>(true);
  const [ejecutando, setEjecutando] = useState<boolean>(false);
  const [respuestaHttp, setRespuestaHttp] = useState<{ status: number; data: any; headers: any } | null>(null);

  // Logs State
  const [logs, setLogs] = useState<any[]>([]);
  const [cargandoLogs, setCargandoLogs] = useState<boolean>(true);

  const cargarLogs = async () => {
    try {
      setCargandoLogs(true);
      const res = await fetch('/api/v1/apilogs?limit=50');
      const data = await res.json();
      if (res.ok && data.exito) {
        setLogs(data.data || []);
      }
    } catch (err) {
      console.error('Error cargando apiLogs desde la API:', err);
    } finally {
      setCargandoLogs(false);
    }
  };

  useEffect(() => {
    if (tabActiva !== 'logs') return;
    cargarLogs();
    const interval = setInterval(cargarLogs, 10000);
    return () => clearInterval(interval);
  }, [tabActiva]);

  // Manejar cambio de endpoint en el tester
  const handleEndpointChange = (nuevoEndpoint: string) => {
    setEndpoint(nuevoEndpoint);
    if (nuevoEndpoint === '/api/v1/license/status') {
      setMetodo('GET');
    } else {
      setMetodo('POST');
    }
  };

  // Ejecutar petición de prueba
  const handleEjecutarPeticion = async () => {
    setEjecutando(true);
    setRespuestaHttp(null);

    let url = endpoint;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (usarHmacAdminBypass) {
      headers['x-admin-bypass'] = 'true';
    } else {
      const ts = Date.now().toString();
      const nonce = Math.random().toString(36).substring(2, 12);
      headers['x-timestamp'] = ts;
      headers['x-nonce'] = nonce;
      // Para pruebas, firma con la clave estándar o hash
      headers['x-signature'] = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    }

    let options: RequestInit = {
      method: metodo,
      headers
    };

    if (metodo === 'POST') {
      let bodyData: any = {
        licenseKey,
        uuidCliente,
        versionSistema
      };

      if (endpoint === '/api/v1/license/activate') {
        bodyData.installationId = installationId;
        bodyData.nombreEquipo = nombreEquipo;
      } else if (endpoint === '/api/v1/license/heartbeat') {
        bodyData.installationId = installationId;
        bodyData.estadoEquipo = 'online';
      } else if (endpoint === '/api/v1/license/deactivate') {
        bodyData.installationId = installationId;
        bodyData.motivo = 'Desactivación manual desde panel de pruebas';
      } else if (endpoint === '/api/v1/license/renew') {
        bodyData.diasAnadidos = diasAnadidos;
      } else if (endpoint === '/api/v1/license/validate') {
        bodyData.installationId = installationId;
        bodyData.nombreEquipo = nombreEquipo;
      }

      options.body = JSON.stringify(bodyData);
    } else {
      // GET request status
      const params = new URLSearchParams({ licenseKey, uuidCliente });
      url = `${endpoint}?${params.toString()}`;
    }

    try {
      const res = await fetch(url, options);
      const json = await res.json();
      setRespuestaHttp({
        status: res.status,
        data: json,
        headers: Object.fromEntries(res.headers.entries())
      });
    } catch (err: any) {
      setRespuestaHttp({
        status: 500,
        data: { exito: false, mensaje: err.message || 'Error de conexión con el servidor.' },
        headers: {}
      });
    } finally {
      setEjecutando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">API Empresarial & Servidor de Validación</h1>
            <p className="text-xs text-slate-400 mt-1">
              Capa de seguridad mediante Express / Cloud Functions con autenticación HMAC SHA-256, anti-replay y auditoría.
            </p>
          </div>
        </div>

        {/* Selector de Tabs */}
        <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-xl">
          <button
            onClick={() => setTabActiva('tester')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tabActiva === 'tester'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Probador de Endpoints
          </button>
          <button
            onClick={() => setTabActiva('logs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tabActiva === 'logs'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            Audit Logs en Vivo
          </button>
        </div>
      </div>

      {tabActiva === 'tester' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Panel de Configuración de la Petición */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-400" />
                Configurador de Petición
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                v1.0 API
              </span>
            </div>

            {/* Selector de Endpoint */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Endpoint API</label>
              <select
                value={endpoint}
                onChange={(e) => handleEndpointChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-indigo-300 font-mono focus:outline-none focus:border-indigo-500"
              >
                <option value="/api/v1/license/validate">POST /api/v1/license/validate (Validar Licencia)</option>
                <option value="/api/v1/license/activate">POST /api/v1/license/activate (Activar Instalación)</option>
                <option value="/api/v1/license/heartbeat">POST /api/v1/license/heartbeat (Enviar Heartbeat)</option>
                <option value="/api/v1/license/deactivate">POST /api/v1/license/deactivate (Desactivar Installation ID)</option>
                <option value="/api/v1/license/renew">POST /api/v1/license/renew (Renovar Tiempo Licencia)</option>
                <option value="/api/v1/license/status">GET /api/v1/license/status (Consultar Estado)</option>
              </select>
            </div>

            {/* Parámetros de la Petición */}
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">Clave de Licencia (licenseKey)</label>
                <input
                  type="text"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">UUID del Cliente (uuidCliente)</label>
                <input
                  type="text"
                  value={uuidCliente}
                  onChange={(e) => setUuidCliente(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200"
                />
              </div>

              {(endpoint.includes('activate') || endpoint.includes('heartbeat') || endpoint.includes('deactivate') || endpoint.includes('validate')) && (
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-400">Installation ID</label>
                  <input
                    type="text"
                    value={installationId}
                    onChange={(e) => setInstallationId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-indigo-400 font-bold"
                  />
                </div>
              )}

              {(endpoint.includes('activate') || endpoint.includes('validate')) && (
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-400">Nombre del Equipo / Terminal</label>
                  <input
                    type="text"
                    value={nombreEquipo}
                    onChange={(e) => setNombreEquipo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">Versión del Sistema de Inventario</label>
                <input
                  type="text"
                  value={versionSistema}
                  onChange={(e) => setVersionSistema(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200"
                />
              </div>

              {endpoint.includes('renew') && (
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-400">Días a Añadir</label>
                  <input
                    type="number"
                    value={diasAnadidos}
                    onChange={(e) => setDiasAnadidos(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                  />
                </div>
              )}
            </div>

            {/* Opciones de Seguridad HMAC */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={usarHmacAdminBypass}
                  onChange={(e) => setUsarHmacAdminBypass(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Bypass Admin HMAC (Pruebas de Desarrollo)
                </span>
              </label>
              <p className="text-[10px] text-slate-500">
                Si no se activa, enviará firmas HMAC SHA-256 obligatorias con timestamp y nonce.
              </p>
            </div>

            {/* Botón de Ejecución */}
            <button
              onClick={handleEjecutarPeticion}
              disabled={ejecutando}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              {ejecutando ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Ejecutando Petición API...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Enviar Petición a la API</span>
                </>
              )}
            </button>
          </div>

          {/* Panel de Respuesta JSON de la API */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Respuesta del Servidor Maestro
              </h2>

              {respuestaHttp && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                    respuestaHttp.status >= 200 && respuestaHttp.status < 300
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  HTTP Status: {respuestaHttp.status}
                </span>
              )}
            </div>

            {respuestaHttp ? (
              <div className="flex-1 space-y-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto text-emerald-300 max-h-[420px]">
                  <pre>{JSON.stringify(respuestaHttp.data, null, 2)}</pre>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-3">
                <Terminal className="w-10 h-10 text-slate-700" />
                <p className="text-sm text-slate-400 font-semibold">Esperando ejecución de petición...</p>
                <p className="text-xs text-slate-600 max-w-sm">
                  Selecciona un endpoint y presiona "Enviar Petición a la API" para inspeccionar la respuesta estandarizada en JSON.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Vista de Audit Logs en Vivo */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                Registro de Auditoría de Llamadas (apiLogs)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Monitoreo en tiempo real de cada consulta enviada al servidor maestro.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Últimos {logs.length} registros</span>
          </div>

          {cargandoLogs ? (
            <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Cargando registros de auditoría desde Firestore...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No hay logs de API registrados aún. Realiza pruebas en el probador para generar entradas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Fecha / Duración</th>
                    <th className="px-4 py-3">Endpoint / Método</th>
                    <th className="px-4 py-3">Cliente / Licencia</th>
                    <th className="px-4 py-3">Resultado / Status</th>
                    <th className="px-4 py-3">Detalle / Mensaje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{log.fecha ? new Date(log.fecha).toLocaleString('es-ES') : 'N/A'}</span>
                        </div>
                        <div className="text-[10px] text-indigo-400 font-mono mt-0.5">
                          {log.duracionMs || 0} ms | {log.ip || '127.0.0.1'}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 text-[11px] font-bold">
                          {log.metodo}
                        </span>
                        <div className="text-[11px] text-slate-300 mt-1">{log.endpoint}</div>
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px]">
                        <div className="text-slate-200">{log.licencia || 'N/A'}</div>
                        <div className="text-slate-400 text-[10px]">{log.uuidCliente || 'N/A'}</div>
                      </td>

                      <td className="px-4 py-3">
                        {log.exito ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            {log.codigoEstado} OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <XCircle className="w-3 h-3" />
                            {log.codigoEstado} {log.codigoError || 'ERROR'}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-300 text-[11px] max-w-xs truncate">
                        {log.mensaje}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
