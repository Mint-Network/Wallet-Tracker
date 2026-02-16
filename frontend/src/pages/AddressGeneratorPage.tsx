import { useState } from "react";
import { getBackendBaseUrl, fetchWithRetry } from "../api/backend";
import "./AddressGeneratorPage.css";

/** Number of addresses to fetch per page (fits in view without scroll). */
const itemsPerPage = 10;
/** Total items available across all pages (drives pagination cap). */
const totalItemsToDisplay = 100;
/** Currencies that do not return ethBalance/codexBalance (hide those columns). */
const noBalanceCurrencyDisplay = ["BTC", "LTC", "BCH", "SOL"];
const totalPages = Math.ceil(totalItemsToDisplay / itemsPerPage);

type AddressResult = {
  srNo: number;
  address: string;
  path: string;
  ethBalance?: string;
  codexBalance?: string;
};

type WalletFetchResponse = {
  data?: AddressResult[];
  error?: string;
};

/**
 * Address generator UI: mnemonic or xpub + currency, then fetches derived addresses from the API
 * and displays them in a table with pagination.
 */
export default function AddressGenerator() {
  const [selectedType, setSelectedType] = useState<"mnemonic" | "xpub">("mnemonic");
  const [currencyType, setCurrencyType] = useState<"ETH" | "BTC" | "LTC" | "BCH" | "SOL">("ETH");
  const [inputValue, setInputValue] = useState("");
  const [results, setResults] = useState<AddressResult[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deriveAddresses = async (pageNumber: number) => {
    setLoading(true);
    setResults([]);
    setError(null);
    setCurrentPage(pageNumber);

    try {
      const startIdx = (pageNumber - 1) * itemsPerPage;
      const cleanedValue = inputValue.trim();
      const baseUrl = await getBackendBaseUrl();
      const res = await fetchWithRetry(
        `${baseUrl}/api/wallet/fetch`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inputType: selectedType.toUpperCase(),
            currency: currencyType,
            value: cleanedValue,
            count: itemsPerPage,
            startIdx,
          }),
        },
        3,
        800
      );

      const json: WalletFetchResponse = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch data");
      setResults(json.data || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="generator-card">
        <header className="generator-header">
          <div>
            <h1 className="generator-title">Wallet Address Generator</h1>
            <p className="generator-subtitle">
              Derive addresses from a mnemonic or extended public key for ETH, BTC, LTC, BCH, and SOL.
            </p>
          </div>
        </header>

        <section className="generator-form">
          <div className="form-row">
            <div className="field-group">
              <span className="field-label">Input Type</span>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="keyType"
                    value="xpub"
                    disabled={loading}
                    checked={selectedType === "xpub"}
                    onChange={() => {
                      setSelectedType("xpub");
                      setResults([]);
                      setInputValue("");
                      setError(null);
                    }}
                  />
                  <span>Extended Public Key</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="keyType"
                    value="mnemonic"
                    disabled={loading}
                    checked={selectedType === "mnemonic"}
                    onChange={() => {
                      setSelectedType("mnemonic");
                      setResults([]);
                      setInputValue("");
                      setError(null);
                    }}
                  />
                  <span>Mnemonic</span>
                </label>
              </div>
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="currency-select">
                Currency
              </label>
              <select
                id="currency-select"
                className="select"
                value={currencyType}
                disabled={loading}
                onChange={(e) => {
                  setCurrencyType(
                    e.target.value as "ETH" | "BTC" | "LTC" | "BCH" | "SOL",
                  );
                  setResults([]);
                  setError(null);
                }}
              >
                <option value="ETH">ETH</option>
                <option value="BTC">BTC</option>
                <option value="LTC">LTC</option>
                <option value="BCH">BCH</option>
                <option value="SOL">SOL</option>
              </select>
            </div>
          </div>

          <div className="field-group field-group-with-action">
            <label className="field-label" htmlFor="input-value">
              {selectedType === "xpub" ? "Extended Public Key" : "Mnemonic"}
            </label>
            <textarea
              id="input-value"
              className="textarea"
              rows={2}
              placeholder={
                selectedType === "xpub"
                  ? "Enter xpub here"
                  : "Enter your 12/24-word mnemonic here"
              }
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={loading}
            />
            <div className="actions-row">
              <button
                type="button"
                className="primary-button"
                onClick={() => deriveAddresses(1)}
                disabled={loading || !inputValue.trim()}
              >
                {loading ? "Loading..." : "Show Addresses"}
              </button>
              {error && <p className="error-text">{error}</p>}
            </div>

            {results.length > 0 && (
              <div className="results-inline">
                <div className="results-table-wrapper">
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Address</th>
                        <th>Derivation Path</th>
                        {!noBalanceCurrencyDisplay.includes(currencyType) && (
                          <>
                            <th>ETH Balance</th>
                            <th>Codex Balance</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r) => (
                        <tr key={r.srNo ?? r.address}>
                          <td>{r.srNo}</td>
                          <td className="mono-text">{r.address}</td>
                          <td className="mono-text">{r.path}</td>
                          {!noBalanceCurrencyDisplay.includes(currencyType) && (
                            <>
                              <td className="mono-text">{r.ethBalance}</td>
                              <td className="mono-text">{r.codexBalance}</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="pagination">
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={currentPage === 1 || loading}
                    onClick={() => deriveAddresses(Math.max(1, currentPage - 1))}
                  >
                    Prev
                  </button>
                  <span className="pagination-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={
                      currentPage * itemsPerPage >= totalItemsToDisplay || loading
                    }
                    onClick={() =>
                      deriveAddresses(Math.min(currentPage + 1, totalPages))
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
