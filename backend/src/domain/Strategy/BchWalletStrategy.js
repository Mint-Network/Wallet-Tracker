import { HDKey } from "@scure/bip32";
import * as bitcoin from "bitcoinjs-lib";
import cashaddr from "cashaddrjs";
import * as bip39 from "@scure/bip39";
import { InputType } from "../Types/InputType.js";
import { WalletStrategyRegistry } from "../Factory/WalletStrategyRegistry.js";
import { IWalletStrategy } from "./IWalletStrategy.js";

const BASE_PATH_MNEMONIC = "m/44'/145'/0'/0";

/**
 * Bitcoin Cash (P2PKH, CashAddr) wallet derivation strategy.
 * Supports MNEMONIC and XPUB via input handlers (OCP). No balance enrichment.
 */
export class BchWalletStrategy extends IWalletStrategy {
  getInputHandlers() {
    return {
      [InputType.XPUB]: {
        deriveRoot: (input) => {
          const node = HDKey.fromExtendedKey(input);
          return { node, basePath: "" };
        },
        deriveChildren: (root, count, startIndex) => {
          return Array.from({ length: count }).map((_, i) => {
            const child = root.node.derive(startIndex + i);
            const { hash } = bitcoin.payments.p2pkh({
              pubkey: Buffer.from(child.publicKey),
            });
            const address = cashaddr.encode("bitcoincash", "P2PKH", hash);
            return {
              srNo: startIndex + i + 1,
              path: `m/${startIndex + i}`,
              address,
            };
          });
        },
      },
      [InputType.MNEMONIC]: {
        deriveRoot: (input) => {
          const seed = bip39.mnemonicToSeedSync(input);
          const node = HDKey.fromMasterSeed(seed);
          return { node, basePath: BASE_PATH_MNEMONIC };
        },
        deriveChildren: (root, count, startIndex) => {
          return Array.from({ length: count }).map((_, i) => {
            const path = `${root.basePath}/${startIndex + i}`;
            const child = root.node.derive(path);
            const { hash } = bitcoin.payments.p2pkh({
              pubkey: Buffer.from(child.publicKey),
            });
            const address = cashaddr.encode("bitcoincash", "P2PKH", hash);
            return { srNo: startIndex + i + 1, path, address };
          });
        },
      },
    };
  }
}

WalletStrategyRegistry.register("BCH", BchWalletStrategy);
