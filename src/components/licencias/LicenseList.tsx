import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit3,
  PauseCircle,
  PlayCircle,
  ShieldOff,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Building2,
  Cpu,
  ArrowUpDown,
  Check,
  Copy
} from 'lucide-react';
import { Licencia, EstadoLicencia, TipoLicencia } from '../../types';
import { licenseService } from '../../services/licenseService';
import { LicenseFormModal } from './LicenseFormModal';
import { LicenseRenewModal } from './LicenseRenewModal';
import { LicenseDetailModal } from './LicenseDetailModal';
import { ConfirmLicenseActionModal } from './ConfirmLicenseActionModal';

interface LicenseListProps {
  userUid: string;
  userCorreo: string;
}

export const LicenseList: React.FC<LicenseListProps> = ({ userUid, userCorreo }) => {
  const [licencias, setLicencias] = useState<Licencia[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Filtros, Búsqueda y Ordenamiento
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todas');
  const [filtroTipo, setFiltroTipo] = useState<string>('todas');
  const [ordenarPor, setOrdenarPor] = useState<'fechaExpiracion' | 'fechaCreacion' | 'diasRestantes'>('fechaCreacion');

  // Estados para Modales
  const [modalFormOpen, setModalFormOpen] = useState<boolean>(false);
  const [licenciaParaEditar, setLicenciaParaEditar] = useState<Licencia | null>(null);

  const [modalRenewOpen, setModalRenewOpen] = useState<boolean>(false);
  const [licenciaParaRenovar, setLicenciaParaRenovar] = useState<Licencia | null>(null);

  const [modalDetailOpen, setModalDetailOpen] = useState<boolean>(false);
  const [licenciaDetalle, setLicenciaDetalle] = useState<Licencia | null>(null);

  const [modalConfirmOpen, setModalConfirmOpen] = useState<boolean>(false);
  const [accionConfirmar, setAccionConfirmar] = useState<'suspender' | 'reactivar' | 'revocar' | 'eliminar'>('suspender');
  const [licenciaAccion, setLicenciaAccion] = useState<Licencia | null>(null);
  const [procesandoAccion, setProcesandoAccion] = useState<boolean>(false);

  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // Cargar Licencias desde Firestore
  const cargarLicencias = async () => {
    try {
      setCargando(true);
      setError(null);
      const data = await licenseService.obtenerLicencias();
      setLicencias(data);
    } catch (err: any) {
      console.error('Error al cargar licencias:', err);
      setError('No se pudieron obtener las licencias desde Firestore.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarLicencias();
  }, []);

  const copiarKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiadoId(key);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  const mostrarExito = (msg: string) => {
    setMensajeExito(msg);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  // Manejo de Formulario (Crear o Editar)
  const handleFormSubmit = async (formData: any) => {
    try {
      setProcesandoAccion(true);
      if (formData.id) {
        // Editar
        await licenseService.actualizarLicencia(
          formData.id,
          {
            versionMinima: formData.versionMinima,
            versionMaxima: formData.versionMaxima,
            cantidadInstalacionesPermitidas: formData.cantidadInstalacionesPermitidas,
            observaciones: formData.observaciones
          },
          userUid,
          userCorreo
        );
        mostrarExito('Parámetros de la licencia actualizados exitosamente.');
      } else {
        // Crear
        await licenseService.crearLicencia(
          {
            clienteId: formData.clienteId,
            uuidCliente: formData.uuidCliente,
            nombreEmpresa: formData.nombreEmpresa,
            tipoLicencia: formData.tipoLicencia,
            versionMinima: formData.versionMinima,
            versionMaxima: formData.versionMaxima,
            cantidadInstalacionesPermitidas: formData.cantidadInstalacionesPermitidas,
            duracionDiasPersonalizada: formData.duracionDiasPersonalizada,
            observaciones: formData.observaciones
          },
          userUid,
          userCorreo
        );
        mostrarExito('Licencia emitida exitosamente e integrada a Firestore.');
      }
      await cargarLicencias();
    } catch (err: any) {
      throw new Error(err.message || 'Error al procesar la licencia.');
    } finally {
      setProcesandoAccion(false);
    }
  };

  // Manejo de Renovación
  const handleRenewSubmit = async (id: string, diasAnadidos: number, observaciones: string) => {
    try {
      setProcesandoAccion(true);
      await licenseService.renovarLicencia(id, diasAnadidos, observaciones, userUid, userCorreo);
      mostrarExito(`Licencia renovada exitosamente (+${diasAnadidos} días).`);
      await cargarLicencias();
    } catch (err: any) {
      throw new Error(err.message || 'Error al renovar licencia.');
    } finally {
      setProcesandoAccion(false);
    }
  };

  // Manejo de Acciones Críticas
  const ejecutarAccionConfirmada = async () => {
    if (!licenciaAccion || !licenciaAccion.id) return;
    try {
      setProcesandoAccion(true);
      if (accionConfirmar === 'suspender') {
        await licenseService.cambiarEstadoLicencia(licenciaAccion.id, 'suspendida', userUid, userCorreo);
        mostrarExito(`La licencia ${licenciaAccion.licenseKey} ha sido suspendida.`);
      } else if (accionConfirmar === 'reactivar') {
        await licenseService.cambiarEstadoLicencia(licenciaAccion.id, 'activa', userUid, userCorreo);
        mostrarExito(`La licencia ${licenciaAccion.licenseKey} ha sido reactivada.`);
      } else if (accionConfirmar === 'revocar') {
        await licenseService.cambiarEstadoLicencia(licenciaAccion.id, 'revocada', userUid, userCorreo);
        mostrarExito(`La licencia ${licenciaAccion.licenseKey} ha sido revocada.`);
      } else if (accionConfirmar === 'eliminar') {
        await licenseService.eliminarLicencia(licenciaAccion.id, userUid, userCorreo);
        mostrarExito(`La licencia ${licenciaAccion.licenseKey} ha sido eliminada permanentemente.`);
      }
      setModalConfirmOpen(false);
      setLicenciaAccion(null);
      await cargarLicencias();
    } catch (err: any) {
      setError(err.message || 'Error al procesar la acción.');
    } finally {
      setProcesandoAccion(false);
    }
  };

  // Abrir Confirmaciones
  const abrirConfirmacion = (lic: Licencia, accion: 'suspender' | 'reactivar' | 'revocar' | 'eliminar') => {
    setLicenciaAccion(lic);
    setAccionConfirmar(accion);
    setModalConfirmOpen(true);
  };

  // Filtrado y Ordenamiento
  const licenciasFiltradas = licencias
    .filter((lic) => {
      const q = busqueda.toLowerCase().trim();
      const coincideBusqueda =
        !q ||
        lic.licenseKey.toLowerCase().includes(q) ||
        (lic.nombreEmpresa && lic.nombreEmpresa.toLowerCase().includes(q)) ||
        (lic.uuidCliente && lic.uuidCliente.toLowerCase().includes(q));

      const coincideEstado =
        filtroEstado === 'todas'
          ? true
          : filtroEstado === 'proximas'
          ? lic.estado === 'activa' && lic.diasRestantes <= 15
          : lic.estado === filtroEstado;

      const coincideTipo = filtroTipo === 'todas' || lic.tipoLicencia === filtroTipo;

      return coincideBusqueda && coincideEstado && coincideTipo;
    })
    .sort((a, b) => {
      if (ordenarPor === 'fechaExpiracion') {
        return new Date(a.fechaExpiracion).getTime() - new Date(b.fechaExpiracion).getTime();
      }
      if (ordenarPor === 'diasRestantes') {
        return a.diasRestantes - b.diasRestantes;
      }
      return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
    });

  // Cálculo de KPIs
  const totalLicencias = licencias.length;
  const activasCount = licencias.filter((l) => l.estado === 'activa' && l.diasRestantes > 15).length;
  const proximasCount = licencias.filter((l) => l.estado === 'activa' && l.diasRestantes <= 15).length;
  const expiradasCount = licencias.filter((l) => l.estado === 'expirada' || (l.estado === 'activa' && l.diasRestantes <= 0)).length;
  const suspendidasRevocadasCount = licencias.filter((l) => l.estado === 'suspendida' || l.estado === 'revocada').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Encabezado Superior */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Sistema Empresarial de Licencias</h1>
          </div>
          <p className="text-xs text-slate-400">
            Control maestro de autorizaciones, vigencias, claves encriptadas y límites para Sistemas de Inventario.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={cargarLicencias}
            disabled={cargando}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition-colors"
            title="Recargar licencias desde Firestore"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              setLicenciaParaEditar(null);
              setModalFormOpen(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Emitir Nueva Licencia</span>
          </button>
        </div>
      </div>

      {/* Alertas Globales de Éxito / Error */}
      {mensajeExito && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-medium">{mensajeExito}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-3 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* KPIs Metrícas Rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Total Emisiones</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{totalLicencias}</div>
          <div className="text-[11px] text-slate-500">Licencias en Firestore</div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Activas Vigentes</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{activasCount}</div>
          <div className="text-[11px] text-slate-500">&gt; 15 días restantes</div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-amber-400/90 font-medium">
            <span>Próximas a Vencer</span>
            <Clock className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-yellow-400">{proximasCount}</div>
          <div className="text-[11px] text-yellow-500/80">Vencen en ≤ 15 días</div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-rose-400/90 font-medium">
            <span>Expiradas</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-400">{expiradasCount}</div>
          <div className="text-[11px] text-red-500/80">Plazo finalizado</div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Suspendidas / Revocadas</span>
            <ShieldOff className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-300">{suspendidasRevocadasCount}</div>
          <div className="text-[11px] text-slate-500">Bloqueadas temporal o def.</div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-center gap-3">
        {/* Buscador */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por LicenseKey, Nombre de Empresa o UUID de Cliente..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Filtro por Estado */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-indigo-500 focus:outline-none capitalize"
          >
            <option value="todas">Todos los Estados</option>
            <option value="activa">Activas</option>
            <option value="proximas">Próximas a Vencer (≤ 15d)</option>
            <option value="suspendida">Suspendidas</option>
            <option value="expirada">Expiradas</option>
            <option value="revocada">Revocadas</option>
            <option value="pendiente">Pendientes</option>
          </select>
        </div>

        {/* Filtro por Tipo */}
        <div className="w-full md:w-auto">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-indigo-500 focus:outline-none capitalize"
          >
            <option value="todas">Todos los Tipos</option>
            <option value="mensual">Mensual</option>
            <option value="trimestral">Trimestral</option>
            <option value="semestral">Semestral</option>
            <option value="anual">Anual</option>
            <option value="permanente">Permanente</option>
            <option value="prueba">Prueba / Demo</option>
            <option value="personalizada">Personalizada</option>
          </select>
        </div>

        {/* Ordenar Por */}
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          <ArrowUpDown className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={ordenarPor}
            onChange={(e) => setOrdenarPor(e.target.value as any)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            <option value="fechaCreacion">Ordenar: Recientes</option>
            <option value="fechaExpiracion">Ordenar: Fecha Expiración</option>
            <option value="diasRestantes">Ordenar: Días Restantes</option>
          </select>
        </div>
      </div>

      {/* Tabla de Licencias */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="p-4">Clave Licencia (Key)</th>
                <th className="p-4">Cliente / Empresa</th>
                <th className="p-4">Tipo &amp; Versión</th>
                <th className="p-4">Instalaciones</th>
                <th className="p-4">Vencimiento / Restante</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {cargando ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Cargando licencias en tiempo real desde Firestore...</span>
                    </div>
                  </td>
                </tr>
              ) : licenciasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-1.5">
                      <KeyRound className="w-8 h-8 text-slate-700" />
                      <p className="font-semibold text-slate-400">No se encontraron licencias</p>
                      <p className="text-[11px] text-slate-600">Modifique los filtros o emita una nueva licencia para comenzar.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                licenciasFiltradas.map((lic) => {
                  const expDate = new Date(lic.fechaExpiracion);
                  const estaExpirada = lic.estado === 'expirada' || (lic.estado === 'activa' && lic.diasRestantes <= 0);
                  const estaProxima = lic.estado === 'activa' && lic.diasRestantes <= 15 && lic.diasRestantes > 0;

                  return (
                    <tr
                      key={lic.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Clave de Licencia */}
                      <td className="p-4 font-mono font-bold text-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-400">{lic.licenseKey}</span>
                          <button
                            onClick={() => copiarKey(lic.licenseKey)}
                            title="Copiar Clave"
                            className="p-1 text-slate-500 hover:text-indigo-400 rounded transition-colors opacity-0 group-hover:opacity-100"
                          >
                            {copiadoId === lic.licenseKey ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Cliente / Empresa */}
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{lic.nombreEmpresa}</span>
                          </div>
                          <div className="font-mono text-[11px] text-slate-400">
                            {lic.uuidCliente}
                          </div>
                        </div>
                      </td>

                      {/* Tipo & Versión */}
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <span className="capitalize font-semibold text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                            {lic.tipoLicencia}
                          </span>
                          <div className="text-[11px] font-mono text-slate-400 pt-1">
                            v{lic.versionMinima} — v{lic.versionMaxima}
                          </div>
                        </div>
                      </td>

                      {/* Instalaciones */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono font-bold text-slate-200">
                              {lic.cantidadInstalacionesUsadas} / {lic.cantidadInstalacionesPermitidas}
                            </span>
                            <span className="text-slate-500 text-[10px]">Puestos</span>
                          </div>
                          <div className="w-24 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className={`h-full transition-all ${
                                lic.cantidadInstalacionesUsadas >= lic.cantidadInstalacionesPermitidas
                                  ? 'bg-amber-500'
                                  : 'bg-indigo-500'
                              }`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  (lic.cantidadInstalacionesUsadas / (lic.cantidadInstalacionesPermitidas || 1)) * 100
                                )}%`
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Vencimiento / Restantes */}
                      <td className="p-4 font-mono">
                        <div className="space-y-0.5">
                          <div className="text-slate-300">
                            {expDate.toLocaleDateString('es-DO', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </div>
                          <div
                            className={`text-[11px] font-bold ${
                              estaExpirada
                                ? 'text-red-400'
                                : estaProxima
                                ? 'text-yellow-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {lic.tipoLicencia === 'permanente'
                              ? 'Ilimitada / Vitalicia'
                              : estaExpirada
                              ? 'Expiró'
                              : `${lic.diasRestantes} días restantes`}
                          </div>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="p-4">
                        {lic.estado === 'suspendida' && (
                          <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[11px] font-semibold flex items-center gap-1 w-fit">
                            <PauseCircle className="w-3 h-3" />
                            <span>Suspendida</span>
                          </span>
                        )}
                        {lic.estado === 'revocada' && (
                          <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-[11px] font-semibold flex items-center gap-1 w-fit">
                            <ShieldOff className="w-3 h-3" />
                            <span>Revocada</span>
                          </span>
                        )}
                        {estaExpirada && lic.estado !== 'suspendida' && lic.estado !== 'revocada' && (
                          <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[11px] font-semibold flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Expirada</span>
                          </span>
                        )}
                        {estaProxima && lic.estado !== 'suspendida' && lic.estado !== 'revocada' && (
                          <span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full text-[11px] font-semibold flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3" />
                            <span>Por Vencer</span>
                          </span>
                        )}
                        {!estaExpirada && !estaProxima && lic.estado === 'activa' && (
                          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[11px] font-semibold flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Activa</span>
                          </span>
                        )}
                        {lic.estado === 'pendiente' && (
                          <span className="px-2.5 py-1 bg-slate-500/10 text-slate-400 border border-slate-500/20 rounded-full text-[11px] font-semibold flex items-center gap-1 w-fit">
                            <span>Pendiente</span>
                          </span>
                        )}
                      </td>

                      {/* Botones de Acción */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Ver Detalle */}
                          <button
                            onClick={() => {
                              setLicenciaDetalle(lic);
                              setModalDetailOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Ver Expediente de Licencia"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Renovar */}
                          <button
                            onClick={() => {
                              setLicenciaParaRenovar(lic);
                              setModalRenewOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Renovar / Extender Días"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>

                          {/* Editar Parámetros */}
                          <button
                            onClick={() => {
                              setLicenciaParaEditar(lic);
                              setModalFormOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Editar Parámetros y Límites"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Suspender / Reactivar */}
                          {lic.estado === 'activa' ? (
                            <button
                              onClick={() => abrirConfirmacion(lic, 'suspender')}
                              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Suspender Licencia"
                            >
                              <PauseCircle className="w-4 h-4" />
                            </button>
                          ) : lic.estado === 'suspendida' ? (
                            <button
                              onClick={() => abrirConfirmacion(lic, 'reactivar')}
                              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Reactivar Licencia"
                            >
                              <PlayCircle className="w-4 h-4" />
                            </button>
                          ) : null}

                          {/* Revocar */}
                          {lic.estado !== 'revocada' && (
                            <button
                              onClick={() => abrirConfirmacion(lic, 'revocar')}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Revocar Licencia Definitivamente"
                            >
                              <ShieldOff className="w-4 h-4" />
                            </button>
                          )}

                          {/* Eliminar únicamente si no ha sido usada */}
                          {lic.cantidadInstalacionesUsadas === 0 && lic.installationIds.length === 0 && (
                            <button
                              onClick={() => abrirConfirmacion(lic, 'eliminar')}
                              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Eliminar Registro de Licencia no Utilizada"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Creación / Edición */}
      <LicenseFormModal
        isOpen={modalFormOpen}
        licenciaParaEditar={licenciaParaEditar}
        cargando={procesandoAccion}
        onSubmit={handleFormSubmit}
        onClose={() => {
          setModalFormOpen(false);
          setLicenciaParaEditar(null);
        }}
      />

      {/* Modal de Renovación */}
      <LicenseRenewModal
        isOpen={modalRenewOpen}
        licencia={licenciaParaRenovar}
        cargando={procesandoAccion}
        onRenew={handleRenewSubmit}
        onClose={() => {
          setModalRenewOpen(false);
          setLicenciaParaRenovar(null);
        }}
      />

      {/* Modal de Detalles Expediente */}
      <LicenseDetailModal
        isOpen={modalDetailOpen}
        licencia={licenciaDetalle}
        onEdit={(lic) => {
          setModalDetailOpen(false);
          setLicenciaParaEditar(lic);
          setModalFormOpen(true);
        }}
        onRenew={(lic) => {
          setModalDetailOpen(false);
          setLicenciaParaRenovar(lic);
          setModalRenewOpen(true);
        }}
        onSuspend={(lic) => {
          setModalDetailOpen(false);
          abrirConfirmacion(lic, 'suspender');
        }}
        onReactivate={(lic) => {
          setModalDetailOpen(false);
          abrirConfirmacion(lic, 'reactivar');
        }}
        onRevoke={(lic) => {
          setModalDetailOpen(false);
          abrirConfirmacion(lic, 'revocar');
        }}
        onDelete={(lic) => {
          setModalDetailOpen(false);
          abrirConfirmacion(lic, 'eliminar');
        }}
        onClose={() => {
          setModalDetailOpen(false);
          setLicenciaDetalle(null);
        }}
      />

      {/* Modal de Confirmación de Acciones */}
      <ConfirmLicenseActionModal
        isOpen={modalConfirmOpen}
        tipo={accionConfirmar}
        licenseKey={licenciaAccion?.licenseKey || ''}
        nombreEmpresa={licenciaAccion?.nombreEmpresa || ''}
        cargando={procesandoAccion}
        onConfirm={ejecutarAccionConfirmada}
        onClose={() => {
          setModalConfirmOpen(false);
          setLicenciaAccion(null);
        }}
      />

    </div>
  );
};
