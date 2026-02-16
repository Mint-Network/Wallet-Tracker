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

let target;
if (platform === "darwin") {
  target = arch === "arm64" ? "mac-arm" : "mac-intel";
} else if (platform === "win32") {
  target = "win";
} else {
  console.error("Unsupported platform for build-current:", platform, arch);
  process.exit(1);
}

console.log("Building backend for current platform:", target);

mkdirSync(binDir, { recursive: true });

const isWin = target === "win";
const wrapperPath = join(binDir, isWin ? "wallet-backend.bat" : "wallet-backend");

if (isWin) {
  writeFileSync(
    wrapperPath,
    `@echo off
setlocal
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"
node index.js
`,
    "utf8"
  );
} else {
  writeFileSync(
    wrapperPath,
    `#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
node index.js
`,
    "utf8"
  );
  chmodSync(wrapperPath, 0o755);
}

console.log("Step 1: Created wrapper at", wrapperPath);

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

console.log("✅ Built:", wrapperPath);
console.log("Note: Backend uses a Node.js wrapper. Node.js must be installed on the target system.");
