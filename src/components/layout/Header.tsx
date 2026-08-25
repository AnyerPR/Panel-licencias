import React from 'react';
import { Shield, LogOut, UserCheck, Cpu, Database } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Encabezado principal del Panel Maestro con información del administrador autenticado y botón de cierre de sesión.
 */
export const Header: React.FC = () => {
  const { adminProfile, logout } = useAuth();

  return (
    <header className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/20 rounded-xl border border-indigo-500/30 text-indigo-400">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Panel Maestro de Licencias</h1>
            <p className="text-sm text-slate-400">Arquitectura Empresarial para Gestión de Clientes, Licencias e Instalaciones</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Badge de seguridad */}
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Cloud Functions Isolated
        </span>

        {/* Perfil del Administrador */}
        {adminProfile && (
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl">
            <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-slate-200">{adminProfile.nombre}</p>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="capitalize text-indigo-400 font-medium">{adminProfile.rol}</span>
                <span>•</span>
                <span className="truncate max-w-[120px]">{adminProfile.correo}</span>
              </div>
            </div>
          </div>
        )}

        {/* Botón de Cerrar Sesión */}
        <button
          onClick={() => logout()}
          title="Cerrar sesión"
          className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 rounded-xl transition-all"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
