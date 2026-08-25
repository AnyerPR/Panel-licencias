import React, { useState, useEffect } from 'react';
import { licenseManager } from '../../services/licenseManager/LicenseManager';
import { LocalLicenseStorage, SystemLicenseState } from '../../services/licenseManager/LicenseManagerTypes';
import {
  ShieldCheck,
  ShieldAlert,
  Wifi,
  WifiOff,
  RefreshCw,
  Key,
  HardDrive,
  Building,
  Clock,
  Calendar,
  AlertTriangle,
  Lock,
  Activity,
  Sliders,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Settings
} from 'lucide-react';

export const LicenseInfoView: React.FC = () => {
  const [licenseState, setLicenseState] = useState<LocalLicenseStorage>(licenseManager.getStateData());
  const [cargando, setCargando] = useState<boolean>(false);
  const [editando, setEditando] = useState<boolean>(false);

  // Formulario para editar la clave de licencia
  const [nuevaClave, setNuevaClave] = useState<string>(licenseState.licenseKey);
  const [nuevoUuid, setNuevoUuid] = useState<string>(licenseState.uuidCliente);
  const [nuevoInstallationId, setNuevoInstallationId] = useState<string>(licenseState.installationId);
  const [nuevoNombreEquipo, setNuevoNombreEquipo] = useState<string>(licenseState.nombreEquipo);

  useEffect(() => {
    // Suscribirse a cambios del LicenseManager
    const unsubscribe = licenseManager.subscribe((data) => {
      setLicenseState(data);
      setNuevaClave(data.licenseKey);
      setNuevoUuid(data.uuidCliente);
      setNuevoInstallationId(data.installationId);
      setNuevoNombreEquipo(data.nombreEquipo);
    });

    // Validar automáticamente al montar si está sin activar o validando
    licenseManager.inicializarYValidar();

    return () => unsubscribe();
  }, []);

  const handleValidarAhora = async () => {
    setCargando(true);
    await licenseManager.inicializarYValidar();
    setCargando(false);
  };

  const handleGuardarConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    await licenseManager.actualizarConfiguracion({
      licenseKey: nuevaClave,
      uuidCliente: nuevoUuid,
      installationId: nuevoInstallationId,
      nombreEquipo: nuevoNombreEquipo,
    });
    setEditando(false);
    setCargando(false);
  };

  const handleSimularCorteConexion = () => {
    licenseManager.simularCorteConexion();
  };

  const handleEnviarHeartbeat = async () => {
    setCargando(true);
    await licenseManager.enviarHeartbeat();
    setCargando(false);
  };

  const handleDesactivar = async () => {
    if (window.confirm('¿Está seguro de que desea desactivar esta terminal de inventario?')) {
      setCargando(true);
      await licenseManager.desactivarInstalacionActual();
      setCargando(false);
    }
  };

  // Helper de badges y estilos para los 10 estados
  const getBadgeEstado = (estado: SystemLicenseState) => {
    switch (estado) {
      case 'CONECTADO':
        return {
          label: 'Licencia Conectada y Válida',
          bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          icon: ShieldCheck,
        };
      case 'MODO_GRACIA':
        return {
          label: 'Modo de Gracia Activo (Sin Conexión)',
          bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          icon: WifiOff,
        };
      case 'SIN_CONEXION':
        return {
          label: 'Sin Conexión',
          bg: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
          icon: WifiOff,
        };
      case 'LICENCIA_EXPIRADA':
        return {
          label: 'Licencia Expirada',
          bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
          icon: Calendar,
        };
      case 'LICENCIA_SUSPENDIDA':
        return {
          label: 'Licencia Suspendida',
          bg: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
          icon: AlertTriangle,
        };
      case 'LICENCIA_REVOCADA':
        return {
          label: 'Licencia Revocada',
          bg: 'bg-red-500/10 border-red-500/20 text-red-500',
          icon: XCircle,
        };
      case 'BLOQUEADO':
        return {
          label: 'Sistema Bloqueado',
          bg: 'bg-red-600/20 border-red-600/30 text-red-400',
          icon: Lock,
        };
      case 'VALIDANDO':
      case 'ACTIVANDO':
        return {
          label: 'Verificando Licencia...',
          bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
          icon: RefreshCw,
        };
      case 'SIN_ACTIVAR':
      default:
        return {
          label: 'Sin Activar',
          bg: 'bg-slate-700/20 border-slate-700/30 text-slate-300',
          icon: HelpCircle,
        };
    }
  };

  const badgeInfo = getBadgeEstado(licenseState.ultimoEstado);
  const IconoEstado = badgeInfo.icon;

  return (
    <div className="space-y-6">
      {/* Header FASE 6 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Administrador de Licencias (Sistema de Inventario)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Fase 6 - Integración
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Capa desacoplada <code className="text-emerald-300 font-mono">LicenseManager</code> comunicada exclusivamente mediante el SDK.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditando(!editando)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition-all"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>{editando ? 'Cancelar Edición' : 'Configurar Clave'}</span>
          </button>

          <button
            onClick={handleValidarAhora}
            disabled={cargando}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
            <span>Revalidar Licencia</span>
          </button>
        </div>
      </div>

      {/* Tarjeta Banner de Estado del Sistema */}
      <div className={`p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${badgeInfo.bg}`}>
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-black/20 mt-0.5">
            <IconoEstado className={`w-6 h-6 ${cargando && (licenseState.ultimoEstado === 'VALIDANDO' || licenseState.ultimoEstado === 'ACTIVANDO') ? 'animate-spin' : ''}`} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-xs font-extrabold uppercase tracking-wider">
                Estado Actual: {licenseState.ultimoEstado}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-black/30 border border-current">
                {badgeInfo.label}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-200">
              {licenseState.mensajeUsuario || 'Monitoreo de estado de licencia del inventario activo.'}
            </p>
          </div>
        </div>

        {licenseState.ultimoEstado === 'MODO_GRACIA' && (
          <div className="bg-amber-950/40 border border-amber-500/30 px-4 py-2.5 rounded-xl text-center space-y-0.5">
            <p className="text-[10px] uppercase font-bold text-amber-300">Días de Gracia Restantes</p>
            <p className="text-lg font-black text-amber-200">{licenseState.diasGraciaRestantes ?? 7} / 7 días</p>
          </div>
        )}
      </div>

      {/* Formulario de Edición de Credenciales Locales (Opcional) */}
      {editando && (
        <form onSubmit={handleGuardarConfig} className="bg-slate-900 border border-indigo-500/30 p-6 rounded-2xl space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Key className="w-4 h-4 text-indigo-400" />
            Configurar Credenciales Locales del Sistema de Inventario
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Clave de Licencia (License Key)</label>
              <input
                type="text"
                value={nuevaClave}
                onChange={(e) => setNuevaClave(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-indigo-300 font-bold"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">UUID del Cliente</label>
              <input
                type="text"
                value={nuevoUuid}
                onChange={(e) => setNuevoUuid(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Installation ID (Hardware)</label>
              <input
                type="text"
                value={nuevoInstallationId}
                onChange={(e) => setNuevoInstallationId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Nombre de la Terminal / Equipo</label>
              <input
                type="text"
                value={nuevoNombreEquipo}
                onChange={(e) => setNuevoNombreEquipo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20"
            >
              Guardar y Revalidar
            </button>
          </div>
        </form>
      )}

      {/* Grid con la Información Detallada requerida en FASE 6 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Empresa */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
            <Building className="w-4 h-4 text-emerald-400" />
            <span>Empresa Registrada</span>
          </div>
          <p className="text-base font-extrabold text-white">
            {licenseState.nombreEmpresa || 'No especificada'}
          </p>
          <p className="text-[11px] text-slate-500">Cliente UUID: {licenseState.uuidCliente}</p>
        </div>

        {/* Clave de Licencia */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
            <Key className="w-4 h-4 text-indigo-400" />
            <span>Clave de Licencia</span>
          </div>
          <p className="text-sm font-mono font-bold text-indigo-300 tracking-wider">
            {licenseState.licenseKey}
          </p>
          <p className="text-[11px] text-slate-500">
            Tipo: {licenseState.tipoLicencia || 'Licencia Estándar'}
          </p>
        </div>

        {/* Expiración y Días Restantes */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Vigencia de Licencia</span>
          </div>
          <p className="text-base font-extrabold text-white">
            {licenseState.diasRestantes !== undefined ? `${licenseState.diasRestantes} días restantes` : 'Indefinida'}
          </p>
          <p className="text-[11px] text-slate-500">
            Expiración: {licenseState.fechaExpiracion ? new Date(licenseState.fechaExpiracion).toLocaleDateString('es-ES') : 'N/A'}
          </p>
        </div>

        {/* Installation ID / Hardware */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <span>Installation ID (Terminal)</span>
          </div>
          <p className="text-sm font-mono font-bold text-cyan-300">
            {licenseState.installationId}
          </p>
          <p className="text-[11px] text-slate-500">Equipo: {licenseState.nombreEquipo}</p>
        </div>

        {/* Versión Instalada */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
            <Sliders className="w-4 h-4 text-purple-400" />
            <span>Versión del Inventario</span>
          </div>
          <p className="text-base font-extrabold text-white font-mono">
            {licenseState.versionSistema}
          </p>
          <p className="text-[11px] text-slate-500">Módulo Farmacia & Suministros</p>
        </div>

        {/* Última Validación & Heartbeat */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Última Sincronización</span>
          </div>
          <div className="text-[11px] space-y-1 font-mono text-slate-300">
            <p>
              Validación: {licenseState.ultimaValidacion ? new Date(licenseState.ultimaValidacion).toLocaleTimeString('es-ES') : 'N/A'}
            </p>
            <p>
              Heartbeat: {licenseState.ultimoHeartbeat ? new Date(licenseState.ultimoHeartbeat).toLocaleTimeString('es-ES') : 'Pendiente'}
            </p>
          </div>
        </div>
      </div>

      {/* Herramientas de Control e Integración */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          Acciones de Prueba e Integración
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleEnviarHeartbeat}
            disabled={cargando}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
          >
            <Wifi className="w-4 h-4 text-emerald-400" />
            <span>Enviar Heartbeat Manual</span>
          </button>

          <button
            onClick={handleSimularCorteConexion}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-semibold transition-all"
          >
            <WifiOff className="w-4 h-4" />
            <span>Simular Corte de Red (Modo Gracia)</span>
          </button>

          <button
            onClick={handleDesactivar}
            disabled={cargando}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            <span>Desactivar esta Terminal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
