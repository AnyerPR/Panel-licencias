import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LoginForm } from './LoginForm';
import { Shield } from 'lucide-react';

/**
 * Guard para proteger rutas y garantizar autenticación activa de administrador
 */
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, adminProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="p-3 bg-indigo-600/20 rounded-2xl border border-indigo-500/30 text-indigo-400 animate-pulse">
            <Shield className="w-8 h-8" />
          </div>
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-medium">Verificando sesión con Firebase Auth...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado o no posee perfil activo de admin
  if (!user || !adminProfile) {
    return <LoginForm />;
  }

  return <>{children}</>;
};
