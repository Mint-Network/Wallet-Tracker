const { WalletStrategyRegistry } = require("./WalletStrategyRegistry.js");

/**
 * Optional facade over the registry. Use WalletStrategyRegistry.get(currency) directly if you prefer.
 * Kept for backward compatibility and to document the factory role.
 */
class WalletStrategyFactory {
  static create(currency) {
    return WalletStrategyRegistry.get(currency);
  }
}

module.exports = { WalletStrategyFactory };
