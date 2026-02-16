# Backend Build Instructions

This backend is a Node.js application that uses ES Modules (ESM).

## Development

Run the backend server:

```bash
npm start
```

Or with auto-reload on file changes:

```bash
npm run dev
```

## Building for Tauri Packaging

The backend must be built and placed in `../frontend/src-tauri/bin/` so Tauri can bundle it when creating the app/DMG. Output names match the Rust side: `wallet-backend` (macOS/Linux), `wallet-backend.bat` (Windows).

**Recommended (automatic):** From the **frontend** directory run `npm run tauri:build` (or `npm run build:all`). This runs `beforeBuildCommand`, which builds the frontend and then the backend for the current platform into `frontend/src-tauri/bin/`.

**Manual build from this directory:**

```bash
# Build for current platform (Node script, works on Windows too)
npm run build:backend:current

# Or use build.sh for a specific target:
npm run build:backend:win      # Windows → wallet-backend.bat
npm run build:backend:mac:arm   # macOS ARM → wallet-backend
npm run build:backend:mac:intel # macOS Intel → wallet-backend
```

## Build Process

The build (either `build.sh` or `scripts/build-current.js`) does the following:

1. **Creates a Node.js wrapper**: A shell script (`wallet-backend`) or batch file (`wallet-backend.bat`) that runs `node index.js` from the bin directory.

2. **Copies backend files**: Copies `package.json`, `index.js`, and `src/` to `../frontend/src-tauri/bin/`.

3. **Installs dependencies**: Runs `npm install --production` in that directory.

## Distribution

After building, `../frontend/src-tauri/bin/` contains:

- **Wrapper**: `wallet-backend` (Unix) or `wallet-backend.bat` (Windows) — names expected by the Tauri Rust code.
- **Backend files**: `index.js`, `src/`, `package.json`, `node_modules/`.
- Tauri’s `resources: ["bin/**/*"]` bundles this folder into the app/DMG.

## Requirements

The built backend requires Node.js to be installed on the target system. The wrapper script handles calling Node.js with the correct working directory.

## Environment Variables

The backend looks for a `.env` file in the same directory as the executable. If not found, it uses default values.

Important environment variables:
- `PORT`: Server port (default: 55001; Tauri spawns the backend with this port)
- `ETH_RPC_URL`: Ethereum RPC URL for balance queries
- `CODEX_RPC_URL`: Codex RPC URL for balance queries (optional)
