import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
import { mkdirSync, copyFileSync, rmSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import pino from 'pino';
import pretty from 'pino-pretty';

const stream = pretty({
  colorize: true,
  translateTime: 'SYS:standard',
  ignore: 'pid,hostname',
});
const logger = pino(stream);

let target = process.argv[2];

// Resolve "current" to platform-specific target
if (target === 'current') {
  const platform = process.platform;
  const arch = process.arch;
  if (platform === 'win32') {
    target = 'win';
  } else if (platform === 'darwin') {
    target = arch === 'arm64' ? 'mac-arm' : 'mac-intel';
  } else {
    logger.error('Unsupported platform for current:', platform, arch);
    process.exit(1);
  }
}

const pkgTargets = {
  'win': 'node18-win-x64',
  'mac-arm': 'node18-macos-arm64',
  'mac-intel': 'node18-macos-x64'
};

const outputs = {
  'win': resolve(__dirname, '../frontend/src-tauri/bin/wallet-backend-x86_64-pc-windows-msvc.exe'),
  'mac-arm': resolve(__dirname, '../frontend/src-tauri/bin/wallet-backend-aarch64-apple-darwin'),
  'mac-intel': resolve(__dirname, '../frontend/src-tauri/bin/wallet-backend-x86_64-apple-darwin')
};

const pkgTarget = pkgTargets[target];
const outputPath = outputs[target];
if (!pkgTarget || !outputPath) {
  logger.error('Invalid target. Use: win, mac-arm, mac-intel, or current');
  process.exit(1);
}

logger.info(`Packaging with pkg for ${pkgTarget}...`);

// Declare these outside try block so they're accessible in catch
const packageJsonPath = resolve(__dirname, 'package.json');
let originalPackageJson = null;
let packageJsonModified = false;

try {
  // Temporarily remove "main": "server.js" from backend/package.json so pkg doesn't include it
  
  if (existsSync(packageJsonPath)) {
    originalPackageJson = readFileSync(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(originalPackageJson);
    const originalMain = pkg.main;
    delete pkg.main; // Remove main so pkg doesn't see server.js
    writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
    packageJsonModified = true;
    logger.info('📦 Temporarily removed "main" from package.json');
  }
  
  try {
    // Create temp directory in system temp (completely isolated)
    const tempDir = resolve(tmpdir(), `pkg-build-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
    
    // Copy ONLY the bundled file (all deps are bundled, no pino at runtime)
    copyFileSync(resolve(__dirname, 'dist', 'app.js'), resolve(tempDir, 'app.js'));
    
    // Create minimal package.json with pkg configuration
    const pkgJson = {
      name: 'wallet-backend',
      version: '1.0.0',
      main: 'app.js',
      bin: 'app.js',
      pkg: {
        scripts: ['app.js'],
        targets: [pkgTarget]
      }
    };
    writeFileSync(resolve(tempDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
    
    // Ensure output directory exists
    mkdirSync(resolve(__dirname, '../frontend/src-tauri/bin'), { recursive: true });
    
    // Run pkg from temp directory (use absolute path for output)
    const originalCwd = process.cwd();
    process.chdir(tempDir);
    
    try {
      const pkgCmd = `npx pkg app.js --targets ${pkgTarget} --output "${outputPath}"`;
      execSync(pkgCmd, { stdio: 'inherit' });
      logger.info(`✅ Built: ${outputPath}`);
    } finally {
      process.chdir(originalCwd);
      rmSync(tempDir, { recursive: true, force: true });
    }
  } finally {
    // Restore original package.json
    if (packageJsonModified && originalPackageJson) {
      writeFileSync(packageJsonPath, originalPackageJson);
      logger.info('✅ Restored package.json');
    }
  }
} catch (error) {
  logger.error({ error: error.message, stack: error.stack }, '❌ pkg failed');
  console.error('Full error:', error);
  // Restore package.json on error too
  if (packageJsonModified && originalPackageJson) {
    writeFileSync(packageJsonPath, originalPackageJson);
  }
  process.exit(1);
}
