/**
 * Build backend for the current platform and copy to frontend/src-tauri/bin.
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

let wrapperName;
if (target === "mac-arm") {
  wrapperName = "wallet-backend-aarch64-apple-darwin";
} else if (target === "mac-intel") {
  wrapperName = "wallet-backend-x86_64-apple-darwin";
} else if (target === "win") {
  wrapperName = "wallet-backend.bat";
} else {
  console.error("Unsupported target:", target);
  process.exit(1);
}

const isWin = target === "win";
const wrapperPath = join(binDir, wrapperName);

if (isWin) {
  writeFileSync(
    wrapperPath,
    `@echo off
setlocal
cd /d "%~dp0"
if defined NODE_BIN (
  "%NODE_BIN%" index.js
) else (
  node index.js
)
`,
    "utf8"
  );
} else {
  writeFileSync(
    wrapperPath,
    `#!/bin/bash
cd "$(dirname "$0")"
NODE_BIN="\${NODE_BIN:-node}"
exec "$NODE_BIN" index.js
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
