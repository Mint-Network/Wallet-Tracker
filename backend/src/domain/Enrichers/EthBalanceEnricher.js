import { ethers } from "ethers";
import { IBalanceEnricher } from "./IBalanceEnricher.js";
import logger from "../../utils/logger.js";

/**
 * Enricher that adds ETH and Codex balances to derived address entries.
 * Depends on two balance providers (injected for testability and DIP).
 */
export class EthBalanceEnricher extends IBalanceEnricher {
  /**
   * @param {object} ethProvider - Provider with getBalance(address) returning balance in wei
   * @param {object} codexProvider - Provider with getBalance(address) returning balance in wei
   */
  constructor(ethProvider, codexProvider) {
    super();
    this.ethProvider = ethProvider;
    this.codexProvider = codexProvider;
  }

  /**
   * Fetches ETH and Codex balance for each child and adds ethBalance, codexBalance (in ETH units).
   * Fetches both balances in parallel per address for better performance.
   */
  async enrich(children) {
    const startTime = Date.now();
    const addressCount = children.length;
    logger.info({ addressCount }, `🔄 Starting balance enrichment for ${addressCount} address(es)`);
    
    const results = await Promise.all(
      children.map(async (c) => {
        // Fetch ETH and Codex balances in parallel for each address
        const [balanceWei, codexBalanceWei] = await Promise.all([
          this.ethProvider.getBalance(c.address).catch((err) => {
            logger.debug({ address: c.address, error: err.message }, "ETH balance fetch failed, using 0");
            return 0n;
          }),
          this.codexProvider.getBalance(c.address).catch((err) => {
            logger.debug({ address: c.address, error: err.message }, "Codex balance fetch failed, using 0");
            return 0n;
          }),
        ]);
        return {
          ...c,
          ethBalance: ethers.formatEther(balanceWei),
          codexBalance: ethers.formatEther(codexBalanceWei),
        };
      }),
    );
    
    const totalDuration = Date.now() - startTime;
    logger.info(
      { addressCount, totalDurationMs: totalDuration, avgDurationMs: Math.round(totalDuration / addressCount) },
      `✅ Balance enrichment completed: ${addressCount} address(es) in ${totalDuration}ms (avg: ${Math.round(totalDuration / addressCount)}ms per address)`
    );
    
    return results;
  }
}


