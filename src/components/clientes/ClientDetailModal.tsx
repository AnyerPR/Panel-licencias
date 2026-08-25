import React, { useState } from 'react';
import {
  X,
  Building2,
  Mail,
  Phone,
  MapPin,
  User,
  Shield,
  Key,
  HardDrive,
  Calendar,
  History,
  FileText,
  Clock,
  ExternalLink,
  Edit,
  PauseCircle,
  PlayCircle,
  Trash2,
  CheckCircle2,
  Layers,
  Sparkles
} from 'lucide-react';
import { Cliente } from '../../types';

interface ClientDetailModalProps {
  isOpen: boolean;
  cliente: Cliente | null;
  onClose: () => void;
  onEditar: (cliente: Cliente) => void;
  onSuspender: (cliente: Cliente) => void;
  onReactivar: (cliente: Cliente) => void;
  onEliminar: (cliente: Cliente) => void;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  isOpen,
  cliente,
  onClose,
  onEditar,
  onSuspender,
  onReactivar,
  onEliminar
}) => {
  const [pestanaActiva, setPestanaActiva] = useState<'general' | 'licencias' | 'instalaciones' | 'versiones' | 'auditoria'>('general');

  if (!isOpen || !cliente) return null;

  const formatearFecha = (fecha: string | Date | undefined) => {
    if (!fecha) return 'Sin fecha';
    try {
      const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
      return d.toLocaleDateString('es-DO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(fecha);
    }
  };

  const badgeEstado = {
    activo: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    suspendido: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    cancelado: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    vencido: 'bg-red-500/10 text-red-400 border-red-500/30',
    mantenimiento: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
  }[cliente.estado] || 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl my-6 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-150">
        
        {/* Cabecera del Detalle */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-white">{cliente.nombreEmpresa}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${badgeEstado}`}>
                  {cliente.estado}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                  Plan {cliente.plan}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <span>{cliente.nombreComercial}</span>
                <span>•</span>
                <span className="font-mono text-slate-300">RNC: {cliente.rnc}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEditar(cliente);
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>

            {cliente.estado === 'activo' ? (
              <button
                onClick={() => onSuspender(cliente)}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-medium rounded-xl border border-amber-500/30 flex items-center gap-1.5 transition-colors"
              >
                <PauseCircle className="w-3.5 h-3.5" />
                <span>Suspender</span>
              </button>
            ) : (
              <button
                onClick={() => onReactivar(cliente)}
                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-xl border border-emerald-500/30 flex items-center gap-1.5 transition-colors"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Reactivar</span>
              </button>
            )}

            <button
              onClick={() => onEliminar(cliente)}
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium rounded-xl border border-rose-500/30 flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* UUID Banner Inmutable */}
        <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Key className="w-3.5 h-3.5 text-indigo-400" />
            <span>UUID Permanente e Inmutable:</span>
            <span className="font-mono text-indigo-300 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {cliente.uuidCliente}
            </span>
          </div>
          <div className="text-slate-500 text-[11px] hidden sm:block">
            Registrado el: {formatearFecha(cliente.fechaCreacion)}
          </div>
        </div>

        {/* Pestañas de Navegación del Detalle */}
        <div className="flex border-b border-slate-800 bg-slate-900 px-6 gap-2 overflow-x-auto">
          {[
            { id: 'general', label: 'Información General', icon: Building2 },
            { id: 'licencias', label: `Licencias (${cliente.cantidadLicencias})`, icon: Key },
            { id: 'instalaciones', label: `Instalaciones (${cliente.cantidadInstalaciones})`, icon: HardDrive },
            { id: 'versiones', label: 'Versión & Sistema', icon: Layers },
            { id: 'auditoria', label: 'Auditoría & Logs', icon: History }
          ].map(tab => {
            const TabIcon = tab.icon;
            const activa = pestanaActiva === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setPestanaActiva(tab.id as any)}
                className={`py-3 px-3 border-b-2 text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
                  activa
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Contenido de la Pestaña */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {pestanaActiva === 'general' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Tarjeta 1: Información Legal y Fiscal */}
              <div className="p-5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-4">
                <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>Datos Comerciales y Fiscales</span>
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between border-b border-slate-800/50 pb-2">
                    <span className="text-slate-400">Razón Social:</span>
                    <span className="font-semibold text-slate-200">{cliente.nombreEmpresa}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/50 pb-2">
                    <span className="text-slate-400">Nombre Comercial:</span>
                    <span className="text-slate-200">{cliente.nombreComercial}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/50 pb-2">
                    <span className="text-slate-400">RNC / RIF:</span>
                    <span className="font-mono font-bold text-slate-200">{cliente.rnc}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/50 pb-2">
                    <span className="text-slate-400">Tipo de Empresa:</span>
                    <span className="capitalize text-slate-200">{cliente.tipo || 'Hospital / Centro Médico'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Plan Asignado:</span>
                    <span className="font-semibold text-indigo-300 capitalize">{cliente.plan}</span>
                  </div>
                </div>
              </div>

              {/* Tarjeta 2: Contacto y Ubicación */}
              <div className="p-5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-4">
                <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>Contacto y Localización</span>
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between border-b border-slate-800/50 pb-2">
                    <span className="text-slate-400">Persona de Contacto:</span>
                    <span className="font-medium text-slate-200">{cliente.personaContacto}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/50 pb-2">
                    <span className="text-slate-400">Correo Electrónico:</span>
                    <a href={`mailto:${cliente.correo}`} className="text-indigo-400 hover:underline">
                      {cliente.correo}
                    </a>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/50 pb-2">
                    <span className="text-slate-400">Teléfono Directo:</span>
                    <span className="font-mono text-slate-200">{cliente.telefono}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/50 pb-2">
                    <span className="text-slate-400">Ciudad / País:</span>
                    <span className="text-slate-200">{cliente.ciudad}, {cliente.pais}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dirección Física:</span>
                    <span className="text-slate-300 text-right max-w-[200px] truncate">{cliente.direccion}</span>
                  </div>
                </div>
              </div>

              {/* Tarjeta 3: Métricas y Resumen de Licencias */}
              <div className="p-5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-4">
                <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  <span>Resumen de Operaciones</span>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center">
                    <span className="block text-xl font-bold text-indigo-400">{cliente.cantidadLicencias}</span>
                    <span className="text-[11px] text-slate-400">Licencias Emitidas</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center">
                    <span className="block text-xl font-bold text-emerald-400">{cliente.cantidadInstalaciones}</span>
                    <span className="text-[11px] text-slate-400">Nodos / Instalaciones</span>
                  </div>
                </div>
              </div>

              {/* Tarjeta 4: Infraestructura y Fechas */}
              <div className="p-5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-4">
                <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Configuración & Fechas</span>
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between border-b border-slate-800/50 pb-2">
                    <span className="text-slate-400">Fecha de Registro:</span>
                    <span className="text-slate-200">{formatearFecha(cliente.fechaCreacion)}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/50 pb-2">
                    <span className="text-slate-400">Última Modificación:</span>
                    <span className="text-slate-200">{formatearFecha(cliente.ultimaModificacion)}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/50 pb-2">
                    <span className="text-slate-400">Proyecto Firebase:</span>
                    <span className="font-mono text-slate-300">{cliente.firebaseProjectId || 'No asignado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dominio Personalizado:</span>
                    <span className="font-mono text-indigo-300">{cliente.dominio || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Tarjeta 5: Observaciones en ancho completo */}
              {cliente.observaciones && (
                <div className="md:col-span-2 p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
                  <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Observaciones / Notas Especiales</span>
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {cliente.observaciones}
                  </p>
                </div>
              )}

            </div>
          )}

          {/* Pestaña: Licencias (Preparado para Fase 3) */}
          {pestanaActiva === 'licencias' && (
            <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center space-y-3 bg-slate-950/40">
              <div className="w-12 h-12 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto">
                <Key className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">Módulo de Licencias del Cliente</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Actualmente este cliente posee <strong className="text-indigo-400">{cliente.cantidadLicencias}</strong> licencia(s) vinculadas a su UUID (<code className="text-indigo-300">{cliente.uuidCliente}</code>).
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Preparado para gestión en la FASE 3</span>
                </span>
              </div>
            </div>
          )}

          {/* Pestaña: Instalaciones */}
          {pestanaActiva === 'instalaciones' && (
            <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center space-y-3 bg-slate-950/40">
              <div className="w-12 h-12 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
                <HardDrive className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">Instalaciones y Nodos del Cliente</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                El cliente registra <strong className="text-emerald-400">{cliente.cantidadInstalaciones}</strong> instalación(es) activa(s) reportando al Panel Maestro.
              </p>
            </div>
          )}

          {/* Pestaña: Versiones */}
          {pestanaActiva === 'versiones' && (
            <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center space-y-3 bg-slate-950/40">
              <div className="w-12 h-12 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">Estado de Versiones e Iso</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Gestión de canales de actualización (Estable, Beta, LTS) para {cliente.nombreEmpresa}.
              </p>
            </div>
          )}

          {/* Pestaña: Auditoría */}
          {pestanaActiva === 'auditoria' && (
            <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center space-y-3 bg-slate-950/40">
              <div className="w-12 h-12 bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                <History className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">Historial de Auditoría</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Todas las modificaciones realizadas sobre este cliente quedan registradas automáticamente en la colección global <code className="text-indigo-300">auditoria</code>.
              </p>
            </div>
          )}

        </div>

        {/* Pie del Modal */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
          >
            Cerrar Detalle
          </button>
        </div>

      </div>
    </div>
  );
};
