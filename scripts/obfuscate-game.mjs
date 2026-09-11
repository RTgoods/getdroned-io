/**
 * Obfuscates game.js before the Vercel production build.
 * Only runs when VERCEL=1 (set automatically by Vercel's build environment).
 * Local `npm run build` and `npm run dev` are unaffected.
 *
 * Domain-locks the output to getdroned.io so copied files don't run elsewhere.
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import JavaScriptObfuscator from 'javascript-obfuscator';

if (!process.env.VERCEL) {
  console.log('⏭  Skipping JS obfuscation (set VERCEL=1 to force)');
  process.exit(0);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const gamePath = join(__dirname, '../public/get-droned/assets/js/game.js');

console.log('🔒 Obfuscating game.js for production...');

const source = readFileSync(gamePath, 'utf8');

const result = JavaScriptObfuscator.obfuscate(source, {
  // Output
  compact: true,
  target: 'browser',

  // Rename local identifiers (safe; avoids renaming globals like document/window)
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,

  // Domain lock — script will not execute on any other origin
  domainLock: ['getdroned.io', 'www.getdroned.io'],
  domainLockRedirectUrl: 'about:blank',

  // String obfuscation — encodes string literals so they're not grep-able
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.8,
  rotateStringArray: true,
  shuffleStringArray: true,
  splitStrings: false,

  // Keep these off: they balloon file size and hurt game performance
  controlFlowFlattening: false,
  selfDefending: false,
  deadCodeInjection: false,

  log: false,
});

writeFileSync(gamePath, result.getObfuscatedCode(), 'utf8');
console.log('✅ game.js obfuscated and domain-locked to getdroned.io');
