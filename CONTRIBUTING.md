# Contributing to w3-kit/learn

Thanks for your interest in contributing recipes, guides, and templates!

## How to contribute

1. Fork the repo
2. Create a branch (`git checkout -b my-recipe`)
3. Add your content
4. Commit and push
5. Open a pull request

## Adding a recipe

Create a new directory in `recipes/`:

```
recipes/your-recipe/
├── evm.tsx                    # EVM implementation (wagmi + viem)
├── solana.tsx                 # Solana implementation (optional)
├── meta.json                  # CLI metadata
├── README.md                  # Overview (200-400 words)
├── your-recipe.learn.md       # Educational deep-dive (2000+ words)
└── example/
    └── evm/
        └── page.tsx           # Self-contained runnable example
```

### Recipe file details

- **`evm.tsx`** — Reusable React component using wagmi hooks. Start with `"use client"`, use full TypeScript types, mark important sections with `★` comments.
- **`README.md`** — Overview with comparison table, security notes, and file list.
- **`{recipe-name}.learn.md`** — Educational content explaining the concepts, not just the API. Include code examples, diagrams, and external references.
- **`example/evm/page.tsx`** — Self-contained page that works with the recipe shell template (see below).

### meta.json format

```json
{
  "name": "your-recipe",
  "description": "What this recipe does",
  "chains": ["evm"],
  "dependencies": {
    "evm": ["viem"]
  }
}
```

### Building showcase-quality examples

Use the **recipe shell template** at `templates/recipe-shell/` for polished examples:

```bash
cp -r templates/recipe-shell my-recipe-example
cd my-recipe-example
npm install
npm run dev
```

The template includes:

- **TanStack Start** with Vite (matching the w3-kit.com website)
- **w3-kit design system** — same CSS tokens, colors, and typography as the website
- **wagmi + viem** pre-configured with mainnet and Sepolia RPCs
- **UI primitives** — Button, Card, Input, Badge from w3-kit
- **Dark mode** toggle and wallet connection
- **RecipeLayout** component for consistent page structure

Add w3-kit components to your example:

```bash
npx w3-kit add nft-card price-ticker connect-wallet
```

## Adding a guide

Create a markdown file in the appropriate `guides/` subdirectory:

- `guides/concepts/` — chain-agnostic concepts
- `guides/evm/` — EVM-specific
- `guides/solana/` — Solana-specific
- `guides/security/` — security topics

## Adding a template

Templates are starter project scaffolds in `templates/`. Each template should be a complete, runnable project.

## Local development

```bash
git clone https://github.com/YOUR_USERNAME/learn.git
cd learn
npm install
```

### Run all CI checks locally

```bash
npm run format:check
```

## Guidelines

- Keep code simple and well-commented — this is educational content
- Include both EVM and Solana implementations where possible
- Every recipe needs a `.learn.md` explaining the concepts
- Use the recipe shell template for showcase-quality examples
- Test your code before submitting

Check [open issues](https://github.com/w3-kit/learn/issues) for ideas.
