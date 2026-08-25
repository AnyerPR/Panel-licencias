import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  Plus,
  Filter,
  RefreshCw,
  Eye,
  Edit3,
  PauseCircle,
  PlayCircle,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Key,
  Mail,
  Phone,
  HardDrive,
  Users,
  ShieldAlert,
  Layers
} from 'lucide-react';
import { Cliente, EstadoCliente } from '../../types';
import { clientService } from '../../services/clientService';
import { useAuth } from '../../context/AuthContext';
import { ClientFormModal } from './ClientFormModal';
import { ClientDetailModal } from './ClientDetailModal';
import { ConfirmActionModal } from './ConfirmActionModal';

export const ClientList: React.FC = () => {
  const { adminProfile } = useAuth();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Filtros de búsqueda y estado
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  // Modales
  const [modalFormAbierto, setModalFormAbierto] = useState(false);
  const [clienteAEditar, setClienteAEditar] = useState<Cliente | null>(null);

  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [clienteVerDetalle, setClienteVerDetalle] = useState<Cliente | null>(null);

  const [modalConfirmTipo, setModalConfirmTipo] = useState<'suspender' | 'reactivar' | 'eliminar' | null>(null);
  const [clienteAccion, setClienteAccion] = useState<Cliente | null>(null);
  const [ejecutandoAccion, setEjecutandoAccion] = useState(false);

  // Cargar lista de clientes
  const cargarClientes = async () => {
    setCargando(true);
    setError(null);
    try {
      const lista = await clientService.obtenerClientes();
      setClientes(lista);
    } catch (err: any) {
      console.error('Error cargando clientes:', err);
      setError(err.message || 'Ocurrió un error al cargar la lista de clientes.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const mostrarMensajeTemporal = (msg: string) => {
    setMensajeExito(msg);
    setTimeout(() => {
      setMensajeExito(null);
    }, 4000);
  };

  // Filtrado en tiempo real
  const clientesFiltrados = clientes.filter(cliente => {
    const texto = busqueda.toLowerCase().trim();
    const coincideTexto =
      !texto ||
      cliente.nombreEmpresa.toLowerCase().includes(texto) ||
      cliente.nombreComercial.toLowerCase().includes(texto) ||
      cliente.rnc.toLowerCase().includes(texto) ||
      cliente.correo.toLowerCase().includes(texto) ||
      cliente.uuidCliente.toLowerCase().includes(texto) ||
      cliente.personaContacto.toLowerCase().includes(texto);

    const coincideEstado =
      filtroEstado === 'todos' || cliente.estado === filtroEstado;

    return coincideTexto && coincideEstado;
  });

  // Manejo de Confirmación de Acciones
  const abrirConfirmacion = (tipo: 'suspender' | 'reactivar' | 'eliminar', cliente: Cliente) => {
    setClienteAccion(cliente);
    setModalConfirmTipo(tipo);
  };

  const ejecutarAccionConfirmada = async () => {
    if (!clienteAccion || !modalConfirmTipo || !adminProfile || !clienteAccion.id) return;

    setEjecutandoAccion(true);
    setError(null);

    try {
      if (modalConfirmTipo === 'suspender') {
        await clientService.cambiarEstadoCliente(
          clienteAccion.id,
          'suspendido',
          clienteAccion.nombreEmpresa,
          adminProfile.uid,
          adminProfile.correo
        );
        mostrarMensajeTemporal(`El cliente "${clienteAccion.nombreEmpresa}" fue suspendido exitosamente.`);
      } else if (modalConfirmTipo === 'reactivar') {
        await clientService.cambiarEstadoCliente(
          clienteAccion.id,
          'activo',
          clienteAccion.nombreEmpresa,
          adminProfile.uid,
          adminProfile.correo
        );
        mostrarMensajeTemporal(`El cliente "${clienteAccion.nombreEmpresa}" fue reactivado exitosamente.`);
      } else if (modalConfirmTipo === 'eliminar') {
        await clientService.eliminarCliente(
          clienteAccion.id,
          clienteAccion.uuidCliente,
          clienteAccion.nombreEmpresa,
          clienteAccion.cantidadLicencias,
          adminProfile.uid,
          adminProfile.correo
        );
        mostrarMensajeTemporal(`El cliente "${clienteAccion.nombreEmpresa}" fue eliminado permanentemente.`);
      }

      setModalConfirmTipo(null);
      setClienteAccion(null);
      await cargarClientes();
    } catch (err: any) {
      console.error('Error al ejecutar acción:', err);
      setError(err.message || 'Ocurrió un error al ejecutar la acción sobre el cliente.');
    } finally {
      setEjecutandoAccion(false);
    }
  };

  // Badge de Estado
  const renderBadgeEstado = (estado: EstadoCliente) => {
    const estilos = {
      activo: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      suspendido: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      cancelado: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      vencido: 'bg-red-500/10 text-red-400 border-red-500/30',
      mantenimiento: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
    }[estado] || 'bg-slate-800 text-slate-300 border-slate-700';

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border capitalize inline-flex items-center gap-1 ${estilos}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
        <span>{estado}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Encabezado del Módulo y Acciones */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Gestión de Clientes</h1>
              <p className="text-xs text-slate-400">
                Administre clientes, UUIDs inmutables, estados de servicio y registros en Firestore
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={cargarClientes}
            disabled={cargando}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors disabled:opacity-50"
            title="Recargar datos"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              setClienteAEditar(null);
              setModalFormAbierto(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Alertas de Éxito / Error */}
      {mensajeExito && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{mensajeExito}</span>
          </div>
          <button onClick={() => setMensajeExito(null)} className="text-emerald-400 hover:text-emerald-200">
            &times;
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">
            &times;
          </button>
        </div>
      )}

      {/* Barra de Búsqueda y Filtros */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Input de Búsqueda en Tiempo Real */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por Empresa, RNC, Correo o UUID..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
            >
              &times;
            </button>
          )}
        </div>

        {/* Selector de Filtro por Estado */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-400">Estado:</span>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors capitalize"
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="suspendido">Suspendidos</option>
            <option value="cancelado">Cancelados</option>
            <option value="vencido">Vencidos</option>
          </select>
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        
        {cargando ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400">Cargando catálogo de clientes desde Firestore...</p>
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-800 text-slate-500 rounded-2xl flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">No se encontraron clientes</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {busqueda || filtroEstado !== 'todos'
                ? 'Intente modificar los términos de búsqueda o los filtros seleccionados.'
                : 'Aún no existen clientes registrados en el sistema. Haga clic en "Nuevo Cliente" para agregar el primero.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Empresa / RNC</th>
                  <th className="py-3.5 px-4">UUID Inmutable</th>
                  <th className="py-3.5 px-4">Contacto & Correo</th>
                  <th className="py-3.5 px-4">Plan / Tipo</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-center">Licencias / Nodos</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {clientesFiltrados.map(cliente => (
                  <tr
                    key={cliente.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Empresa y RNC */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                        {cliente.nombreEmpresa}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{cliente.nombreComercial}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-400 font-medium">RNC: {cliente.rnc}</span>
                      </div>
                    </td>

                    {/* UUID permanente */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 text-[11px] font-semibold">
                        {cliente.uuidCliente}
                      </span>
                    </td>

                    {/* Contacto & Correo */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 font-medium">{cliente.personaContacto}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate max-w-[160px]">{cliente.correo}</span>
                      </div>
                    </td>

                    {/* Plan y Tipo */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-300 capitalize">{cliente.plan}</span>
                      <div className="text-[11px] text-slate-500 capitalize">{cliente.tipo || 'Hospital / Centro'}</div>
                    </td>

                    {/* Estado */}
                    <td className="py-3.5 px-4">
                      {renderBadgeEstado(cliente.estado)}
                    </td>

                    {/* Cantidad Licencias e Instalaciones */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-2 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800 text-[11px]">
                        <span className="text-indigo-400 font-bold" title="Licencias emitidas">
                          {cliente.cantidadLicencias} lic.
                        </span>
                        <span className="text-slate-600">|</span>
                        <span className="text-emerald-400 font-bold" title="Instalaciones activas">
                          {cliente.cantidadInstalaciones} inst.
                        </span>
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Ver Detalle */}
                        <button
                          onClick={() => {
                            setClienteVerDetalle(cliente);
                            setModalDetalleAbierto(true);
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-indigo-600/20 hover:text-indigo-300 text-slate-400 rounded-lg transition-colors"
                          title="Ver Detalle Completo"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Editar */}
                        <button
                          onClick={() => {
                            setClienteAEditar(cliente);
                            setModalFormAbierto(true);
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                          title="Editar Cliente"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Suspender o Reactivar */}
                        {cliente.estado === 'activo' ? (
                          <button
                            onClick={() => abrirConfirmacion('suspender', cliente)}
                            className="p-1.5 bg-slate-800 hover:bg-amber-500/20 hover:text-amber-400 text-slate-400 rounded-lg transition-colors"
                            title="Suspender Cliente"
                          >
                            <PauseCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => abrirConfirmacion('reactivar', cliente)}
                            className="p-1.5 bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-400 rounded-lg transition-colors"
                            title="Reactivar Cliente"
                          >
                            <PlayCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Eliminar */}
                        <button
                          onClick={() => abrirConfirmacion('eliminar', cliente)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 rounded-lg transition-colors"
                          title="Eliminar Cliente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pie con Contador de Registros */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Mostrando {clientesFiltrados.length} de {clientes.length} clientes registrados</span>
          <span className="text-[11px] text-slate-500">Conectado a Firestore Real</span>
        </div>

      </div>

      {/* Modal Formulario (Crear / Editar) */}
      <ClientFormModal
        isOpen={modalFormAbierto}
        clienteEditar={clienteAEditar}
        onClose={() => setModalFormAbierto(false)}
        onSuccess={() => {
          cargarClientes();
          mostrarMensajeTemporal(
            clienteAEditar
              ? 'Cliente actualizado con éxito.'
              : 'Nuevo cliente registrado correctamente.'
          );
        }}
      />

      {/* Modal Detalle Completo */}
      <ClientDetailModal
        isOpen={modalDetalleAbierto}
        cliente={clienteVerDetalle}
        onClose={() => setModalDetalleAbierto(false)}
        onEditar={(c) => {
          setClienteAEditar(c);
          setModalFormAbierto(true);
        }}
        onSuspender={(c) => abrirConfirmacion('suspender', c)}
        onReactivar={(c) => abrirConfirmacion('reactivar', c)}
        onEliminar={(c) => abrirConfirmacion('eliminar', c)}
      />

      {/* Modal Confirmación de Acciones (Suspender, Reactivar, Eliminar) */}
      {modalConfirmTipo && clienteAccion && (
        <ConfirmActionModal
          isOpen={true}
          tipo={modalConfirmTipo}
          nombreEmpresa={clienteAccion.nombreEmpresa}
          cargando={ejecutandoAccion}
          onConfirm={ejecutarAccionConfirmada}
          onClose={() => setModalConfirmTipo(null)}
        />
      )}

    </div>
  );
};
