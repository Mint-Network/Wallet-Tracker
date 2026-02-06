# Wallet Tracker

A full-stack app to **derive wallet addresses** for multiple blockchains from a **mnemonic** or **extended public key (xpub)**, with optional balance enrichment for Ethereum.

---

## Table of contents

- [What it does](#what-it-does)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Clone and run](#clone-and-run)
- [Environment variables (.env)](#environment-variables-env)
- [Using the app](#using-the-app)
- [API overview](#api-overview)
- [Project structure](#project-structure)
- [Security and Git](#security-and-git)

---

## What it does

- **Derive addresses** for **ETH**, **BTC**, **LTC**, **BCH**, and **SOL** from:
  - a 12/24-word **mnemonic**, or  
  - an **extended public key (xpub)** (where the chain supports it).
- **Pagination**: request a range of addresses using `startIdx` and `count`.
- **ETH balances**: for Ethereum, optionally add `ethBalance` and `codexBalance` to each address (requires RPC URLs in `.env`).

---

## Tech stack

| Layer   | Stack |
|--------|--------|
| Frontend | React, TypeScript, Vite |
| Backend  | Node.js, Express |
| API docs | Swagger UI (OpenAPI 3) |
| Domain   | Strategy pattern per currency; DI for enrichers and RPC providers |

---

## Prerequisites

- **Node.js** (v18 or newer recommended)
- **npm** (or yarn/pnpm)

Check versions:

```bash
node -v
npm -v
```

---

## Clone and run

### 1. Clone the repo

```bash
git clone https://github.com/danknooob/Wallet-Tracker
cd Wallet-Tracker
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create your environment file (see [Environment variables](#environment-variables-env) below):

```bash
cp .env.example .env
```

Edit `.env` and add your own values (do not commit `.env` or real URLs).

Start the backend:

```bash
npm run dev
```

The API runs at **http://localhost:5000** (or the `PORT` you set in `.env`).

### 3. Frontend setup

In a new terminal, from the project root:

```bash
cd frontend
npm install
npm run dev
```

The UI runs at **http://localhost:5173** (or the port Vite prints).

### 4. Use the app

- Open the frontend URL in your browser.
- Choose **Mnemonic** or **Extended Public Key**, pick a **currency**, enter your value, and click **Show Addresses**.
- For ETH, balances appear if you configured `ETH_RPC_URL` (and optionally `CODEX_RPC_URL`) in `backend/.env`.

---

## Environment variables (.env)

**Important:** Real RPC URLs and secrets must stay in `.env` only. **Never commit `.env`** or put real URLs in the README or repo.

The backend reads `.env` from the **backend** folder. Use the example file as a template:

```bash
cd backend
cp .env.example .env
```

Then edit `backend/.env` with your own values.

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: `5000`) |
| `NODE_ENV` | No | e.g. `development` or `production` |
| `ETH_RPC_URL` | For ETH balances | Your Ethereum JSON-RPC URL (e.g. from Infura, Alchemy, or a public RPC). If missing, ETH/Codex balance columns stay empty. |
| `CODEX_RPC_URL` | No | Your Codex chain RPC URL. If missing, `codexBalance` is returned as `0.0`. |

**Example (placeholders only – replace with your own):**

```env
PORT=5000
NODE_ENV=development
ETH_RPC_URL=https://your-eth-rpc-endpoint.example.com
CODEX_RPC_URL=https://your-codex-rpc-endpoint.example.com
```

Where to get RPC URLs (examples; not endorsements):

- Ethereum: Infura, Alchemy, QuickNode, or public endpoints like LlamaRPC.
- Codex: your chain’s official docs or provider.

---

## Using the app

1. **Input type**: Mnemonic (12/24 words) or Extended Public Key.
2. **Currency**: ETH, BTC, LTC, BCH, or SOL.
3. **Value**: Paste your mnemonic or xpub (never use mainnet keys you care about on untrusted machines).
4. **Show Addresses**: Fetches the first page; use **Prev** / **Next** for more.

For ETH, the table shows **ETH Balance** and **Codex Balance** when the backend has the corresponding RPC URLs configured.

---

## API overview

- **Swagger UI**: when the backend is running, open **http://localhost:5000/api-docs** to see and try the API.
- **OpenAPI JSON**: **http://localhost:5000/api-docs.json**

### POST `/api/wallet/fetch`

Derives addresses for the given currency and input.

**Request body:**

```json
{
  "inputType": "MNEMONIC",
  "currency": "ETH",
  "value": "your mnemonic or xpub string",
  "count": 20,
  "startIdx": 0
}
```

| Field | Description |
|-------|-------------|
| `inputType` | `"MNEMONIC"` or `"XPUB"` |
| `currency` | `"ETH"`, `"BTC"`, `"LTC"`, `"BCH"`, `"SOL"` |
| `value` | Mnemonic phrase or xpub |
| `count` | Number of addresses to derive (page size) |
| `startIdx` | Starting index (for pagination) |

**Response (example):**

```json
{
  "currency": "ETH",
  "count": 20,
  "data": [
    {
      "srNo": 1,
      "path": "m/44'/60'/0'/0/0",
      "address": "0x...",
      "ethBalance": "0.0",
      "codexBalance": "0.0"
    }
  ]
}
```

`ethBalance` and `codexBalance` are only present when the backend has balance enrichment enabled (e.g. ETH strategy with RPC URLs set).

---

## Project structure

```text
wallet-tracker/
├── .gitignore              # Ignores node_modules, .env, build outputs
├── README.md
├── backend/
│   ├── .env                # Your secrets (create from .env.example, never commit)
│   ├── .env.example        # Template with placeholder variable names
│   ├── server.js           # Entry: loads .env, starts Express
│   ├── package.json
│   └── src/
│       ├── app.js          # Express app, CORS, Swagger, route mounting, DI wiring
│       ├── routes/         # /api/wallet
│       ├── controllers/
│       ├── services/
│       ├── domain/         # Strategies, enrichers, providers, registry, types
│       ├── docs/           # Swagger/OpenAPI spec
│       └── utils/          # e.g. xpub normalisation
└── frontend/
    ├── package.json
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        └── pages/
            ├── AddressGeneratorPage.tsx
            └── AddressGeneratorPage.css
```

---

## Security and Git

- **`.env`** is listed in `.gitignore`. Never commit it or add real RPC URLs to the repo.
- Use **`.env.example`** only as a template (placeholder values). No real URLs or keys in the example.
- **Mnemonics**: Do not use production or valuable mnemonics. Prefer test mnemonics on trusted machines only.
- After cloning, copy `backend/.env.example` to `backend/.env` and fill in your own values locally.

---

## Limitations

- **SOL** supports mnemonic only (no xpub).
- **Balances** are only fetched for ETH (and Codex when configured); other currencies show address and path only.
- RPC rate limits and availability depend on the endpoints you configure in `.env`.
