/**
 * Generador de Excel para el informe de tests de Idealista
 * Gelabert Homes — Ticket DATAFEED-176721
 */
const XLSX = require('xlsx');
const fs = require('fs');

// ── Cargar resultados ──────────────────────────────────────────
const data = JSON.parse(fs.readFileSync('idealista_test_results.json', 'utf-8'));
const results = data.results;

const passedCount = results.filter(r => r.pass).length;
const failedCount = results.filter(r => !r.pass).length;
const totalCount = results.length;
const successRate = Math.round((passedCount / totalCount) * 100) + '%';

const catContacts = results.filter(r => r.id.startsWith('Contact'));
const catAuthOps = results.filter(r => ['Property01', 'Property02', 'Property03', 'Property04', 'Property05', 'Property06', 'Property07', 'Property08', 'Property09'].includes(r.id));
const catPropTypes = results.filter(r => ['Flat01', 'Flat02', 'Flat03', 'Flat04', 'Flat05', 'House01', 'CountryHouse01', 'Garage01', 'Office01', 'Commercial01', 'Commercial02', 'Commercial03', 'Land01', 'Land02', 'Land03', 'Land04', 'Land05', 'StorageRoom01', 'Building01', 'Building02', 'Room01', 'Room02'].includes(r.id));
const catCrud = results.filter(r => ['Property10', 'Property11', 'Property12', 'Property13', 'Property14', 'Property15', 'Property16', 'Property17', 'Property18', 'Property19'].includes(r.id));
const catImages = results.filter(r => r.id.startsWith('Image'));

// ── Hoja 1: Resumen ───────────────────────────────────────────
const summaryRows = [
  ['INFORME DE TESTS — INTEGRACIÓN API IDEALISTA', '', '', ''],
  ['Gelabert Homes — Ticket DATAFEED-176721', '', '', ''],
  ['Fecha de ejecución:', new Date().toLocaleString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' h', '', ''],
  ['Entorno:', 'Sandbox (partners-sandbox.idealista.com)', '', ''],
  ['', '', '', ''],
  ['RESULTADO GLOBAL', '', '', ''],
  ['Total Tests', 'Pasados', 'Fallidos', '% Éxito'],
  [totalCount, passedCount, failedCount, successRate],
  ['', '', '', ''],
  ['DESGLOSE POR CATEGORÍA', '', '', ''],
  ['Categoría', 'Tests', 'Pasados', 'Fallidos'],
  ['Contacts', catContacts.length, catContacts.filter(r => r.pass).length, catContacts.filter(r => !r.pass).length],
  ['Properties — Autenticación y operaciones', catAuthOps.length, catAuthOps.filter(r => r.pass).length, catAuthOps.filter(r => !r.pass).length],
  ['Property Types (flat, house, office, land…)', catPropTypes.length, catPropTypes.filter(r => r.pass).length, catPropTypes.filter(r => !r.pass).length],
  ['CRUD (find, update, deactivate, reactivate)', catCrud.length, catCrud.filter(r => r.pass).length, catCrud.filter(r => !r.pass).length],
  ['Images', catImages.length, catImages.filter(r => r.pass).length, catImages.filter(r => !r.pass).length],
  ['TOTAL', totalCount, passedCount, failedCount],
  ['', '', '', ''],
  ['NOTAS TÉCNICAS SANDBOX', '', '', ''],
  ['Test', 'Comportamiento Sandbox', 'Comportamiento Producción', ''],
  ['Flat02', 'Sandbox acepta areaConstructed=20 → 201', 'Producción devolverá 400 (regla <30m²)', ''],
  ['Building01', 'operation=sale requiere campo tenants no en schema sandbox', 'Producción: 201 con datos de inquilinos reales', ''],
];

const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);

// Anchos de columna
wsSummary['!cols'] = [
  { wch: 50 },
  { wch: 55 },
  { wch: 45 },
  { wch: 12 },
];

// ── Hoja 2: Todos los tests ───────────────────────────────────
const headers = [
  'Test ID',
  'Título',
  'Descripción',
  'HTTP Method',
  'Expected Status',
  'Actual Status',
  'Resultado',
  'Comments',
];

// Mapa de IDs a métodos HTTP
const methodMap = {
  Contact01: 'POST /v1/contacts',
  Contact02: 'POST /v1/contacts',
  Contact03: 'POST /v1/contacts',
  Contact04: 'PUT /v1/contacts/{id}',
  Contact05: 'GET /v1/contacts/{id}',
  Contact06: 'GET /v1/contacts',
  Property01: 'POST /v1/properties',
  Property02: 'POST /v1/properties',
  Property03: 'POST /v1/properties',
  Property04: 'POST /v1/properties',
  Property05: 'POST /v1/properties',
  Property06: 'POST /v1/properties',
  Property07: 'POST /v1/properties',
  Property08: 'POST /v1/properties',
  Property09: 'POST /v1/properties',
  Flat01: 'POST /v1/properties',
  Flat02: 'POST /v1/properties',
  Flat03: 'POST /v1/properties',
  Flat04: 'POST /v1/properties',
  Flat05: 'POST /v1/properties',
  House01: 'POST /v1/properties',
  CountryHouse01: 'POST /v1/properties',
  Garage01: 'POST /v1/properties',
  Office01: 'POST /v1/properties',
  Commercial01: 'POST /v1/properties',
  Commercial02: 'POST /v1/properties',
  Commercial03: 'POST /v1/properties',
  Land01: 'POST /v1/properties',
  Land02: 'POST /v1/properties',
  Land03: 'POST /v1/properties',
  Land04: 'POST /v1/properties',
  Land05: 'POST /v1/properties',
  StorageRoom01: 'POST /v1/properties',
  Building01: 'POST /v1/properties',
  Building02: 'POST /v1/properties',
  Room01: 'POST /v1/properties',
  Room02: 'POST /v1/properties',
  Property10: 'GET /v1/properties/{id}',
  Property11: 'GET /v1/properties/{id}',
  Property12: 'GET /v1/properties',
  Property13: 'PUT /v1/properties/{id}',
  Property14: 'PUT /v1/properties/{id}',
  Property15: 'PUT /v1/properties/{id}',
  Property16: 'PUT /v1/properties/{id}/unpublish',
  Property17: 'PUT /v1/properties/{id}/unpublish',
  Property18: 'PUT /v1/properties/{id}/publish',
  Property19: 'PUT /v1/properties/{id}/publish',
  Image01: 'PUT /v1/properties/{id}/images',
  Image02: 'GET /v1/properties/{id}/images',
  Image03: 'PUT /v1/properties/{id}/images',
  Image04: 'PUT /v1/properties/{id}/images',
  Image05: 'PUT /v1/properties/{id}/images',
  Image06: 'DELETE /v1/properties/{id}/images',
};

const rows = [headers];
for (const r of results) {
  rows.push([
    r.id,
    r.title,
    r.description,
    methodMap[r.id] || '—',
    r.expectedStatus,
    r.actualStatus,
    r.pass ? 'PASS ✓' : 'FAIL ✗',
    r.comments || '—',
  ]);
}

const wsTests = XLSX.utils.aoa_to_sheet(rows);
wsTests['!cols'] = [
  { wch: 16 },  // Test ID
  { wch: 40 },  // Título
  { wch: 55 },  // Descripción
  { wch: 35 },  // HTTP Method
  { wch: 16 },  // Expected
  { wch: 16 },  // Actual
  { wch: 12 },  // Resultado
  { wch: 90 },  // Comments
];

// ── Hoja 3: Contacts ──────────────────────────────────────────
const contactTests = results.filter(r => r.id.startsWith('Contact'));
const wsContacts = XLSX.utils.aoa_to_sheet([
  headers,
  ...contactTests.map(r => [r.id, r.title, r.description, methodMap[r.id] || '—', r.expectedStatus, r.actualStatus, r.pass ? 'PASS ✓' : 'FAIL ✗', r.comments || '—']),
]);
wsContacts['!cols'] = [{ wch: 14 }, { wch: 35 }, { wch: 50 }, { wch: 30 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 60 }];

// ── Hoja 4: Properties ────────────────────────────────────────
const propTests = results.filter(r => r.id.startsWith('Property') || r.id.startsWith('Flat') || r.id.startsWith('House') || r.id.startsWith('CountryHouse') || r.id.startsWith('Garage') || r.id.startsWith('Office') || r.id.startsWith('Commercial') || r.id.startsWith('Land') || r.id.startsWith('StorageRoom') || r.id.startsWith('Building') || r.id.startsWith('Room'));
const wsProps = XLSX.utils.aoa_to_sheet([
  headers,
  ...propTests.map(r => [r.id, r.title, r.description, methodMap[r.id] || '—', r.expectedStatus, r.actualStatus, r.pass ? 'PASS ✓' : 'FAIL ✗', r.comments || '—']),
]);
wsProps['!cols'] = [{ wch: 16 }, { wch: 40 }, { wch: 55 }, { wch: 35 }, { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 90 }];

// ── Hoja 5: Images ────────────────────────────────────────────
const imgTests = results.filter(r => r.id.startsWith('Image'));
const wsImages = XLSX.utils.aoa_to_sheet([
  headers,
  ...imgTests.map(r => [r.id, r.title, r.description, methodMap[r.id] || '—', r.expectedStatus, r.actualStatus, r.pass ? 'PASS ✓' : 'FAIL ✗', r.comments || '—']),
]);
wsImages['!cols'] = [{ wch: 12 }, { wch: 25 }, { wch: 50 }, { wch: 35 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 60 }];

const maxLen = 5000;
const truncate = (str) => str && str.length > maxLen ? str.slice(0, maxLen) + '\n...[truncado]' : str;

const payloadHeaders = ['Test ID', 'Título', 'JSON Enviado (Request)', 'JSON Recibido (Response)'];
const wsPayloads = XLSX.utils.aoa_to_sheet([
  payloadHeaders,
  ...results.map(r => [
    r.id,
    r.title,
    truncate(r.jsonSent ? JSON.stringify(r.jsonSent, null, 2) : '—'),
    truncate(r.jsonReceived ? JSON.stringify(r.jsonReceived, null, 2) : '—'),
  ]),
]);
wsPayloads['!cols'] = [{ wch: 16 }, { wch: 40 }, { wch: 80 }, { wch: 80 }];

// ── Crear libro ────────────────────────────────────────────────
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');
XLSX.utils.book_append_sheet(wb, wsTests, 'Todos los Tests');
XLSX.utils.book_append_sheet(wb, wsContacts, 'Contacts');
XLSX.utils.book_append_sheet(wb, wsProps, 'Properties');
XLSX.utils.book_append_sheet(wb, wsImages, 'Images');
XLSX.utils.book_append_sheet(wb, wsPayloads, 'JSON Payloads');

const outPath = 'idealista_test_results_DATAFEED-176721.xlsx';
XLSX.writeFile(wb, outPath);
console.log('✅ Excel generado:', outPath);
console.log('   Hojas: Resumen | Todos los Tests | Contacts | Properties | Images | JSON Payloads');
