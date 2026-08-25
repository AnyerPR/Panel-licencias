import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Building2,
  Calendar,
  Layers,
  Cpu,
  History,
  ShieldAlert,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  PlayCircle,
  ShieldOff,
  Trash2,
  RefreshCw,
  Edit3,
  X,
  Copy,
  Check
} from 'lucide-react';
import { Licencia, Cliente } from '../../types';
import { clientService } from '../../services/clientService';

interface LicenseDetailModalProps {
  isOpen: boolean;
  licencia: Licencia | null;
  onEdit: (licencia: Licencia) => void;
  onRenew: (licencia: Licencia) => void;
  onSuspend: (licencia: Licencia) => void;
  onReactivate: (licencia: Licencia) => void;
  onRevoke: (licencia: Licencia) => void;
  onDelete: (licencia: Licencia) => void;
  onClose: () => void;
}

export const LicenseDetailModal: React.FC<LicenseDetailModalProps> = ({
  isOpen,
  licencia,
  onEdit,
  onRenew,
  onSuspend,
  onReactivate,
  onRevoke,
  onDelete,
  onClose
}) => {
  if (!isOpen || !licencia) return null;

  const [activeTab, setActiveTab] = useState<'general' | 'cliente' | 'instalaciones' | 'renovaciones'>('general');
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [cargandoCliente, setCargandoCliente] = useState<boolean>(false);
  const [copiadoKey, setCopiadoKey] = useState<boolean>(false);

  // Cargar información completa del cliente desde Firestore
  useEffect(() => {
    if (licencia?.clienteId) {
      const cargarCliente = async () => {
        try {
          setCargandoCliente(true);
          const data = await clientService.obtenerClientePorId(licencia.clienteId);
          setCliente(data);
        } catch (err) {
          console.error('Error al cargar cliente asociado:', err);
        } finally {
          setCargandoCliente(false);
        }
      };
      cargarCliente();
    }
  }, [licencia]);

  const copiarKey = () => {
    navigator.clipboard.writeText(licencia.licenseKey);
    setCopiadoKey(true);
    setTimeout(() => setCopiadoKey(false), 2000);
  };

  // Badges y estilos de estado
  const getBadgeEstado = (estado: string, diasRestantes: number) => {
    if (estado === 'suspendida') {
      return (
        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-semibold flex items-center gap-1.5">
          <PauseCircle className="w-3.5 h-3.5" />
          <span>Suspendida</span>
        </span>
      );
    }
    if (estado === 'revocada') {
      return (
        <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-xs font-semibold flex items-center gap-1.5">
          <ShieldOff className="w-3.5 h-3.5" />
          <span>Revocada</span>
        </span>
      );
    }
    if (estado === 'expirada' || diasRestantes <= 0) {
      return (
        <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-semibold flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Expirada</span>
        </span>
      );
    }
    if (diasRestantes <= 15) {
      return (
        <span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full text-xs font-semibold flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>Próxima a vencer ({diasRestantes}d)</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold flex items-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Activa ({diasRestantes}d)</span>
      </span>
    );
  };

  const expDate = new Date(licencia.fechaExpiracion);
  const creacionDate = new Date(licencia.fechaCreacion);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in duration-150">
        
        {/* Encabezado Principal */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-mono font-bold text-white tracking-wide">
                  {licencia.licenseKey}
                </h2>
                <button
                  onClick={copiarKey}
                  title="Copiar Clave"
                  className="p-1 text-slate-400 hover:text-indigo-400 transition-colors rounded-md"
                >
                  {copiadoKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-semibold text-slate-200">{licencia.nombreEmpresa}</span>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-slate-400">{licencia.uuidCliente}</span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {getBadgeEstado(licencia.estado, licencia.diasRestantes)}
              <button
                onClick={onClose}
                className="p-1 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Botones de Acción Rápida */}
          <div className="flex flex-wrap items-center gap-2 pt-4 mt-4 border-t border-slate-800/80">
            <button
              onClick={() => onRenew(licencia)}
              className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Renovar / Extender</span>
            </button>

            <button
              onClick={() => onEdit(licencia)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar Parámetros</span>
            </button>

            {licencia.estado === 'activa' && (
              <button
                onClick={() => onSuspend(licencia)}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <PauseCircle className="w-3.5 h-3.5" />
                <span>Suspender</span>
              </button>
            )}

            {licencia.estado === 'suspendida' && (
              <button
                onClick={() => onReactivate(licencia)}
                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Reactivar</span>
              </button>
            )}

            {licencia.estado !== 'revocada' && (
              <button
                onClick={() => onRevoke(licencia)}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <ShieldOff className="w-3.5 h-3.5" />
                <span>Revocar</span>
              </button>
            )}

            {licencia.cantidadInstalacionesUsadas === 0 && licencia.installationIds.length === 0 && (
              <button
                onClick={() => onDelete(licencia)}
                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Registro</span>
              </button>
            )}
          </div>
        </div>

        {/* Pestañas de Navegación Interna */}
        <div className="flex border-b border-slate-800 bg-slate-900/80 px-6">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'general'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Información General</span>
          </button>

          <button
            onClick={() => setActiveTab('cliente')}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'cliente'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Cliente Asociado</span>
          </button>

          <button
            onClick={() => setActiveTab('instalaciones')}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'instalaciones'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Instalaciones ({licencia.cantidadInstalacionesUsadas}/{licencia.cantidadInstalacionesPermitidas})</span>
          </button>

          <button
            onClick={() => setActiveTab('renovaciones')}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'renovaciones'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historial Renovaciones ({licencia.renovaciones.length})</span>
          </button>
        </div>

        {/* Contenido de la Pestaña Activa */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {activeTab === 'general' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Vigencia y Tipo</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tipo de Licencia:</span>
                    <span className="font-semibold text-slate-200 capitalize">{licencia.tipoLicencia}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fecha de Emisión:</span>
                    <span className="font-mono text-slate-300">{creacionDate.toLocaleDateString('es-DO')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fecha Expiración:</span>
                    <span className="font-mono text-indigo-400 font-bold">{expDate.toLocaleDateString('es-DO')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Días Restantes:</span>
                    <span className="font-bold text-emerald-400">{licencia.diasRestantes} días</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Reglas y Versiones</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Versión Mínima:</span>
                    <span className="font-mono text-slate-200">{licencia.versionMinima}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Versión Máxima:</span>
                    <span className="font-mono text-slate-200">{licencia.versionMaxima}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Instalaciones Permitidas:</span>
                    <span className="font-mono font-bold text-slate-200">{licencia.cantidadInstalacionesPermitidas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Instalaciones Activas:</span>
                    <span className="font-mono font-bold text-indigo-400">{licencia.cantidadInstalacionesUsadas}</span>
                  </div>
                </div>
              </div>

              <div className="col-span-full p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Auditoría de Registro</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-400">
                  <div>Emitido Por: <span className="text-slate-200 font-medium">{licencia.creadoPor}</span></div>
                  <div>Última Validación API: <span className="text-slate-200 font-mono">{licencia.ultimaValidacion ? new Date(licencia.ultimaValidacion).toLocaleString() : 'Pendiente de inicio'}</span></div>
                </div>
              </div>

              {licencia.observaciones && (
                <div className="col-span-full p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[11px] font-medium text-slate-400 uppercase">Observaciones:</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{licencia.observaciones}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'cliente' && (
            <div className="space-y-4">
              {cargandoCliente ? (
                <div className="p-8 text-center text-xs text-slate-500">Cargando datos detallados del cliente...</div>
              ) : cliente ? (
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">{cliente.nombreEmpresa}</h4>
                      <p className="text-xs text-slate-400">{cliente.nombreComercial}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-medium capitalize">
                      {cliente.estado}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-800/60">
                    <div><span className="text-slate-500">RNC:</span> <span className="text-slate-200 font-mono font-medium">{cliente.rnc || 'N/A'}</span></div>
                    <div><span className="text-slate-500">UUID Inmutable:</span> <span className="text-indigo-400 font-mono font-semibold">{cliente.uuidCliente}</span></div>
                    <div><span className="text-slate-500">Correo Principal:</span> <span className="text-slate-200">{cliente.correo}</span></div>
                    <div><span className="text-slate-500">Teléfono:</span> <span className="text-slate-200">{cliente.telefono}</span></div>
                    <div><span className="text-slate-500">Persona Contacto:</span> <span className="text-slate-200">{cliente.personaContacto}</span></div>
                    <div><span className="text-slate-500">Ubicación:</span> <span className="text-slate-200">{cliente.ciudad}, {cliente.pais}</span></div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-400">
                  Cliente registrado con UUID: <span className="font-mono text-indigo-400">{licencia.uuidCliente}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'instalaciones' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Nodos / Clientes locales autorizados</span>
                <span className="font-mono">{licencia.cantidadInstalacionesUsadas} de {licencia.cantidadInstalacionesPermitidas} puestos ocupados</span>
              </div>

              {licencia.installationIds && licencia.installationIds.length > 0 ? (
                <div className="space-y-2">
                  {licencia.installationIds.map((instId, index) => (
                    <div key={index} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <Cpu className="w-4 h-4 text-indigo-400" />
                        <span className="font-mono font-semibold text-slate-200">{instId}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md text-[11px] font-mono">
                        Instalado / Activo
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center space-y-1">
                  <Cpu className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">Aún no existen instalaciones registradas</p>
                  <p className="text-[11px] text-slate-500">
                    El cliente registrará sus hardware IDs automáticamente cuando conecte su Inventario.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'renovaciones' && (
            <div className="space-y-3">
              {licencia.renovaciones && licencia.renovaciones.length > 0 ? (
                <div className="space-y-2.5">
                  {licencia.renovaciones.map((ren, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-400 flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>+{ren.diasAnadidos} Días Añadidos</span>
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {new Date(ren.fecha).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Renovado por: <strong className="text-slate-200">{ren.renovadoPor}</strong></span>
                        <span>Nuevo Vencimiento: <strong className="text-emerald-400 font-mono">{new Date(ren.nuevoVencimiento).toLocaleDateString()}</strong></span>
                      </div>
                      {ren.observaciones && (
                        <p className="text-[11px] text-slate-400 italic bg-slate-900/50 p-2 rounded-lg border border-slate-800/60">
                          "{ren.observaciones}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center space-y-1">
                  <History className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">Sin renovaciones anteriores</p>
                  <p className="text-[11px] text-slate-500">Esta licencia se mantiene en su vigencia original de emisión.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cierre */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
          >
            Cerrar Detalles
          </button>
        </div>

      </div>
    </div>
  );
};
