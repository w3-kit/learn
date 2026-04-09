# Recipe Shell

Starter template for building showcase-quality w3-kit recipe examples.

## Quick start

```bash
cp -r templates/recipe-shell my-recipe-example
cd my-recipe-example
npm install
npm run dev
```

Open [http://localhost:3333](http://localhost:3333).

## What's included

- **TanStack Start** with Vite and TypeScript (matching w3-kit.com website)
- **Tailwind CSS** with w3-kit design tokens (colors, spacing, typography)
- **wagmi + viem** pre-configured with mainnet and Sepolia
- **Geist font** matching the w3-kit.com website
- **Dark mode** toggle
- **Wallet connection** with address display and disconnect
- **UI primitives** — Button, Card, Input, Badge, Tabs

## Adding w3-kit components

Use the CLI to add web3 components:

```bash
npx w3-kit add nft-card
npx w3-kit add price-ticker
npx w3-kit add connect-wallet
```

Components are copied to `src/components/` and can be imported directly.

## Building a recipe example

Edit `src/routes/index.tsx`. Use `RecipeLayout` for the page shell:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { RecipeLayout } from "../components/recipe-layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";

export const Route = createFileRoute("/")({
  component: MyRecipePage,
});

function MyRecipePage() {
  return (
    <RecipeLayout
      title="My Recipe"
      description="What this recipe does."
      category="NFTs"
      chains={["evm"]}
    >
      <Card>
        <CardHeader>
          <CardTitle>Section Name</CardTitle>
        </CardHeader>
        <CardContent>{/* Your recipe UI here */}</CardContent>
      </Card>
    </RecipeLayout>
  );
}
```

## Design tokens

The template uses the same CSS variables as w3-kit.com:

| Token           | Light     | Dark      |
| --------------- | --------- | --------- |
| `--w3-gray-100` | `#fafafa` | `#0a0a0a` |
| `--w3-gray-900` | `#171717` | `#ededed` |
| `--w3-accent`   | `#5554d9` | `#5554d9` |
| `--background`  | gray-100  | gray-100  |
| `--foreground`  | gray-900  | gray-900  |
| `--card`        | `#ffffff` | gray-200  |
| `--border`      | gray-300  | gray-400  |

Use Tailwind classes like `bg-card`, `text-foreground`, `border-border`, `text-accent` to stay on-brand.
