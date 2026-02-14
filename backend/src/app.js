/**
 * Express app and composition root. Loads strategies, wires DI for ETH (balance enricher + RPC providers),
 * mounts wallet API and Swagger UI.
 */
const express = require("express");
const cors = require("cors");
const walletRoutes = require("./routes/walletRoute.js");
const swaggerUi = require("swagger-ui-express");
const { swaggerSpec } = require("./docs/swagger.js");
require("dotenv").config();
// Load all strategies so they self-register (BTC, LTC, BCH, SOL). ETH is re-registered below with DI.
require("./domain/Strategy/index.js");

const { WalletStrategyRegistry } = require("./domain/Factory/WalletStrategyRegistry.js");
const { EthWalletStrategy } = require("./domain/Strategy/EthWalletStrategy.js");
const { EthRpcProvider } = require("./domain/Providers/EthRpcProvider.js");
const { CodexRpcProvider } = require("./domain/Providers/CodexRpcProvider.js");
const { ZeroBalanceProvider } = require("./domain/Providers/ZeroBalanceProvider.js");
const { EthBalanceEnricher } = require("./domain/Enrichers/EthBalanceEnricher.js");
const logger = require("./utils/logger");

const app = express();
// ---------- Composition root (DI): wire ETH strategy with balance enricher and RPC providers ----------
const ethRpcUrl = process.env.ETH_RPC_URL;
const codexRpcUrl = process.env.CODEX_RPC_URL;
logger.info({ ethRpcUrl }, "On the appjs file the ethRpcUrl is");
logger.info({ codexRpcUrl }, "On the appjs file the codexRpcUrl is");
if (ethRpcUrl) {
  const ethProvider = new EthRpcProvider(ethRpcUrl);
  const codexProvider = codexRpcUrl
    ? new CodexRpcProvider(codexRpcUrl)
    : new ZeroBalanceProvider();
  if (!codexRpcUrl) {
    logger.warn("CODEX_RPC_URL not set: codexBalance will show 0.0. Set it in .env for real Codex balances.");
  }
  const ethBalanceEnricher = new EthBalanceEnricher(ethProvider, codexProvider);
  WalletStrategyRegistry.register("ETH", () => new EthWalletStrategy(ethBalanceEnricher));
} else {
  logger.warn("ETH_RPC_URL not set in .env: ETH/Codex balance columns will be empty. Add ETH_RPC_URL (and optionally CODEX_RPC_URL) to enable balances.");
}

app.use(cors());
app.use(express.json());

app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Wallet Tracker API",
  customfavIcon: "/favicon.ico",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
  },
}));

app.use("/api/wallet", walletRoutes);
app.get("/", (req, res) => {
  res.send("Welcome to the Wallet Tracker API");
});

module.exports = app;
