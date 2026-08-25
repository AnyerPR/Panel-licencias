import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import apiApp from './src/api/functions/index';

async function startServer() {
  // Validación de variable de entorno obligatoria LICENSE_HMAC_SECRET
  if (!process.env.LICENSE_HMAC_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[ERROR CRÍTICO SEGURIDAD] LICENSE_HMAC_SECRET no está configurada en las variables de entorno. Imposible iniciar el servidor.');
      process.exit(1);
    } else {
      console.warn('[AVISO DE SEGURIDAD] LICENSE_HMAC_SECRET no configurada. Inicializando clave de desarrollo por defecto.');
      process.env.LICENSE_HMAC_SECRET = 'panel-maestro-deli-secret-key-2026-enterprise';
    }
  }

  const app = express();
  const PORT = 3000;

  // Registrar sub-aplicación de API de Licencias en el prefijo /api
  app.use('/api', apiApp);

  // Middleware de Vite para desarrollo frontend SPA
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Panel Maestro] Servidor unificado ejecutándose en http://0.0.0.0:${PORT}`);
  });
}

startServer();
