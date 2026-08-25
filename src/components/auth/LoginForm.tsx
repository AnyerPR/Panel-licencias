import React, { useState, useEffect } from 'react';
import { Shield, Key, Mail, User, Lock, AlertCircle, UserPlus, Eye, EyeOff, Sparkles, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Formulario de Inicio de Sesión Autónomo y Libre de Costos
 * No utiliza Firebase Authentication externa.
 */
export const LoginForm: React.FC = () => {
  const { login, loginAccesoRapido, registrarPrimerAdmin, existenAdmins } = useAuth();

  // Estados de formulario
  const [modoRegistroInicial, setModoRegistroInicial] = useState<boolean>(!existenAdmins);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);

  // Estados de feedback
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoRapido, setCargandoRapido] = useState(false);

  // Sincronizar el modo cuando cambie existenAdmins
  useEffect(() => {
    if (!existenAdmins) {
      setModoRegistroInicial(true);
    }
  }, [existenAdmins]);

  const handleAccesoRapido = async () => {
    setError(null);
    setCargandoRapido(true);
    try {
      await loginAccesoRapido('Super Administrador', 'admin@panelmaestro.com');
    } catch (err: any) {
      console.error('Error en acceso rápido:', err);
      setError(err.message || 'No se pudo iniciar sesión en modo rápido.');
    } finally {
      setCargandoRapido(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      if (modoRegistroInicial) {
        if (!nombre.trim()) {
          throw new Error('Por favor, ingrese el nombre completo del administrador');
        }
        if (password.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres');
        }
        await registrarPrimerAdmin(nombre, email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      console.error('Error en autenticación:', err);
      setError(err.message || 'Error al procesar la solicitud de acceso.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Encabezado */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-indigo-600/20 rounded-2xl border border-indigo-500/30 text-indigo-400 mb-1">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Panel Maestro de Licencias</h1>
          <p className="text-sm text-slate-400">
            {modoRegistroInicial 
              ? 'Configuración inicial: Registrar el Primer Administrador' 
              : 'Acceso seguro al panel de administración'}
          </p>
        </div>

        {/* Tarjeta del Formulario */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-5">
          
          {/* Mensaje de Inicialización si no hay administradores */}
          {!existenAdmins && (
            <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-300 text-xs flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
              <span>
                <strong>Modo Inicial:</strong> Cree su cuenta de Super Administrador para configurar el acceso al panel.
              </span>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Botón de Acceso Rápido Local / Maestro */}
          <button
            type="button"
            onClick={handleAccesoRapido}
            disabled={cargando || cargandoRapido}
            className="w-full py-2.5 px-4 bg-emerald-600/20 hover:bg-emerald-600/30 active:bg-emerald-600/40 text-emerald-300 font-medium text-sm rounded-xl border border-emerald-500/30 shadow-sm flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cargandoRapido ? (
              <div className="w-5 h-5 border-2 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin"></div>
            ) : (
              <>
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Acceso Rápido Super Administrador</span>
              </>
            )}
          </button>

          {/* Divisor */}
          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-slate-800 w-full"></div>
            <span className="bg-slate-900 px-3 text-xs text-slate-500 uppercase tracking-wider">o ingresar credenciales</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {modoRegistroInicial && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Administrador Principal"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@panelmaestro.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando || cargandoRapido}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {cargando ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : modoRegistroInicial ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Crear Super Administrador</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>
          </form>

          {/* Opción para alternar entre Login y Configuración Inicial */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setModoRegistroInicial(!modoRegistroInicial);
                setError(null);
              }}
              className="text-xs text-slate-500 hover:text-indigo-400 transition-colors"
            >
              {modoRegistroInicial 
                ? '¿Ya tienes cuenta registrada? Iniciar Sesión' 
                : '¿Configurar nuevo Administrador? Cambiar a modo registro'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-600">
          <p>Panel Maestro de Licencias &copy; 2026</p>
          <p className="mt-1">Autenticación Autónoma Local y en la Nube</p>
        </div>

      </div>
    </div>
  );
};
