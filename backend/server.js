/**
 * Entry point for the Wallet Tracker API server.
 * Loads env from .env, mounts the Express app, and listens on PORT.
 */
import dotenv from "dotenv";
dotenv.config();
import app from "./src/app.js";
import logger from "./src/utils/logger.js";

const port = process.env.PORT || 5001;

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
