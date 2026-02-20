import { ethers } from "ethers";
import logger from "../../utils/logger.js";

// Hard-coded default Codex RPC URL for balance lookups.
// This avoids any dependency on process.env.CODEX_RPC_URL in packaged builds.
const DEFAULT_CODEX_RPC_URL = "https://node-mainnet.codexnetwork.org";

/**
 * Codex chain RPC provider for balance lookups.
 * Accepts rpcUrl in constructor for DI; defaults to DEFAULT_CODEX_RPC_URL.
 */
export class CodexRpcProvider {
  /**
   * @param {string} [rpcUrl] - Optional. Uses DEFAULT_CODEX_RPC_URL if omitted.
   */
  constructor(rpcUrl = DEFAULT_CODEX_RPC_URL) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  /**
   * @param {string} address - Address on Codex chain
   * @returns {Promise<bigint>} Balance in wei
   */
  async getBalance(address) {
    const startTime = Date.now();
    const timeoutMs = 8000; // 8 second timeout per balance request
    logger.debug({ address }, "Fetching Codex balance...");
    
    try {
      const balance = await Promise.race([
        this.provider.getBalance(address),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Codex balance request timeout for ${address}`)), timeoutMs)
        ),
      ]);
      const duration = Date.now() - startTime;
      const balanceEth = ethers.formatEther(balance);
      logger.info(
        { address, balanceWei: balance.toString(), balanceEth, durationMs: duration },
        `✅ Codex balance fetched: ${balanceEth} CODEX (${duration}ms)`
      );
      return balance;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.warn(
        { address, error: error.message, durationMs: duration },
        `⚠️ Codex balance fetch failed after ${duration}ms`
      );
      throw error;
    }
  }
}


