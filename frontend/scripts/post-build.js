/**
 * Post-build script to copy .env file to the app bundle's MacOS directory
 * The pkg binary is self-contained, so we only need to copy .env
 */
import { existsSync, cpSync, readdirSync } from 'fs';
import { join } from 'path';

const repoRoot = process.cwd();
const tauriDir = join(repoRoot, 'src-tauri');
const binDir = join(tauriDir, 'bin');
const bundleDir = join(tauriDir, 'target', 'release', 'bundle', 'macos');

// Check if we're on macOS and the bundle directory exists
if (process.platform !== 'darwin') {
  console.log('ℹ️  Not on macOS, skipping post-build copy');
  process.exit(0);
}

if (!existsSync(bundleDir)) {
  console.log('ℹ️  Bundle directory not found, skipping post-build copy');
  process.exit(0);
}

if (!existsSync(binDir)) {
  console.log('⚠️  Bin directory not found, skipping post-build copy');
  process.exit(0);
}

// Find the .app bundle
const bundles = readdirSync(bundleDir).filter(name => name.endsWith('.app'));

if (bundles.length === 0) {
  console.log('ℹ️  No .app bundles found, skipping post-build copy');
  process.exit(0);
}

if (bundles.length > 1) {
  console.log('⚠️  Multiple .app bundles found, using the first one:', bundles[0]);
}

const appBundle = bundles[0];
const appPath = join(bundleDir, appBundle);
const macosDir = join(appPath, 'Contents', 'MacOS');

console.log(`📦 Found app bundle: ${appBundle}`);
console.log(`📁 Target MacOS directory: ${macosDir}`);

if (!existsSync(macosDir)) {
  console.error('❌ MacOS directory not found in app bundle');
  process.exit(1);
}

// Copy only the .env file (pkg binary is self-contained)
console.log('📋 Copying .env file to MacOS directory...');

try {
  const envFile = join(binDir, '.env');
  if (existsSync(envFile)) {
    cpSync(envFile, join(macosDir, '.env'));
    console.log('✅ Copied .env file to MacOS directory');
  } else {
    console.warn('⚠️  .env file not found in bin directory');
  }

  console.log('✅ Post-build complete');
  console.log('📝 The pkg binary is self-contained and does not need external files');
} catch (error) {
  console.error('❌ Failed to copy .env file:', error.message);
  process.exit(1);
}
