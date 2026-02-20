import { ethers } from "ethers";
import logger from "../../utils/logger.js";

// Hard-coded default Ethereum RPC URL for balance lookups.
// This avoids any dependency on process.env.ETH_RPC_URL in packaged builds.
const DEFAULT_ETH_RPC_URL = "https://eth.llamarpc.com";

/**
 * Ethereum RPC provider used to fetch balances.
 * Accepts rpcUrl in constructor for DI and testability; defaults to DEFAULT_ETH_RPC_URL.
 */
export class EthRpcProvider {
  /**
   * @param {string} [rpcUrl] - Optional. Uses DEFAULT_ETH_RPC_URL if omitted.
   */
  constructor(rpcUrl = DEFAULT_ETH_RPC_URL) {
    if (!rpcUrl) {
      throw new Error("ETH RPC URL is not defined");
    }
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  /**
   * @param {string} address - Ethereum address
   * @returns {Promise<bigint>} Balance in wei
   */
  async getBalance(address) {
    const startTime = Date.now();
    const timeoutMs = 8000; // 8 second timeout per balance request
    logger.debug({ address }, "Fetching ETH balance...");
    
    try {
      const balance = await Promise.race([
        this.provider.getBalance(address),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`ETH balance request timeout for ${address}`)), timeoutMs)
        ),
      ]);
      const duration = Date.now() - startTime;
      const balanceEth = ethers.formatEther(balance);
      logger.info(
        { address, balanceWei: balance.toString(), balanceEth, durationMs: duration },
        `✅ ETH balance fetched: ${balanceEth} ETH (${duration}ms)`
      );
      return balance;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.warn(
        { address, error: error.message, durationMs: duration },
        `⚠️ ETH balance fetch failed after ${duration}ms`
      );
      throw error;
    }
  }
}


