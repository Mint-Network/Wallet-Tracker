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

To build the backend for Tauri packaging, use the build script:

```bash
# For Windows
npm run build:backend:win

# For macOS ARM (Apple Silicon)
npm run build:backend:mac:arm

# For macOS Intel
npm run build:backend:mac:intel
```

## Build Process

The build script (`build.sh`) performs the following steps:

1. **Creates a Node.js wrapper script**: A shell script (or batch file on Windows) that runs `node index.js` from the correct directory.

2. **Copies backend files**: Copies all necessary backend source files and dependencies to the Tauri `bin` directory.

3. **Installs dependencies**: Runs `npm install --production` in the target directory to ensure all dependencies are available.

## Distribution

After building, the following files will be created in `../frontend/src-tauri/bin/`:

- **Executable wrapper**: `wallet-backend-aarch64-apple-darwin` (or platform-specific equivalent)
- **Backend files**: Complete Node.js application with all dependencies in `node_modules/`

## Requirements

The built backend requires Node.js to be installed on the target system. The wrapper script handles calling Node.js with the correct working directory.

## Environment Variables

The backend looks for a `.env` file in the same directory as the executable. If not found, it uses default values.

Important environment variables:
- `PORT`: Server port (default: 5001)
- `ETH_RPC_URL`: Ethereum RPC URL for balance queries
- `CODEX_RPC_URL`: Codex RPC URL for balance queries (optional)
