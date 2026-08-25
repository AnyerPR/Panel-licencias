import React, { useState, useEffect } from 'react';
import { X, Building2, Mail, Phone, MapPin, User, FileText, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import { Cliente } from '../../types';
import { clientService } from '../../services/clientService';
import { useAuth } from '../../context/AuthContext';

interface ClientFormModalProps {
  isOpen: boolean;
  clienteEditar?: Cliente | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({
  isOpen,
  clienteEditar,
  onClose,
  onSuccess
}) => {
  const { adminProfile } = useAuth();

  const esEdicion = !!clienteEditar;

  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [nombreComercial, setNombreComercial] = useState('');
  const [rnc, setRnc] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [pais, setPais] = useState('República Dominicana');
  const [personaContacto, setPersonaContacto] = useState('');
  const [plan, setPlan] = useState<'mensual' | 'anual' | 'vitalicio' | 'demo'>('anual');
  const [tipo, setTipo] = useState<'hospital' | 'farmacia' | 'clinica' | 'otro'>('farmacia');
  const [firebaseProjectId, setFirebaseProjectId] = useState('');
  const [dominio, setDominio] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clienteEditar) {
      setNombreEmpresa(clienteEditar.nombreEmpresa || '');
      setNombreComercial(clienteEditar.nombreComercial || '');
      setRnc(clienteEditar.rnc || '');
      setCorreo(clienteEditar.correo || '');
      setTelefono(clienteEditar.telefono || '');
      setDireccion(clienteEditar.direccion || '');
      setCiudad(clienteEditar.ciudad || '');
      setPais(clienteEditar.pais || 'República Dominicana');
      setPersonaContacto(clienteEditar.personaContacto || '');
      setPlan(clienteEditar.plan || 'anual');
      setTipo(clienteEditar.tipo || 'farmacia');
      setFirebaseProjectId(clienteEditar.firebaseProjectId || '');
      setDominio(clienteEditar.dominio || '');
      setObservaciones(clienteEditar.observaciones || '');
    } else {
      // Reset campos para creación
      setNombreEmpresa('');
      setNombreComercial('');
      setRnc('');
      setCorreo('');
      setTelefono('');
      setDireccion('');
      setCiudad('');
      setPais('República Dominicana');
      setPersonaContacto('');
      setPlan('anual');
      setTipo('farmacia');
      setFirebaseProjectId('');
      setDominio('');
      setObservaciones('');
    }
    setError(null);
  }, [clienteEditar, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile) return;

    setError(null);
    setCargando(true);

    try {
      if (esEdicion && clienteEditar?.id) {
        await clientService.actualizarCliente(
          clienteEditar.id,
          {
            nombreEmpresa,
            nombreComercial,
            rnc,
            correo,
            telefono,
            direccion,
            ciudad,
            pais,
            personaContacto,
            plan,
            tipo,
            firebaseProjectId,
            dominio,
            observaciones
          },
          adminProfile.uid,
          adminProfile.correo
        );
      } else {
        await clientService.crearCliente(
          {
            nombreEmpresa,
            nombreComercial,
            rnc,
            correo,
            telefono,
            direccion,
            ciudad,
            pais,
            personaContacto,
            plan,
            tipo,
            firebaseProjectId,
            dominio,
            observaciones
          },
          adminProfile.uid,
          adminProfile.correo
        );
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error al guardar cliente:', err);
      setError(err.message || 'Error inesperado al guardar los datos del cliente.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl my-8 overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Cabecera del Formulario */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {esEdicion ? 'Editar Registro de Cliente' : 'Registrar Nuevo Cliente'}
              </h3>
              <p className="text-xs text-slate-400">
                {esEdicion
                  ? `Modificando datos de ${clienteEditar?.nombreEmpresa}`
                  : 'El sistema generará automáticamente un UUID permanente inmutable'}
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

        {/* Cuerpo del Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Información del UUID (Si es Edición) */}
          {esEdicion && clienteEditar && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">UUID Inmutable:</span>
              <span className="font-mono text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {clienteEditar.uuidCliente}
              </span>
            </div>
          )}

          {/* Sección 1: Datos Principales de la Empresa */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>Identificación Comercial</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nombre de la Empresa / Razon Social *
                </label>
                <input
                  type="text"
                  required
                  value={nombreEmpresa}
                  onChange={(e) => setNombreEmpresa(e.target.value)}
                  placeholder="Ej. Farmacias del Este S.R.L."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nombre Comercial *
                </label>
                <input
                  type="text"
                  required
                  value={nombreComercial}
                  onChange={(e) => setNombreComercial(e.target.value)}
                  placeholder="Ej. Farmacia San Rafael"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  RNC / Registro Fiscal *
                </label>
                <input
                  type="text"
                  required
                  value={rnc}
                  onChange={(e) => setRnc(e.target.value)}
                  placeholder="Ej. 131-09876-2"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tipo de Institución *
                </label>
                <select
                  value={tipo}
                  onChange={(e: any) => setTipo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                >
                  <option value="farmacia">Farmacia</option>
                  <option value="hospital">Hospital / Centro Médico</option>
                  <option value="clinica">Clínica / Consultorio</option>
                  <option value="otro">Distribuidora / Otro</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sección 2: Contacto y Ubicación */}
          <div className="space-y-4 pt-2 border-t border-slate-800/80">
            <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" />
              <span>Ubicación y Contacto Directo</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Persona de Contacto *
                </label>
                <input
                  type="text"
                  required
                  value={personaContacto}
                  onChange={(e) => setPersonaContacto(e.target.value)}
                  placeholder="Ej. Lic. Carlos Mendoza"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="contacto@farmaciasanrafael.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Teléfono de Contacto *
                </label>
                <input
                  type="text"
                  required
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej. (809) 555-0199"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Ciudad *
                </label>
                <input
                  type="text"
                  required
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  placeholder="Ej. Santo Domingo"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  País *
                </label>
                <input
                  type="text"
                  required
                  value={pais}
                  onChange={(e) => setPais(e.target.value)}
                  placeholder="Ej. República Dominicana"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Plan Contratado *
                </label>
                <select
                  value={plan}
                  onChange={(e: any) => setPlan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors capitalize"
                >
                  <option value="anual">Plan Anual</option>
                  <option value="mensual">Plan Mensual</option>
                  <option value="vitalicio">Plan Vitalicio</option>
                  <option value="demo">Demostración / Prueba</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Dirección Física Completa *
                </label>
                <input
                  type="text"
                  required
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Ej. Av. 27 de Febrero No. 45, Ensanche Naco"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Sección 3: Datos Técnicos y Observaciones */}
          <div className="space-y-4 pt-2 border-t border-slate-800/80">
            <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              <span>Infraestructura & Notas Internas</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Project ID Firebase (Opcional)
                </label>
                <input
                  type="text"
                  value={firebaseProjectId}
                  onChange={(e) => setFirebaseProjectId(e.target.value)}
                  placeholder="Ej. farmacia-sanrafael-prod"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Dominio Personalizado (Opcional)
                </label>
                <input
                  type="text"
                  value={dominio}
                  onChange={(e) => setDominio(e.target.value)}
                  placeholder="Ej. sistema.farmaciasanrafael.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Observaciones / Notas Internas
                </label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Notas adicionales sobre el contrato, acuerdo especial o representante empresarial..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Botones de Pie de Modal */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
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
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-medium rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {cargando && <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>}
              <span>{esEdicion ? 'Guardar Cambios' : 'Crear Cliente'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
