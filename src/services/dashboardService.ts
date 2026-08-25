import {
  collection,
  getDocs,
  query,
  orderBy,
  limit as firestoreLimit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { DashboardStats, LogAuditoria } from '../types';

export const dashboardService = {
  /**
   * Obtiene estadísticas globales consolidadas calculadas directamente desde Firestore
   */
  async obtenerEstadisticas(): Promise<DashboardStats> {
    try {
      // 1. Intentar API si existe
      try {
        const response = await fetch('/api/v1/dashboard/stats', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          const resData = await response.json();
          if (resData.exito && resData.data) {
            return resData.data as DashboardStats;
          }
        }
      } catch {
        // Fallback a cálculo directo
      }

      // 2. Conexión Directa a Firestore
      const [clientesSnap, licenciasSnap, instSnap] = await Promise.all([
        getDocs(collection(db, 'clientes')),
        getDocs(collection(db, 'licencias')),
        getDocs(collection(db, 'instalaciones')).catch(() => ({ docs: [], size: 0 })),
      ]);

      const clientes = clientesSnap.docs.map((d) => d.data());
      const licencias = licenciasSnap.docs.map((d) => d.data());

      let clientesActivos = 0;
      let clientesSuspendidos = 0;
      let clientesVencidos = 0;
      let clientesProximosVencer = 0;

      const ahora = new Date();

      clientes.forEach((c) => {
        if (c.estado === 'inactivo' || c.estado === 'suspendido') {
          clientesSuspendidos++;
        } else {
          clientesActivos++;
        }
      });

      licencias.forEach((l) => {
        if (l.fechaExpiracion) {
          const exp = new Date(l.fechaExpiracion);
          const diffMs = exp.getTime() - ahora.getTime();
          const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          if (dias <= 0 && l.tipoLicencia !== 'permanente') {
            clientesVencidos++;
          } else if (dias <= 15 && l.tipoLicencia !== 'permanente') {
            clientesProximosVencer++;
          }
        }
      });

      return {
        clientesTotales: clientesSnap.size,
        clientesActivos,
        clientesSuspendidos,
        clientesVencidos,
        clientesProximosVencer,
        instalacionesTotales: instSnap.docs ? instSnap.docs.length : 0,
        licenciasTotales: licenciasSnap.size,
        versionesRegistradas: 4,
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas del Dashboard:', error);
      return {
        clientesTotales: 0,
        clientesActivos: 0,
        clientesSuspendidos: 0,
        clientesVencidos: 0,
        clientesProximosVencer: 0,
        instalacionesTotales: 0,
        licenciasTotales: 0,
        versionesRegistradas: 0,
      };
    }
  },

  /**
   * Obtiene los registros de auditoría más recientes
   */
  async obtenerActividadReciente(limiteAuditoria: number = 5): Promise<LogAuditoria[]> {
    try {
      // 1. Intentar API si existe
      try {
        const response = await fetch(`/api/v1/dashboard/activity?limit=${limiteAuditoria}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          const resData = await response.json();
          if (resData.exito && Array.isArray(resData.data)) {
            return resData.data as LogAuditoria[];
          }
        }
      } catch {
        // Fallback a Firestore
      }

      // 2. Conexión Directa a Firestore
      const audRef = collection(db, 'auditoria');
      try {
        const q = query(audRef, orderBy('fecha', 'desc'), firestoreLimit(limiteAuditoria));
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as LogAuditoria[];
      } catch {
        const snap = await getDocs(audRef);
        return snap.docs.slice(0, limiteAuditoria).map((d) => ({
          id: d.id,
          ...d.data(),
        })) as LogAuditoria[];
      }
    } catch (error) {
      console.error('Error obteniendo actividad reciente:', error);
      return [];
    }
  },
};
