import { build } from 'esbuild';
import { mkdirSync, writeFileSync, readFileSync } from 'fs';

// Create dist folder
mkdirSync('dist', { recursive: true });

console.log('Bundling backend with esbuild to CommonJS...');

// Bundle EVERYTHING into a single CommonJS file
await build({
  entryPoints: ['index.js'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outfile: 'dist/app.js',
  external: [],
  sourcemap: false,
}).catch((error) => {
  console.error('esbuild failed:', error);
  process.exit(1);
});

// Clean up the bundled code
let code = readFileSync('dist/app.js', 'utf-8');
// Remove comment references to server.js
code = code.replace(/\/\/ server\.js\n/g, '// entry\n');
code = code.replace(/\/\/.*server\.js.*\n/g, '// entry\n');
// Fix standalone dotenv.config() calls - find the dotenv require and use it
// First, find where dotenv is required/imported
const dotenvRequireMatch = code.match(/var\s+(\w+)\s*=\s*require\(["']dotenv["']\)/);
if (dotenvRequireMatch) {
  const dotenvVar = dotenvRequireMatch[1];
  // Replace standalone dotenv.config() with the variable
  code = code.replace(/\bdotenv\.config\(\)/g, `${dotenvVar}.config()`);
} else {
  // If no dotenv require found, add one and use it
  code = code.replace(/\bdotenv\.config\(\)/g, 'require("dotenv").config()');
}
writeFileSync('dist/app.js', code);

console.log('✅ Bundled to dist/app.js (all server.js references removed)');
