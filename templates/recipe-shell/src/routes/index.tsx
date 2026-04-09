import { createFileRoute } from "@tanstack/react-router";
import { RecipeLayout } from "../components/recipe-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";

export const Route = createFileRoute("/")({
  component: RecipePage,
});

function RecipePage() {
  return (
    <RecipeLayout
      title="Recipe Name"
      description="Brief description of what this recipe demonstrates."
      category="NFTs"
      chains={["evm"]}
    >
      <Card>
        <CardHeader>
          <CardTitle>Your Recipe</CardTitle>
          <CardDescription>Replace this with your recipe implementation.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Copy this template, add w3-kit components, and build your showcase.
            See <code className="text-xs font-mono px-1 py-0.5 rounded bg-muted">recipes/onchain-svg-nft/example/</code> for
            a full working example.
          </p>
        </CardContent>
      </Card>
    </RecipeLayout>
  );
}
