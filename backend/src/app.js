/**
 * Express app and composition root. Loads strategies, wires DI for ETH (balance enricher + RPC providers),
 * mounts wallet API and Swagger UI.
 */
import express from "express";
import cors from "cors";
import walletRoutes from "./routes/walletRoute.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger.js";
import dotenv from "dotenv";
// Load all strategies so they self-register (BTC, LTC, BCH, SOL). ETH is re-registered below with DI.
import "./domain/Strategy/index.js";

import { WalletStrategyRegistry } from "./domain/Factory/WalletStrategyRegistry.js";
import { EthWalletStrategy } from "./domain/Strategy/EthWalletStrategy.js";
import { EthRpcProvider } from "./domain/Providers/EthRpcProvider.js";
import { CodexRpcProvider } from "./domain/Providers/CodexRpcProvider.js";
import { ZeroBalanceProvider } from "./domain/Providers/ZeroBalanceProvider.js";
import { EthBalanceEnricher } from "./domain/Enrichers/EthBalanceEnricher.js";

const app = express();
dotenv.config();
// ---------- Composition root (DI): wire ETH strategy with balance enricher and RPC providers ----------
// You need at least ETH_RPC_URL for ETH/Codex balance columns to appear. CODEX_RPC_URL is optional (shows 0 if missing).
const ethRpcUrl = process.env.ETH_RPC_URL;
const codexRpcUrl = process.env.CODEX_RPC_URL;
console.log("On the appjs file the ethRpcUrl is ", ethRpcUrl);
console.log("On the appjs file the codexRpcUrl is ", codexRpcUrl);
if (ethRpcUrl) {
  const ethProvider = new EthRpcProvider(ethRpcUrl);
  const codexProvider = codexRpcUrl
    ? new CodexRpcProvider(codexRpcUrl)
    : new ZeroBalanceProvider();
  if (!codexRpcUrl) {
    console.warn("CODEX_RPC_URL not set: codexBalance will show 0.0. Set it in .env for real Codex balances.");
  }
  const ethBalanceEnricher = new EthBalanceEnricher(ethProvider, codexProvider);
  WalletStrategyRegistry.register("ETH", () => new EthWalletStrategy(ethBalanceEnricher));
} else {
  console.warn("ETH_RPC_URL not set in .env: ETH/Codex balance columns will be empty. Add ETH_RPC_URL (and optionally CODEX_RPC_URL) to enable balances.");
}

app.use(cors());
app.use(express.json());

app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/wallet", walletRoutes);
app.get("/", (req, res) => {
  res.send("Welcome to the Wallet Tracker API");
});

export default app;
