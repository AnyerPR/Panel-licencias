import React, { useState, useEffect } from 'react';
import { HardDrive, Search, RefreshCw, CheckCircle2, XCircle, Clock, ShieldAlert } from 'lucide-react';

export interface InstalacionItem {
  id: string;
  installationId: string;
  licenseKey: string;
  uuidCliente: string;
  nombreEquipo: string;
  versionSistema: string;
  ip: string;
  estado: 'activa' | 'desactivada' | 'bloqueada';
  fechaActivacion: string;
  ultimaConexion: string;
  motivoDesactivacion?: string;
}

export const InstallationList: React.FC = () => {
  const [instalaciones, setInstalaciones] = useState<InstalacionItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  const cargarInstalaciones = async () => {
    try {
      setCargando(true);
      const res = await fetch('/api/v1/installations');
      const data = await res.json();
      if (res.ok && data.exito) {
        setInstalaciones(data.data || []);
      }
    } catch (err) {
      console.error('Error cargando instalaciones desde la API:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarInstalaciones();
    const interval = setInterval(cargarInstalaciones, 30000);
    return () => clearInterval(interval);
  }, []);

  const instalacionesFiltradas = instalaciones.filter((inst) => {
    const term = busqueda.toLowerCase();
    return (
      inst.installationId?.toLowerCase().includes(term) ||
      inst.licenseKey?.toLowerCase().includes(term) ||
      inst.nombreEquipo?.toLowerCase().includes(term) ||
      inst.uuidCliente?.toLowerCase().includes(term) ||
      inst.ip?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Instalaciones ID Registradas</h1>
            <p className="text-xs text-slate-400 mt-1">
              Monitoreo permanente de terminales y sistemas de inventario vinculados a licencias maestras.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={cargarInstalaciones}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 border border-slate-700 rounded-xl transition-colors"
            title="Recargar instalaciones"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>
          <span className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
            Total: {instalaciones.length}
          </span>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por Installation ID, Clave Licencia, Nombre de Equipo, IP..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Tabla de Instalaciones */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {cargando && instalaciones.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Cargando instalaciones...</span>
          </div>
        ) : instalacionesFiltradas.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-300 font-semibold">No se encontraron instalaciones</p>
            <p className="text-xs text-slate-500">
              Las instalaciones de los clientes aparecerán automáticamente cuando activen su primer sistema de inventario.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Installation ID / Equipo</th>
                  <th className="px-4 py-3">Licencia / Cliente</th>
                  <th className="px-4 py-3">Versión / IP</th>
                  <th className="px-4 py-3">Última Conexión</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
                {instalacionesFiltradas.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono text-indigo-400 font-bold">{item.installationId}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.nombreEquipo}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-mono text-slate-200">{item.licenseKey}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{item.uuidCliente}</div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                        v{item.versionSistema || '1.0.0'}
                      </span>
                      <div className="text-[11px] text-slate-400 mt-1 font-mono">{item.ip || '127.0.0.1'}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{item.ultimaConexion ? new Date(item.ultimaConexion).toLocaleString('es-ES') : 'N/A'}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Activación: {item.fechaActivacion ? new Date(item.fechaActivacion).toLocaleDateString('es-ES') : 'N/A'}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {item.estado === 'activa' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Activa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <XCircle className="w-3 h-3" />
                          {item.estado || 'Desactivada'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
