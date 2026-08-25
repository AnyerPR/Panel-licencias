import http from 'http';
import app from '../api/functions/index';

async function runPhase7_2Tests() {
  console.log('==== INICIANDO PRUEBAS DE INTEGRACIÓN FASE 7.2 (API REST PANEL MAESTRO) ====\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, message: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      throw new Error(`Test fallido: ${message}`);
    }
  }

  // Iniciar servidor de prueba en puerto efímero
  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;
  console.log(`Servidor de prueba Express montado en ${baseUrl}\n`);

  try {
    // 1. Crear Cliente
    console.log('--- Test 1: Crear Cliente mediante POST /v1/clients ---');
    const testRnc = `RNC-${Date.now()}`;
    const testCorreo = `cliente-${Date.now()}@test.com`;

    const resCrearCliente = await fetch(`${baseUrl}/v1/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombreEmpresa: 'Hospital General Test S.R.L.',
        nombreComercial: 'Hospital Test',
        rnc: testRnc,
        telefono: '809-555-0199',
        correo: testCorreo,
        direccion: 'Av. Winston Churchill 100',
        ciudad: 'Santo Domingo',
        pais: 'República Dominicana',
        personaContacto: 'Dr. Alejandro Peña',
        plan: 'anual',
        tipo: 'hospital',
        observaciones: 'Cliente de prueba automatizada',
        userUid: 'test_admin_uid',
        userCorreo: 'admin@test.com',
      }),
    });

    const dataCrearCliente = await resCrearCliente.json();
    assert(resCrearCliente.status === 201, 'POST /v1/clients debe retornar status 201');
    assert(dataCrearCliente.exito === true, 'Respuesta debe indicar exito: true');
    assert(!!dataCrearCliente.data.id, 'Cliente creado debe tener id asignado');
    assert(!!dataCrearCliente.data.uuidCliente, 'Cliente creado debe tener uuidCliente asignado');
    const clienteCreadoId = dataCrearCliente.data.id;
    const clienteUuid = dataCrearCliente.data.uuidCliente;

    // 2. Listar Clientes
    console.log('\n--- Test 2: Listar Clientes mediante GET /v1/clients ---');
    const resListarClientes = await fetch(`${baseUrl}/v1/clients`);
    const dataListarClientes = await resListarClientes.json();
    assert(resListarClientes.status === 200, 'GET /v1/clients debe retornar status 200');
    assert(Array.isArray(dataListarClientes.data), 'GET /v1/clients data debe ser un arreglo');
    assert(dataListarClientes.data.some((c: any) => c.id === clienteCreadoId), 'La lista debe incluir el cliente creado');

    // 3. Obtener Cliente por ID
    console.log('\n--- Test 3: Obtener Cliente por ID mediante GET /v1/clients/:id ---');
    const resGetCliente = await fetch(`${baseUrl}/v1/clients/${clienteCreadoId}`);
    const dataGetCliente = await resGetCliente.json();
    assert(resGetCliente.status === 200, 'GET /v1/clients/:id debe retornar status 200');
    assert(dataGetCliente.data.nombreEmpresa === 'Hospital General Test S.R.L.', 'El cliente devuelto coincide con el nombre esperado');

    // 4. Actualizar Cliente
    console.log('\n--- Test 4: Actualizar Cliente mediante PUT /v1/clients/:id ---');
    const resPutCliente = await fetch(`${baseUrl}/v1/clients/${clienteCreadoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombreEmpresa: 'Hospital General Test Modificado',
        nombreComercial: 'Hospital Test Modificado',
        rnc: testRnc,
        telefono: '809-555-9999',
        correo: testCorreo,
        direccion: 'Av. Winston Churchill 200',
        ciudad: 'Santo Domingo',
        pais: 'República Dominicana',
        personaContacto: 'Dr. Alejandro Peña',
        plan: 'anual',
        userUid: 'test_admin_uid',
        userCorreo: 'admin@test.com',
      }),
    });
    const dataPutCliente = await resPutCliente.json();
    assert(resPutCliente.status === 200, 'PUT /v1/clients/:id debe retornar status 200');
    assert(dataPutCliente.exito === true, 'Respuesta debe indicar exito: true');

    // 5. Emitir Licencia
    console.log('\n--- Test 5: Emitir Licencia mediante POST /v1/licenses ---');
    const resCrearLic = await fetch(`${baseUrl}/v1/licenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clienteId: clienteCreadoId,
        uuidCliente: clienteUuid,
        nombreEmpresa: 'Hospital General Test Modificado',
        tipoLicencia: 'anual',
        versionMinima: '1.0.0',
        versionMaxima: '2.5.0',
        cantidadInstalacionesPermitidas: 5,
        observaciones: 'Licencia principal anual para el hospital',
        userUid: 'test_admin_uid',
        userCorreo: 'admin@test.com',
      }),
    });
    const dataCrearLic = await resCrearLic.json();
    assert(resCrearLic.status === 201, 'POST /v1/licenses debe retornar status 201');
    assert(dataCrearLic.exito === true, 'Respuesta debe indicar exito: true');
    assert(dataCrearLic.data.licenseKey.startsWith('DELI-'), 'Clave de licencia debe tener prefijo DELI-');
    assert(dataCrearLic.data.cantidadInstalacionesPermitidas === 5, 'Instalaciones permitidas debe ser 5');
    const licenciaCreadaId = dataCrearLic.data.id;

    // 6. Listar Licencias
    console.log('\n--- Test 6: Listar Licencias mediante GET /v1/licenses ---');
    const resListarLic = await fetch(`${baseUrl}/v1/licenses?clienteId=${clienteCreadoId}`);
    const dataListarLic = await resListarLic.json();
    assert(resListarLic.status === 200, 'GET /v1/licenses debe retornar status 200');
    assert(dataListarLic.data.length >= 1, 'Debe haber al menos una licencia listada para el cliente');

    // 7. Renovar Licencia
    console.log('\n--- Test 7: Renovar Licencia mediante POST /v1/licenses/:id/renew ---');
    const resRenovar = await fetch(`${baseUrl}/v1/licenses/${licenciaCreadaId}/renew`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        diasAnadidos: 30,
        observaciones: 'Ampliación de cortesía',
        userUid: 'test_admin_uid',
        userCorreo: 'admin@test.com',
      }),
    });
    const dataRenovar = await resRenovar.json();
    assert(resRenovar.status === 200, 'POST /v1/licenses/:id/renew debe retornar status 200');
    assert(dataRenovar.exito === true, 'Respuesta debe indicar exito: true');

    // 8. Cambiar Estado Licencia (Suspender)
    console.log('\n--- Test 8: Cambiar Estado Licencia mediante PATCH /v1/licenses/:id/status ---');
    const resStatusLic = await fetch(`${baseUrl}/v1/licenses/${licenciaCreadaId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nuevoEstado: 'suspendida',
        userUid: 'test_admin_uid',
        userCorreo: 'admin@test.com',
      }),
    });
    const dataStatusLic = await resStatusLic.json();
    assert(resStatusLic.status === 200, 'PATCH /v1/licenses/:id/status debe retornar status 200');
    assert(dataStatusLic.exito === true, 'Estado de licencia actualizado con exito');

    // 9. Dashboard Stats
    console.log('\n--- Test 9: Consultar Estadísticas del Dashboard mediante GET /v1/dashboard/stats ---');
    const resDashboard = await fetch(`${baseUrl}/v1/dashboard/stats`);
    const dataDashboard = await resDashboard.json();
    assert(resDashboard.status === 200, 'GET /v1/dashboard/stats debe retornar status 200');
    assert(typeof dataDashboard.data.clientesTotales === 'number', 'clientesTotales debe ser numérico');
    assert(typeof dataDashboard.data.licenciasTotales === 'number', 'licenciasTotales debe ser numérico');

    // 10. Auditoría
    console.log('\n--- Test 10: Registrar y Listar Auditoría mediante /v1/audit ---');
    const resPostAudit = await fetch(`${baseUrl}/v1/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuarioUid: 'test_admin_uid',
        usuarioCorreo: 'admin@test.com',
        accion: 'Prueba Automatizada',
        modulo: 'Tests',
        detalles: 'Registro de validación de endpoints',
        exito: true,
      }),
    });
    assert(resPostAudit.status === 201, 'POST /v1/audit debe retornar status 201');

    const resGetAudit = await fetch(`${baseUrl}/v1/audit?limit=10`);
    const dataGetAudit = await resGetAudit.json();
    assert(resGetAudit.status === 200, 'GET /v1/audit debe retornar status 200');
    assert(Array.isArray(dataGetAudit.data), 'Auditoría debe retornar un arreglo');

    // 11. Validar restricción de eliminación de cliente con licencias
    console.log('\n--- Test 11: Validar que no se puede eliminar cliente con licencias asociadas ---');
    const resDelClienteFail = await fetch(`${baseUrl}/v1/clients/${clienteCreadoId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userUid: 'test_admin_uid',
        userCorreo: 'admin@test.com',
      }),
    });
    assert(resDelClienteFail.status === 409, 'DELETE /v1/clients/:id debe retornar 409 cuando tiene licencias');

    // 12. Eliminar Licencia no usada
    console.log('\n--- Test 12: Eliminar Licencia no usada mediante DELETE /v1/licenses/:id ---');
    const resDelLic = await fetch(`${baseUrl}/v1/licenses/${licenciaCreadaId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userUid: 'test_admin_uid',
        userCorreo: 'admin@test.com',
      }),
    });
    const dataDelLic = await resDelLic.json();
    assert(resDelLic.status === 200, 'DELETE /v1/licenses/:id debe retornar status 200');
    assert(dataDelLic.exito === true, 'Licencia eliminada exitosamente');

    // 13. Eliminar Cliente ahora que no tiene licencias
    console.log('\n--- Test 13: Eliminar Cliente sin licencias mediante DELETE /v1/clients/:id ---');
    const resDelClienteOk = await fetch(`${baseUrl}/v1/clients/${clienteCreadoId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userUid: 'test_admin_uid',
        userCorreo: 'admin@test.com',
      }),
    });
    const dataDelClienteOk = await resDelClienteOk.json();
    assert(resDelClienteOk.status === 200, 'DELETE /v1/clients/:id debe retornar status 200');
    assert(dataDelClienteOk.exito === true, 'Cliente eliminado exitosamente');

    console.log(`\n============================================================`);
    console.log(`🎉 TODAS LAS PRUEBAS DE LA FASE 7.2 PASARON CON ÉXITO (${passed}/${total})`);
    console.log(`============================================================\n`);
  } finally {
    server.close();
  }

  process.exit(0);
}

runPhase7_2Tests().catch((err) => {
  console.error('Error fatal durante las pruebas de la Fase 7.2:', err);
  process.exit(1);
});
