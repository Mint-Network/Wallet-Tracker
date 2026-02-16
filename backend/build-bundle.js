import { build } from 'esbuild';
import { mkdirSync, writeFileSync, readFileSync } from 'fs';
import pino from 'pino';
import pretty from 'pino-pretty';

const stream = pretty({
  colorize: true,
  translateTime: 'SYS:standard',
  ignore: 'pid,hostname',
});
const logger = pino(stream);

// Create dist folder
mkdirSync('dist', { recursive: true });

logger.info('Bundling backend with esbuild to ESM...');

// Bundle EVERYTHING into a single ESM file
await build({
  entryPoints: ['index.js'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: 'dist/app.js',
  sourcemap: false,
  inject: [],
  banner: {
    js: `// ${new Date().toISOString()}\n// Bundled for Tauri with ESM support`,
  },
  // Bundle all dependencies into the output file
  packages: 'bundle',
  allowOverwrite: true,
  // Keep Node.js built-in modules as external (they can't be bundled)
  external: [
    'node:*',
    'fs',
    'path',
    'os',
    'http',
    'https',
    'events',
    'stream',
    'util',
    'buffer',
    'crypto',
    'child_process',
    'net',
    'tls',
    'url',
    'querystring',
    'string_decoder',
    'zlib'
  ],
  // Add a plugin to handle dynamic requires properly
  plugins: [
    {
      name: 'node-protocol-fix',
      setup(build) {
        build.onResolve({ filter: /^node:/ }, (args) => {
          // Return the module with node: prefix intact
          return { path: args.path, external: true };
        });
      },
    },
  ],
}).catch((error) => {
  logger.error('esbuild failed:', error);
  process.exit(1);
});

logger.info('✅ Bundled to dist/app.js (ESM format)');
