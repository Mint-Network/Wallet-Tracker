/**
 * Pre-build script to copy .env file to Tauri directory
 * This ensures the .env file is available when bundled
 */
import { copyFileSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const repoRoot = join(__dirname, '../..');
const backendEnv = join(repoRoot, 'backend', '.env');
const tauriDir = join(repoRoot, 'frontend', 'src-tauri');
const tauriEnv = join(tauriDir, '.env');
const binDir = join(tauriDir, 'bin');

// Copy .env file to Tauri directory (for bundling as resource)
if (existsSync(backendEnv)) {
  try {
    copyFileSync(backendEnv, tauriEnv);
    console.log('✅ Copied .env file to Tauri directory (for resource bundling)');
    
    // Also copy .env to bin directory so it's bundled with backend files
    const binEnv = join(binDir, '.env');
    copyFileSync(backendEnv, binEnv);
    console.log('✅ Copied .env file to bin directory');
  } catch (error) {
    console.error('❌ Failed to copy .env file to Tauri directory:', error.message);
    process.exit(1);
  }
} else {
  console.warn('⚠️  backend/.env not found - creating minimal .env for Tauri resource path');
  const minimal = 'PORT=55001\nNODE_ENV=development\n';
  try {
    writeFileSync(tauriEnv, minimal);
    console.log('✅ Created minimal .env in Tauri directory');
  } catch (e) {
    console.error('❌ Failed to create .env:', e.message);
    process.exit(1);
  }
}
