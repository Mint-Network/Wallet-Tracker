#!/bin/bash

TARGET=$1

if [ -z "$TARGET" ]; then
  echo "Usage: ./build.sh <target>"
  echo "Targets: win, mac-arm, mac-intel"
  exit 1
fi

case "$TARGET" in
  win)
    OUTPUT="../frontend/src-tauri/bin/wallet-backend-x86_64-pc-windows-msvc.exe"
    ;;
  mac-arm)
    OUTPUT="../frontend/src-tauri/bin/wallet-backend-aarch64-apple-darwin"
    ;;
  mac-intel)
    OUTPUT="../frontend/src-tauri/bin/wallet-backend-x86_64-apple-darwin"
    ;;
  *)
    echo "Invalid target. Use: win, mac-arm, or mac-intel"
    exit 1
    ;;
esac

echo "Building for $TARGET..."

# Step 1: Create Node.js wrapper script
echo "Step 1: Creating Node.js wrapper script..."

if [ "$TARGET" = "win" ]; then
  # Create Windows batch wrapper
  cat > "$OUTPUT" << 'EOFBAT'
@echo off
setlocal
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"
node index.js
EOFBAT
else
  # Create Unix shell wrapper
  cat > "$OUTPUT" << 'EOFSH'
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
node index.js
EOFSH
  chmod +x "$OUTPUT"
fi

# Step 2: Copy all backend files to bin directory
echo "Step 2: Copying backend files..."

# Create bin directory if it doesn't exist
mkdir -p "../frontend/src-tauri/bin"

# Copy package.json and lock file
cp package.json "../frontend/src-tauri/bin/"
cp package-lock.json "../frontend/src-tauri/bin/" 2>/dev/null || echo "No package-lock.json found, skipping..."

# Copy source directories
cp -r src "../frontend/src-tauri/bin/"
cp index.js "../frontend/src-tauri/bin/"

# Step 3: Install dependencies in bin directory
echo "Step 3: Installing dependencies..."
cd "../frontend/src-tauri/bin"
npm install --production
cd -

echo "✅ Built: $OUTPUT"
echo "Note: This uses a Node.js wrapper. Node.js must be installed on the target system."
