import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

/**
 * Inicialización centralizada de Firebase SDK (Auth y Firestore)
 * utilizando las credenciales del proyecto maestro.
 */

// Inicializar la aplicación de Firebase si no se ha inicializado previamente
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Instancia de Autenticación
export const auth = getAuth(app);

// Instancia de Firestore configurada con la base de datos específica del Panel Maestro
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

export default app;
