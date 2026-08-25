import { cryptoUtils } from '../api/utils/cryptoUtils';
import { securityMiddleware } from '../api/middlewares/securityMiddleware';
import { LicenseManager } from '../services/licenseManager/LicenseManager';
import { LocalLicenseStorage } from '../services/licenseManager/LicenseManagerTypes';

async function testPhaseA() {
  console.log('==== RUNNING PHASE A VERIFICATION TESTS ====\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, message: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      throw new Error(`Test failed: ${message}`);
    }
  }

  // TEST 1: Eliminación del x-admin-bypass en producción
  console.log('--- Test 1: x-admin-bypass en producción ---');
  const originalEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'production';
    let nextCalled = false;
    let statusSent: number | null = null;

    const mockReq: any = {
      headers: { 'x-admin-bypass': 'true' },
      ip: '127.0.0.1',
    };
    const mockRes: any = {
      status: (code: number) => {
        statusSent = code;
        return {
          json: (body: any) => body,
        };
      },
    };
    const mockNext = () => {
      nextCalled = true;
    };

    securityMiddleware.validarHmacYReplay(mockReq, mockRes, mockNext);
    assert(!nextCalled, 'x-admin-bypass NO debe permitir pasar la petición en producción');
    assert(statusSent === 401, 'Devuelve 401 sin cabeceras HMAC en producción aunque x-admin-bypass sea enviado');
  } finally {
    process.env.NODE_ENV = originalEnv;
  }

  // TEST 2: Obligatoriedad de LICENSE_HMAC_SECRET en producción
  console.log('\n--- Test 2: LICENSE_HMAC_SECRET obligatoria en producción ---');
  const originalSecret = process.env.LICENSE_HMAC_SECRET;
  try {
    process.env.NODE_ENV = 'production';
    delete process.env.LICENSE_HMAC_SECRET;
    let errorThrown = false;
    try {
      cryptoUtils.generarFirma('POST', '/api/v1/license/validate', '12345', 'nonce', {});
    } catch (e: any) {
      errorThrown = true;
      assert(e.message.includes('LICENSE_HMAC_SECRET'), 'Lanza error fatal si falta LICENSE_HMAC_SECRET en prod');
    }
    assert(errorThrown, 'Debe lanzar excepción si falta la variable de entorno de producción');
  } finally {
    process.env.NODE_ENV = originalEnv;
    if (originalSecret) process.env.LICENSE_HMAC_SECRET = originalSecret;
  }

  // TEST 3: Firma de integridad y Detección de Manipulación en LocalStorage (Modo de Gracia)
  console.log('\n--- Test 3: Protección contra manipulación local de licencias ---');
  const testData: LocalLicenseStorage = {
    licenseKey: 'DELI-TEST-1234',
    uuidCliente: 'CLI-001',
    installationId: 'INST-001',
    nombreEquipo: 'Test PC',
    versionSistema: '1.0.0',
    ultimoEstado: 'MODO_GRACIA',
    fechaUltimoExito: new Date().toISOString(),
    diasGraciaPermitidos: 7,
    diasGraciaRestantes: 5,
  };

  const originalChecksum = LicenseManager.calcularFirmaIntegridad(testData);
  assert(typeof originalChecksum === 'string' && originalChecksum.length > 0, 'Genera checksum de integridad');

  // Simular alteración maliciosa en diasGraciaRestantes o fechaUltimoExito
  const tamperedData: LocalLicenseStorage = {
    ...testData,
    diasGraciaRestantes: 99, // Alteración manual de días de gracia
    _checksum: originalChecksum, // Checksum desactualizado/inválido para los nuevos datos
  };

  const recheckedChecksum = LicenseManager.calcularFirmaIntegridad(tamperedData);
  assert(tamperedData._checksum !== recheckedChecksum, 'Detecta que la firma de integridad no coincide tras alteración manual');

  console.log(`\n==== RESULTADO: ${passed}/${total} PRUEBAS COMPLETADAS CON ÉXITO ====\n`);
  process.exit(0);
}

testPhaseA().catch((err) => {
  console.error('Pruebas de la Fase A fallidas:', err);
  process.exit(1);
});
