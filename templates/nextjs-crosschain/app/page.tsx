"use client";

import { WalletReadyState } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { ConnectWallet } from "@/components/connect-wallet/ConnectWallet";
import type { WalletOption } from "@/components/connect-wallet/types";

function shorten(value?: string) {
  if (!value) {
    return "Not connected";
  }

  if (value.length <= 16) {
    return value;
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function StatusPill({ active, label }: { active: boolean; label: string }) {
  return <span className={active ? "status-pill status-pill-active" : "status-pill"}>{label}</span>;
}

function WalletGlyph({
  label,
  background,
}: {
  label: string;
  background: string;
}) {
  return (
    <span
      style={{ background }}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white"
    >
      {label}
    </span>
  );
}

function normalizeWalletId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function adapterInstalled(readyState: WalletReadyState) {
  return readyState === WalletReadyState.Installed || readyState === WalletReadyState.Loadable;
}

function adapterInstallUrl(walletId: string) {
  if (walletId === "phantom") {
    return "https://phantom.app/";
  }

  if (walletId === "solflare") {
    return "https://solflare.com/download/";
  }

  return undefined;
}

export default function Home() {
  const { address, chain, connector: activeConnector, isConnected } = useAccount();
  const { connectors, connect, error, isPending } = useConnect();
  const { disconnect: disconnectEvm } = useDisconnect();
  const {
    publicKey,
    connected: solanaConnected,
    wallet,
    wallets: solanaWallets,
    disconnect: disconnectSolana,
    select,
  } = useWallet();
  const [sessionNote, setSessionNote] = useState("Waiting for both wallets.");
  const [recentWalletId, setRecentWalletId] = useState<string>();

  const injectedConnector = connectors.find((connector) => connector.type === "injected") ?? connectors[0];
  const solanaAddress = publicKey?.toBase58();
  const bothConnected = isConnected && solanaConnected;
  const connectedWalletCount = Number(isConnected) + Number(solanaConnected);
  const hasInjectedProvider =
    typeof window !== "undefined" &&
    "ethereum" in window &&
    Boolean((window as Window & { ethereum?: unknown }).ethereum);

  const walletOptions = useMemo<WalletOption[]>(() => {
    const evmOptions = connectors.map((connector, index) => ({
      id: `evm:${connector.id}`,
      name: connector.name,
      icon: <WalletGlyph label="E" background={index === 0 ? "#2563eb" : "#0f172a"} />,
      ecosystem: "evm" as const,
      installed: connector.type === "injected" ? hasInjectedProvider : undefined,
      installUrl:
        connector.type === "injected" && !hasInjectedProvider
          ? "https://metamask.io/download/"
          : undefined,
      popular: index === 0,
    }));

    const solanaOptions = solanaWallets.map(({ adapter, readyState }) => {
      const walletId = normalizeWalletId(adapter.name);
      const installed = adapterInstalled(readyState);
      const fallbackIcon: ReactNode = (
        <WalletGlyph
          label={adapter.name.slice(0, 1).toUpperCase()}
          background={walletId === "phantom" ? "#8b5cf6" : "#f97316"}
        />
      );

      return {
        id: `sol:${walletId}`,
        name: adapter.name,
        icon: adapter.icon || fallbackIcon,
        ecosystem: "solana" as const,
        installed,
        installUrl: installed ? undefined : adapterInstallUrl(walletId),
        popular: walletId === "phantom",
      };
    });

    return [...evmOptions, ...solanaOptions];
  }, [connectors, hasInjectedProvider, solanaWallets]);

  const sessionSummary = useMemo(
    () => ({
      evmAddress: address ?? null,
      evmNetwork: chain?.name ?? null,
      solanaPublicKey: solanaAddress ?? null,
      solanaNetwork: "devnet",
      ready: bothConnected,
    }),
    [address, bothConnected, chain?.name, solanaAddress],
  );

  useEffect(() => {
    if (isConnected && activeConnector) {
      setRecentWalletId(`evm:${activeConnector.id}`);
    }
  }, [activeConnector, isConnected]);

  useEffect(() => {
    if (solanaConnected && wallet?.adapter.name) {
      setRecentWalletId(`sol:${normalizeWalletId(wallet.adapter.name)}`);
    }
  }, [solanaConnected, wallet]);

  const handleWalletConnect = (walletId: string) => {
    setRecentWalletId(walletId);

    const selectedWallet = walletOptions.find((option) => option.id === walletId);
    if (selectedWallet?.installed === false && selectedWallet.installUrl) {
      window.open(selectedWallet.installUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (walletId.startsWith("evm:")) {
      const connector = connectors.find((item) => `evm:${item.id}` === walletId);
      if (connector) {
        connect({ connector });
      }
      return;
    }

    const solanaWallet = solanaWallets.find(
      ({ adapter }) => `sol:${normalizeWalletId(adapter.name)}` === walletId,
    );

    if (solanaWallet) {
      select(solanaWallet.adapter.name);
    }
  };

  const buildSession = () => {
    if (!bothConnected) {
      setSessionNote(
        "Use the shared wallet picker to connect one EVM wallet and one Solana wallet before creating a unified identity view.",
      );
      return;
    }

    setSessionNote(
      `Cross-chain identity ready: ${shorten(address)} on ${chain?.name ?? "EVM"} paired with ${shorten(solanaAddress)} on Solana devnet.`,
    );
  };

  return (
    <main className="shell">
      <section className="intro">
        <div>
          <p className="eyebrow">Cross-chain dApp starter</p>
          <h1>Connect EVM and Solana wallets in one Next.js app.</h1>
        </div>
        <div className="network-strip" aria-label="Supported networks">
          <span>Ethereum</span>
          <span>Sepolia</span>
          <span>Solana devnet</span>
        </div>
      </section>

      <section className="dashboard" aria-label="Cross-chain wallet dashboard">
        <article className="panel panel-wide">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">Shared wallet picker</p>
              <h2>One surface for EVM and Solana</h2>
            </div>
            <StatusPill active={bothConnected} label={`${connectedWalletCount}/2 connected`} />
          </div>

          <ConnectWallet
            wallets={walletOptions}
            onConnect={handleWalletConnect}
            recentWalletId={recentWalletId}
            loading={isPending}
            className="max-w-none"
          />

          <p className="session-note">
            This template routes one flat wallet list into wagmi connectors for EVM and wallet-adapter selection for
            Solana.
          </p>

          {error ? <p className="error">{error.message}</p> : null}
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">EVM wallet</p>
              <h2>{shorten(address)}</h2>
            </div>
            <StatusPill active={isConnected} label={isConnected ? "Connected" : "Offline"} />
          </div>

          <dl className="facts">
            <div>
              <dt>Network</dt>
              <dd>{chain?.name ?? "Choose after connecting"}</dd>
            </div>
            <div>
              <dt>Connector</dt>
              <dd>{activeConnector?.name ?? injectedConnector?.name ?? "No injected wallet found"}</dd>
            </div>
          </dl>

          <button
            className="button secondary"
            type="button"
            disabled={!isConnected}
            onClick={() => disconnectEvm()}
          >
            Disconnect EVM
          </button>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">Solana wallet</p>
              <h2>{shorten(solanaAddress)}</h2>
            </div>
            <StatusPill active={solanaConnected} label={solanaConnected ? "Connected" : "Offline"} />
          </div>

          <dl className="facts">
            <div>
              <dt>Network</dt>
              <dd>Solana devnet</dd>
            </div>
            <div>
              <dt>Adapter</dt>
              <dd>{wallet?.adapter.name ?? "Select in shared wallet picker"}</dd>
            </div>
          </dl>

          <button
            className="button secondary"
            type="button"
            disabled={!solanaConnected}
            onClick={() => disconnectSolana()}
          >
            Disconnect Solana
          </button>
        </article>

        <article className="panel session-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">Unified session</p>
              <h2>{bothConnected ? "Identity pair ready" : "Connect both sides"}</h2>
            </div>
            <StatusPill active={bothConnected} label={bothConnected ? "Ready" : "Incomplete"} />
          </div>

          <pre className="session-code">{JSON.stringify(sessionSummary, null, 2)}</pre>

          <button className="button" type="button" onClick={buildSession}>
            Build identity view
          </button>
          <p className="session-note">{sessionNote}</p>
        </article>

        <article className="panel next-actions">
          <p className="panel-kicker">Example flow</p>
          <h2>Safe first cross-chain interaction</h2>
          <ol>
            <li>Pick an EVM or Solana wallet from the shared `ConnectWallet` registry component.</li>
            <li>Route EVM choices into wagmi and Solana choices into wallet-adapter selection.</li>
            <li>Show both identities in one client session.</li>
          </ol>
          <p>
            This starter stops before token movement. Add message signing, proof storage, or a bridge SDK only after
            deciding the protocol and trust model.
          </p>
        </article>
      </section>
    </main>
  );
}
