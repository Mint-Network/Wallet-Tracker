const bs58check = require("bs58check");
const { Buffer } = require("buffer");

/**
 * Normalize Bitcoin-family extended public keys (xpub/ypub/zpub/tpub/vpub) to a standard version
 * so that HDKey.fromExtendedKey can consume them regardless of wallet prefix.
 * @param {string} extPub - Base58check-encoded extended public key
 * @returns {string} Normalized base58check extended public key (xpub or tpub for testnet)
 */
function normalizeExtendedPubKey(extPub) {
  const data = bs58check.decode(extPub);
  const version = Buffer.from(data.slice(0, 4)).toString("hex");

  const VERSIONS = {
    "0488b21e": "0488b21e", // xpub → xpub
    "049d7cb2": "0488b21e", // ypub → xpub
    "04b24746": "0488b21e", // zpub → xpub
    "043587cf": "043587cf", // tpub → tpub
    "045f1cf6": "043587cf", // vpub → tpub
  };

  const targetVersion = VERSIONS[version];
  if (!targetVersion) {
    throw new Error(`Unsupported extended public key version: ${version}`);
  }

  const converted = targetVersion + Buffer.from(data.slice(4)).toString("hex");
  return bs58check.encode(Buffer.from(converted, "hex"));
}

module.exports = { normalizeExtendedPubKey };
