# Create release zip for Wallet Tracker (Windows)
# Run from repo root: .\scripts\create-release-zip.ps1
# Or: .\scripts\create-release-zip.ps1 -Version "1.0.2"

param(
    [string]$Version = ""
)

$ErrorActionPreference = "Stop"
$repoRoot = $PSScriptRoot + "\.."
$releaseDir = Join-Path $repoRoot "frontend\src-tauri\target\release"
$tauriConf = Join-Path $repoRoot "frontend\src-tauri\tauri.conf.json"

# Get version from tauri.conf.json if not provided
if (-not $Version) {
    $json = Get-Content $tauriConf -Raw | ConvertFrom-Json
    $Version = $json.version
}

$zipName = "Wallet-Tracker-v$Version-windows-x64.zip"
$zipPath = Join-Path $repoRoot $zipName

# Required files (main app + backend for fallback)
$mainExe = Join-Path $releaseDir "wallet-tracker.exe"
$backendExe = Join-Path $releaseDir "wallet-backend.exe"
$backendLong = Join-Path $releaseDir "wallet-backend-x86_64-pc-windows-msvc.exe"

if (-not (Test-Path $mainExe)) {
    Write-Error "Not found: $mainExe - Run 'cd frontend; npm run tauri:build' first."
}

# Prefer wallet-backend.exe; else use long name (we'll add as wallet-backend.exe in zip)
$backendToZip = $null
if (Test-Path $backendExe) {
    $backendToZip = $backendExe
} elseif (Test-Path $backendLong) {
    $backendToZip = $backendLong
}
if (-not $backendToZip) {
    Write-Error "Backend exe not found. Run 'cd backend; npm run build:backend:win' then 'cd frontend; npm run tauri:build'."
}

# Remove old zip if present
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

# Temp folder so zip contains flat exes (no paths)
$tempDir = Join-Path $env:TEMP "wallet-tracker-release"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir | Out-Null

Copy-Item $mainExe -Destination (Join-Path $tempDir "wallet-tracker.exe") -Force
# Zip must contain wallet-backend.exe for the app's fallback to find it
Copy-Item $backendToZip -Destination (Join-Path $tempDir "wallet-backend.exe") -Force

# Include the actual .env file with RPC URLs
$envPath = Join-Path $repoRoot "backend\.env"
if (Test-Path $envPath) {
    Copy-Item $envPath -Destination (Join-Path $tempDir ".env") -Force
}

Compress-Archive -Path (Join-Path $tempDir "*") -DestinationPath $zipPath -Force
Remove-Item $tempDir -Recurse -Force

Write-Host "Created: $zipPath"
Write-Host "Upload this file to your GitHub release."
