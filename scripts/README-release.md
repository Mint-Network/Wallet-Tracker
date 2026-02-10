# Creating a release zip (Windows)

## One-time setup

1. **Build the backend sidecar** (from repo root):
   ```powershell
   cd backend
   npm install
   npm run build:backend:win
   ```

2. **Build the Tauri app**:
   ```powershell
   cd ..\frontend
   npm install
   npm run tauri:build
   ```

## Create the zip

From the **repo root**:

```powershell
.\scripts\create-release-zip.ps1
```

This reads the version from `frontend/src-tauri/tauri.conf.json` and creates:

- **`Wallet-Tracker-v1.0.1-windows-x64.zip`** (or whatever version is in the config)

in the repo root. The zip contains:

- `wallet-tracker.exe`
- `wallet-backend.exe`

Upload that zip to your GitHub release.

### Custom version

```powershell
.\scripts\create-release-zip.ps1 -Version "1.0.2"
```

Creates `Wallet-Tracker-v1.0.2-windows-x64.zip`.
