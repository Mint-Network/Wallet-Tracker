import pkg from 'nexe';
const { nexe } = pkg;
import pino from 'pino';
import pretty from 'pino-pretty';

const stream = pretty({
  colorize: true,
  translateTime: 'SYS:standard',
  ignore: 'pid,hostname',
});
const logger = pino(stream);

const target = process.argv[2];

const targets = {
  'win': { 
    nexeTarget: 'windows-x64-18.5.0',
    output: '../frontend/src-tauri/bin/wallet-backend-x86_64-pc-windows-msvc.exe'
  },
  'mac-arm': { 
    nexeTarget: 'mac-x64-18.5.0',
    output: '../frontend/src-tauri/bin/wallet-backend-aarch64-apple-darwin'
  },
  'mac-intel': { 
    nexeTarget: 'mac-x64-18.5.0',
    output: '../frontend/src-tauri/bin/wallet-backend-x86_64-apple-darwin'
  }
};

const config = targets[target];
if (!config) {
  logger.error('Invalid target. Use: win, mac-arm, or mac-intel');
  process.exit(1);
}

logger.info(`Packaging with nexe for ${config.nexeTarget}...`);

try {
  await nexe.compile({
    input: 'index.js',
    output: config.output,
    target: config.nexeTarget,
    resources: [],
    bundle: './',
    build: true,
    name: 'wallet-backend',
    enableNodeCli: false,
  });
  
  logger.info(`✅ Built: ${config.output}`);
} catch (error) {
  logger.error('❌ nexe failed:', error.message);
  process.exit(1);
}
