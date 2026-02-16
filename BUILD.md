# Wallet Tracker - Build Instructions

This document provides instructions for building the Wallet Tracker application for different platforms.

## Prerequisites

### Common Requirements
- Node.js 18+ (for backend)
- npm or yarn
- Git

### macOS
- Xcode Command Line Tools
- macOS 10.15+ (Catalina or later)

### Windows
- Visual Studio Build Tools
- Windows 10+

## Project Structure

```
Wallet-Tracker/
├── backend/          # Node.js Express backend
│   ├── src/         # Backend source code
│   ├── dist/        # Bundled JavaScript files
│   ├── build.sh      # Backend build script
│   └── package.json
├── frontend/         # React + Tauri frontend
│   ├── src/         # Frontend source code
│   ├── src-tauri/   # Tauri native code
│   │   └── bin/    # Backend binaries (generated)
│   └── package.json
└── BUILD.md         # This file
```

## Development

### Backend Development

```bash
cd backend
npm install
npm start  # Runs on port 5001
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev  # Starts Tauri dev server
```

## Building for Production

### Quick Build (macOS ARM - Apple Silicon)

```bash
cd frontend
npm run build:all
```

### Platform-Specific Builds

#### macOS ARM (Apple Silicon)

```bash
# Backend only
cd backend
npm run build:backend:mac:arm

# Full application
cd frontend
npm run build:backend:mac:arm
TAURI_TARGET_TRIPLE=aarch64-apple-darwin npm run tauri build -- --bundles app
```

#### macOS Intel

```bash
# Backend only
cd backend
npm run build:backend:mac:intel

# Full application
cd frontend
npm run build:backend:mac:intel
TAURI_TARGET_TRIPLE=x86_64-apple-darwin npm run tauri build -- --bundles app
```

#### Windows

```bash
# Backend only
cd backend
npm run build:backend:win

# Full application
cd frontend
npm run build:backend:win
TAURI_TARGET_TRIPLE=x86_64-pc-windows-msvc npm run tauri build -- --bundles msi
```

## Build Process Details

### Backend Build Process

The backend build script (`backend/build.sh`) performs the following steps:

1. **Creates a Node.js wrapper script**:
   - For Unix: Shell script that changes directory and runs `node index.js`
   - For Windows: Batch file that changes directory and runs `node index.js`

2. **Copies backend files**:
   - Copies `package.json` and `package-lock.json`
   - Copies all source files from `src/` directory
   - Copies `index.js` entry point

3. **Installs dependencies**:
   - Runs `npm install --production` in the target directory
   - Ensures all required dependencies are available

### Frontend Build Process

The Tauri build process:

1. **Builds React frontend** using Vite
2. **Compiles Rust code** for the target platform
3. **Creates application bundle** (.app on macOS, .exe on Windows)
4. **Includes backend resources** from `src-tauri/bin/`

### Backend Spawning

The Tauri application automatically spawns the backend process on startup:

1. **Determines platform-specific backend name**:
   - macOS ARM: `wallet-backend-aarch64-apple-darwin`
   - macOS Intel: `wallet-backend-x86_64-apple-darwin`
   - Windows: `wallet-backend-x86_64-pc-windows-msvc.exe`

2. **Sets up backend environment**:
   - Sets `PORT` environment variable to 55001
   - Changes to the backend's working directory

3. **Spawns the backend process**:
   - Uses `std::process::Command` to execute the backend
   - Backend runs in the background

## Output Locations

### macOS
```
frontend/src-tauri/target/release/bundle/macos/Wallet Tracker.app
```

### Windows
```
frontend/src-tauri/target/release/bundle/msi/Wallet Tracker_1.0.1_x64_en-US.msi
```

## Backend Requirements

The built backend requires:

- **Node.js 18+** installed on the target system
- **No additional dependencies** (all bundled)

The backend wrapper script automatically:
- Changes to the correct working directory
- Calls `node index.js` with the correct environment

## Environment Variables

The backend reads the following environment variables:

- `PORT`: Server port (default: 5001, Tauri sets to 55001)
- `ETH_RPC_URL`: Ethereum RPC URL for balance queries
- `CODEX_RPC_URL`: Codex RPC URL for balance queries (optional)

## Troubleshooting

### Backend Not Starting

If the backend doesn't start when the application launches:

1. **Check Node.js installation**:
   ```bash
   node --version  # Should be 18+
   ```

2. **Verify backend executable exists**:
   ```bash
   ls -la src-tauri/target/release/bundle/macos/Wallet\ Tracker.app/Contents/Resources/bin/
   ```

3. **Check backend logs**:
   - The backend logs to stdout/stderr
   - In Tauri, logs are visible in the console

### Build Errors

#### "node_modules not found"

Ensure you ran the backend build script which installs dependencies:
```bash
cd backend
./build.sh mac-arm
```

#### "Backend executable not found"

Make sure you built the backend before building the frontend:
```bash
cd backend
npm run build:backend:mac:arm

cd ../frontend
npm run tauri:build
```

#### Icon format errors

The Tauri build may fail with icon format errors. Update `tauri.conf.json`:
```json
{
  "bundle": {
    "icon": ["icons/icon.png"]
  }
}
```

## Running the Built Application

### macOS

```bash
open src-tauri/target/release/bundle/macos/Wallet\ Tracker.app
```

### Windows

```bash
src-tauri/target/release/bundle/msi/Wallet\ Tracker_1.0.1_x64_en-US.msi
```

## Development Notes

- The backend uses ES Modules (`"type": "module"` in package.json)
- All backend code has been migrated from CommonJS to ESM
- The Tauri app spawns the backend on port 55001
- Frontend communicates with backend via HTTP API

## License

See LICENSE file for details.
