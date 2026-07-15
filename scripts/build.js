'use strict';

// "Build" step for this plain Node/Express app: there's no compiler, so build
// verification means syntax-checking every source file before tests run.

const { execFileSync } = require('child_process');
const path = require('path');

const files = [
  'server.js',
  'lib/serviceCatalog.js',
  'lib/doctorCatalog.js',
  'lib/appointmentStore.js',
  'lib/invoiceStore.js',
  'lib/patientStore.js',
  'lib/renderInvoice.js',
  'public/app.js',
];

let ok = true;
for (const file of files) {
  const full = path.join(__dirname, '..', file);
  try {
    execFileSync(process.execPath, ['--check', full], { stdio: 'inherit' });
    console.log(`OK  ${file}`);
  } catch {
    console.error(`FAIL ${file}`);
    ok = false;
  }
}

if (!ok) {
  console.error('Build failed: syntax errors found.');
  process.exit(1);
}
console.log('Build check passed.');
