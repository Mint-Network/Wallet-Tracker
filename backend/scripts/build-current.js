/**
 * Build backend for the current platform and copy to frontend/src-tauri/bin.
 * Output names match Rust (lib.rs): wallet-backend (Unix), wallet-backend.bat (Windows).
 * Run from backend dir: node scripts/build-current.js
 */
import { mkdirSync, cpSync, writeFileSync, chmodSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(__dirname, "..");
const binDir = join(backendRoot, "..", "frontend", "src-tauri", "bin");

const platform = process.platform;
const arch = process.arch;

// Determine target triple for Tauri's externalBin naming convention
let targetTriple;
let target;
let isWin = false;

if (platform === "darwin") {
  isWin = false;
  if (arch === "arm64") {
    target = "mac-arm";
    targetTriple = "aarch64-apple-darwin";
  } else {
    target = "mac-intel";
    targetTriple = "x86_64-apple-darwin";
  }
} else if (platform === "win32") {
  isWin = true;
  target = "win";
  targetTriple = "x86_64-pc-windows-msvc";
} else if (platform === "linux") {
  isWin = false;
  target = "linux";
  targetTriple = arch === "arm64" ? "aarch64-unknown-linux-gnu" : "x86_64-unknown-linux-gnu";
} else {
  console.error("Unsupported platform for build-current:", platform, arch);
  process.exit(1);
}

console.log("Building backend for current platform:", target, `(${targetTriple})`);

mkdirSync(binDir, { recursive: true });

// Create platform-specific name for Tauri sidecar (externalBin expects this)
const tauriWrapperPath = join(binDir, `wallet-backend-${targetTriple}${isWin ? ".bat" : ""}`);
// Also create simple name for fallback in Rust code
const simpleWrapperPath = join(binDir, isWin ? "wallet-backend.bat" : "wallet-backend");

const wrapperContent = isWin
  ? `@echo off
setlocal
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"
node index.js
`
  : `#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
node index.js
`;

// Create Tauri sidecar name (required by externalBin)
writeFileSync(tauriWrapperPath, wrapperContent, "utf8");
if (!isWin) {
  chmodSync(tauriWrapperPath, 0o755);
}

// Also create simple name for fallback in Rust code
writeFileSync(simpleWrapperPath, wrapperContent, "utf8");
if (!isWin) {
  chmodSync(simpleWrapperPath, 0o755);
}

console.log("Step 1: Created wrappers:");
console.log("  - Tauri sidecar:", tauriWrapperPath);
console.log("  - Fallback:", simpleWrapperPath);

cpSync(join(backendRoot, "package.json"), join(binDir, "package.json"));
try {
  cpSync(join(backendRoot, "package-lock.json"), join(binDir, "package-lock.json"));
} catch {
  console.log("No package-lock.json, skipping");
}
cpSync(join(backendRoot, "src"), join(binDir, "src"), { recursive: true });
cpSync(join(backendRoot, "index.js"), join(binDir, "index.js"));

console.log("Step 2: Copied backend files to", binDir);

execSync("npm install --production", {
  cwd: binDir,
  stdio: "inherit",
  shell: true,
});

console.log("✅ Built:", tauriWrapperPath);
console.log("Note: Backend uses a Node.js wrapper. Node.js must be installed on the target system.");
