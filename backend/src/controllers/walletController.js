import { fetchWalletData } from "../services/walletService.js";
import { InputType } from "../domain/Types/InputType.js";

/**
 * POST /api/wallet/fetch handler. Validates body, normalizes inputType, and returns derived addresses (and balances for ETH).
 */
export const fetchData = async (req, res) => {
  try {
    const { inputType, currency, value, count, startIdx } = req.body;

    if (!inputType || !currency || !value) {
      return res.status(400).json({
        error: "inputType, currency, and value are required",
      });
    }

    const normalizedInputType = InputType[inputType.toUpperCase()];
    if (!normalizedInputType) {
      return res.status(400).json({
        error: `Unsupported inputType: ${inputType}. Use MNEMONIC or XPUB.`,
      });
    }

    const result = await fetchWalletData({
      inputType: normalizedInputType,
      currency: currency.toUpperCase(),
      value: value.trim(),
      count: count ?? 20,
      startIdx: startIdx ?? 0,
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
