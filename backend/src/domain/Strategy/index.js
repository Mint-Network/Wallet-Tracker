/**
 * Side-effect import: loads all currency strategies so they self-register with WalletStrategyRegistry.
 * ETH can be re-registered in the app composition root with an injected balance enricher (DI).
 */
require("./EthWalletStrategy.js");
require("./BtcWalletStrategy.js");
require("./SolWalletStrategy.js");
require("./LtcWalletStrategy.js");
require("./BchWalletStrategy.js");
