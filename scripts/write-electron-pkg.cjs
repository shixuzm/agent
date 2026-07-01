// Writes electron-dist/package.json with {"type":"commonjs"} so that
// Node/Electron treat the CJS-compiled electron-dist/*.js files as CommonJS.
// The root package.json has "type":"module" (needed for the Vite ESM frontend),
// which would otherwise make .js files be parsed as ESM and break
// require/exports/__dirname used by the Electron main/preload/config output.
// This file uses .cjs so it always runs as CommonJS regardless of the root type field.
const fs = require('node:fs');
const path = require('node:path');

const target = path.join(__dirname, '..', 'electron-dist', 'package.json');
fs.writeFileSync(target, JSON.stringify({ type: 'commonjs' }, null, 2) + '\n');
console.log('[write-electron-pkg] wrote', path.relative(path.join(__dirname, '..'), target));
