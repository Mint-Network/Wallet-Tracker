const bip39 = require("@scure/bip39");
const { derivePath } = require("ed25519-hd-key");
const nacl = require("tweetnacl");
const bs58 = require("bs58");
const { WalletStrategyRegistry } = require("../Factory/WalletStrategyRegistry.js");
const { IWalletStrategy } = require("./IWalletStrategy.js");
const { InputType } = require("../Types/InputType.js");

/**
 * Solana wallet derivation strategy (BIP44 path m/44'/501'/i'/0').
 * Only MNEMONIC is supported; XPUB handler throws (Solana uses Ed25519, different from BIP32 xpub).
 */
class SolWalletStrategy extends IWalletStrategy {
  getInputHandlers() {
    return {
      [InputType.MNEMONIC]: {
        deriveRoot: (input) => {
          const seed = bip39.mnemonicToSeedSync(input);
          return { seed };
        },
        deriveChildren: (root, count, startIdx) => {
          return Array.from({ length: count }).map((_, i) => {
            const path = `m/44'/501'/${startIdx + i}'/0'`;
            const { key } = derivePath(path, root.seed.toString("hex"));
            const kp = nacl.sign.keyPair.fromSeed(key);
            return {
              srNo: startIdx + i + 1,
              path,
              address: bs58.encode(kp.publicKey),
            };
          });
        },
      },
      [InputType.XPUB]: {
        deriveRoot: () => {
          throw new Error("Unsupported input type for SOL (use MNEMONIC)");
        },
        deriveChildren: () => {
          throw new Error("Unsupported input type for SOL (use MNEMONIC)");
        },
      },
    };
  }
}

WalletStrategyRegistry.register("SOL", SolWalletStrategy);

module.exports = { SolWalletStrategy };
