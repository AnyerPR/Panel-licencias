import { FirestoreAdminService, adminDb } from '../api/services/FirestoreAdminService';

async function testPhase7_1() {
  console.log('==== VERIFICACIÓN FASE 7.1: FIREBASE ADMIN SDK ====\n');

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

  // 1. Probar que FirestoreAdminService está inicializado e interactúa con la BD admin
  console.log('--- Test 1: Comprobar instancia de Firestore Admin DB ---');
  assert(!!adminDb, 'adminDb existe e inicializado');
  const dbFromService = FirestoreAdminService.getDb();
  assert(dbFromService === adminDb, 'FirestoreAdminService.getDb() retorna la instancia adminDb');

  // 2. Probar escritura mediante Firebase Admin SDK
  console.log('\n--- Test 2: Escritura en Firestore mediante Firebase Admin SDK ---');
  const testCollection = 'api_health';
  const testDocId = `test_admin_${Date.now()}`;
  const testData = {
    mensaje: 'Prueba de integración Firebase Admin SDK en API Express',
    modulo: 'FASE_7_1',
    fechaPrueba: new Date().toISOString(),
  };

  const setResult = await FirestoreAdminService.setDoc(testCollection, testDocId, testData);
  assert(setResult.id === testDocId, 'Se escribió correctamente el documento de prueba vía Admin SDK');

  // 3. Probar lectura mediante Firebase Admin SDK
  console.log('\n--- Test 3: Lectura en Firestore mediante Firebase Admin SDK ---');
  const docLeido = await FirestoreAdminService.getDoc(testCollection, testDocId);
  assert(!!docLeido, 'Se leyó exitosamente el documento recién escrito');
  assert(docLeido?.modulo === 'FASE_7_1', 'Los datos leídos coinciden exactamente con los escritos');
  assert(docLeido?.mensaje === testData.mensaje, 'El mensaje guardado coincide');

  // 4. Probar actualización y consulta vía FirestoreAdminService
  console.log('\n--- Test 4: Actualización y Consulta vía FirestoreAdminService ---');
  await FirestoreAdminService.updateDoc(testCollection, testDocId, {
    estado: 'VERIFICADO',
  });

  const queryResult = await FirestoreAdminService.queryCollection(testCollection, [
    { field: 'modulo', op: '==', value: 'FASE_7_1' },
    { field: 'estado', op: '==', value: 'VERIFICADO' },
  ]);

  assert(queryResult.length > 0, 'La consulta por filtros en Admin SDK retornó el documento actualizado');

  // 5. Limpieza del documento de prueba
  console.log('\n--- Test 5: Limpieza de datos de prueba ---');
  await FirestoreAdminService.deleteDoc(testCollection, testDocId);
  const docEliminado = await FirestoreAdminService.getDoc(testCollection, testDocId);
  assert(docEliminado === null, 'El documento de prueba fue eliminado limpiamente');

  console.log(`\n==== RESULTADO FASE 7.1: ${passed}/${total} PRUEBAS COMPLETADAS CON ÉXITO ====\n`);
  process.exit(0);
}

testPhase7_1().catch((err) => {
  console.error('Error en pruebas de la Fase 7.1:', err);
  process.exit(1);
});
