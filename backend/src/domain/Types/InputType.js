/**
 * Supported input types for wallet derivation.
 * Used to select the derivation path and algorithm (mnemonic vs extended public key).
 * Adding a new value here is OCP-friendly: strategies can register handlers for new types.
 */
const InputType = Object.freeze({
  MNEMONIC: "mnemonic",
  XPUB: "xpub",
});

module.exports = { InputType };
