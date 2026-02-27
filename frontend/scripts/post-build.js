/**
 * Post-build script to copy backend bin directory contents to the app bundle's MacOS directory
 * This ensures all backend files are in the same location as the wrapper script
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

// Copy all contents from bin directory to MacOS directory
console.log('📋 Copying backend files to MacOS directory...');

try {
  // Read all items in bin directory
  const items = readdirSync(binDir, { withFileTypes: true });
  
  for (const item of items) {
    const srcPath = join(binDir, item.name);
    const destPath = join(macosDir, item.name);
    
    // Skip the wrapper script itself (it's already there from externalBin)
    if (item.name === 'wallet-backend' || 
        item.name === 'wallet-backend-aarch64-apple-darwin' ||
        item.name === 'wallet-backend-x86_64-apple-darwin') {
      console.log(`  ⏭️  Skipping wrapper script: ${item.name}`);
      continue;
    }
    
    if (item.isDirectory()) {
      // Copy directory recursively
      cpSync(srcPath, destPath, { recursive: true });
      console.log(`  ✅ Copied directory: ${item.name}`);
    } else if (item.isFile()) {
      // Copy file
      cpSync(srcPath, destPath);
      console.log(`  ✅ Copied file: ${item.name}`);
    }
  }
  
  console.log(`✅ Successfully copied backend files to ${macosDir}`);
  console.log('📝 All backend files are now in the same directory as the wrapper script');
} catch (error) {
  console.error('❌ Failed to copy backend files:', error.message);
  process.exit(1);
}
