/**
 * Entry point for the Wallet Tracker API server.
 * Loads env from .env, mounts the Express app, and listens on PORT.
 */
const path = require("path");
const fs = require("fs");
const logger = require("./src/utils/logger");

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
  require("dotenv").config({ path: envPath });
  logger.info(`Loaded .env from: ${envPath}`);
} else {
  // Fallback to default dotenv behavior (current directory)
  require("dotenv").config();
  logger.info("No .env file found, using default dotenv behavior");
}

const app = require("./src/app.js");

const port = process.env.PORT || 5001;

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
