/**
 * Entry point for the Wallet Tracker API server.
 * Loads env from .env, mounts the Express app, and listens on PORT.
 */
import path from "path";
import fs from "fs";
import logger from "./src/utils/logger.js";
import dotenv from "dotenv";

// For packaged executables (pkg), look for .env in the executable's directory
// For development, use the current working directory
let envPath = path.join(process.cwd(), ".env");

// If running as a packaged executable, try the executable's directory
if (process.pkg) {
  const exeDir = path.dirname(process.execPath);
  const exeEnvPath = path.join(exeDir, ".env");
  if (fs.existsSync(exeEnvPath)) {
    envPath = exeEnvPath;
  }
}

// Try to load .env from the determined path
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  logger.info(`Loaded .env from: ${envPath}`);
} else {
  // Fallback to default dotenv behavior (current directory)
  dotenv.config();
  logger.info("No .env file found, using default dotenv behavior");
}

import app from "./src/app.js";

const port = process.env.PORT || 5001;

// Prevent the process from exiting on unhandled errors
process.on('uncaughtException', (err) => {
  logger.error(err, 'Uncaught Exception thrown');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(reason, 'Unhandled Rejection at Promise');
});

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});

// Keep the process alive
setInterval(() => {}, 1 << 30);
