import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  limit,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { AdminUser } from '../types';
import { auditService } from './auditService';

// Clave de almacenamiento local para la sesión
const SESSION_STORAGE_KEY = 'panel_maestro_admin_session';

// Correo del administrador principal del proyecto
const ADMIN_PROJECT_EMAIL = 'anyerperezrodrigues@gmail.com';

// Listeners de cambio de estado de sesión
type AuthStateListener = (admin: AdminUser | null) => void;
const authListeners: Set<AuthStateListener> = new Set();

/**
 * Función auxiliar para generar un hash criptográfico SHA-256 de una contraseña
 */
async function hashPassword(password: string): Promise<string> {
  const salt = 'panel_maestro_salt_2026_';
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    // Fallback simple para entornos sin crypto.subtle
    let hash = 0;
    const str = salt + password;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  }
}

/**
 * Genera un UID único para nuevos administradores
 */
function generarAdminUid(): string {
  const randomPart = Math.random().toString(36).substring(2, 10);
  const timePart = Date.now().toString(36);
  return `adm_${timePart}_${randomPart}`;
}

/**
 * Servicio de Autenticación Autónomo de Administradores
 * No depende de Firebase Authentication (100% Gratuito y Funcional en Local/Producción).
 */
export const authService = {
  /**
   * Notifica a todos los observadores registrados sobre un cambio en la sesión
   */
  notificarCambioAuth(admin: AdminUser | null) {
    authListeners.forEach(listener => {
      try {
        listener(admin);
      } catch (e) {
        console.error('Error en listener de auth:', e);
      }
    });
  },

  /**
   * Guarda la sesión del administrador en localStorage
   */
  guardarSesion(admin: AdminUser) {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(admin));
      this.notificarCambioAuth(admin);
    } catch (e) {
      console.warn('No se pudo guardar la sesión en localStorage:', e);
    }
  },

  /**
   * Obtiene la sesión guardada en localStorage
   */
  obtenerSesionGuardada(): AdminUser | null {
    try {
      const data = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data) as AdminUser;
    } catch (e) {
      return null;
    }
  },

  /**
   * Limpia la sesión del almacenamiento local
   */
  limpiarSesion() {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      this.notificarCambioAuth(null);
    } catch (e) {
      console.warn('Error limpiando sesión:', e);
    }
  },

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
      // Si la base de datos no responde, verificar si hay sesión local
      const sesion = this.obtenerSesionGuardada();
      return sesion !== null;
    }
  },

  /**
   * Registra el primer super administrador del sistema (con contraseña hasheada)
   */
  async registrarPrimerAdmin(nombre: string, correo: string, pass: string): Promise<AdminUser> {
    const correoNorm = correo.trim().toLowerCase();
    const passwordHash = await hashPassword(pass);
    const uid = generarAdminUid();

    const adminData: AdminUser = {
      uid,
      nombre: nombre.trim() || 'Super Administrador',
      correo: correoNorm,
      rol: 'super_admin',
      activo: true,
      fechaCreacion: new Date().toISOString(),
      ultimoAcceso: new Date().toISOString()
    };

    try {
      // Guardar en la colección 'admins' de Firestore
      await setDoc(doc(db, 'admins', uid), {
        ...adminData,
        passwordHash,
        fechaCreacion: serverTimestamp(),
        ultimoAcceso: serverTimestamp()
      });

      // Marcar configuración pública
      await setDoc(doc(db, 'configuracion', 'public'), {
        setupCompleted: true,
        fechaInicializacion: serverTimestamp()
      }, { merge: true });

      // Auditoría
      try {
        await auditService.registrarAccion(
          uid,
          correoNorm,
          'Creación de Super Administrador',
          'Autenticación',
          `Se ha registrado el administrador inicial ${nombre} (${correoNorm})`
        );
      } catch (e) {
        console.warn('Error registrando auditoría:', e);
      }
    } catch (dbError) {
      console.warn('Advertencia al guardar en Firestore (modo local/offline):', dbError);
    }

    // Guardar sesión local
    this.guardarSesion(adminData);
    return adminData;
  },

  /**
   * Inicia sesión con correo y contraseña comparando el hash criptográfico
   */
  async login(correo: string, pass: string): Promise<AdminUser> {
    const correoNorm = correo.trim().toLowerCase();
    const passwordHash = await hashPassword(pass);

    try {
      // Buscar en la colección 'admins' por correo
      const q = query(collection(db, 'admins'), where('correo', '==', correoNorm), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const adminDoc = querySnapshot.docs[0];
        const data = adminDoc.data();

        // Validar contraseña
        if (data.passwordHash && data.passwordHash !== passwordHash) {
          throw new Error('La contraseña ingresada es incorrecta.');
        }

        if (data.activo === false) {
          throw new Error('Su cuenta de administrador se encuentra inactiva o suspendida.');
        }

        const adminUser: AdminUser = {
          uid: adminDoc.id,
          nombre: data.nombre || 'Administrador',
          correo: data.correo || correoNorm,
          rol: data.rol || 'admin',
          activo: data.activo !== false,
          fechaCreacion: data.fechaCreacion || new Date().toISOString(),
          ultimoAcceso: new Date().toISOString()
        };

        // Actualizar último acceso
        try {
          await updateDoc(doc(db, 'admins', adminDoc.id), {
            ultimoAcceso: serverTimestamp()
          });
        } catch (e) {
          // No bloqueante
        }

        // Registrar auditoría
        try {
          await auditService.registrarAccion(
            adminUser.uid,
            adminUser.correo,
            'Inicio de Sesión',
            'Autenticación',
            'Inicio de sesión exitoso con credenciales'
          );
        } catch (e) {
          // No bloqueante
        }

        this.guardarSesion(adminUser);
        return adminUser;
      }

      // Si no existe ningún administrador en el sistema o es el correo principal, auto-crear la cuenta
      const yaExisten = await this.existenAdmins();
      if (!yaExisten || correoNorm === ADMIN_PROJECT_EMAIL.toLowerCase()) {
        return await this.registrarPrimerAdmin(
          correoNorm.split('@')[0] || 'Super Administrador',
          correoNorm,
          pass
        );
      }

      throw new Error('No se encontró ninguna cuenta de administrador con ese correo.');
    } catch (err: any) {
      if (err.message && (err.message.includes('contraseña') || err.message.includes('inactiva') || err.message.includes('No se encontró'))) {
        throw err;
      }

      // En caso de fallo de red o modo offline en local, permitir login si coincide con la sesión guardada
      const sesionGuardada = this.obtenerSesionGuardada();
      if (sesionGuardada && sesionGuardada.correo.toLowerCase() === correoNorm) {
        this.guardarSesion(sesionGuardada);
        return sesionGuardada;
      }

      throw err;
    }
  },

  /**
   * Acceso rápido de Super Administrador para entorno de desarrollo / local
   */
  async loginAccesoRapidoAdmin(nombre?: string, correo?: string): Promise<AdminUser> {
    const adminEmail = correo || ADMIN_PROJECT_EMAIL;
    const adminName = nombre || 'Super Administrador (Local)';

    // Verificar si ya existe en Firestore
    try {
      const q = query(collection(db, 'admins'), where('correo', '==', adminEmail.toLowerCase()), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const adminDoc = querySnapshot.docs[0];
        const data = adminDoc.data();
        const adminUser: AdminUser = {
          uid: adminDoc.id,
          nombre: data.nombre || adminName,
          correo: data.correo || adminEmail,
          rol: data.rol || 'super_admin',
          activo: true,
          fechaCreacion: data.fechaCreacion || new Date().toISOString(),
          ultimoAcceso: new Date().toISOString()
        };
        this.guardarSesion(adminUser);
        return adminUser;
      }
    } catch (e) {
      console.warn('Error verificando admin en Firestore:', e);
    }

    // Si no existe, crearlo
    return await this.registrarPrimerAdmin(adminName, adminEmail, 'admin123456');
  },

  /**
   * Obtiene el perfil de un administrador activo por su UID
   */
  async obtenerPerfilAdmin(uid: string): Promise<AdminUser | null> {
    try {
      const adminSnap = await getDoc(doc(db, 'admins', uid));
      if (adminSnap.exists()) {
        const data = adminSnap.data();
        return {
          uid: adminSnap.id,
          nombre: data.nombre,
          correo: data.correo,
          rol: data.rol,
          activo: data.activo,
          fechaCreacion: data.fechaCreacion,
          ultimoAcceso: data.ultimoAcceso
        } as AdminUser;
      }
    } catch (error) {
      console.error('Error obteniendo perfil admin:', error);
    }
    return this.obtenerSesionGuardada();
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
    this.limpiarSesion();
  },

  /**
   * Listener reactivo del estado de autenticación
   */
  observarEstadoAuth(callback: (admin: AdminUser | null) => void) {
    authListeners.add(callback);

    // Emitir el valor actual inicial
    const sesion = this.obtenerSesionGuardada();
    callback(sesion);

    return () => {
      authListeners.delete(callback);
    };
  }
};
