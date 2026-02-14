/**
 * Entry point for the Wallet Tracker API server.
 * Loads env from .env, mounts the Express app, and listens on PORT.
 */
require("dotenv").config();
const app = require("./src/app.js");
const logger = require("./src/utils/logger");

const port = process.env.PORT || 5001;

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
