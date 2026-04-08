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
├── evm/           # EVM implementation
│   └── index.ts
├── solana/        # Solana implementation (optional)
│   └── index.ts
├── meta.json      # CLI metadata
└── .learn.md      # Educational explanation
```

### meta.json format

```json
{
  "name": "your-recipe",
  "description": "What this recipe does",
  "category": "wallet|tokens|nfts|defi|utils",
  "chains": ["evm", "solana"],
  "dependencies": {
    "evm": { "viem": "^2.0.0" },
    "solana": { "@solana/web3.js": "^1.0.0" }
  }
}
```

## Adding a guide

Create a markdown file in the appropriate `guides/` subdirectory:

- `guides/concepts/` — chain-agnostic concepts
- `guides/evm/` — EVM-specific
- `guides/solana/` — Solana-specific
- `guides/security/` — security topics

## Adding a template

Templates are starter project scaffolds in `templates/`. Each template should be a complete, runnable project.

## Guidelines

- Keep code simple and well-commented — this is educational content
- Include both EVM and Solana implementations where possible
- Every recipe needs a `.learn.md` explaining the concepts
- Test your code before submitting

Check [open issues](https://github.com/w3-kit/learn/issues) for ideas.
