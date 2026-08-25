var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express9 = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");

// src/api/functions/index.ts
var import_express8 = __toESM(require("express"), 1);

// src/api/routes/licenseRoutes.ts
var import_express = require("express");

// src/api/services/FirestoreAdminService.ts
var import_app2 = require("firebase-admin/app");
var import_firestore2 = require("firebase-admin/firestore");
var import_auth = require("firebase-admin/auth");

// src/config/firebase.ts
var import_app = require("firebase/app");
var import_firestore = require("firebase/firestore");

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "gen-lang-client-0996675321",
  appId: "1:123041029000:web:45e46662500fa83106f83d",
  apiKey: "AIzaSyDMBUunIDnpvOm-f-U60c4N_0wlTK9uJh8",
  authDomain: "gen-lang-client-0996675321.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-panelmaestrodeli-7d4d30e8-9f83-407a-aa75-f97c0f1f0252",
  storageBucket: "gen-lang-client-0996675321.firebasestorage.app",
  messagingSenderId: "123041029000",
  measurementId: "",
  oAuthClientId: "123041029000-h029halord6ug381i111kk4tca6lr76f.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

// src/config/firebase.ts
var app = !(0, import_app.getApps)().length ? (0, import_app.initializeApp)(firebase_applet_config_default) : (0, import_app.getApp)();
var db = (0, import_firestore.getFirestore)(app, firebase_applet_config_default.firestoreDatabaseId || "(default)");

// src/api/services/FirestoreAdminService.ts
var import_firestore3 = require("firebase/firestore");
var adminApp = null;
var adminDb = null;
var adminAuth = null;
var isServiceAccountConfigured = false;
var useAdminSdk = false;
try {
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (serviceAccountVar) {
    const serviceAccount = JSON.parse(serviceAccountVar);
    adminApp = !(0, import_app2.getApps)().length ? (0, import_app2.initializeApp)({
      credential: (0, import_app2.cert)(serviceAccount),
      projectId: firebase_applet_config_default.projectId
    }) : (0, import_app2.getApp)();
    isServiceAccountConfigured = true;
    useAdminSdk = true;
  } else {
    adminApp = !(0, import_app2.getApps)().length ? (0, import_app2.initializeApp)({
      projectId: firebase_applet_config_default.projectId
    }) : (0, import_app2.getApp)();
    isServiceAccountConfigured = false;
    useAdminSdk = false;
  }
  if (adminApp) {
    adminDb = firebase_applet_config_default.firestoreDatabaseId ? (0, import_firestore2.getFirestore)(adminApp, firebase_applet_config_default.firestoreDatabaseId) : (0, import_firestore2.getFirestore)(adminApp);
    adminAuth = (0, import_auth.getAuth)(adminApp);
  }
} catch (err) {
  console.warn("[FirestoreAdminService] Firebase Admin SDK inicializado en modo fallback:", err);
}
var FirestoreAdminService = class {
  /**
   * Obtiene la instancia pura de Firestore Admin DB
   */
  static getDb() {
    return adminDb;
  }
  /**
   * Obtiene la instancia pura de Auth Admin
   */
  static getAuth() {
    return adminAuth;
  }
  /**
   * Indica si se está utilizando actualmente Firebase Admin SDK directo
   */
  static isUsingAdminSdk() {
    return useAdminSdk && !!adminDb;
  }
  /**
   * Obtiene un documento por ID desde Firestore
   */
  static async getDoc(collectionName, docId) {
    if (useAdminSdk && adminDb) {
      try {
        const snap2 = await adminDb.collection(collectionName).doc(docId).get();
        return snap2.exists ? { id: snap2.id, ...snap2.data() || {} } : null;
      } catch (error) {
        if (error?.code === 7 || error?.message?.includes("PERMISSION_DENIED")) {
          useAdminSdk = false;
        } else {
          throw error;
        }
      }
    }
    const docRef = (0, import_firestore3.doc)(db, collectionName, docId);
    const snap = await (0, import_firestore3.getDoc)(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() || {} } : null;
  }
  /**
   * Crea un nuevo documento con un ID generado automáticamente
   */
  static async addDoc(collectionName, data) {
    if (useAdminSdk && adminDb) {
      try {
        const ref = await adminDb.collection(collectionName).add(data);
        return { id: ref.id };
      } catch (error) {
        if (error?.code === 7 || error?.message?.includes("PERMISSION_DENIED")) {
          useAdminSdk = false;
        } else {
          throw error;
        }
      }
    }
    const colRef = (0, import_firestore3.collection)(db, collectionName);
    const docRef = await (0, import_firestore3.addDoc)(colRef, data);
    return { id: docRef.id };
  }
  /**
   * Crea o reemplaza un documento con un ID específico
   */
  static async setDoc(collectionName, docId, data, merge = true) {
    if (useAdminSdk && adminDb) {
      try {
        await adminDb.collection(collectionName).doc(docId).set(data, { merge });
        return { id: docId };
      } catch (error) {
        if (error?.code === 7 || error?.message?.includes("PERMISSION_DENIED")) {
          useAdminSdk = false;
        } else {
          throw error;
        }
      }
    }
    const docRef = (0, import_firestore3.doc)(db, collectionName, docId);
    await (0, import_firestore3.setDoc)(docRef, data, { merge });
    return { id: docId };
  }
  /**
   * Actualiza los campos de un documento existente
   */
  static async updateDoc(collectionName, docId, data) {
    if (useAdminSdk && adminDb) {
      try {
        await adminDb.collection(collectionName).doc(docId).update(data);
        return { id: docId };
      } catch (error) {
        if (error?.code === 7 || error?.message?.includes("PERMISSION_DENIED")) {
          useAdminSdk = false;
        } else {
          throw error;
        }
      }
    }
    const docRef = (0, import_firestore3.doc)(db, collectionName, docId);
    await (0, import_firestore3.updateDoc)(docRef, data);
    return { id: docId };
  }
  /**
   * Elimina un documento por su ID
   */
  static async deleteDoc(collectionName, docId) {
    if (useAdminSdk && adminDb) {
      try {
        await adminDb.collection(collectionName).doc(docId).delete();
        return { id: docId };
      } catch (error) {
        if (error?.code === 7 || error?.message?.includes("PERMISSION_DENIED")) {
          useAdminSdk = false;
        } else {
          throw error;
        }
      }
    }
    const docRef = (0, import_firestore3.doc)(db, collectionName, docId);
    await (0, import_firestore3.deleteDoc)(docRef);
    return { id: docId };
  }
  /**
   * Realiza búsquedas y consultas filtradas en la colección dada
   */
  static async queryCollection(collectionName, conditions = [], options) {
    if (useAdminSdk && adminDb) {
      try {
        let q2 = adminDb.collection(collectionName);
        for (const cond of conditions) {
          q2 = q2.where(cond.field, cond.op, cond.value);
        }
        if (options?.orderBy) {
          q2 = q2.orderBy(options.orderBy, options.orderDir || "asc");
        }
        if (options?.limit) {
          q2 = q2.limit(options.limit);
        }
        const snap2 = await q2.get();
        return snap2.docs.map((d) => ({ id: d.id, ...d.data() || {} }));
      } catch (error) {
        if (error?.code === 7 || error?.message?.includes("PERMISSION_DENIED")) {
          useAdminSdk = false;
        } else {
          throw error;
        }
      }
    }
    const queryConstraints = [];
    for (const cond of conditions) {
      queryConstraints.push((0, import_firestore3.where)(cond.field, cond.op, cond.value));
    }
    if (options?.orderBy) {
      queryConstraints.push((0, import_firestore3.orderBy)(options.orderBy, options.orderDir || "asc"));
    }
    if (options?.limit) {
      queryConstraints.push((0, import_firestore3.limit)(options.limit));
    }
    const colRef = (0, import_firestore3.collection)(db, collectionName);
    const q = (0, import_firestore3.query)(colRef, ...queryConstraints);
    const snap = await (0, import_firestore3.getDocs)(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() || {} }));
  }
  /**
   * Genera un timestamp del servidor
   */
  static serverTimestamp() {
    return useAdminSdk ? import_firestore2.FieldValue.serverTimestamp() : (/* @__PURE__ */ new Date()).toISOString();
  }
  /**
   * Genera una operación de incremento
   */
  static increment(n) {
    return useAdminSdk ? import_firestore2.FieldValue.increment(n) : (0, import_firestore3.increment)(n);
  }
  /**
   * Genera una operación arrayUnion
   */
  static arrayUnion(...items) {
    return useAdminSdk ? import_firestore2.FieldValue.arrayUnion(...items) : (0, import_firestore3.arrayUnion)(...items);
  }
  /**
   * Genera una operación arrayRemove
   */
  static arrayRemove(...items) {
    return useAdminSdk ? import_firestore2.FieldValue.arrayRemove(...items) : (0, import_firestore3.arrayRemove)(...items);
  }
};

// src/api/services/validationService.ts
function compararVersiones(v1, v2) {
  const parts1 = v1.split(".").map(Number);
  const parts2 = v2.split(".").map(Number);
  const len = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < len; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}
var validationService = {
  /**
   * Valida integralmente una licencia para el sistema de inventario utilizando Firebase Admin SDK
   */
  async validarLicencia(reqData, clientIp) {
    const { licenseKey, uuidCliente, versionSistema, installationId } = reqData;
    if (!licenseKey || !uuidCliente || !versionSistema) {
      return {
        exito: false,
        status: 400,
        codigoError: "DATOS_INVALIDOS",
        mensaje: "Los campos licenseKey, uuidCliente y versionSistema son obligatorios."
      };
    }
    const snapCliente = await adminDb.collection("clientes").where("uuidCliente", "==", uuidCliente).get();
    let clienteDoc = snapCliente.docs[0];
    if (!clienteDoc) {
      const snapDoc = await adminDb.collection("clientes").doc(uuidCliente).get();
      if (snapDoc.exists) {
        clienteDoc = snapDoc;
      }
    }
    if (!clienteDoc) {
      return {
        exito: false,
        status: 404,
        codigoError: "CLIENTE_NO_ENCONTRADO",
        mensaje: `No se encontr\xF3 ning\xFAn cliente registrado con el UUID: ${uuidCliente}`
      };
    }
    const clienteData = clienteDoc.data() || {};
    if (clienteData.estado !== "activo") {
      return {
        exito: false,
        status: 403,
        codigoError: "CLIENTE_INACTIVO",
        mensaje: `El cliente '${clienteData.nombreEmpresa || uuidCliente}' se encuentra inactivo o desactivado.`
      };
    }
    const snapLicencia = await adminDb.collection("licencias").where("licenseKey", "==", licenseKey).get();
    let licenciaDoc = snapLicencia.docs[0];
    if (!licenciaDoc) {
      const snapDoc = await adminDb.collection("licencias").doc(licenseKey).get();
      if (snapDoc.exists) {
        licenciaDoc = snapDoc;
      }
    }
    if (!licenciaDoc) {
      return {
        exito: false,
        status: 404,
        codigoError: "LICENCIA_NO_ENCONTRADA",
        mensaje: `La clave de licencia '${licenseKey}' no existe en el sistema maestro.`
      };
    }
    const licenciaData = licenciaDoc.data() || {};
    if (licenciaData.uuidCliente !== uuidCliente && licenciaData.clienteId !== clienteDoc.id) {
      return {
        exito: false,
        status: 403,
        codigoError: "UUID_CLIENTE_INVALIDO",
        mensaje: "La licencia especificada no pertenece al cliente solicitante."
      };
    }
    const estado = licenciaData.estado;
    if (estado === "suspendida") {
      return {
        exito: false,
        status: 403,
        codigoError: "LICENCIA_SUSPENDIDA",
        mensaje: "La licencia se encuentra suspendida temporalmente por administraci\xF3n."
      };
    }
    if (estado === "revocada") {
      return {
        exito: false,
        status: 403,
        codigoError: "LICENCIA_REVOCADA",
        mensaje: "La licencia ha sido revocada de forma permanente."
      };
    }
    if (estado === "inactiva") {
      return {
        exito: false,
        status: 403,
        codigoError: "LICENCIA_INACTIVA",
        mensaje: "La licencia a\xFAn no ha sido activada o se encuentra inactiva."
      };
    }
    const fechaExpiracion = new Date(licenciaData.fechaExpiracion);
    const ahora = /* @__PURE__ */ new Date();
    if (ahora > fechaExpiracion) {
      if (estado !== "expirada") {
        await FirestoreAdminService.updateDoc("licencias", licenciaDoc.id, { estado: "expirada" });
      }
      return {
        exito: false,
        status: 403,
        codigoError: "LICENCIA_EXPIRADA",
        mensaje: `La licencia expir\xF3 el ${fechaExpiracion.toLocaleDateString("es-ES")}. Por favor, solicite una renovaci\xF3n.`
      };
    }
    const vMin = licenciaData.versionMinima || "1.0.0";
    const vMax = licenciaData.versionMaxima || "99.99.99";
    if (compararVersiones(versionSistema, vMin) < 0 || compararVersiones(versionSistema, vMax) > 0) {
      return {
        exito: false,
        status: 403,
        codigoError: "VERSION_NO_PERMITIDA",
        mensaje: `La versi\xF3n del sistema (${versionSistema}) no est\xE1 dentro del rango permitido (${vMin} - ${vMax}).`
      };
    }
    const diffTime = fechaExpiracion.getTime() - ahora.getTime();
    const diasRestantes = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
    const instalacionesUsadas = Array.isArray(licenciaData.installationIds) ? licenciaData.installationIds.length : 0;
    const estaInstalado = installationId && Array.isArray(licenciaData.installationIds) ? licenciaData.installationIds.includes(installationId) : false;
    await FirestoreAdminService.updateDoc("licencias", licenciaDoc.id, {
      ultimaValidacion: (/* @__PURE__ */ new Date()).toISOString(),
      ipUltimaConexion: clientIp
    });
    return {
      exito: true,
      status: 200,
      mensaje: "Licencia v\xE1lida y autorizada.",
      data: {
        licenciaValida: true,
        licenseKey: licenciaData.licenseKey,
        uuidCliente: clienteData.uuidCliente || uuidCliente,
        nombreEmpresa: clienteData.nombreEmpresa || "Cliente Empresarial",
        estadoLicencia: licenciaData.estado,
        tipoLicencia: licenciaData.tipoLicencia,
        versionMinima: vMin,
        versionMaxima: vMax,
        fechaExpiracion: licenciaData.fechaExpiracion,
        diasRestantes,
        cantidadInstalacionesPermitidas: licenciaData.cantidadInstalacionesPermitidas || 1,
        cantidadInstalacionesUsadas: instalacionesUsadas,
        installationIdRegistrado: estaInstalado
      }
    };
  },
  /**
   * Registra y activa una instalación mediante su Installation ID permanente
   */
  async activarInstalacion(reqData, clientIp) {
    const { licenseKey, uuidCliente, installationId, nombreEquipo, versionSistema, detallesHardware } = reqData;
    if (!licenseKey || !uuidCliente || !installationId || !nombreEquipo) {
      return {
        exito: false,
        status: 400,
        codigoError: "DATOS_INVALIDOS",
        mensaje: "licenseKey, uuidCliente, installationId y nombreEquipo son obligatorios."
      };
    }
    const val = await this.validarLicencia(
      { licenseKey, uuidCliente, versionSistema: versionSistema || "1.0.0", installationId, nombreEquipo },
      clientIp
    );
    if (!val.exito) {
      return val;
    }
    const snapLicencia = await adminDb.collection("licencias").where("licenseKey", "==", licenseKey).get();
    const licenciaDoc = snapLicencia.docs[0];
    const licenciaData = licenciaDoc.data();
    const installationIds = Array.isArray(licenciaData.installationIds) ? licenciaData.installationIds : [];
    const limiteInstalaciones = licenciaData.cantidadInstalacionesPermitidas || 1;
    const yaRegistrada = installationIds.includes(installationId);
    if (!yaRegistrada) {
      if (installationIds.length >= limiteInstalaciones) {
        return {
          exito: false,
          status: 409,
          codigoError: "MAXIMA_INSTALACIONES_ALCANZADO",
          mensaje: `Se ha alcanzado el l\xEDmite m\xE1ximo de ${limiteInstalaciones} instalaciones permitidas para esta licencia.`
        };
      }
      await FirestoreAdminService.updateDoc("licencias", licenciaDoc.id, {
        installationIds: FirestoreAdminService.arrayUnion(installationId),
        ultimaConexion: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    const snapInst = await adminDb.collection("instalaciones").where("installationId", "==", installationId).where("licenseKey", "==", licenseKey).get();
    const ahoraIso = (/* @__PURE__ */ new Date()).toISOString();
    if (snapInst.empty) {
      await FirestoreAdminService.addDoc("instalaciones", {
        installationId,
        licenseKey,
        uuidCliente,
        nombreEquipo,
        versionSistema: versionSistema || "1.0.0",
        ip: clientIp,
        estado: "activa",
        fechaActivacion: ahoraIso,
        ultimaConexion: ahoraIso,
        detallesHardware: detallesHardware || {}
      });
    } else {
      const instDoc = snapInst.docs[0];
      await FirestoreAdminService.updateDoc("instalaciones", instDoc.id, {
        nombreEquipo,
        versionSistema: versionSistema || "1.0.0",
        ip: clientIp,
        estado: "activa",
        ultimaConexion: ahoraIso
      });
    }
    return {
      exito: true,
      status: 201,
      mensaje: yaRegistrada ? "Instalaci\xF3n revalidada y actualizada correctamente." : "Nueva instalaci\xF3n activada y vinculada a la licencia exitosamente.",
      data: {
        installationId,
        licenseKey,
        uuidCliente,
        nombreEquipo,
        estado: "activa",
        fechaActivacion: ahoraIso,
        instalacionesUsadas: yaRegistrada ? installationIds.length : installationIds.length + 1,
        instalacionesPermitidas: limiteInstalaciones
      }
    };
  },
  /**
   * Recibe el Heartbeat periódico del sistema de inventario
   */
  async procesarHeartbeat(reqData, clientIp) {
    const { licenseKey, uuidCliente, installationId, versionSistema, estadoEquipo } = reqData;
    if (!licenseKey || !uuidCliente || !installationId) {
      return {
        exito: false,
        status: 400,
        codigoError: "DATOS_INVALIDOS",
        mensaje: "licenseKey, uuidCliente e installationId son obligatorios."
      };
    }
    const val = await this.validarLicencia(
      { licenseKey, uuidCliente, versionSistema: versionSistema || "1.0.0", installationId },
      clientIp
    );
    if (!val.exito) {
      return val;
    }
    const snapInst = await adminDb.collection("instalaciones").where("installationId", "==", installationId).where("licenseKey", "==", licenseKey).get();
    if (snapInst.empty) {
      return {
        exito: false,
        status: 404,
        codigoError: "INSTALACION_NO_ENCONTRADA",
        mensaje: `La instalaci\xF3n '${installationId}' no se encuentra registrada para esta licencia.`
      };
    }
    const instDoc = snapInst.docs[0];
    const ahoraIso = (/* @__PURE__ */ new Date()).toISOString();
    await FirestoreAdminService.updateDoc("instalaciones", instDoc.id, {
      ultimaConexion: ahoraIso,
      versionSistema: versionSistema || "1.0.0",
      ip: clientIp,
      estadoEquipo: estadoEquipo || "online"
    });
    return {
      exito: true,
      status: 200,
      mensaje: "Heartbeat procesado correctamente.",
      data: {
        installationId,
        estado: "activa",
        ultimaConexion: ahoraIso,
        diasRestantes: val.data?.diasRestantes
      }
    };
  },
  /**
   * Desactiva un Installation ID de una licencia
   */
  async desactivarInstalacion(reqData, clientIp) {
    const { licenseKey, uuidCliente, installationId, motivo } = reqData;
    if (!licenseKey || !uuidCliente || !installationId) {
      return {
        exito: false,
        status: 400,
        codigoError: "DATOS_INVALIDOS",
        mensaje: "licenseKey, uuidCliente e installationId son campos requeridos."
      };
    }
    const snapLic = await adminDb.collection("licencias").where("licenseKey", "==", licenseKey).get();
    if (snapLic.empty) {
      return {
        exito: false,
        status: 404,
        codigoError: "LICENCIA_NO_ENCONTRADA",
        mensaje: "La licencia especificada no existe."
      };
    }
    const licDoc = snapLic.docs[0];
    await FirestoreAdminService.updateDoc("licencias", licDoc.id, {
      installationIds: FirestoreAdminService.arrayRemove(installationId)
    });
    const snapInst = await adminDb.collection("instalaciones").where("installationId", "==", installationId).where("licenseKey", "==", licenseKey).get();
    if (!snapInst.empty) {
      await FirestoreAdminService.updateDoc("instalaciones", snapInst.docs[0].id, {
        estado: "desactivada",
        motivoDesactivacion: motivo || "Desactivaci\xF3n solicitada por API",
        fechaDesactivacion: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    return {
      exito: true,
      status: 200,
      mensaje: `La instalaci\xF3n '${installationId}' fue desactivada exitosamente.`,
      data: {
        installationId,
        licenseKey,
        estado: "desactivada"
      }
    };
  },
  /**
   * Renueva el tiempo de vigencia de una licencia
   */
  async renovarLicencia(reqData, clientIp) {
    const { licenseKey, uuidCliente, diasAnadidos } = reqData;
    if (!licenseKey || !uuidCliente || !diasAnadidos || diasAnadidos <= 0) {
      return {
        exito: false,
        status: 400,
        codigoError: "DATOS_INVALIDOS",
        mensaje: "licenseKey, uuidCliente y diasAnadidos (> 0) son obligatorios."
      };
    }
    const snapLic = await adminDb.collection("licencias").where("licenseKey", "==", licenseKey).get();
    if (snapLic.empty) {
      return {
        exito: false,
        status: 404,
        codigoError: "LICENCIA_NO_ENCONTRADA",
        mensaje: "Licencia no encontrada."
      };
    }
    const licDoc = snapLic.docs[0];
    const licData = licDoc.data();
    const actualExp = new Date(licData.fechaExpiracion);
    const baseDate = actualExp > /* @__PURE__ */ new Date() ? actualExp : /* @__PURE__ */ new Date();
    baseDate.setDate(baseDate.getDate() + Number(diasAnadidos));
    const nuevaExpiracion = baseDate.toISOString();
    await FirestoreAdminService.updateDoc("licencias", licDoc.id, {
      fechaExpiracion: nuevaExpiracion,
      estado: "activa",
      ultimaRenovacion: (/* @__PURE__ */ new Date()).toISOString()
    });
    return {
      exito: true,
      status: 200,
      mensaje: `Licencia renovada por ${diasAnadidos} d\xEDas con \xE9xito.`,
      data: {
        licenseKey,
        nuevaFechaExpiracion: nuevaExpiracion,
        diasAnadidos,
        estado: "activa"
      }
    };
  },
  /**
   * Obtiene el estado detallado de una licencia sin alterar contadores
   */
  async obtenerEstadoLicencia(licenseKey, uuidCliente, clientIp) {
    return this.validarLicencia(
      { licenseKey, uuidCliente, versionSistema: "1.0.0" },
      clientIp
    );
  },
  /**
   * Guarda un log detallado de cada llamada a la API en la colección 'apiLogs' utilizando Firebase Admin SDK
   */
  async registrarApiLog(logData) {
    try {
      await FirestoreAdminService.addDoc("apiLogs", {
        ...logData,
        createdAt: FirestoreAdminService.serverTimestamp()
      });
    } catch (err) {
      console.error("Error registrando log de API:", err);
    }
  }
};

// src/api/utils/responseUtils.ts
var responseUtils = {
  /**
   * Crea una respuesta estandarizada de éxito
   */
  exito(data, mensaje = "Operaci\xF3n ejecutada exitosamente", status = 200) {
    return {
      status,
      body: {
        exito: true,
        codigoEstado: status,
        mensaje,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        data
      }
    };
  },
  /**
   * Crea una respuesta estandarizada de error con código HTTP exacto y código de error del dominio
   */
  error(codigoError, mensaje, status = 400, data) {
    return {
      status,
      body: {
        exito: false,
        codigoEstado: status,
        codigoError,
        mensaje,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        ...data ? { data } : {}
      }
    };
  }
};

// src/api/controllers/licenseController.ts
var licenseController = {
  /**
   * Endpoint: POST /api/v1/license/validate
   */
  async validateLicense(req, res) {
    const inicio = Date.now();
    const clientIp = req.headers["x-forwarded-for"] || req.ip || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "Unknown";
    try {
      const resultado = await validationService.validarLicencia(req.body, clientIp);
      const duracionMs = Date.now() - inicio;
      await validationService.registrarApiLog({
        fecha: (/* @__PURE__ */ new Date()).toISOString(),
        timestamp: inicio,
        cliente: req.body?.uuidCliente || "An\xF3nimo",
        uuidCliente: req.body?.uuidCliente || "",
        licencia: req.body?.licenseKey || "",
        installationId: req.body?.installationId || "",
        endpoint: "/api/v1/license/validate",
        metodo: "POST",
        codigoEstado: resultado.status,
        exito: resultado.exito,
        codigoError: resultado.codigoError,
        mensaje: resultado.mensaje,
        ip: clientIp,
        userAgent,
        duracionMs
      });
      if (!resultado.exito) {
        const errResp = responseUtils.error(
          resultado.codigoError || "ERROR_INTERNO",
          resultado.mensaje,
          resultado.status
        );
        return res.status(errResp.status).json(errResp.body);
      }
      const okResp = responseUtils.exito(resultado.data, resultado.mensaje, resultado.status);
      return res.status(okResp.status).json(okResp.body);
    } catch (error) {
      const duracionMs = Date.now() - inicio;
      const errResp = responseUtils.error(
        "ERROR_INTERNO",
        error.message || "Error no controlado procesando la validaci\xF3n de licencia.",
        500
      );
      return res.status(errResp.status).json(errResp.body);
    }
  },
  /**
   * Endpoint: POST /api/v1/license/activate
   */
  async activateInstallation(req, res) {
    const inicio = Date.now();
    const clientIp = req.headers["x-forwarded-for"] || req.ip || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "Unknown";
    try {
      const resultado = await validationService.activarInstalacion(req.body, clientIp);
      const duracionMs = Date.now() - inicio;
      await validationService.registrarApiLog({
        fecha: (/* @__PURE__ */ new Date()).toISOString(),
        timestamp: inicio,
        cliente: req.body?.uuidCliente || "An\xF3nimo",
        uuidCliente: req.body?.uuidCliente || "",
        licencia: req.body?.licenseKey || "",
        installationId: req.body?.installationId || "",
        endpoint: "/api/v1/license/activate",
        metodo: "POST",
        codigoEstado: resultado.status,
        exito: resultado.exito,
        codigoError: resultado.codigoError,
        mensaje: resultado.mensaje,
        ip: clientIp,
        userAgent,
        duracionMs
      });
      if (!resultado.exito) {
        const errResp = responseUtils.error(
          resultado.codigoError || "ERROR_INTERNO",
          resultado.mensaje,
          resultado.status
        );
        return res.status(errResp.status).json(errResp.body);
      }
      const okResp = responseUtils.exito(resultado.data, resultado.mensaje, resultado.status);
      return res.status(okResp.status).json(okResp.body);
    } catch (error) {
      const errResp = responseUtils.error("ERROR_INTERNO", error.message || "Error inesperado.", 500);
      return res.status(errResp.status).json(errResp.body);
    }
  },
  /**
   * Endpoint: POST /api/v1/license/heartbeat
   */
  async heartbeat(req, res) {
    const inicio = Date.now();
    const clientIp = req.headers["x-forwarded-for"] || req.ip || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "Unknown";
    try {
      const resultado = await validationService.procesarHeartbeat(req.body, clientIp);
      const duracionMs = Date.now() - inicio;
      await validationService.registrarApiLog({
        fecha: (/* @__PURE__ */ new Date()).toISOString(),
        timestamp: inicio,
        cliente: req.body?.uuidCliente || "An\xF3nimo",
        uuidCliente: req.body?.uuidCliente || "",
        licencia: req.body?.licenseKey || "",
        installationId: req.body?.installationId || "",
        endpoint: "/api/v1/license/heartbeat",
        metodo: "POST",
        codigoEstado: resultado.status,
        exito: resultado.exito,
        codigoError: resultado.codigoError,
        mensaje: resultado.mensaje,
        ip: clientIp,
        userAgent,
        duracionMs
      });
      if (!resultado.exito) {
        const errResp = responseUtils.error(
          resultado.codigoError || "ERROR_INTERNO",
          resultado.mensaje,
          resultado.status
        );
        return res.status(errResp.status).json(errResp.body);
      }
      const okResp = responseUtils.exito(resultado.data, resultado.mensaje, resultado.status);
      return res.status(okResp.status).json(okResp.body);
    } catch (error) {
      const errResp = responseUtils.error("ERROR_INTERNO", error.message || "Error inesperado.", 500);
      return res.status(errResp.status).json(errResp.body);
    }
  },
  /**
   * Endpoint: POST /api/v1/license/deactivate
   */
  async deactivateInstallation(req, res) {
    const inicio = Date.now();
    const clientIp = req.headers["x-forwarded-for"] || req.ip || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "Unknown";
    try {
      const resultado = await validationService.desactivarInstalacion(req.body, clientIp);
      const duracionMs = Date.now() - inicio;
      await validationService.registrarApiLog({
        fecha: (/* @__PURE__ */ new Date()).toISOString(),
        timestamp: inicio,
        cliente: req.body?.uuidCliente || "An\xF3nimo",
        uuidCliente: req.body?.uuidCliente || "",
        licencia: req.body?.licenseKey || "",
        installationId: req.body?.installationId || "",
        endpoint: "/api/v1/license/deactivate",
        metodo: "POST",
        codigoEstado: resultado.status,
        exito: resultado.exito,
        codigoError: resultado.codigoError,
        mensaje: resultado.mensaje,
        ip: clientIp,
        userAgent,
        duracionMs
      });
      if (!resultado.exito) {
        const errResp = responseUtils.error(
          resultado.codigoError || "ERROR_INTERNO",
          resultado.mensaje,
          resultado.status
        );
        return res.status(errResp.status).json(errResp.body);
      }
      const okResp = responseUtils.exito(resultado.data, resultado.mensaje, resultado.status);
      return res.status(okResp.status).json(okResp.body);
    } catch (error) {
      const errResp = responseUtils.error("ERROR_INTERNO", error.message || "Error inesperado.", 500);
      return res.status(errResp.status).json(errResp.body);
    }
  },
  /**
   * Endpoint: POST /api/v1/license/renew
   */
  async renewLicense(req, res) {
    const inicio = Date.now();
    const clientIp = req.headers["x-forwarded-for"] || req.ip || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "Unknown";
    try {
      const resultado = await validationService.renovarLicencia(req.body, clientIp);
      const duracionMs = Date.now() - inicio;
      await validationService.registrarApiLog({
        fecha: (/* @__PURE__ */ new Date()).toISOString(),
        timestamp: inicio,
        cliente: req.body?.uuidCliente || "An\xF3nimo",
        uuidCliente: req.body?.uuidCliente || "",
        licencia: req.body?.licenseKey || "",
        endpoint: "/api/v1/license/renew",
        metodo: "POST",
        codigoEstado: resultado.status,
        exito: resultado.exito,
        codigoError: resultado.codigoError,
        mensaje: resultado.mensaje,
        ip: clientIp,
        userAgent,
        duracionMs
      });
      if (!resultado.exito) {
        const errResp = responseUtils.error(
          resultado.codigoError || "ERROR_INTERNO",
          resultado.mensaje,
          resultado.status
        );
        return res.status(errResp.status).json(errResp.body);
      }
      const okResp = responseUtils.exito(resultado.data, resultado.mensaje, resultado.status);
      return res.status(okResp.status).json(okResp.body);
    } catch (error) {
      const errResp = responseUtils.error("ERROR_INTERNO", error.message || "Error inesperado.", 500);
      return res.status(errResp.status).json(errResp.body);
    }
  },
  /**
   * Endpoint: GET /api/v1/license/status
   */
  async getLicenseStatus(req, res) {
    const inicio = Date.now();
    const clientIp = req.headers["x-forwarded-for"] || req.ip || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "Unknown";
    const licenseKey = req.query.licenseKey || "";
    const uuidCliente = req.query.uuidCliente || "";
    try {
      const resultado = await validationService.obtenerEstadoLicencia(licenseKey, uuidCliente, clientIp);
      const duracionMs = Date.now() - inicio;
      await validationService.registrarApiLog({
        fecha: (/* @__PURE__ */ new Date()).toISOString(),
        timestamp: inicio,
        cliente: uuidCliente || "An\xF3nimo",
        uuidCliente,
        licencia: licenseKey,
        endpoint: "/api/v1/license/status",
        metodo: "GET",
        codigoEstado: resultado.status,
        exito: resultado.exito,
        codigoError: resultado.codigoError,
        mensaje: resultado.mensaje,
        ip: clientIp,
        userAgent,
        duracionMs
      });
      if (!resultado.exito) {
        const errResp = responseUtils.error(
          resultado.codigoError || "ERROR_INTERNO",
          resultado.mensaje,
          resultado.status
        );
        return res.status(errResp.status).json(errResp.body);
      }
      const okResp = responseUtils.exito(resultado.data, resultado.mensaje, resultado.status);
      return res.status(okResp.status).json(okResp.body);
    } catch (error) {
      const errResp = responseUtils.error("ERROR_INTERNO", error.message || "Error inesperado.", 500);
      return res.status(errResp.status).json(errResp.body);
    }
  }
};

// src/api/utils/cryptoUtils.ts
var import_crypto = __toESM(require("crypto"), 1);
var getSecret = () => {
  const secret = process.env.LICENSE_HMAC_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("[FATAL SECURITY ERROR] LICENSE_HMAC_SECRET must be configured in environment variables.");
    }
    return "panel-maestro-deli-secret-key-2026-enterprise";
  }
  return secret;
};
var NONCE_TTL_MS = 5 * 60 * 1e3;
var noncesVistos = /* @__PURE__ */ new Map();
setInterval(() => {
  const ahora = Date.now();
  for (const [nonce, ts] of noncesVistos.entries()) {
    if (ahora - ts > NONCE_TTL_MS) {
      noncesVistos.delete(nonce);
    }
  }
}, 2 * 60 * 1e3);
var cryptoUtils = {
  /**
   * Genera la firma HMAC SHA-256 para una petición determinada
   */
  generarFirma(metodo, path2, timestamp, nonce, bodyObj, secret = getSecret()) {
    const bodyStr = bodyObj ? JSON.stringify(bodyObj) : "";
    const payload = `${metodo.toUpperCase()}:${path2}:${timestamp}:${nonce}:${bodyStr}`;
    return import_crypto.default.createHmac("sha256", secret).update(payload).digest("hex");
  },
  /**
   * Valida la firma HMAC recibida en los headers
   */
  validarFirma(metodo, path2, timestamp, nonce, firmaRecibida, bodyObj, secret = getSecret()) {
    if (!firmaRecibida || typeof firmaRecibida !== "string") return false;
    const firmaCalculada = this.generarFirma(metodo, path2, timestamp, nonce, bodyObj, secret);
    try {
      return import_crypto.default.timingSafeEqual(
        Buffer.from(firmaCalculada, "hex"),
        Buffer.from(firmaRecibida, "hex")
      );
    } catch {
      return false;
    }
  },
  /**
   * Valida que el timestamp esté dentro del rango de tolerancia (5 minutos)
   */
  validarTimestamp(timestampStr) {
    if (!timestampStr) return false;
    const ts = Number(timestampStr);
    if (isNaN(ts)) return false;
    const ahora = Date.now();
    const diferencia = Math.abs(ahora - ts);
    return diferencia <= NONCE_TTL_MS;
  },
  /**
   * Detecta y previene Replay Attacks registrando los nonces utilizados
   */
  esNonceReutilizado(nonce, timestampStr) {
    if (!nonce || typeof nonce !== "string") return true;
    if (noncesVistos.has(nonce)) {
      return true;
    }
    const ts = Number(timestampStr) || Date.now();
    noncesVistos.set(nonce, ts);
    return false;
  }
};

// src/api/middlewares/securityMiddleware.ts
var rateLimitMap = /* @__PURE__ */ new Map();
var MAX_PETICIONES_POR_MINUTO = 60;
var VENTANA_RATE_LIMIT_MS = 60 * 1e3;
var securityMiddleware = {
  /**
   * Middleware de Rate Limiting para prevenir ataques de fuerza bruta o saturación
   */
  rateLimiter(req, res, next) {
    const clientIp = req.headers["x-forwarded-for"] || req.ip || "127.0.0.1";
    const ahora = Date.now();
    let record = rateLimitMap.get(clientIp);
    if (!record || ahora > record.resetTime) {
      record = { count: 1, resetTime: ahora + VENTANA_RATE_LIMIT_MS };
      rateLimitMap.set(clientIp, record);
      return next();
    }
    record.count++;
    if (record.count > MAX_PETICIONES_POR_MINUTO) {
      const resp = responseUtils.error(
        "RATE_LIMIT_EXCEEDED",
        `Se ha superado el l\xEDmite de ${MAX_PETICIONES_POR_MINUTO} peticiones por minuto. Intente de nuevo m\xE1s tarde.`,
        429
      );
      return res.status(resp.status).json(resp.body);
    }
    next();
  },
  /**
   * Middleware de Seguridad HMAC, Timestamp y Replay Attacks
   */
  validarHmacYReplay(req, res, next) {
    const timestampHeader = req.headers["x-timestamp"] || "";
    const nonceHeader = req.headers["x-nonce"] || "";
    const signatureHeader = req.headers["x-signature"] || req.headers["x-hmac-signature"] || "";
    const isDevAdminBypass = process.env.NODE_ENV !== "production" && req.headers["x-admin-bypass"] === "true" && process.env.ALLOW_ADMIN_BYPASS === "true";
    if (isDevAdminBypass) {
      return next();
    }
    if (!timestampHeader || !nonceHeader || !signatureHeader) {
      const resp = responseUtils.error(
        "FIRMA_HMAC_INVALIDA",
        "Faltan cabeceras de seguridad obligatorias (x-timestamp, x-nonce, x-signature).",
        401
      );
      return res.status(resp.status).json(resp.body);
    }
    if (!cryptoUtils.validarTimestamp(timestampHeader)) {
      const resp = responseUtils.error(
        "TIMESTAMP_EXPIRADO",
        "El timestamp de la petici\xF3n difiere en m\xE1s de 5 minutos del tiempo del servidor.",
        401
      );
      return res.status(resp.status).json(resp.body);
    }
    if (cryptoUtils.esNonceReutilizado(nonceHeader, timestampHeader)) {
      const resp = responseUtils.error(
        "REPLAY_ATTACK_DETECTADO",
        "El nonce de esta petici\xF3n ya ha sido utilizado. Petici\xF3n rechazada por seguridad.",
        401
      );
      return res.status(resp.status).json(resp.body);
    }
    const path2 = req.originalUrl || req.url;
    const esFirmaValida = cryptoUtils.validarFirma(
      req.method,
      path2,
      timestampHeader,
      nonceHeader,
      signatureHeader,
      req.body
    );
    if (!esFirmaValida) {
      const resp = responseUtils.error(
        "FIRMA_HMAC_INVALIDA",
        "La firma HMAC de la petici\xF3n es inv\xE1lida o el contenido ha sido alterado.",
        401
      );
      return res.status(resp.status).json(resp.body);
    }
    next();
  }
};

// src/api/routes/licenseRoutes.ts
var router = (0, import_express.Router)();
router.use(securityMiddleware.rateLimiter);
router.use(securityMiddleware.validarHmacYReplay);
router.post("/validate", licenseController.validateLicense);
router.post("/activate", licenseController.activateInstallation);
router.post("/heartbeat", licenseController.heartbeat);
router.post("/deactivate", licenseController.deactivateInstallation);
router.post("/renew", licenseController.renewLicense);
router.get("/status", licenseController.getLicenseStatus);
var licenseRoutes_default = router;

// src/api/routes/clientAdminRoutes.ts
var import_express2 = require("express");

// src/api/controllers/clientAdminController.ts
function generarUuidCliente() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let randomStr = "";
  for (let i = 0; i < 10; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `cli_${randomStr}`;
}
var clientAdminController = {
  /**
   * Obtiene la lista completa de clientes
   * GET /api/v1/clients
   */
  async listarClientes(req, res) {
    try {
      const docs = await FirestoreAdminService.queryCollection("clientes", [], {
        orderBy: "fechaCreacion",
        orderDir: "desc"
      });
      const clientes = docs.map((data) => {
        const fechaCreacionStr = data.fechaCreacion ? typeof data.fechaCreacion === "string" ? data.fechaCreacion : data.fechaCreacion.toDate ? data.fechaCreacion.toDate().toISOString() : data.fechaCreacionIso || (/* @__PURE__ */ new Date()).toISOString() : (/* @__PURE__ */ new Date()).toISOString();
        const ultimaModStr = data.ultimaModificacion ? typeof data.ultimaModificacion === "string" ? data.ultimaModificacion : data.ultimaModificacion.toDate ? data.ultimaModificacion.toDate().toISOString() : void 0 : void 0;
        return {
          id: data.id,
          uuidCliente: data.uuidCliente || data.uuid || data.id,
          uuid: data.uuidCliente || data.uuid || data.id,
          nombreEmpresa: data.nombreEmpresa || data.nombre || "Sin nombre",
          nombreComercial: data.nombreComercial || data.nombreEmpresa || data.nombre || "Sin nombre comercial",
          rnc: data.rnc || "N/A",
          telefono: data.telefono || "N/A",
          correo: data.correo || "N/A",
          direccion: data.direccion || "N/A",
          ciudad: data.ciudad || "N/A",
          pais: data.pais || "N/A",
          personaContacto: data.personaContacto || data.contacto || "N/A",
          estado: data.estado || "activo",
          plan: data.plan || "mensual",
          fechaCreacion: fechaCreacionStr,
          ultimaModificacion: ultimaModStr,
          cantidadLicencias: data.cantidadLicencias ?? 0,
          cantidadInstalaciones: data.cantidadInstalaciones ?? 0,
          observaciones: data.observaciones || "",
          tipo: data.tipo || "hospital",
          firebaseProjectId: data.firebaseProjectId || "",
          dominio: data.dominio || ""
        };
      });
      res.status(200).json({
        exito: true,
        data: clientes,
        total: clientes.length
      });
    } catch (error) {
      console.error("[clientAdminController.listarClientes] Error:", error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || "Error al obtener la lista de clientes."
      });
    }
  },
  /**
   * Obtiene un cliente por su ID o UUID
   * GET /api/v1/clients/:id
   */
  async obtenerCliente(req, res) {
    try {
      const { id } = req.params;
      let cliente = await FirestoreAdminService.getDoc("clientes", id);
      if (!cliente) {
        const docs = await FirestoreAdminService.queryCollection("clientes", [
          { field: "uuidCliente", op: "==", value: id }
        ]);
        if (docs.length > 0) {
          cliente = docs[0];
        }
      }
      if (!cliente) {
        res.status(404).json({
          exito: false,
          mensaje: `Cliente con ID o UUID '${id}' no encontrado.`
        });
        return;
      }
      res.status(200).json({
        exito: true,
        data: {
          id: cliente.id,
          uuidCliente: cliente.uuidCliente || cliente.uuid || cliente.id,
          uuid: cliente.uuidCliente || cliente.uuid || cliente.id,
          nombreEmpresa: cliente.nombreEmpresa || cliente.nombre || "Sin nombre",
          nombreComercial: cliente.nombreComercial || cliente.nombreEmpresa || cliente.nombre || "Sin nombre comercial",
          rnc: cliente.rnc || "N/A",
          telefono: cliente.telefono || "N/A",
          correo: cliente.correo || "N/A",
          direccion: cliente.direccion || "N/A",
          ciudad: cliente.ciudad || "N/A",
          pais: cliente.pais || "N/A",
          personaContacto: cliente.personaContacto || cliente.contacto || "N/A",
          estado: cliente.estado || "activo",
          plan: cliente.plan || "mensual",
          fechaCreacion: cliente.fechaCreacion ? typeof cliente.fechaCreacion === "string" ? cliente.fechaCreacion : cliente.fechaCreacion.toDate ? cliente.fechaCreacion.toDate().toISOString() : cliente.fechaCreacionIso || (/* @__PURE__ */ new Date()).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
          ultimaModificacion: cliente.ultimaModificacion ? typeof cliente.ultimaModificacion === "string" ? cliente.ultimaModificacion : cliente.ultimaModificacion.toDate ? cliente.ultimaModificacion.toDate().toISOString() : void 0 : void 0,
          cantidadLicencias: cliente.cantidadLicencias ?? 0,
          cantidadInstalaciones: cliente.cantidadInstalaciones ?? 0,
          observaciones: cliente.observaciones || "",
          tipo: cliente.tipo || "hospital",
          firebaseProjectId: cliente.firebaseProjectId || "",
          dominio: cliente.dominio || ""
        }
      });
    } catch (error) {
      console.error("[clientAdminController.obtenerCliente] Error:", error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || "Error al obtener el cliente."
      });
    }
  },
  /**
   * Crea un nuevo cliente con UUID único y validación de duplicados
   * POST /api/v1/clients
   */
  async crearCliente(req, res) {
    try {
      const {
        nombreEmpresa,
        nombreComercial,
        rnc,
        telefono,
        correo,
        direccion,
        ciudad,
        pais,
        personaContacto,
        plan,
        tipo,
        firebaseProjectId,
        dominio,
        observaciones,
        userUid,
        userCorreo
      } = req.body;
      if (!nombreEmpresa || !correo) {
        res.status(400).json({
          exito: false,
          mensaje: "El nombre de la empresa y el correo electr\xF3nico son obligatorios."
        });
        return;
      }
      const correoLimpio = correo.trim().toLowerCase();
      const rncLimpio = (rnc || "").trim();
      if (rncLimpio.length > 0) {
        const docsRnc = await FirestoreAdminService.queryCollection("clientes", [
          { field: "rnc", op: "==", value: rncLimpio }
        ]);
        if (docsRnc.length > 0) {
          res.status(409).json({
            exito: false,
            mensaje: `El RNC/Identificaci\xF3n "${rncLimpio}" ya se encuentra registrado para otro cliente.`
          });
          return;
        }
      }
      const docsCorreo = await FirestoreAdminService.queryCollection("clientes", [
        { field: "correo", op: "==", value: correoLimpio }
      ]);
      if (docsCorreo.length > 0) {
        res.status(409).json({
          exito: false,
          mensaje: `El correo electr\xF3nico "${correoLimpio}" ya est\xE1 en uso por otro cliente.`
        });
        return;
      }
      const uuidGenerado = generarUuidCliente();
      const fechaHora = (/* @__PURE__ */ new Date()).toISOString();
      const payloadCliente = {
        uuidCliente: uuidGenerado,
        uuid: uuidGenerado,
        nombreEmpresa: nombreEmpresa.trim(),
        nombreComercial: (nombreComercial || nombreEmpresa).trim(),
        rnc: rncLimpio || "N/A",
        telefono: (telefono || "").trim(),
        correo: correoLimpio,
        direccion: (direccion || "").trim(),
        ciudad: (ciudad || "").trim(),
        pais: (pais || "").trim(),
        personaContacto: (personaContacto || "").trim(),
        estado: "activo",
        plan: plan || "mensual",
        fechaCreacion: FirestoreAdminService.serverTimestamp(),
        fechaCreacionIso: fechaHora,
        ultimaModificacion: FirestoreAdminService.serverTimestamp(),
        cantidadLicencias: 0,
        cantidadInstalaciones: 0,
        observaciones: (observaciones || "").trim(),
        tipo: tipo || "hospital",
        firebaseProjectId: (firebaseProjectId || "").trim(),
        dominio: (dominio || "").trim()
      };
      const { id } = await FirestoreAdminService.addDoc("clientes", payloadCliente);
      await FirestoreAdminService.addDoc("auditoria", {
        fecha: FirestoreAdminService.serverTimestamp(),
        usuarioUid: userUid || "system",
        usuarioCorreo: userCorreo || "admin@sistema.local",
        accion: "Creaci\xF3n de Cliente",
        modulo: "Clientes",
        detalles: `Se cre\xF3 el cliente ${nombreEmpresa} con UUID ${uuidGenerado} (ID: ${id})`,
        exito: true
      });
      res.status(201).json({
        exito: true,
        mensaje: `Cliente ${nombreEmpresa} creado exitosamente.`,
        data: {
          id,
          uuidCliente: uuidGenerado,
          uuid: uuidGenerado,
          ...payloadCliente,
          fechaCreacion: fechaHora,
          ultimaModificacion: fechaHora
        }
      });
    } catch (error) {
      console.error("[clientAdminController.crearCliente] Error:", error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || "Error al crear el cliente."
      });
    }
  },
  /**
   * Actualiza un cliente existente
   * PUT /api/v1/clients/:id
   */
  async actualizarCliente(req, res) {
    try {
      const { id } = req.params;
      const {
        nombreEmpresa,
        nombreComercial,
        rnc,
        telefono,
        correo,
        direccion,
        ciudad,
        pais,
        personaContacto,
        plan,
        tipo,
        firebaseProjectId,
        dominio,
        observaciones,
        userUid,
        userCorreo
      } = req.body;
      const clienteExistente = await FirestoreAdminService.getDoc("clientes", id);
      if (!clienteExistente) {
        res.status(404).json({
          exito: false,
          mensaje: "El cliente especificado no existe."
        });
        return;
      }
      const correoLimpio = correo ? correo.trim().toLowerCase() : clienteExistente.correo;
      const rncLimpio = rnc !== void 0 ? rnc.trim() : clienteExistente.rnc;
      if (rncLimpio && rncLimpio.length > 0 && rncLimpio !== "N/A") {
        const docsRnc = await FirestoreAdminService.queryCollection("clientes", [
          { field: "rnc", op: "==", value: rncLimpio }
        ]);
        const existeOtro = docsRnc.some((d) => d.id !== id);
        if (existeOtro) {
          res.status(409).json({
            exito: false,
            mensaje: `El RNC/Identificaci\xF3n "${rncLimpio}" ya se encuentra registrado para otro cliente.`
          });
          return;
        }
      }
      if (correoLimpio && correoLimpio.length > 0) {
        const docsCorreo = await FirestoreAdminService.queryCollection("clientes", [
          { field: "correo", op: "==", value: correoLimpio }
        ]);
        const existeOtro = docsCorreo.some((d) => d.id !== id);
        if (existeOtro) {
          res.status(409).json({
            exito: false,
            mensaje: `El correo electr\xF3nico "${correoLimpio}" ya est\xE1 en uso por otro cliente.`
          });
          return;
        }
      }
      const updatePayload = {
        nombreEmpresa: (nombreEmpresa || clienteExistente.nombreEmpresa).trim(),
        nombreComercial: (nombreComercial || clienteExistente.nombreComercial || nombreEmpresa).trim(),
        rnc: rncLimpio,
        telefono: telefono !== void 0 ? telefono.trim() : clienteExistente.telefono,
        correo: correoLimpio,
        direccion: direccion !== void 0 ? direccion.trim() : clienteExistente.direccion,
        ciudad: ciudad !== void 0 ? ciudad.trim() : clienteExistente.ciudad,
        pais: pais !== void 0 ? pais.trim() : clienteExistente.pais,
        personaContacto: personaContacto !== void 0 ? personaContacto.trim() : clienteExistente.personaContacto,
        plan: plan || clienteExistente.plan,
        tipo: tipo || clienteExistente.tipo || "hospital",
        firebaseProjectId: firebaseProjectId !== void 0 ? firebaseProjectId.trim() : clienteExistente.firebaseProjectId || "",
        dominio: dominio !== void 0 ? dominio.trim() : clienteExistente.dominio || "",
        observaciones: observaciones !== void 0 ? observaciones.trim() : clienteExistente.observaciones || "",
        ultimaModificacion: FirestoreAdminService.serverTimestamp()
      };
      await FirestoreAdminService.updateDoc("clientes", id, updatePayload);
      await FirestoreAdminService.addDoc("auditoria", {
        fecha: FirestoreAdminService.serverTimestamp(),
        usuarioUid: userUid || "system",
        usuarioCorreo: userCorreo || "admin@sistema.local",
        accion: "Actualizaci\xF3n de Cliente",
        modulo: "Clientes",
        detalles: `Se actualiz\xF3 la informaci\xF3n del cliente ${updatePayload.nombreEmpresa} (ID: ${id})`,
        exito: true
      });
      res.status(200).json({
        exito: true,
        mensaje: "Cliente actualizado exitosamente."
      });
    } catch (error) {
      console.error("[clientAdminController.actualizarCliente] Error:", error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || "Error al actualizar el cliente."
      });
    }
  },
  /**
   * Cambia el estado de un cliente (activo, suspendido, cancelado)
   * PATCH /api/v1/clients/:id/status
   */
  async cambiarEstadoCliente(req, res) {
    try {
      const { id } = req.params;
      const { nuevoEstado, userUid, userCorreo } = req.body;
      if (!nuevoEstado) {
        res.status(400).json({
          exito: false,
          mensaje: "El campo nuevoEstado es obligatorio."
        });
        return;
      }
      const cliente = await FirestoreAdminService.getDoc("clientes", id);
      if (!cliente) {
        res.status(404).json({
          exito: false,
          mensaje: "El cliente no existe."
        });
        return;
      }
      await FirestoreAdminService.updateDoc("clientes", id, {
        estado: nuevoEstado,
        ultimaModificacion: FirestoreAdminService.serverTimestamp()
      });
      const accionStr = nuevoEstado === "suspendido" ? "Suspensi\xF3n de Cliente" : nuevoEstado === "activo" ? "Reactivaci\xF3n de Cliente" : nuevoEstado === "cancelado" ? "Cancelaci\xF3n de Cliente" : "Cambio de Estado de Cliente";
      await FirestoreAdminService.addDoc("auditoria", {
        fecha: FirestoreAdminService.serverTimestamp(),
        usuarioUid: userUid || "system",
        usuarioCorreo: userCorreo || "admin@sistema.local",
        accion: accionStr,
        modulo: "Clientes",
        detalles: `Se cambi\xF3 el estado del cliente ${cliente.nombreEmpresa || id} a '${nuevoEstado}'`,
        exito: true
      });
      res.status(200).json({
        exito: true,
        mensaje: `Estado del cliente actualizado a '${nuevoEstado}'.`
      });
    } catch (error) {
      console.error("[clientAdminController.cambiarEstadoCliente] Error:", error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || "Error al cambiar estado del cliente."
      });
    }
  },
  /**
   * Elimina un cliente permanentemente si no posee licencias vinculadas
   * DELETE /api/v1/clients/:id
   */
  async eliminarCliente(req, res) {
    try {
      const { id } = req.params;
      const { userUid, userCorreo } = req.body;
      const cliente = await FirestoreAdminService.getDoc("clientes", id);
      if (!cliente) {
        res.status(404).json({
          exito: false,
          mensaje: "El cliente que intenta eliminar no existe."
        });
        return;
      }
      const uuidCliente = cliente.uuidCliente || cliente.uuid || id;
      const nombreEmpresa = cliente.nombreEmpresa || "Cliente";
      if ((cliente.cantidadLicencias || 0) > 0) {
        res.status(409).json({
          exito: false,
          mensaje: `No es posible eliminar el cliente "${nombreEmpresa}" porque posee ${cliente.cantidadLicencias} licencia(s) registrada(s).`
        });
        return;
      }
      const licenciasVinculadas = await FirestoreAdminService.queryCollection("licencias", [
        { field: "clienteUuid", op: "==", value: uuidCliente }
      ]);
      const licenciasPorId = await FirestoreAdminService.queryCollection("licencias", [
        { field: "clienteId", op: "==", value: id }
      ]);
      if (licenciasVinculadas.length > 0 || licenciasPorId.length > 0) {
        res.status(409).json({
          exito: false,
          mensaje: `No se puede eliminar el cliente "${nombreEmpresa}" porque existen registros de licencias activas o hist\xF3ricas vinculadas.`
        });
        return;
      }
      await FirestoreAdminService.deleteDoc("clientes", id);
      await FirestoreAdminService.addDoc("auditoria", {
        fecha: FirestoreAdminService.serverTimestamp(),
        usuarioUid: userUid || "system",
        usuarioCorreo: userCorreo || "admin@sistema.local",
        accion: "Eliminaci\xF3n de Cliente",
        modulo: "Clientes",
        detalles: `Se elimin\xF3 permanentemente el cliente ${nombreEmpresa} (UUID: ${uuidCliente}, ID: ${id})`,
        exito: true
      });
      res.status(200).json({
        exito: true,
        mensaje: `Cliente "${nombreEmpresa}" eliminado correctamente.`
      });
    } catch (error) {
      console.error("[clientAdminController.eliminarCliente] Error:", error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || "Error al eliminar el cliente."
      });
    }
  }
};

// src/api/routes/clientAdminRoutes.ts
var router2 = (0, import_express2.Router)();
router2.get("/", clientAdminController.listarClientes);
router2.get("/:id", clientAdminController.obtenerCliente);
router2.post("/", clientAdminController.crearCliente);
router2.put("/:id", clientAdminController.actualizarCliente);
router2.patch("/:id/status", clientAdminController.cambiarEstadoCliente);
router2.delete("/:id", clientAdminController.eliminarCliente);
var clientAdminRoutes_default = router2;

// src/api/routes/licenseAdminRoutes.ts
var import_express3 = require("express");

// src/api/controllers/licenseAdminController.ts
function generarLicenseKeySync() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const frag = (len = 4) => {
    let s = "";
    for (let i = 0; i < len; i++) {
      s += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return s;
  };
  return `DELI-${frag(4)}-${frag(4)}-${frag(4)}-${frag(4)}`;
}
function calcularFechaExpiracion(tipo, duracionDiasPersonalizada) {
  const fecha = /* @__PURE__ */ new Date();
  switch (tipo) {
    case "mensual":
      fecha.setMonth(fecha.getMonth() + 1);
      break;
    case "trimestral":
      fecha.setMonth(fecha.getMonth() + 3);
      break;
    case "semestral":
      fecha.setMonth(fecha.getMonth() + 6);
      break;
    case "anual":
      fecha.setFullYear(fecha.getFullYear() + 1);
      break;
    case "permanente":
      fecha.setFullYear(fecha.getFullYear() + 99);
      break;
    case "prueba":
      fecha.setDate(fecha.getDate() + 14);
      break;
    case "personalizada":
      fecha.setDate(fecha.getDate() + (duracionDiasPersonalizada && duracionDiasPersonalizada > 0 ? duracionDiasPersonalizada : 30));
      break;
    default:
      fecha.setFullYear(fecha.getFullYear() + 1);
  }
  return fecha;
}
function calcularDiasRestantes(fechaExpIso) {
  try {
    const exp = new Date(fechaExpIso);
    const ahora = /* @__PURE__ */ new Date();
    const diffMs = exp.getTime() - ahora.getTime();
    const dias = Math.ceil(diffMs / (1e3 * 60 * 60 * 24));
    return dias > 0 ? dias : 0;
  } catch {
    return 0;
  }
}
function evaluarEstado(estadoActual, fechaExpIso, tipo) {
  if (estadoActual === "suspendida" || estadoActual === "revocada" || estadoActual === "inactiva") {
    return estadoActual;
  }
  if (tipo === "permanente") {
    return "activa";
  }
  const dias = calcularDiasRestantes(fechaExpIso);
  if (dias <= 0) {
    return "expirada";
  }
  return estadoActual;
}
var licenseAdminController = {
  /**
   * Obtiene la lista completa de licencias (con filtrado opcional)
   * GET /api/v1/licenses
   */
  async listarLicencias(req, res) {
    try {
      const { clienteId, estado } = req.query;
      const conditions = [];
      if (clienteId && typeof clienteId === "string") {
        conditions.push({ field: "clienteId", op: "==", value: clienteId });
      }
      if (estado && typeof estado === "string") {
        conditions.push({ field: "estado", op: "==", value: estado });
      }
      const docs = await FirestoreAdminService.queryCollection("licencias", conditions, {
        orderBy: "fechaCreacion",
        orderDir: "desc"
      });
      const licencias = docs.map((data) => {
        const fechaExpIso = data.fechaExpiracion ? typeof data.fechaExpiracion === "string" ? data.fechaExpiracion : data.fechaExpiracion.toDate ? data.fechaExpiracion.toDate().toISOString() : (/* @__PURE__ */ new Date()).toISOString() : (/* @__PURE__ */ new Date()).toISOString();
        const tipoLic = data.tipoLicencia || data.plan || "anual";
        const estadoEvaluado = evaluarEstado(data.estado || "activa", fechaExpIso, tipoLic);
        const diasRestantes = calcularDiasRestantes(fechaExpIso);
        const fechaCreacionStr = data.fechaCreacion ? typeof data.fechaCreacion === "string" ? data.fechaCreacion : data.fechaCreacion.toDate ? data.fechaCreacion.toDate().toISOString() : data.fechaCreacionIso || (/* @__PURE__ */ new Date()).toISOString() : (/* @__PURE__ */ new Date()).toISOString();
        const fechaActStr = data.fechaActivacion ? typeof data.fechaActivacion === "string" ? data.fechaActivacion : data.fechaActivacion.toDate ? data.fechaActivacion.toDate().toISOString() : data.fechaActivacionIso : void 0;
        const ultimaValidacionStr = data.ultimaValidacion ? typeof data.ultimaValidacion === "string" ? data.ultimaValidacion : data.ultimaValidacion.toDate ? data.ultimaValidacion.toDate().toISOString() : void 0 : void 0;
        const ultimaConexionStr = data.ultimaConexion ? typeof data.ultimaConexion === "string" ? data.ultimaConexion : data.ultimaConexion.toDate ? data.ultimaConexion.toDate().toISOString() : void 0 : void 0;
        return {
          id: data.id,
          licenseKey: data.licenseKey || "SIN-CLAVE",
          clienteId: data.clienteId || "",
          uuidCliente: data.uuidCliente || data.clienteUuid || "",
          clienteUuid: data.uuidCliente || data.clienteUuid || "",
          nombreEmpresa: data.nombreEmpresa || "Cliente sin asignar",
          tipoLicencia: tipoLic,
          plan: data.plan || tipoLic,
          estado: estadoEvaluado,
          versionMinima: data.versionMinima || "1.0.0",
          versionMaxima: data.versionMaxima || "9.9.9",
          fechaCreacion: fechaCreacionStr,
          fechaActivacion: fechaActStr,
          fechaExpiracion: fechaExpIso,
          fechaVencimiento: fechaExpIso,
          diasRestantes,
          cantidadInstalacionesPermitidas: data.cantidadInstalacionesPermitidas ?? data.instalacionesMaximas ?? 1,
          cantidadInstalacionesUsadas: Array.isArray(data.installationIds) ? data.installationIds.length : data.cantidadInstalacionesUsadas ?? 0,
          instalacionesMaximas: data.cantidadInstalacionesPermitidas ?? data.instalacionesMaximas ?? 1,
          renovaciones: Array.isArray(data.renovaciones) ? data.renovaciones : [],
          ultimaValidacion: ultimaValidacionStr,
          ultimaConexion: ultimaConexionStr,
          installationIds: Array.isArray(data.installationIds) ? data.installationIds : [],
          observaciones: data.observaciones || data.notas || "",
          notas: data.observaciones || data.notas || "",
          creadoPor: data.creadoPor || data.creadoPorUid || "Administrador",
          creadoPorUid: data.creadoPorUid || ""
        };
      });
      res.status(200).json({
        exito: true,
        data: licencias,
        total: licencias.length
      });
    } catch (error) {
      console.error("[licenseAdminController.listarLicencias] Error:", error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || "Error al listar las licencias."
      });
    }
  },
  /**
   * Obtiene el detalle de una licencia por su ID o clave
   * GET /api/v1/licenses/:id
   */
  async obtenerLicencia(req, res) {
    try {
      const { id } = req.params;
      let data = await FirestoreAdminService.getDoc("licencias", id);
      if (!data) {
        const docs = await FirestoreAdminService.queryCollection("licencias", [
          { field: "licenseKey", op: "==", value: id }
        ]);
        if (docs.length > 0) {
          data = docs[0];
        }
      }
      if (!data) {
        res.status(404).json({
          exito: false,
          mensaje: `Licencia con identificador '${id}' no encontrada.`
        });
        return;
      }
      const fechaExpIso = data.fechaExpiracion ? typeof data.fechaExpiracion === "string" ? data.fechaExpiracion : data.fechaExpiracion.toDate ? data.fechaExpiracion.toDate().toISOString() : (/* @__PURE__ */ new Date()).toISOString() : (/* @__PURE__ */ new Date()).toISOString();
      const tipoLic = data.tipoLicencia || data.plan || "anual";
      const estadoEvaluado = evaluarEstado(data.estado || "activa", fechaExpIso, tipoLic);
      const diasRestantes = calcularDiasRestantes(fechaExpIso);
      res.status(200).json({
        exito: true,
        data: {
          id: data.id,
          licenseKey: data.licenseKey || "SIN-CLAVE",
          clienteId: data.clienteId || "",
          uuidCliente: data.uuidCliente || data.clienteUuid || "",
          clienteUuid: data.uuidCliente || data.clienteUuid || "",
          nombreEmpresa: data.nombreEmpresa || "Cliente sin asignar",
          tipoLicencia: tipoLic,
          plan: data.plan || tipoLic,
          estado: estadoEvaluado,
          versionMinima: data.versionMinima || "1.0.0",
          versionMaxima: data.versionMaxima || "9.9.9",
          fechaCreacion: data.fechaCreacion ? typeof data.fechaCreacion === "string" ? data.fechaCreacion : data.fechaCreacion.toDate ? data.fechaCreacion.toDate().toISOString() : data.fechaCreacionIso || (/* @__PURE__ */ new Date()).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
          fechaActivacion: data.fechaActivacion ? typeof data.fechaActivacion === "string" ? data.fechaActivacion : data.fechaActivacion.toDate ? data.fechaActivacion.toDate().toISOString() : data.fechaActivacionIso : void 0,
          fechaExpiracion: fechaExpIso,
          fechaVencimiento: fechaExpIso,
          diasRestantes,
          cantidadInstalacionesPermitidas: data.cantidadInstalacionesPermitidas ?? data.instalacionesMaximas ?? 1,
          cantidadInstalacionesUsadas: Array.isArray(data.installationIds) ? data.installationIds.length : data.cantidadInstalacionesUsadas ?? 0,
          instalacionesMaximas: data.cantidadInstalacionesPermitidas ?? data.instalacionesMaximas ?? 1,
          renovaciones: Array.isArray(data.renovaciones) ? data.renovaciones : [],
          installationIds: Array.isArray(data.installationIds) ? data.installationIds : [],
          observaciones: data.observaciones || data.notas || "",
          notas: data.observaciones || data.notas || "",
          creadoPor: data.creadoPor || data.creadoPorUid || "Administrador",
          creadoPorUid: data.creadoPorUid || ""
        }
      });
    } catch (error) {
      console.error("[licenseAdminController.obtenerLicencia] Error:", error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || "Error al obtener la licencia."
      });
    }
  },
  /**
   * Genera y crea una nueva licencia asociada a un cliente
   * POST /api/v1/licenses
   */
  async crearLicencia(req, res) {
    try {
      const {
        clienteId,
        uuidCliente,
        nombreEmpresa,
        tipoLicencia,
        versionMinima,
        versionMaxima,
        cantidadInstalacionesPermitidas,
        duracionDiasPersonalizada,
        observaciones,
        userUid,
        userCorreo
      } = req.body;
      if (!clienteId) {
        res.status(400).json({
          exito: false,
          mensaje: "Debe especificar el clienteId para vincular la licencia."
        });
        return;
      }
      if (!cantidadInstalacionesPermitidas || Number(cantidadInstalacionesPermitidas) <= 0) {
        res.status(400).json({
          exito: false,
          mensaje: "La cantidad de instalaciones permitidas debe ser un n\xFAmero entero mayor a 0."
        });
        return;
      }
      const clienteDoc = await FirestoreAdminService.getDoc("clientes", clienteId);
      if (!clienteDoc) {
        res.status(404).json({
          exito: false,
          mensaje: "El cliente seleccionado no existe en el sistema."
        });
        return;
      }
      let keyGenerada = "";
      let intentos = 0;
      let existeKey = true;
      while (existeKey && intentos < 10) {
        intentos++;
        keyGenerada = generarLicenseKeySync();
        const existentes = await FirestoreAdminService.queryCollection("licencias", [
          { field: "licenseKey", op: "==", value: keyGenerada }
        ]);
        if (existentes.length === 0) {
          existeKey = false;
        }
      }
      const tipoFinal = tipoLicencia || "anual";
      const fechaExpDate = calcularFechaExpiracion(tipoFinal, duracionDiasPersonalizada);
      const fechaExpIso = fechaExpDate.toISOString();
      const fechaHoraActual = (/* @__PURE__ */ new Date()).toISOString();
      const diasRestantes = calcularDiasRestantes(fechaExpIso);
      const resolvedUuidCliente = uuidCliente || clienteDoc.uuidCliente || clienteDoc.uuid || clienteId;
      const resolvedNombreEmpresa = nombreEmpresa || clienteDoc.nombreEmpresa || "Cliente";
      const payloadLicencia = {
        licenseKey: keyGenerada,
        clienteId,
        uuidCliente: resolvedUuidCliente,
        clienteUuid: resolvedUuidCliente,
        nombreEmpresa: resolvedNombreEmpresa,
        tipoLicencia: tipoFinal,
        plan: tipoFinal,
        estado: "activa",
        versionMinima: (versionMinima || "1.0.0").trim(),
        versionMaxima: (versionMaxima || "9.9.9").trim(),
        fechaCreacion: FirestoreAdminService.serverTimestamp(),
        fechaCreacionIso: fechaHoraActual,
        fechaActivacion: FirestoreAdminService.serverTimestamp(),
        fechaActivacionIso: fechaHoraActual,
        fechaExpiracion: fechaExpIso,
        fechaVencimiento: fechaExpIso,
        diasRestantes,
        cantidadInstalacionesPermitidas: Number(cantidadInstalacionesPermitidas),
        cantidadInstalacionesUsadas: 0,
        instalacionesMaximas: Number(cantidadInstalacionesPermitidas),
        renovaciones: [],
        installationIds: [],
        observaciones: (observaciones || "").trim(),
        notas: (observaciones || "").trim(),
        creadoPor: userCorreo || "Administrador",
        creadoPorUid: userUid || "system",
        ultimaModificacion: FirestoreAdminService.serverTimestamp()
      };
      const { id } = await FirestoreAdminService.addDoc("licencias", payloadLicencia);
      const licActuales = clienteDoc.cantidadLicencias && typeof clienteDoc.cantidadLicencias === "number" ? clienteDoc.cantidadLicencias : 0;
      await FirestoreAdminService.updateDoc("clientes", clienteId, {
        cantidadLicencias: licActuales + 1,
        ultimaModificacion: FirestoreAdminService.serverTimestamp()
      });
      await FirestoreAdminService.addDoc("auditoria", {
        fecha: FirestoreAdminService.serverTimestamp(),
        usuarioUid: userUid || "system",
        usuarioCorreo: userCorreo || "admin@sistema.local",
        accion: "Emisi\xF3n de Licencia",
        modulo: "Licencias",
        detalles: `Se emiti\xF3 la licencia ${keyGenerada} de tipo '${tipoFinal}' para el cliente ${resolvedNombreEmpresa} (ID: ${id})`,
        exito: true
      });
      res.status(201).json({
        exito: true,
        mensaje: `Licencia ${keyGenerada} emitida con \xE9xito.`,
        data: {
          id,
          ...payloadLicencia,
          fechaCreacion: fechaHoraActual,
          fechaActivacion: fechaHoraActual
        }
      });
    } catch (error) {
      console.error("[licenseAdminController.crearLicencia] Error:", error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || "Error al emitir la licencia."
      });
    }
  },
  /**
   * Actualiza parámetros de configuración de una licencia
   * PUT /api/v1/licenses/:id
   */
  async actualizarLicencia(req, res) {
    try {
      const { id } = req.params;
      const {
        versionMinima,
        versionMaxima,
        cantidadInstalacionesPermitidas,
        observaciones,
        userUid,
        userCorreo
      } = req.body;
      const licencia = await FirestoreAdminService.getDoc("licencias", id);
      if (!licencia) {
        res.status(404).json({
          exito: false,
          mensaje: "La licencia especificada no existe."
        });
        return;
      }
      const instalacionesUsadas = Array.isArray(licencia.installationIds) ? licencia.installationIds.length : licencia.cantidadInstalacionesUsadas || 0;
      if (cantidadInstalacionesPermitidas !== void 0 && Number(cantidadInstalacionesPermitidas) < instalacionesUsadas) {
        res.status(400).json({
          exito: false,
          mensaje: `La cantidad de instalaciones permitidas (${cantidadInstalacionesPermitidas}) no puede ser menor a las ya registradas (${instalacionesUsadas}).`
        });
        return;
      }
      const updatePayload = {
        versionMinima: versionMinima !== void 0 ? versionMinima.trim() : licencia.versionMinima || "1.0.0",
        versionMaxima: versionMaxima !== void 0 ? versionMaxima.trim() : licencia.versionMaxima || "9.9.9",
        cantidadInstalacionesPermitidas: cantidadInstalacionesPermitidas !== void 0 ? Number(cantidadInstalacionesPermitidas) : licencia.cantidadInstalacionesPermitidas,
        instalacionesMaximas: cantidadInstalacionesPermitidas !== void 0 ? Number(cantidadInstalacionesPermitidas) : licencia.cantidadInstalacionesPermitidas,
        observaciones: observaciones !== void 0 ? observaciones.trim() : licencia.observaciones || "",
        notas: observaciones !== void 0 ? observaciones.trim() : licencia.observaciones || "",
        ultimaModificacion: FirestoreAdminService.serverTimestamp()
      };
      await FirestoreAdminService.updateDoc("licencias", id, updatePayload);
      await FirestoreAdminService.addDoc("auditoria", {
        fecha: FirestoreAdminService.serverTimestamp(),
        usuarioUid: userUid || "system",
        usuarioCorreo: userCorreo || "admin@sistema.local",
        accion: "Actualizaci\xF3n de Licencia",
        modulo: "Licencias",
        detalles: `Se actualizaron los par\xE1metros de la licencia ${licencia.licenseKey} (ID: ${id})`,
        exito: true
      });
      res.status(200).json({
        exito: true,
        mensaje: "Licencia actualizada exitosamente."
      });
    } catch (error) {
      console.error("[licenseAdminController.actualizarLicencia] Error:", error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || "Error al actualizar la licencia."
      });
    }
  },
  /**
   * Cambia el estado operativo de una licencia (activa, suspendida, revocada)
   * PATCH /api/v1/licenses/:id/status
   */
  async cambiarEstadoLicencia(req, res) {
    try {
      const { id } = req.params;
      const { nuevoEstado, userUid, userCorreo } = req.body;
      if (!nuevoEstado) {
        res.status(400).json({
          exito: false,
          mensaje: "El campo nuevoEstado es obligatorio."
        });
        return;
      }
      const licencia = await FirestoreAdminService.getDoc("licencias", id);
      if (!licencia) {
        res.status(404).json({
          exito: false,
          mensaje: "La licencia especificada no existe."
        });
        return;
      }
      await FirestoreAdminService.updateDoc("licencias", id, {
        estado: nuevoEstado,
        ultimaModificacion: FirestoreAdminService.serverTimestamp()
      });
      const accionStr = nuevoEstado === "suspendida" ? "Suspensi\xF3n de Licencia" : nuevoEstado === "activa" ? "Reactivaci\xF3n de Licencia" : nuevoEstado === "revocada" ? "Revocaci\xF3n de Licencia" : "Cambio de Estado de Licencia";
      await FirestoreAdminService.addDoc("auditoria", {
        fecha: FirestoreAdminService.serverTimestamp(),
        usuarioUid: userUid || "system",
        usuarioCorreo: userCorreo || "admin@sistema.local",
        accion: accionStr,
        modulo: "Licencias",
        detalles: `Se cambi\xF3 el estado de la licencia ${licencia.licenseKey} a '${nuevoEstado}'`,
        exito: true
      });
      res.status(200).json({
        exito: true,
        mensaje: `Estado de la licencia actualizado a '${nuevoEstado}'.`
      });
    } catch (error) {
      console.error("[licenseAdminController.cambiarEstadoLicencia] Error:", error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || "Error al cambiar el estado de la licencia."
      });
    }
  },
  /**
   * Renueva el tiempo de vigencia de una licencia
   * POST /api/v1/licenses/:id/renew
   */
  async renovarLicencia(req, res) {
    try {
      const { id } = req.params;
      const { diasAnadidos, observaciones, userUid, userCorreo } = req.body;
      if (!diasAnadidos || Number(diasAnadidos) <= 0) {
        res.status(400).json({
          exito: false,
          mensaje: "La cantidad de d\xEDas a\xF1adidos debe ser mayor a 0."
        });
        return;
      }
      const licencia = await FirestoreAdminService.getDoc("licencias", id);
      if (!licencia) {
        res.status(404).json({
          exito: false,
          mensaje: "La licencia especificada no existe."
        });
        return;
      }
      const expActualDate = licencia.fechaExpiracion ? new Date(licencia.fechaExpiracion) : /* @__PURE__ */ new Date();
      const baseDate = expActualDate.getTime() > Date.now() ? expActualDate : /* @__PURE__ */ new Date();
      const nuevaExpDate = new Date(baseDate.getTime() + Number(diasAnadidos) * 24 * 60 * 60 * 1e3);
      const nuevaExpIso = nuevaExpDate.toISOString();
      const registroRenovacion = {
        fecha: (/* @__PURE__ */ new Date()).toISOString(),
        diasAnadidos: Number(diasAnadidos),
        renovadoPor: userCorreo || "Administrador",
        nuevoVencimiento: nuevaExpIso,
        observaciones: (observaciones || "").trim()
      };
      const renovacionesExistentes = Array.isArray(licencia.renovaciones) ? licencia.renovaciones : [];
      await FirestoreAdminService.updateDoc("licencias", id, {
        fechaExpiracion: nuevaExpIso,
        fechaVencimiento: nuevaExpIso,
        diasRestantes: calcularDiasRestantes(nuevaExpIso),
        estado: "activa",
        renovaciones: [...renovacionesExistentes, registroRenovacion],
        ultimaModificacion: FirestoreAdminService.serverTimestamp()
      });
      await FirestoreAdminService.addDoc("auditoria", {
        fecha: FirestoreAdminService.serverTimestamp(),
        usuarioUid: userUid || "system",
        usuarioCorreo: userCorreo || "admin@sistema.local",
        accion: "Renovaci\xF3n de Licencia",
        modulo: "Licencias",
        detalles: `Se renov\xF3 la licencia ${licencia.licenseKey} sumando ${diasAnadidos} d\xEDas. Nuevo vencimiento: ${nuevaExpDate.toLocaleDateString("es-ES")}`,
        exito: true
      });
      res.status(200).json({
        exito: true,
        mensaje: `Licencia renovada por ${diasAnadidos} d\xEDas con \xE9xito.`,
        data: {
          id,
          nuevaFechaExpiracion: nuevaExpIso,
          diasRestantes: calcularDiasRestantes(nuevaExpIso),
          estado: "activa"
        }
      });
    } catch (error) {
      console.error("[licenseAdminController.renovarLicencia] Error:", error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || "Error al renovar la licencia."
      });
    }
  },
  /**
   * Elimina una licencia que nunca haya sido activada
   * DELETE /api/v1/licenses/:id
   */
  async eliminarLicencia(req, res) {
    try {
      const { id } = req.params;
      const { userUid, userCorreo } = req.body;
      const licencia = await FirestoreAdminService.getDoc("licencias", id);
      if (!licencia) {
        res.status(404).json({
          exito: false,
          mensaje: "La licencia que intenta eliminar no existe."
        });
        return;
      }
      const instalacionesUsadas = Array.isArray(licencia.installationIds) ? licencia.installationIds.length : licencia.cantidadInstalacionesUsadas || 0;
      if (instalacionesUsadas > 0) {
        res.status(409).json({
          exito: false,
          mensaje: `No es posible eliminar la licencia "${licencia.licenseKey}" porque ya fue activada en ${instalacionesUsadas} instalaci\xF3n(es). Para deshabilitarla, utilice la opci\xF3n de "Revocar" o "Suspender".`
        });
        return;
      }
      await FirestoreAdminService.deleteDoc("licencias", id);
      if (licencia.clienteId) {
        try {
          const cliDoc = await FirestoreAdminService.getDoc("clientes", licencia.clienteId);
          if (cliDoc) {
            const licActuales = cliDoc.cantidadLicencias && typeof cliDoc.cantidadLicencias === "number" ? cliDoc.cantidadLicencias : 1;
            await FirestoreAdminService.updateDoc("clientes", licencia.clienteId, {
              cantidadLicencias: Math.max(0, licActuales - 1),
              ultimaModificacion: FirestoreAdminService.serverTimestamp()
            });
          }
        } catch (err) {
          console.warn("No se pudo decrementar contador en cliente:", err);
        }
      }
      await FirestoreAdminService.addDoc("auditoria", {
        fecha: FirestoreAdminService.serverTimestamp(),
        usuarioUid: userUid || "system",
        usuarioCorreo: userCorreo || "admin@sistema.local",
        accion: "Eliminaci\xF3n de Licencia",
        modulo: "Licencias",
        detalles: `Se elimin\xF3 la licencia no utilizada ${licencia.licenseKey} (ID: ${id})`,
        exito: true
      });
      res.status(200).json({
        exito: true,
        mensaje: `Licencia ${licencia.licenseKey} eliminada correctamente.`
      });
    } catch (error) {
      console.error("[licenseAdminController.eliminarLicencia] Error:", error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || "Error al eliminar la licencia."
      });
    }
  },
  /**
   * Obtiene la lista de instalaciones de una licencia
   * GET /api/v1/licenses/:id/installations
   */
  async obtenerInstalacionesLicencia(req, res) {
    try {
      const { id } = req.params;
      let licencia = await FirestoreAdminService.getDoc("licencias", id);
      if (!licencia) {
        const docs = await FirestoreAdminService.queryCollection("licencias", [
          { field: "licenseKey", op: "==", value: id }
        ]);
        if (docs.length > 0) licencia = docs[0];
      }
      if (!licencia) {
        res.status(404).json({
          exito: false,
          mensaje: "Licencia no encontrada."
        });
        return;
      }
      const instalaciones = await FirestoreAdminService.queryCollection("instalaciones", [
        { field: "licenseKey", op: "==", value: licencia.licenseKey }
      ]);
      res.status(200).json({
        exito: true,
        data: instalaciones,
        total: instalaciones.length
      });
    } catch (error) {
      console.error("[licenseAdminController.obtenerInstalacionesLicencia] Error:", error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || "Error al obtener las instalaciones de la licencia."
      });
    }
  }
};

// src/api/routes/licenseAdminRoutes.ts
var router3 = (0, import_express3.Router)();
router3.get("/", licenseAdminController.listarLicencias);
router3.get("/:id", licenseAdminController.obtenerLicencia);
router3.get("/:id/installations", licenseAdminController.obtenerInstalacionesLicencia);
router3.post("/", licenseAdminController.crearLicencia);
router3.put("/:id", licenseAdminController.actualizarLicencia);
router3.patch("/:id/status", licenseAdminController.cambiarEstadoLicencia);
router3.post("/:id/renew", licenseAdminController.renovarLicencia);
router3.delete("/:id", licenseAdminController.eliminarLicencia);
var licenseAdminRoutes_default = router3;

// src/api/routes/dashboardAdminRoutes.ts
var import_express4 = require("express");

// src/api/controllers/dashboardAdminController.ts
var dashboardAdminController = {
  /**
   * Obtiene estadísticas agregadas globales calculadas en el backend
   * GET /api/v1/dashboard/stats
   */
  async obtenerEstadisticas(req, res) {
    try {
      const clientesDocs = await FirestoreAdminService.queryCollection("clientes");
      const licenciasDocs = await FirestoreAdminService.queryCollection("licencias");
      const instalacionesDocs = await FirestoreAdminService.queryCollection("instalaciones");
      const versionesDocs = await FirestoreAdminService.queryCollection("versiones");
      let clientesTotales = clientesDocs.length;
      let clientesActivos = 0;
      let clientesSuspendidos = 0;
      let clientesVencidos = 0;
      let clientesProximosVencer = 0;
      const ahora = /* @__PURE__ */ new Date();
      const limite15Dias = /* @__PURE__ */ new Date();
      limite15Dias.setDate(ahora.getDate() + 15);
      clientesDocs.forEach((cliente) => {
        if (cliente.estado === "activo") clientesActivos++;
        if (cliente.estado === "suspendido") clientesSuspendidos++;
        if (cliente.estado === "vencido") clientesVencidos++;
        if (cliente.vencimientoLicencia) {
          const fechaVenc = new Date(cliente.vencimientoLicencia);
          if (fechaVenc > ahora && fechaVenc <= limite15Dias && cliente.estado === "activo") {
            clientesProximosVencer++;
          }
        }
      });
      res.status(200).json({
        exito: true,
        data: {
          clientesTotales,
          clientesActivos,
          clientesSuspendidos,
          clientesVencidos,
          clientesProximosVencer,
          instalacionesTotales: instalacionesDocs.length,
          licenciasTotales: licenciasDocs.length,
          versionesRegistradas: versionesDocs.length
        }
      });
    } catch (error) {
      console.error("[dashboardAdminController.obtenerEstadisticas] Error:", error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || "Error al calcular estad\xEDsticas del dashboard.",
        data: {
          clientesTotales: 0,
          clientesActivos: 0,
          clientesSuspendidos: 0,
          clientesVencidos: 0,
          clientesProximosVencer: 0,
          instalacionesTotales: 0,
          licenciasTotales: 0,
          versionesRegistradas: 0
        }
      });
    }
  },
  /**
   * Obtiene los logs de actividad reciente para el dashboard
   * GET /api/v1/dashboard/activity
   */
  async obtenerActividadReciente(req, res) {
    try {
      const limitParam = Number(req.query.limit) || 10;
      const logs = await FirestoreAdminService.queryCollection("auditoria", [], {
        orderBy: "fecha",
        orderDir: "desc",
        limit: limitParam
      });
      res.status(200).json({
        exito: true,
        data: logs,
        total: logs.length
      });
    } catch (error) {
      console.error("[dashboardAdminController.obtenerActividadReciente] Error:", error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || "Error al obtener actividad reciente.",
        data: []
      });
    }
  }
};

// src/api/routes/dashboardAdminRoutes.ts
var router4 = (0, import_express4.Router)();
router4.get("/stats", dashboardAdminController.obtenerEstadisticas);
router4.get("/activity", dashboardAdminController.obtenerActividadReciente);
var dashboardAdminRoutes_default = router4;

// src/api/routes/auditAdminRoutes.ts
var import_express5 = require("express");

// src/api/controllers/auditAdminController.ts
var auditAdminController = {
  /**
   * Lista los registros de auditoría
   * GET /api/v1/audit
   */
  async listarLogs(req, res) {
    try {
      const limitParam = Number(req.query.limit) || 100;
      const logs = await FirestoreAdminService.queryCollection("auditoria", [], {
        orderBy: "fecha",
        orderDir: "desc",
        limit: limitParam
      });
      res.status(200).json({
        exito: true,
        data: logs,
        total: logs.length
      });
    } catch (error) {
      console.error("[auditAdminController.listarLogs] Error:", error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || "Error al obtener registros de auditor\xEDa.",
        data: []
      });
    }
  },
  /**
   * Registra un nuevo evento de auditoría
   * POST /api/v1/audit
   */
  async registrarLog(req, res) {
    try {
      const { usuarioUid, usuarioCorreo, accion, modulo, detalles, exito } = req.body;
      const { id } = await FirestoreAdminService.addDoc("auditoria", {
        fecha: FirestoreAdminService.serverTimestamp(),
        usuarioUid: usuarioUid || "system",
        usuarioCorreo: usuarioCorreo || "admin@sistema.local",
        accion: accion || "Acci\xF3n del Sistema",
        modulo: modulo || "General",
        detalles: detalles || "",
        exito: exito !== void 0 ? exito : true
      });
      res.status(201).json({
        exito: true,
        mensaje: "Registro de auditor\xEDa guardado exitosamente.",
        id
      });
    } catch (error) {
      console.error("[auditAdminController.registrarLog] Error:", error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || "Error al guardar log de auditor\xEDa."
      });
    }
  }
};

// src/api/routes/auditAdminRoutes.ts
var router5 = (0, import_express5.Router)();
router5.get("/", auditAdminController.listarLogs);
router5.post("/", auditAdminController.registrarLog);
var auditAdminRoutes_default = router5;

// src/api/routes/installationAdminRoutes.ts
var import_express6 = require("express");

// src/api/controllers/installationAdminController.ts
var installationAdminController = {
  /**
   * Obtiene la lista completa de instalaciones registradas en el sistema
   * GET /api/v1/installations
   */
  async listarInstalaciones(req, res) {
    try {
      const docs = await FirestoreAdminService.queryCollection("instalaciones", [], {
        orderBy: "ultimaConexion",
        orderDir: "desc"
      });
      res.status(200).json({
        exito: true,
        data: docs,
        total: docs.length
      });
    } catch (error) {
      console.error("[installationAdminController.listarInstalaciones] Error:", error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || "Error al obtener la lista de instalaciones.",
        data: []
      });
    }
  }
};

// src/api/routes/installationAdminRoutes.ts
var router6 = (0, import_express6.Router)();
router6.get("/", installationAdminController.listarInstalaciones);
var installationAdminRoutes_default = router6;

// src/api/routes/apiLogAdminRoutes.ts
var import_express7 = require("express");

// src/api/controllers/apiLogAdminController.ts
var apiLogAdminController = {
  /**
   * Obtiene los últimos logs de actividad de la API
   * GET /api/v1/apilogs
   */
  async listarLogs(req, res) {
    try {
      const limitParam = Number(req.query.limit) || 20;
      const docs = await FirestoreAdminService.queryCollection("apiLogs", [], {
        orderBy: "timestamp",
        orderDir: "desc",
        limit: limitParam
      });
      res.status(200).json({
        exito: true,
        data: docs,
        total: docs.length
      });
    } catch (error) {
      console.error("[apiLogAdminController.listarLogs] Error:", error);
      res.status(500).json({
        exito: false,
        mensaje: error.message || "Error al obtener los logs de la API.",
        data: []
      });
    }
  }
};

// src/api/routes/apiLogAdminRoutes.ts
var router7 = (0, import_express7.Router)();
router7.get("/", apiLogAdminController.listarLogs);
var apiLogAdminRoutes_default = router7;

// src/api/functions/index.ts
var app2 = (0, import_express8.default)();
app2.use(import_express8.default.json());
app2.use(import_express8.default.urlencoded({ extended: true }));
app2.use("/v1/license", licenseRoutes_default);
app2.use("/v1/clients", clientAdminRoutes_default);
app2.use("/v1/licenses", licenseAdminRoutes_default);
app2.use("/v1/dashboard", dashboardAdminRoutes_default);
app2.use("/v1/audit", auditAdminRoutes_default);
app2.use("/v1/installations", installationAdminRoutes_default);
app2.use("/v1/apilogs", apiLogAdminRoutes_default);
app2.use((req, res) => {
  res.status(404).json({
    exito: false,
    codigoEstado: 404,
    codigoError: "DATOS_INVALIDOS",
    mensaje: `Ruta de la API no encontrada: ${req.method} ${req.originalUrl}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
var functions_default = app2;

// server.ts
async function startServer() {
  if (!process.env.LICENSE_HMAC_SECRET) {
    if (process.env.NODE_ENV === "production") {
      console.error("[ERROR CR\xCDTICO SEGURIDAD] LICENSE_HMAC_SECRET no est\xE1 configurada en las variables de entorno. Imposible iniciar el servidor.");
      process.exit(1);
    } else {
      console.warn("[AVISO DE SEGURIDAD] LICENSE_HMAC_SECRET no configurada. Inicializando clave de desarrollo por defecto.");
      process.env.LICENSE_HMAC_SECRET = "panel-maestro-deli-secret-key-2026-enterprise";
    }
  }
  const app3 = (0, import_express9.default)();
  const PORT = 3e3;
  app3.use("/api", functions_default);
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app3.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app3.use(import_express9.default.static(distPath));
    app3.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app3.listen(PORT, "0.0.0.0", () => {
    console.log(`[Panel Maestro] Servidor unificado ejecut\xE1ndose en http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
