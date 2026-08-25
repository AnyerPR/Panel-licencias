import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  limit,
  query,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { AdminUser } from '../types';
import { auditService } from './auditService';

// Correo del administrador principal del proyecto
const ADMIN_PROJECT_EMAIL = 'anyerperezrodrigues@gmail.com';

/**
 * Servicio de Autenticación de Administradores
 */
export const authService = {
  /**
   * Verifica si ya existen administradores registrados mediante la configuración o colección admins
   */
  async existenAdmins(): Promise<boolean> {
    try {
      const pubSnap = await getDoc(doc(db, 'configuracion', 'public'));
      if (pubSnap.exists() && pubSnap.data()?.setupCompleted === true) {
        return true;
      }
      const q = query(collection(db, 'admins'), limit(1));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.warn('Error comprobando estado de admins:', error);
      return false;
    }
  },

  /**
   * Auto-inicializa a un usuario como Super Administrador si es el primero o el dueño del proyecto
   */
  async autoInicializarAdmin(user: User, nombreCustom?: string): Promise<AdminUser> {
    const adminData: AdminUser = {
      uid: user.uid,
      nombre: nombreCustom || user.displayName || user.email?.split('@')[0] || 'Super Administrador',
      correo: user.email || '',
      rol: 'super_admin',
      activo: true,
      fechaCreacion: new Date().toISOString(),
      ultimoAcceso: new Date().toISOString()
    };

    // Guardar en la colección 'admins'
    await setDoc(doc(db, 'admins', user.uid), {
      ...adminData,
      fechaCreacion: serverTimestamp(),
      ultimoAcceso: serverTimestamp()
    });

    // Marcar el sistema como inicializado en la configuración pública
    await setDoc(doc(db, 'configuracion', 'public'), {
      setupCompleted: true,
      fechaInicializacion: serverTimestamp()
    }, { merge: true });

    // Auditoría
    try {
      await auditService.registrarAccion(
        user.uid,
        user.email || '',
        'Inicialización de Administrador',
        'Autenticación',
        `El usuario ${user.email} se ha configurado como Super Administrador inicial.`
      );
    } catch (e) {
      console.warn('No se pudo registrar auditoría de auto-inicialización:', e);
    }

    return adminData;
  },

  /**
   * Inicia sesión con cuenta de Google mediante Popup
   */
  async loginConGoogle(): Promise<AdminUser> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Verificar si ya existe perfil en Firestore
    const adminDocRef = doc(db, 'admins', user.uid);
    const adminSnap = await getDoc(adminDocRef);

    if (!adminSnap.exists()) {
      const q = query(collection(db, 'admins'), limit(1));
      const querySnapshot = await getDocs(q);
      const noHayAdmins = querySnapshot.empty;
      const esAdminPrincipal = user.email?.toLowerCase() === ADMIN_PROJECT_EMAIL.toLowerCase() || noHayAdmins;

      if (esAdminPrincipal) {
        return await this.autoInicializarAdmin(user);
      } else {
        await signOut(auth);
        throw new Error(`Acceso denegado: La cuenta ${user.email} no tiene permisos de Administrador en este Panel.`);
      }
    }

    const adminData = adminSnap.data() as AdminUser;

    if (!adminData.activo) {
      await signOut(auth);
      throw new Error('Su cuenta de administrador se encuentra suspendida o inactiva.');
    }

    await updateDoc(adminDocRef, {
      ultimoAcceso: serverTimestamp()
    });

    return {
      ...adminData,
      ultimoAcceso: new Date().toISOString()
    };
  },

  /**
   * Registra el primer super administrador del sistema
   */
  async registrarPrimerAdmin(nombre: string, correo: string, pass: string): Promise<AdminUser> {
    const yaExisten = await this.existenAdmins();
    if (yaExisten && correo.toLowerCase() !== ADMIN_PROJECT_EMAIL.toLowerCase()) {
      throw new Error('Ya existen administradores en el sistema. Utilice el inicio de sesión regular.');
    }

    let user: User;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, correo, pass);
      user = userCredential.user;
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        // Si el usuario ya existe en Auth, intentar autenticarlo
        const cred = await signInWithEmailAndPassword(auth, correo, pass);
        user = cred.user;
      } else {
        throw err;
      }
    }

    return await this.autoInicializarAdmin(user, nombre);
  },

  /**
   * Inicia sesión con correo y contraseña
   */
  async login(correo: string, pass: string): Promise<AdminUser> {
    let user: User;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, correo, pass);
      user = userCredential.user;
    } catch (err: any) {
      // Si el usuario no existe y todavía no hay administradores registrados, crear el super admin directamente
      const yaExisten = await this.existenAdmins();
      if (!yaExisten || correo.toLowerCase() === ADMIN_PROJECT_EMAIL.toLowerCase()) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, correo, pass);
          user = userCredential.user;
          return await this.autoInicializarAdmin(user);
        } catch (createErr: any) {
          throw err;
        }
      }
      throw err;
    }

    // Obtener perfil de admin desde Firestore
    const adminDocRef = doc(db, 'admins', user.uid);
    const adminSnap = await getDoc(adminDocRef);

    if (!adminSnap.exists()) {
      const yaExisten = await this.existenAdmins();
      if (!yaExisten || user.email?.toLowerCase() === ADMIN_PROJECT_EMAIL.toLowerCase()) {
        return await this.autoInicializarAdmin(user);
      }

      await signOut(auth);
      await auditService.registrarAccion(
        user.uid,
        correo,
        'Intento de Login Fallido',
        'Autenticación',
        'El usuario existe en Auth pero no tiene registro en la colección admins',
        false
      );
      throw new Error('Acceso no autorizado: Su cuenta no está registrada como Administrador.');
    }

    const adminData = adminSnap.data() as AdminUser;

    if (!adminData.activo) {
      await signOut(auth);
      await auditService.registrarAccion(
        user.uid,
        correo,
        'Intento de Login Bloqueado',
        'Autenticación',
        'Acceso denegado a cuenta inactiva',
        false
      );
      throw new Error('Su cuenta de administrador se encuentra suspendida o inactiva.');
    }

    // Actualizar último acceso
    try {
      await updateDoc(adminDocRef, {
        ultimoAcceso: serverTimestamp()
      });
    } catch (e) {
      console.warn('No se pudo actualizar ultimoAcceso:', e);
    }

    // Registrar en auditoría
    try {
      await auditService.registrarAccion(
        user.uid,
        user.email || correo,
        'Inicio de Sesión Exitoso',
        'Autenticación',
        'El administrador ha ingresado al Panel Maestro'
      );
    } catch (e) {
      console.warn('Error registrando auditoría:', e);
    }

    return {
      ...adminData,
      ultimoAcceso: new Date().toISOString()
    };
  },

  /**
   * Obtiene el perfil de un administrador activo por su UID
   */
  async obtenerPerfilAdmin(uid: string): Promise<AdminUser | null> {
    try {
      const adminSnap = await getDoc(doc(db, 'admins', uid));
      if (adminSnap.exists()) {
        return adminSnap.data() as AdminUser;
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo perfil admin:', error);
      return null;
    }
  },

  /**
   * Cierra la sesión activa
   */
  async logout(usuarioUid?: string, usuarioCorreo?: string): Promise<void> {
    if (usuarioUid && usuarioCorreo) {
      try {
        await auditService.registrarAccion(
          usuarioUid,
          usuarioCorreo,
          'Cierre de Sesión',
          'Autenticación',
          'El administrador cerró la sesión activa'
        );
      } catch (e) {
        console.warn('Error registrando cierre de sesión:', e);
      }
    }
    await signOut(auth);
  },

  /**
   * Listener de estado de autenticación de Firebase
   */
  observarEstadoAuth(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
};
