#!/bin/bash

TARGET=$1

if [ -z "$TARGET" ]; then
  echo "Usage: ./copy-backend.sh <target>"
  echo "Targets: mac-arm, mac-intel, win"
  exit 1
fi

case "$TARGET" in
  mac-arm)
    BACKEND_FILE="../../backend/src-tauri/bin/wallet-backend-aarch64-apple-darwin"
    ;;
  mac-intel)
    BACKEND_FILE="../../backend/src-tauri/bin/wallet-backend-x86_64-apple-darwin"
    ;;
  win)
    BACKEND_FILE="../../backend/src-tauri/bin/wallet-backend-x86_64-pc-windows-msvc.exe"
    ;;
  *)
    echo "Invalid target. Use: mac-arm, mac-intel, or win"
    exit 1
    ;;
esac

echo "Copying backend for $TARGET..."

# Create bin directory if it doesn't exist
mkdir -p src-tauri/bin

# Copy the backend executable
if [ -f "$BACKEND_FILE" ]; then
  cp "$BACKEND_FILE" "src-tauri/bin/"
  echo "✅ Copied $BACKEND_FILE to src-tauri/bin/"
else
  echo "❌ Backend file not found: $BACKEND_FILE"
  echo "Please run 'cd ../../backend && ./build.sh $TARGET' first"
  exit 1
fi

# Copy backend dependencies (optional - for development)
if [ -d "../../backend/src-tauri/bin/src" ]; then
  cp -r ../../backend/src-tauri/bin/src src-tauri/bin/
  echo "✅ Copied backend source files"
fi

if [ -f "../../backend/src-tauri/bin/package.json" ]; then
  cp ../../backend/src-tauri/bin/package.json src-tauri/bin/
  echo "✅ Copied package.json"
fi

if [ -d "../../backend/src-tauri/bin/node_modules" ]; then
  cp -r ../../backend/src-tauri/bin/node_modules src-tauri/bin/
  echo "✅ Copied node_modules"
fi

echo "✅ Backend copied successfully"
