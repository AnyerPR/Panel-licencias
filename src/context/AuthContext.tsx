import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { AdminUser } from '../types';

interface AuthContextType {
  user: AdminUser | null;
  adminProfile: AdminUser | null;
  loading: boolean;
  existenAdmins: boolean;
  login: (correo: string, pass: string) => Promise<AdminUser>;
  loginAccesoRapido: (nombre?: string, correo?: string) => Promise<AdminUser>;
  logout: () => Promise<void>;
  registrarPrimerAdmin: (nombre: string, correo: string, pass: string) => Promise<AdminUser>;
  recargarEstadoAdmins: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

    // Escuchar el estado de autenticación autónomo
    const unsubscribe = authService.observarEstadoAuth((admin) => {
      setAdminProfile(admin);
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

  const loginAccesoRapido = async (nombre?: string, correo?: string) => {
    setLoading(true);
    try {
      const perfil = await authService.loginAccesoRapidoAdmin(nombre, correo);
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
        user: adminProfile,
        adminProfile,
        loading,
        existenAdmins,
        login,
        loginAccesoRapido,
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
