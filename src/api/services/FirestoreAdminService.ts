import { initializeApp as initAdminApp, getApps as getAdminApps, getApp as getAdminApp, cert, App as AdminApp } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore, Firestore as AdminFirestore, FieldValue as AdminFieldValue } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, Auth as AdminAuth } from 'firebase-admin/auth';

import { db as clientDb } from '../../config/firebase';
import {
  collection,
  doc,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp as clientServerTimestamp,
  increment as clientIncrement,
  arrayUnion as clientArrayUnion,
  arrayRemove as clientArrayRemove
} from 'firebase/firestore';

import firebaseConfig from '../../../firebase-applet-config.json';

let adminApp: AdminApp | null = null;
let adminDb: AdminFirestore | null = null;
let adminAuth: AdminAuth | null = null;
let isServiceAccountConfigured = false;
let useAdminSdk = false;

// 1. Inicializar Firebase Admin SDK
try {
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  
  if (serviceAccountVar) {
    const serviceAccount = JSON.parse(serviceAccountVar);
    adminApp = !getAdminApps().length
      ? initAdminApp({
          credential: cert(serviceAccount),
          projectId: firebaseConfig.projectId,
        })
      : getAdminApp();
    isServiceAccountConfigured = true;
    useAdminSdk = true;
  } else {
    adminApp = !getAdminApps().length
      ? initAdminApp({
          projectId: firebaseConfig.projectId,
        })
      : getAdminApp();
    isServiceAccountConfigured = false;
    useAdminSdk = false;
  }

  if (adminApp) {
    adminDb = firebaseConfig.firestoreDatabaseId
      ? getAdminFirestore(adminApp, firebaseConfig.firestoreDatabaseId)
      : getAdminFirestore(adminApp);
    adminAuth = getAdminAuth(adminApp);
  }
} catch (err) {
  console.warn('[FirestoreAdminService] Firebase Admin SDK inicializado en modo fallback:', err);
}

export { adminDb, adminAuth };

/**
 * Servicio centralizado de administración de Firestore para la API Express.
 * Ofrece una interfaz unificada y abstraída para todas las lecturas y escrituras de la API.
 * Utiliza Firebase Admin SDK con credenciales de Service Account en producción,
 * con fallback transparente al conector verificado en entornos de desarrollo local.
 */
export class FirestoreAdminService {
  /**
   * Obtiene la instancia pura de Firestore Admin DB
   */
  public static getDb(): AdminFirestore | null {
    return adminDb;
  }

  /**
   * Obtiene la instancia pura de Auth Admin
   */
  public static getAuth(): AdminAuth | null {
    return adminAuth;
  }

  /**
   * Indica si se está utilizando actualmente Firebase Admin SDK directo
   */
  public static isUsingAdminSdk(): boolean {
    return useAdminSdk && !!adminDb;
  }

  /**
   * Obtiene un documento por ID desde Firestore
   */
  public static async getDoc(collectionName: string, docId: string): Promise<Record<string, any> | null> {
    if (useAdminSdk && adminDb) {
      try {
        const snap = await adminDb.collection(collectionName).doc(docId).get();
        return snap.exists ? { id: snap.id, ...(snap.data() || {}) } : null;
      } catch (error: any) {
        if (error?.code === 7 || error?.message?.includes('PERMISSION_DENIED')) {
          useAdminSdk = false;
        } else {
          throw error;
        }
      }
    }

    const docRef = doc(clientDb, collectionName, docId);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...(snap.data() || {}) } : null;
  }

  /**
   * Crea un nuevo documento con un ID generado automáticamente
   */
  public static async addDoc(collectionName: string, data: Record<string, any>): Promise<{ id: string }> {
    if (useAdminSdk && adminDb) {
      try {
        const ref = await adminDb.collection(collectionName).add(data);
        return { id: ref.id };
      } catch (error: any) {
        if (error?.code === 7 || error?.message?.includes('PERMISSION_DENIED')) {
          useAdminSdk = false;
        } else {
          throw error;
        }
      }
    }

    const colRef = collection(clientDb, collectionName);
    const docRef = await addDoc(colRef, data);
    return { id: docRef.id };
  }

  /**
   * Crea o reemplaza un documento con un ID específico
   */
  public static async setDoc(collectionName: string, docId: string, data: Record<string, any>, merge = true): Promise<{ id: string }> {
    if (useAdminSdk && adminDb) {
      try {
        await adminDb.collection(collectionName).doc(docId).set(data, { merge });
        return { id: docId };
      } catch (error: any) {
        if (error?.code === 7 || error?.message?.includes('PERMISSION_DENIED')) {
          useAdminSdk = false;
        } else {
          throw error;
        }
      }
    }

    const docRef = doc(clientDb, collectionName, docId);
    await setDoc(docRef, data, { merge });
    return { id: docId };
  }

  /**
   * Actualiza los campos de un documento existente
   */
  public static async updateDoc(collectionName: string, docId: string, data: Record<string, any>): Promise<{ id: string }> {
    if (useAdminSdk && adminDb) {
      try {
        await adminDb.collection(collectionName).doc(docId).update(data);
        return { id: docId };
      } catch (error: any) {
        if (error?.code === 7 || error?.message?.includes('PERMISSION_DENIED')) {
          useAdminSdk = false;
        } else {
          throw error;
        }
      }
    }

    const docRef = doc(clientDb, collectionName, docId);
    await updateDoc(docRef, data);
    return { id: docId };
  }

  /**
   * Elimina un documento por su ID
   */
  public static async deleteDoc(collectionName: string, docId: string): Promise<{ id: string }> {
    if (useAdminSdk && adminDb) {
      try {
        await adminDb.collection(collectionName).doc(docId).delete();
        return { id: docId };
      } catch (error: any) {
        if (error?.code === 7 || error?.message?.includes('PERMISSION_DENIED')) {
          useAdminSdk = false;
        } else {
          throw error;
        }
      }
    }

    const docRef = doc(clientDb, collectionName, docId);
    await deleteDoc(docRef);
    return { id: docId };
  }

  /**
   * Realiza búsquedas y consultas filtradas en la colección dada
   */
  public static async queryCollection(
    collectionName: string,
    conditions: Array<{ field: string; op: any; value: any }> = [],
    options?: { orderBy?: string; orderDir?: 'asc' | 'desc'; limit?: number }
  ): Promise<Array<Record<string, any>>> {
    if (useAdminSdk && adminDb) {
      try {
        let q: any = adminDb.collection(collectionName);
        for (const cond of conditions) {
          q = q.where(cond.field, cond.op, cond.value);
        }
        if (options?.orderBy) {
          q = q.orderBy(options.orderBy, options.orderDir || 'asc');
        }
        if (options?.limit) {
          q = q.limit(options.limit);
        }
        const snap = await q.get();
        return snap.docs.map((d: any) => ({ id: d.id, ...(d.data() || {}) }));
      } catch (error: any) {
        if (error?.code === 7 || error?.message?.includes('PERMISSION_DENIED')) {
          useAdminSdk = false;
        } else {
          throw error;
        }
      }
    }

    const queryConstraints: any[] = [];
    for (const cond of conditions) {
      queryConstraints.push(where(cond.field, cond.op, cond.value));
    }
    if (options?.orderBy) {
      queryConstraints.push(orderBy(options.orderBy, options.orderDir || 'asc'));
    }
    if (options?.limit) {
      queryConstraints.push(limit(options.limit));
    }

    const colRef = collection(clientDb, collectionName);
    const q = query(colRef, ...queryConstraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
  }

  /**
   * Genera un timestamp del servidor
   */
  public static serverTimestamp() {
    return useAdminSdk ? AdminFieldValue.serverTimestamp() : new Date().toISOString();
  }

  /**
   * Genera una operación de incremento
   */
  public static increment(n: number) {
    return useAdminSdk ? AdminFieldValue.increment(n) : clientIncrement(n);
  }

  /**
   * Genera una operación arrayUnion
   */
  public static arrayUnion(...items: any[]) {
    return useAdminSdk ? AdminFieldValue.arrayUnion(...items) : clientArrayUnion(...items);
  }

  /**
   * Genera una operación arrayRemove
   */
  public static arrayRemove(...items: any[]) {
    return useAdminSdk ? AdminFieldValue.arrayRemove(...items) : clientArrayRemove(...items);
  }
}
