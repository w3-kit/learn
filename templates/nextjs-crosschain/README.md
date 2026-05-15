# Next.js Cross-chain Starter

A minimal Next.js App Router template that connects EVM and Solana wallets in one client session.

## What is included

- Next.js App Router
- wagmi and viem for EVM wallet state
- Solana wallet-adapter providers
- Tailwind CSS for registry component styling
- `ConnectWallet` from the `w3-kit/ui` registry, wired to both ecosystems
- A dashboard that shows an EVM address and Solana public key together
- A safe example cross-chain identity view without token transfers or bridging

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and connect either wallet, or connect both wallets to populate the unified session panel.

## Registry component

This template is pre-wired to the shared `ConnectWallet` component from the `w3-kit/ui` registry. If you want to refresh it later in your own app, the equivalent install path is:

```bash
npx shadcn@latest init
npx shadcn@latest add @w3-kit/connect-wallet
```

## Build

```bash
npm run build
npm run start
```

## Template boundary

This starter intentionally does not implement a bridge, token transfer, production authentication, or a backend. It keeps the first cross-chain example to wallet identity pairing so the template is safe to run and easy to extend.
