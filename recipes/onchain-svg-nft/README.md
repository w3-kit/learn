# On-chain SVG NFT

Decode and render fully on-chain SVG NFTs, read Chainlink price feeds, and mint dynamic NFTs whose metadata changes based on real-world data.

## What this does

Given an ERC-721 contract address and token ID, reads the base64-encoded `tokenURI`, decodes the JSON metadata, extracts the embedded SVG image, and renders it safely in a sandboxed iframe. Optionally reads a Chainlink price feed to demonstrate how dynamic NFTs react to on-chain state changes.

## On-chain vs off-chain NFT storage

|                | Fully on-chain (SVG)                       | Off-chain (IPFS/Arweave)           | Off-chain (HTTP)                 |
| -------------- | ------------------------------------------ | ---------------------------------- | -------------------------------- |
| **Storage**    | SVG + JSON in contract bytecode            | URI on-chain, data off-chain       | URI on-chain, data on server     |
| **Permanence** | Permanent — survives as long as chain runs | IPFS: fragile / Arweave: perm.     | Server can go down               |
| **Dynamic?**   | Yes — contract generates metadata per call | No — content-addressed = immutable | Yes — server can change response |
| **Gas cost**   | High (deploy) / Free (read)                | Low (just store URI)               | Low (just store URI)             |
| **Examples**   | Nouns, Autoglyphs, Loot                    | Bored Apes, Azuki                  | Early/low-budget projects        |

## How dynamic NFTs work

A dynamic NFT contract generates its `tokenURI` response at read time instead of storing a fixed URI. The contract reads on-chain state (prices, timestamps, ownership history) and constructs different SVG/JSON based on that state. The metadata changes without any transaction — a view call returns different data each time conditions change.

## Why EVM only

On-chain SVG generation via `abi.encodePacked` inside `tokenURI()` is an EVM-specific pattern. Solana NFTs use Metaplex, which stores a URI pointing off-chain — it does not generate art inside the program. Chainlink price feeds are also EVM-native. For Solana oracle patterns, see the Pyth network documentation.

## Security notes

- **SVG XSS** — on-chain SVGs can contain `<script>` tags or event handlers; always render in a sandboxed iframe with `sandbox=""` (maximum restriction)
- **Price feed staleness** — check `updatedAt` from Chainlink; stale data (> 1 hour old) may indicate a feed issue
- **Contract verification** — verify the NFT contract on Etherscan before interacting; a malicious `tokenURI` could return crafted payloads

## Run the showcase

```bash
cd recipes/onchain-svg-nft/example
npm install
npm run dev
```

Open http://localhost:3333 — built on the `templates/recipe-shell/` with w3-kit design system and components.

Features:

- **Read On-chain SVG** — fetches Loot NFTs from mainnet, renders SVG + w3-kit NFTCard
- **Chainlink Price Feed** — live ETH/USD via w3-kit PriceTicker
- **Deploy & Mint** — deploy a DynamicSvgNft contract on Sepolia, mint, read back

## Files

- `evm.tsx` — Reusable component: decode on-chain SVG, read Chainlink price, mint
- `example/` — Showcase app (TanStack Start + w3-kit design system)
- `onchain-svg-nft.learn.md` — Educational deep-dive (~2500 words)
