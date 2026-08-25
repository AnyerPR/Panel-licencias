import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Header } from './components/layout/Header';
import { Sidebar, SeccionNavegacion } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { ClientList } from './components/clientes/ClientList';
import { LicenseList } from './components/licencias/LicenseList';
import { InstallationList } from './components/instalaciones/InstallationList';
import { ApiPlayground } from './components/api/ApiPlayground';
import { SdkExplorer } from './components/sdk/SdkExplorer';
import { LicenseInfoView } from './components/inventario/LicenseInfoView';

function MainLayout() {
  const [seccionActiva, setSeccionActiva] = useState<SeccionNavegacion>('dashboard');
  const { user, adminProfile } = useAuth();

  const userUid = user?.uid || adminProfile?.uid || 'super_admin';
  const userCorreo = adminProfile?.correo || user?.email || 'admin@sistema.com';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Header />
        
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <Sidebar
            seccionActiva={seccionActiva}
            onCambiarSeccion={setSeccionActiva}
          />
          <main className="flex-1 w-full min-w-0">
            {seccionActiva === 'dashboard' && <DashboardView />}
            {seccionActiva === 'clientes' && <ClientList />}
            {seccionActiva === 'licencias' && (
              <LicenseList userUid={userUid} userCorreo={userCorreo} />
            )}
            {seccionActiva === 'instalaciones' && <InstallationList />}
            {seccionActiva === 'api' && <ApiPlayground />}
            {seccionActiva === 'versiones' && <SdkExplorer />}
            {seccionActiva === 'auditoria' && <LicenseInfoView />}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    </AuthProvider>
  );
}
