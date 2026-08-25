import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

/**
 * Inicialización centralizada de Firebase SDK (Firestore)
 * utilizando las credenciales del proyecto maestro.
 * No requiere Firebase Authentication.
 */

// Inicializar la aplicación de Firebase si no se ha inicializado previamente
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Instancia de Firestore configurada con la base de datos específica del Panel Maestro
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

export default app;
