import React from 'react';
import {
  LayoutDashboard,
  Users,
  Key,
  HardDrive,
  Layers,
  History,
  Shield,
  ShieldCheck,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type SeccionNavegacion = 'dashboard' | 'clientes' | 'licencias' | 'instalaciones' | 'api' | 'versiones' | 'auditoria';

interface SidebarProps {
  seccionActiva: SeccionNavegacion;
  onCambiarSeccion: (seccion: SeccionNavegacion) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ seccionActiva, onCambiarSeccion }) => {
  const { adminProfile, logout } = useAuth();

  const menuItems: Array<{
    id: SeccionNavegacion;
    label: string;
    icon: React.ElementType;
    habilitado: boolean;
    badge?: string;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, habilitado: true },
    { id: 'clientes', label: 'Clientes', icon: Users, habilitado: true },
    { id: 'licencias', label: 'Licencias', icon: Key, habilitado: true },
    { id: 'instalaciones', label: 'Instalaciones ID', icon: HardDrive, habilitado: true },
    { id: 'api', label: 'API & Validaciones', icon: Shield, habilitado: true },
    { id: 'versiones', label: 'SDK Oficial', icon: Layers, habilitado: true },
    { id: 'auditoria', label: 'Licencia Inventario', icon: ShieldCheck, habilitado: true }
  ];

  return (
    <aside className="w-full lg:w-64 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shrink-0 shadow-xl">
      <div className="space-y-6">
        
        {/* Iso & Branding del Panel Maestro */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight leading-tight">Panel Maestro</h2>
            <p className="text-[11px] text-slate-400">Licencias & Inventario</p>
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-slate-800/80"></div>

        {/* Menú Principal de Secciones */}
        <nav className="space-y-1.5">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Navegación Principal
          </p>
          
          {menuItems.map(item => {
            const Icono = item.icon;
            const esActivo = seccionActiva === item.id;

            return (
              <button
                key={item.id}
                onClick={() => item.habilitado && onCambiarSeccion(item.id)}
                disabled={!item.habilitado}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  esActivo
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : item.habilitado
                    ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                    : 'text-slate-600 cursor-not-allowed opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icono className={`w-4 h-4 ${esActivo ? 'text-white' : item.habilitado ? 'text-slate-400' : 'text-slate-600'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950 text-slate-500 border border-slate-800">
                    {item.badge}
                  </span>
                ) : esActivo ? (
                  <ChevronRight className="w-4 h-4 text-white/80" />
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Perfil del Administrador & Cerrar Sesión */}
      <div className="pt-6 mt-6 border-t border-slate-800/80 space-y-3">
        {adminProfile && (
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
            <p className="text-xs font-bold text-slate-200 truncate">{adminProfile.nombre}</p>
            <p className="text-[11px] text-slate-400 truncate">{adminProfile.correo}</p>
            <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 uppercase">
              {adminProfile.rol}
            </span>
          </div>
        )}

        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-950 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 rounded-xl text-xs font-semibold transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>

    </aside>
  );
};
