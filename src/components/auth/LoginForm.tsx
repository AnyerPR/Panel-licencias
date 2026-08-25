import React, { useState, useEffect } from 'react';
import { Shield, Key, Mail, User, Lock, AlertCircle, UserPlus, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Formulario de Inicio de Sesión y Registro del Primer Administrador
 */
export const LoginForm: React.FC = () => {
  const { login, loginConGoogle, registrarPrimerAdmin, existenAdmins } = useAuth();

  // Estados de formulario
  const [modoRegistroInicial, setModoRegistroInicial] = useState<boolean>(!existenAdmins);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);

  // Estados de feedback
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoGoogle, setCargandoGoogle] = useState(false);

  // Sincronizar el modo cuando cambie existenAdmins
  useEffect(() => {
    if (!existenAdmins) {
      setModoRegistroInicial(true);
    }
  }, [existenAdmins]);

  const handleGoogleLogin = async () => {
    setError(null);
    setCargandoGoogle(true);
    try {
      await loginConGoogle();
    } catch (err: any) {
      console.error('Error con Google Sign-In:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Ventana de acceso cerrada antes de completar el inicio de sesión.');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('No se pudo autenticar con Google. Intente nuevamente.');
      }
    } finally {
      setCargandoGoogle(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      if (modoRegistroInicial) {
        if (!nombre.trim()) {
          throw new Error('Ingrese el nombre completo del administrador');
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
      let mensaje = 'Error al procesar la solicitud.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        mensaje = 'Correo electrónico o contraseña incorrectos.';
      } else if (err.code === 'auth/email-already-in-use') {
        mensaje = 'Este correo ya se encuentra registrado en el sistema.';
      } else if (err.code === 'auth/weak-password') {
        mensaje = 'La contraseña debe tener al menos 6 caracteres.';
      } else if (err.code === 'auth/invalid-email') {
        mensaje = 'El formato del correo electrónico no es válido.';
      } else if (err.message) {
        mensaje = err.message;
      }
      setError(mensaje);
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
              : 'Acceso exclusivo para administradores del sistema'}
          </p>
        </div>

        {/* Tarjeta del Formulario */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-5">
          
          {/* Mensaje de Inicialización si no hay administradores */}
          {!existenAdmins && (
            <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-300 text-xs flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
              <span>
                <strong>Bienvenido:</strong> Inicie sesión con su cuenta de Google o cree su cuenta de Super Administrador para configurar el acceso inicial al panel.
              </span>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Botón de Acceso Rápido con Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={cargando || cargandoGoogle}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-750 text-white font-medium text-sm rounded-xl border border-slate-700 shadow-sm flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cargandoGoogle ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.38-2.27V6.58H1.25A11.97 11.97 0 0 0 0 12c0 1.92.45 3.74 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continuar con Google</span>
              </>
            )}
          </button>

          {/* Divisor */}
          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-slate-800 w-full"></div>
            <span className="bg-slate-900 px-3 text-xs text-slate-500 uppercase tracking-wider">o con credenciales</span>
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
                    placeholder="Ej. Ing. Administrador Principal"
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
                  placeholder="admin@panellicencias.com"
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
              disabled={cargando || cargandoGoogle}
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
          <p className="mt-1">Sistema de Gestión de Inventario Médico y Farmacéutico</p>
        </div>

      </div>
    </div>
  );
};
