import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Moon, Sun, Wallet, LogOut, ExternalLink } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

interface RecipeLayoutProps {
  title: string;
  description: string;
  category: string;
  chains: string[];
  children: ReactNode;
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("w3-theme", next ? "dark" : "light");
    setDark(next);
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

function WalletConnect() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-1.5 py-1 font-mono text-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {chain?.name ?? "Unknown"}
        </Badge>
        <Badge variant="secondary" className="font-mono text-xs">
          {address.slice(0, 6)}...{address.slice(-4)}
        </Badge>
        <Button variant="ghost" size="icon" onClick={() => disconnect()} aria-label="Disconnect">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {connectors.map((connector) => (
        <Button key={connector.uid} variant="outline" size="sm" onClick={() => connect({ connector })}>
          <Wallet className="mr-2 h-4 w-4" />
          {connector.name}
        </Button>
      ))}
    </div>
  );
}

export function RecipeLayout({ title, description, category, chains, children }: RecipeLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <a href="https://w3-kit.com" className="text-sm font-semibold tracking-tight text-foreground no-underline">
              w3-kit
            </a>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm text-muted-foreground">recipes</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a
              href="https://github.com/w3-kit/learn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="mb-3 flex items-center gap-2">
            <Badge>{category}</Badge>
            {chains.map((c) => (
              <Badge key={c} variant="outline">{c.toUpperCase()}</Badge>
            ))}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-muted-foreground">{description}</p>
          <div className="mt-6">
            <WalletConnect />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <p className="text-xs text-muted-foreground">
            Built with{" "}
            <a href="https://w3-kit.com" className="text-accent hover:underline">w3-kit</a>
            {" "}— open-source web3 developer toolkit
          </p>
        </div>
      </footer>
    </div>
  );
}
