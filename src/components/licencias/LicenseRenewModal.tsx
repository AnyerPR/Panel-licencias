import React, { useState } from 'react';
import { RefreshCw, Calendar, FileText, X, AlertCircle } from 'lucide-react';
import { Licencia } from '../../types';

interface LicenseRenewModalProps {
  isOpen: boolean;
  licencia: Licencia | null;
  cargando: boolean;
  onRenew: (id: string, diasAnadidos: number, observaciones: string) => Promise<void>;
  onClose: () => void;
}

export const LicenseRenewModal: React.FC<LicenseRenewModalProps> = ({
  isOpen,
  licencia,
  cargando,
  onRenew,
  onClose
}) => {
  if (!isOpen || !licencia) return null;

  const [dias, setDias] = useState<number>(30);
  const [observaciones, setObservaciones] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const presets = [
    { label: '+30 Días (1 Mes)', val: 30 },
    { label: '+90 Días (3 Meses)', val: 90 },
    { label: '+180 Días (6 Meses)', val: 180 },
    { label: '+365 Días (1 Año)', val: 365 }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dias || dias <= 0) {
      setError('Escriba una cantidad válida de días a extender.');
      return;
    }
    setError(null);
    try {
      await onRenew(licencia.id!, dias, observaciones);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al procesar la renovación.');
    }
  };

  const expActual = new Date(licencia.fechaExpiracion);
  const baseDate = expActual.getTime() > Date.now() ? expActual : new Date();
  const nuevaFechaExp = new Date(baseDate.getTime() + (dias || 0) * 24 * 60 * 60 * 1000);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Encabezado */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Renovar / Extender Licencia</h3>
              <p className="text-xs font-mono text-indigo-400">{licencia.licenseKey}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={cargando}
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Información Actual */}
          <div className="p-3.5 bg-slate-950/50 border border-slate-800 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Cliente:</span>
              <span className="font-semibold text-slate-200">{licencia.nombreEmpresa}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Vencimiento Actual:</span>
              <span className="font-mono text-slate-200">{expActual.toLocaleDateString('es-DO', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Nuevo Vencimiento:</span>
              <span className="font-mono text-indigo-400 font-bold">{nuevaFechaExp.toLocaleDateString('es-DO', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>

          {/* Días Rápidos */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Añadir Plazo Rápido</label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => setDias(p.val)}
                  className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all ${
                    dias === p.val
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Días Personalizados */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
              <span>Días Adicionales a Extender</span>
              <span className="text-[10px] text-slate-500">Días a sumar al período actual</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="number"
                min="1"
                max="3650"
                value={dias}
                onChange={(e) => setDias(parseInt(e.target.value) || 0)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
                placeholder="Ej. 30"
              />
            </div>
          </div>

          {/* Observaciones */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Motivo / Notas de la Renovación</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:border-indigo-500 focus:outline-none resize-none"
              placeholder="Ej. Extensión por comprobante de pago recibido..."
            />
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={cargando}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando || !dias || dias <= 0}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {cargando && <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>}
              <span>Confirmar Renovación</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
