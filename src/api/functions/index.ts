import express from 'express';
import licenseRoutes from '../routes/licenseRoutes';
import clientAdminRoutes from '../routes/clientAdminRoutes';
import licenseAdminRoutes from '../routes/licenseAdminRoutes';
import dashboardAdminRoutes from '../routes/dashboardAdminRoutes';
import auditAdminRoutes from '../routes/auditAdminRoutes';
import installationAdminRoutes from '../routes/installationAdminRoutes';
import apiLogAdminRoutes from '../routes/apiLogAdminRoutes';

/**
 * Servidor Express modular de la API Empresarial del Panel Maestro.
 * Proporciona endpoints para la gestión de clientes, licencias, auditoría, dashboard,
 * instalaciones y logs, además de la API de validación y SDK de licenciamiento.
 */
export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas de validación de licencias para clientes / SDK
app.use('/v1/license', licenseRoutes);

// Rutas de administración para el Panel Maestro
app.use('/v1/clients', clientAdminRoutes);
app.use('/v1/licenses', licenseAdminRoutes);
app.use('/v1/dashboard', dashboardAdminRoutes);
app.use('/v1/audit', auditAdminRoutes);
app.use('/v1/installations', installationAdminRoutes);
app.use('/v1/apilogs', apiLogAdminRoutes);

// Manejador genérico para rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    exito: false,
    codigoEstado: 404,
    codigoError: 'DATOS_INVALIDOS',
    mensaje: `Ruta de la API no encontrada: ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
});

export default app;
