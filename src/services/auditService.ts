import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { LogAuditoria } from '../types';

export const auditService = {
  /**
   * Obtiene la lista de registros de auditoría directamente desde Firestore
   */
  async obtenerLogs(limite: number = 100): Promise<LogAuditoria[]> {
    try {
      // 1. Intentar API si existe
      try {
        const response = await fetch(`/api/v1/audit?limit=${limite}`, {
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
        const q = query(audRef, orderBy('fecha', 'desc'), firestoreLimit(limite));
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as LogAuditoria[];
      } catch {
        const snap = await getDocs(audRef);
        return snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as LogAuditoria[];
      }
    } catch (error) {
      console.error('Error consultando registros de auditoría:', error);
      return [];
    }
  },

  /**
   * Registra un evento en la colección de auditoría directamente en Firestore
   */
  async registrarAccion(
    usuarioUid: string,
    usuarioCorreo: string,
    accion: string,
    modulo: string,
    detalles: string,
    exito: boolean = true
  ): Promise<void> {
    try {
      const logId = doc(collection(db, 'auditoria')).id;
      const logData = {
        usuarioUid: usuarioUid || 'admin_uid',
        usuarioCorreo: usuarioCorreo || 'admin@panelmaestro.com',
        accion,
        modulo,
        detalles,
        exito,
        fecha: new Date().toISOString(),
      };

      await setDoc(doc(db, 'auditoria', logId), {
        ...logData,
        fechaTimestamp: serverTimestamp(),
      });
    } catch (error) {
      console.warn('Error guardando registro de auditoría en Firestore:', error);
    }
  },
};
