import React from 'react';
import { AlertTriangle, Trash2, PauseCircle, PlayCircle, X } from 'lucide-react';

interface ConfirmActionModalProps {
  isOpen: boolean;
  tipo: 'suspender' | 'reactivar' | 'eliminar';
  nombreEmpresa: string;
  cargando: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Modal de confirmación para acciones críticas sobre un cliente
 */
export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  tipo,
  nombreEmpresa,
  cargando,
  onConfirm,
  onClose
}) => {
  if (!isOpen) return null;

  const config = {
    suspender: {
      titulo: 'Suspender Cliente',
      descripcion: `¿Está seguro de que desea suspender al cliente "${nombreEmpresa}"? El cliente no podrá validar licencias hasta que sea reactivado.`,
      icono: PauseCircle,
      colorIcono: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      colorBoton: 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 shadow-amber-600/20',
      textoBoton: 'Sí, Suspender Cliente'
    },
    reactivar: {
      titulo: 'Reactivar Cliente',
      descripcion: `¿Desea reactivar la cuenta del cliente "${nombreEmpresa}"? Sus licencias e instalaciones volverán a estar vigentes.`,
      icono: PlayCircle,
      colorIcono: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      colorBoton: 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-emerald-600/20',
      textoBoton: 'Sí, Reactivar Cliente'
    },
    eliminar: {
      titulo: 'Eliminar Cliente Permanentemente',
      descripcion: `¿Está completamente seguro de eliminar el registro del cliente "${nombreEmpresa}"? Esta acción es irreversible y eliminará la información del sistema.`,
      icono: Trash2,
      colorIcono: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      colorBoton: 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 shadow-rose-600/20',
      textoBoton: 'Sí, Eliminar Registro'
    }
  }[tipo];

  const Icono = config.icono;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in duration-150">
        
        {/* Cabecera del Modal */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${config.colorIcono}`}>
              <Icono className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{config.titulo}</h3>
              <p className="text-xs text-slate-400">Confirmación requerida</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={cargando}
            className="p-1 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensaje de Advertencia */}
        <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed">
          {config.descripcion}
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={cargando}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={cargando}
            className={`px-4 py-2 text-white text-xs font-medium rounded-xl shadow-lg flex items-center gap-2 transition-all disabled:opacity-50 ${config.colorBoton}`}
          >
            {cargando && <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>}
            <span>{config.textoBoton}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
