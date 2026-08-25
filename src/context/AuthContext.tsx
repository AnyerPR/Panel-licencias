import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { authService } from '../services/authService';
import { AdminUser } from '../types';

interface AuthContextType {
  user: User | null;
  adminProfile: AdminUser | null;
  loading: boolean;
  existenAdmins: boolean;
  login: (correo: string, pass: string) => Promise<AdminUser>;
  loginConGoogle: () => Promise<AdminUser>;
  logout: () => Promise<void>;
  registrarPrimerAdmin: (nombre: string, correo: string, pass: string) => Promise<AdminUser>;
  recargarEstadoAdmins: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [existenAdmins, setExistenAdmins] = useState<boolean>(true);

  const recargarEstadoAdmins = async () => {
    try {
      const existen = await authService.existenAdmins();
      setExistenAdmins(existen);
    } catch (e) {
      setExistenAdmins(false);
    }
  };

  useEffect(() => {
    // Comprobar si existen admins registrados al iniciar
    recargarEstadoAdmins();

    // Escuchar el estado de autenticación en Firebase Auth
    const unsubscribe = authService.observarEstadoAuth(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        let perfil = await authService.obtenerPerfilAdmin(firebaseUser.uid);
        
        // Auto-inicializar si no existe perfil de admin
        if (!perfil) {
          const existen = await authService.existenAdmins();
          if (!existen || firebaseUser.email?.toLowerCase() === 'anyerperezrodrigues@gmail.com') {
            try {
              perfil = await authService.autoInicializarAdmin(firebaseUser);
              setExistenAdmins(true);
            } catch (err) {
              console.error('Error auto-inicializando perfil de admin:', err);
            }
          }
        }

        if (perfil && perfil.activo) {
          setAdminProfile(perfil);
        } else {
          setAdminProfile(null);
        }
      } else {
        setAdminProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (correo: string, pass: string) => {
    setLoading(true);
    try {
      const perfil = await authService.login(correo, pass);
      setAdminProfile(perfil);
      setExistenAdmins(true);
      return perfil;
    } finally {
      setLoading(false);
    }
  };

  const loginConGoogle = async () => {
    setLoading(true);
    try {
      const perfil = await authService.loginConGoogle();
      setAdminProfile(perfil);
      setExistenAdmins(true);
      return perfil;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (adminProfile) {
        await authService.logout(adminProfile.uid, adminProfile.correo);
      } else {
        await authService.logout();
      }
      setUser(null);
      setAdminProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const registrarPrimerAdmin = async (nombre: string, correo: string, pass: string) => {
    setLoading(true);
    try {
      const perfil = await authService.registrarPrimerAdmin(nombre, correo, pass);
      setAdminProfile(perfil);
      setExistenAdmins(true);
      return perfil;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        adminProfile,
        loading,
        existenAdmins,
        login,
        loginConGoogle,
        logout,
        registrarPrimerAdmin,
        recargarEstadoAdmins
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
