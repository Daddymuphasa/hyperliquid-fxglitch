# Hyperliquid WhatsApp Agent

A greenfield backend for onboarding users to Hyperliquid through WhatsApp, connecting a wallet through a secure web link, and enabling delegated trading through approved API wallets.

## What this scaffold includes

- WhatsApp webhook entrypoint for user conversations.
- Wallet-link session model for connecting a wallet outside WhatsApp.
- Hyperliquid service boundary for info and exchange API calls.
- Admin trading routes with explicit consent checks.
- Encrypted credential storage interface.
- Safety-first product notes for API wallet delegation.

## Security model

The admin must never receive a user's seed phrase, private wallet key, or unrestricted wallet access. Users approve a Hyperliquid API wallet, also called an agent wallet in the Hyperliquid docs, for trading-only actions. Hyperliquid documents API wallets as signers that can act for a master account or sub-account, while account data queries should still use the actual account address.

Funding should be handled through user-controlled wallet actions and verified on-chain or through Hyperliquid account state. The WhatsApp bot can guide the user, generate links, and confirm status, but it should not custody funds.

## Development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` and fill the values for your provider accounts.

## Main flows

1. User sends a message to the WhatsApp agent.
2. Backend creates an onboarding session and sends a secure connect link.
3. User opens the link, connects wallet, and signs the requested Hyperliquid API-wallet approval.
4. Backend stores the approved agent credential encrypted and marks the user as trade-enabled.
5. Admin can submit trades only for users with active consent and risk limits.

## Useful Hyperliquid docs

- Builder tools index: https://hyperliquid.gitbook.io/hyperliquid-docs/builder-tools
- API overview: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api
- API wallets and nonces: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets
- Exchange endpoint: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint
- Signing: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/signing
