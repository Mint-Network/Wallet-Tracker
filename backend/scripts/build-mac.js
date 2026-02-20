/**
 * Build backend for macOS (ARM or Intel) and copy to frontend/src-tauri/bin.
 * Creates platform-specific names for Tauri sidecar.
 * Run from backend dir: node scripts/build-mac.js <arm|intel>
 */
import { mkdirSync, cpSync, writeFileSync, chmodSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(__dirname, "..");
const binDir = join(backendRoot, "..", "frontend", "src-tauri", "bin");

const targetArg = process.argv[2];
if (!targetArg || (targetArg !== "arm" && targetArg !== "intel")) {
  console.error("Usage: node scripts/build-mac.js <arm|intel>");
  process.exit(1);
}

const targetTriple = targetArg === "arm" ? "aarch64-apple-darwin" : "x86_64-apple-darwin";
const target = `mac-${targetArg}`;

console.log("Building backend for macOS:", target, `(${targetTriple})`);

mkdirSync(binDir, { recursive: true });

// Create Tauri sidecar name (required by externalBin)
const tauriWrapperPath = join(binDir, `wallet-backend-${targetTriple}`);
// Also create simple name for fallback in Rust code
const simpleWrapperPath = join(binDir, "wallet-backend");

const wrapperContent = `#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
node index.js
`;

// Create Tauri sidecar name
writeFileSync(tauriWrapperPath, wrapperContent, "utf8");
chmodSync(tauriWrapperPath, 0o755);

// Also create simple name for fallback
writeFileSync(simpleWrapperPath, wrapperContent, "utf8");
chmodSync(simpleWrapperPath, 0o755);

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
