import React, { useState, useEffect } from 'react';
import { KeyRound, Building2, Layers, Cpu, FileText, X, AlertCircle } from 'lucide-react';
import { Licencia, TipoLicencia, Cliente } from '../../types';
import { clientService } from '../../services/clientService';

interface LicenseFormModalProps {
  isOpen: boolean;
  licenciaParaEditar: Licencia | null;
  cargando: boolean;
  onSubmit: (formData: any) => Promise<void>;
  onClose: () => void;
}

export const LicenseFormModal: React.FC<LicenseFormModalProps> = ({
  isOpen,
  licenciaParaEditar,
  cargando,
  onSubmit,
  onClose
}) => {
  if (!isOpen) return null;

  const esEdicion = !!licenciaParaEditar;

  // Estado del formulario
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargandoClientes, setCargandoClientes] = useState<boolean>(false);

  const [clienteId, setClienteId] = useState<string>('');
  const [tipoLicencia, setTipoLicencia] = useState<TipoLicencia>('anual');
  const [versionMinima, setVersionMinima] = useState<string>('1.0.0');
  const [versionMaxima, setVersionMaxima] = useState<string>('9.9.9');
  const [cantidadInstalacionesPermitidas, setCantidadInstalacionesPermitidas] = useState<number>(1);
  const [duracionDiasPersonalizada, setDuracionDiasPersonalizada] = useState<number>(30);
  const [observaciones, setObservaciones] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Cargar lista de clientes para seleccionar en la creación
  useEffect(() => {
    if (!esEdicion && isOpen) {
      const cargarClientes = async () => {
        try {
          setCargandoClientes(true);
          const data = await clientService.obtenerClientes();
          setClientes(data);
          if (data.length > 0) {
            setClienteId(data[0].id || '');
          }
        } catch (err) {
          console.error('Error al cargar lista de clientes:', err);
        } finally {
          setCargandoClientes(false);
        }
      };
      cargarClientes();
    }
  }, [isOpen, esEdicion]);

  // Si es edición, poblar campos editables
  useEffect(() => {
    if (licenciaParaEditar) {
      setClienteId(licenciaParaEditar.clienteId);
      setTipoLicencia(licenciaParaEditar.tipoLicencia);
      setVersionMinima(licenciaParaEditar.versionMinima || '1.0.0');
      setVersionMaxima(licenciaParaEditar.versionMaxima || '9.9.9');
      setCantidadInstalacionesPermitidas(licenciaParaEditar.cantidadInstalacionesPermitidas || 1);
      setObservaciones(licenciaParaEditar.observaciones || '');
    } else {
      setTipoLicencia('anual');
      setVersionMinima('1.0.0');
      setVersionMaxima('9.9.9');
      setCantidadInstalacionesPermitidas(1);
      setDuracionDiasPersonalizada(30);
      setObservaciones('');
    }
    setError(null);
  }, [licenciaParaEditar, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!esEdicion && !clienteId) {
      setError('Seleccione un cliente para emitir la licencia.');
      return;
    }

    if (cantidadInstalacionesPermitidas <= 0) {
      setError('La cantidad de instalaciones permitidas debe ser mínimo 1.');
      return;
    }

    const clienteSeleccionado = clientes.find(c => c.id === clienteId);

    try {
      if (esEdicion && licenciaParaEditar) {
        await onSubmit({
          id: licenciaParaEditar.id,
          versionMinima,
          versionMaxima,
          cantidadInstalacionesPermitidas,
          observaciones
        });
      } else {
        await onSubmit({
          clienteId,
          uuidCliente: clienteSeleccionado?.uuidCliente || clienteSeleccionado?.uuid || '',
          nombreEmpresa: clienteSeleccionado?.nombreEmpresa || 'Cliente sin Nombre',
          tipoLicencia,
          versionMinima,
          versionMaxima,
          cantidadInstalacionesPermitidas,
          duracionDiasPersonalizada: tipoLicencia === 'personalizada' ? duracionDiasPersonalizada : undefined,
          observaciones
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al guardar la licencia.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-150">
        
        {/* Encabezado */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {esEdicion ? 'Editar Parámetros de Licencia' : 'Emitir Nueva Licencia'}
              </h3>
              <p className="text-xs text-slate-400">
                {esEdicion ? `Licencia: ${licenciaParaEditar.licenseKey}` : 'Se generará una clave única encriptada'}
              </p>
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

          {/* Selección de Cliente (solo en creación) */}
          {!esEdicion ? (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Cliente Asociado *</span>
              </label>
              {cargandoClientes ? (
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-500">
                  Cargando clientes de Firestore...
                </div>
              ) : (
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                  required
                >
                  {clientes.length === 0 && <option value="">No hay clientes registrados</option>}
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombreEmpresa} — {c.rnc ? `RNC: ${c.rnc}` : c.uuidCliente} ({c.estado})
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-400">Cliente Asociado:</span>
              <span className="font-semibold text-slate-200">{licenciaParaEditar.nombreEmpresa}</span>
            </div>
          )}

          {/* Tipo de Licencia (solo en creación) */}
          {!esEdicion && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Tipo de Licencia *</span>
              </label>
              <select
                value={tipoLicencia}
                onChange={(e) => setTipoLicencia(e.target.value as TipoLicencia)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:border-indigo-500 focus:outline-none capitalize"
              >
                <option value="mensual">Mensual (30 días)</option>
                <option value="trimestral">Trimestral (90 días)</option>
                <option value="semestral">Semestral (180 días)</option>
                <option value="anual">Anual (365 días)</option>
                <option value="permanente">Permanente (Vitalicia)</option>
                <option value="prueba">Prueba / Demo (14 días)</option>
                <option value="personalizada">Personalizada (Especificar Días)</option>
              </select>
            </div>
          )}

          {/* Días Personalizados si elige 'personalizada' */}
          {!esEdicion && tipoLicencia === 'personalizada' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Duración Personalizada en Días</label>
              <input
                type="number"
                min="1"
                max="3650"
                value={duracionDiasPersonalizada}
                onChange={(e) => setDuracionDiasPersonalizada(parseInt(e.target.value) || 30)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          )}

          {/* Versiones Mínima y Máxima Permitidas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Versión Mínima *</label>
              <input
                type="text"
                value={versionMinima}
                onChange={(e) => setVersionMinima(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
                placeholder="1.0.0"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Versión Máxima *</label>
              <input
                type="text"
                value={versionMaxima}
                onChange={(e) => setVersionMaxima(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
                placeholder="9.9.9"
                required
              />
            </div>
          </div>

          {/* Cantidad de Instalaciones Permitiadas */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                <span>Instalaciones Simultáneas Permitidas *</span>
              </span>
              <span className="text-[10px] text-slate-500">
                {esEdicion ? `Mínimo: ${licenciaParaEditar?.cantidadInstalacionesUsadas || 0} utilizadas` : 'Límite de nodos instalados'}
              </span>
            </label>
            <input
              type="number"
              min={esEdicion ? (licenciaParaEditar?.cantidadInstalacionesUsadas || 1) : 1}
              max="999"
              value={cantidadInstalacionesPermitidas}
              onChange={(e) => setCantidadInstalacionesPermitidas(parseInt(e.target.value) || 1)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          {/* Observaciones */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Observaciones / Notas Internas</span>
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:border-indigo-500 focus:outline-none resize-none"
              placeholder="Detalles sobre el contrato, acuerdo de nivel de servicio u observaciones..."
            />
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
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
              disabled={cargando}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {cargando && <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>}
              <span>{esEdicion ? 'Guardar Cambios' : 'Emitir Licencia'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
