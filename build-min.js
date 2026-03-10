#!/usr/bin/env node
/**
 * Builds formio-inject.min.js from formio.js.
 *
 * Usage:
 *   node build-min.js
 *   npx terser --version   # ensure terser is available
 *
 * What it does:
 *   1. Minifies formio.js with terser
 *   2. Breaks the minified output into lines at semicolons (~4000 chars each)
 *      so the result doesn't exceed editor line-length limits
 *   3. Embeds it in the inject wrapper and writes formio-inject.min.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DIR      = __dirname;
const SRC      = path.join(DIR, 'formio.js');
const OUT      = path.join(DIR, 'formio-inject.min.js');
const TMP      = path.join(DIR, '.formio.min.tmp.js');
const MAX_LINE = 4000;

// 1. Minify
console.log('Minifying formio.js...');
execSync(`npx terser "${SRC}" --compress --mangle --output "${TMP}"`);

// 2. Read and break into lines at semicolons
const minlib = fs.readFileSync(TMP, 'utf8').trim();
fs.unlinkSync(TMP);

const lines = [];
let buf = '';
for (const ch of minlib) {
    buf += ch;
    if (ch === ';' && buf.length >= MAX_LINE) {
        lines.push(buf);
        buf = '';
    }
}
if (buf) lines.push(buf);

// 3. Escape backticks and ${...} so they don't break the outer template literal.
//    \` → ` and \${ → ${ in the resulting string value, which is valid JS when injected.
const brokenLib = lines.join('\n')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');

// 4. Build inject wrapper
const output =
    'if(window.__injectedScripts===undefined||window.__injectedScripts===null)' +
    '{window.__injectedScripts=new Set();}\n' +
    'function injectScriptOnce(key,source){' +
    'if(window.__injectedScripts.has(key)){return;}' +
    'console.log("Injecting script: "+key);' +
    'const script=document.createElement("script");' +
    'script.textContent=source;' +
    'document.head.appendChild(script);' +
    'window.__injectedScripts.add(key);}\n' +
    'const scriptData=`\n' + brokenLib + '\n`;\n' +
    'injectScriptOnce("ThereforeScripts",scriptData);\n';

fs.writeFileSync(OUT, output, 'utf8');

const lines_count = output.split('\n').length;
const max_len = Math.max(...output.split('\n').map(l => l.length));
const size = Buffer.byteLength(output, 'utf8');

console.log(`Written: formio-inject.min.js`);
console.log(`  Lines:    ${lines_count}`);
console.log(`  Max line: ${max_len} chars`);
console.log(`  Size:     ${(size / 1024).toFixed(1)} KB`);
