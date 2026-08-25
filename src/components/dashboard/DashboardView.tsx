import React, { useEffect, useState } from 'react';
import {
  Users,
  Key,
  Download,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Lock,
  Cpu,
  Layers,
  RefreshCw,
  Calendar,
  Building2,
  FileText
} from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';
import { DashboardStats, LogAuditoria } from '../../types';
import { formatearFecha } from '../../utils/formatters';

/**
 * Vista de Dashboard principal conectada a Firestore
 */
export const DashboardView: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    clientesTotales: 0,
    clientesActivos: 0,
    clientesSuspendidos: 0,
    clientesVencidos: 0,
    clientesProximosVencer: 0,
    instalacionesTotales: 0,
    licenciasTotales: 0,
    versionesRegistradas: 0
  });

  const [actividadReciente, setActividadReciente] = useState<LogAuditoria[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [dataStats, logs] = await Promise.all([
        dashboardService.obtenerEstadisticas(),
        dashboardService.obtenerActividadReciente(6)
      ]);
      setStats(dataStats);
      setActividadReciente(logs);
    } catch (error) {
      console.error('Error cargando métricas del Dashboard:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <div className="space-y-8">
      
      {/* Barra superior con botón de actualización */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Métricas del Sistema</h2>
          <p className="text-xs text-slate-400">Datos sincronizados con Firestore en tiempo real</p>
        </div>
        <button
          onClick={cargarDatos}
          disabled={cargando}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-xl border border-slate-800 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Grid de Tarjetas Principales del Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Clientes Totales */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Clientes Totales</span>
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white">{stats.clientesTotales}</span>
            <span className="text-xs text-slate-400 font-mono">
              {stats.clientesTotales === 1 ? '1 Cliente' : `${stats.clientesTotales} Clientes`}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-1 text-[11px] text-slate-400">
            <div className="text-emerald-400">
              <span className="font-semibold">{stats.clientesActivos}</span> activos
            </div>
            <div className="text-amber-400">
              <span className="font-semibold">{stats.clientesSuspendidos}</span> susp.
            </div>
            <div className="text-rose-400">
              <span className="font-semibold">{stats.clientesVencidos}</span> venc.
            </div>
          </div>
        </div>

        {/* Licencias Totales */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Licencias Emitidas</span>
            <Key className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white">{stats.licenciasTotales}</span>
            <span className="text-xs text-slate-400 font-mono">
              {stats.licenciasTotales === 1 ? '1 Licencia' : `${stats.licenciasTotales} Licencias`}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="text-amber-400 font-medium">Próximas a vencer:</span>
            <span className="font-bold text-amber-300">{stats.clientesProximosVencer}</span>
          </div>
        </div>

        {/* Instalaciones Registradas */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Instalaciones</span>
            <Download className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white">{stats.instalacionesTotales}</span>
            <span className="text-xs text-slate-400 font-mono">
              {stats.instalacionesTotales === 1 ? '1 Instalación' : `${stats.instalacionesTotales} Instalaciones`}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span>Limitación activada por Installation ID</span>
          </div>
        </div>

        {/* Versiones Disponibles */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Versiones</span>
            <FileText className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white">{stats.versionesRegistradas}</span>
            <span className="text-xs text-slate-400 font-mono">
              {stats.versionesRegistradas === 1 ? '1 Versión' : `${stats.versionesRegistradas} Versiones`}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span>Canales: Estable, Beta, LTS</span>
          </div>
        </div>

      </div>

      {/* Grid de Arquitectura e Historial Reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Panel de Información de Arquitectura */}
        <div className="lg:col-span-1 bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-6 space-y-5 relative overflow-hidden">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
            <Cpu className="w-5 h-5" />
            <span>Reglas de Seguridad & Aislamiento</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Los clientes de inventario médico nunca leen Firestore directamente. Toda validación de licencia, instalación y versión se realiza estrictamente vía API Cloud Functions.
          </p>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-200">Firebase Auth Restringido</p>
                <p className="text-slate-400 text-[11px]">Acceso al panel exclusivo para administradores verificados.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-200">Identificador Inmutable UUID</p>
                <p className="text-slate-400 text-[11px]">Formato cli_xxxxxxxx para prevenir colisiones o spoofing.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-200">Auditoría Inmutable</p>
                <p className="text-slate-400 text-[11px]">Registro de logins y acciones administrativas en tiempo real.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Actividad Reciente (Auditoría) */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>Bitácora de Auditoría Reciente</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">Colección /auditoria</span>
          </div>

          {actividadReciente.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs space-y-2">
              <Clock className="w-8 h-8 mx-auto text-slate-600" />
              <p>Sin registros de auditoría recientes.</p>
              <p className="text-[11px] text-slate-600">Las acciones de inicio de sesión y gestión aparecerán en este registro.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {actividadReciente.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${log.exito ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                      <span className="font-semibold text-slate-200">{log.accion}</span>
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full text-[10px]">
                        {log.modulo}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] pl-4">{log.detalles}</p>
                  </div>
                  <div className="text-right shrink-0 text-[11px] text-slate-500 font-mono">
                    {formatearFecha(log.fecha)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
