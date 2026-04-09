import { createFileRoute } from "@tanstack/react-router";
import { RecipeLayout } from "../components/recipe-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { NFTCard } from "../components/nft-card/NFTCard";
import type { NFT } from "../components/nft-card/types";
import { PriceTicker } from "../components/price-ticker/PriceTicker";
import type { Token } from "../components/price-ticker/types";
import {
  usePublicClient,
  useAccount,
  useConnect,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatUnits } from "viem";
import { useMemo, useState } from "react";
import {
  Search,
  Loader2,
  TrendingUp,
  TrendingDown,
  Coins,
  Image as ImageIcon,
  Sparkles,
  Check,
  AlertCircle,
  Wallet,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: OnchainSvgNftPage,
});

// --- ABIs ---

const erc721TokenURIAbi = [
  { name: "tokenURI", type: "function", stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }] },
] as const;

const aggregatorV3Abi = [
  { name: "latestRoundData", type: "function", stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "roundId", type: "uint80" }, { name: "answer", type: "int256" },
      { name: "startedAt", type: "uint256" }, { name: "updatedAt", type: "uint256" },
      { name: "answeredInRound", type: "uint80" },
    ] },
] as const;

const dynamicNftMintAbi = [
  { name: "safeMint", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "to", type: "address" }, { name: "tokenId", type: "uint256" }],
    outputs: [] },
] as const;

// --- Helpers ---

type NFTMetadata = {
  name?: string;
  description?: string;
  image?: string;
  animation_url?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
};

function decodeOnchainMetadata(uri: string): NFTMetadata | null {
  if (!uri.startsWith("data:application/json;base64,")) return null;
  try { return JSON.parse(atob(uri.split(",")[1])); } catch { return null; }
}

function extractSvg(metadata: NFTMetadata): string | null {
  const imageUri = metadata.image || metadata.animation_url;
  if (!imageUri) return null;
  if (imageUri.startsWith("data:image/svg+xml;base64,")) {
    try { return atob(imageUri.split(",")[1]); } catch { return null; }
  }
  if (imageUri.startsWith("data:image/svg+xml;utf8,") || imageUri.startsWith("data:image/svg+xml,")) {
    return decodeURIComponent(imageUri.split(",")[1]);
  }
  return null;
}

// Chainlink ETH/USD on mainnet — works without wallet connection
const DEFAULT_PRICE_FEED = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
// Loot (for Adventurers) — fully on-chain SVG NFT on mainnet
const DEFAULT_NFT_CONTRACT = "0xFF9C1b15B16263C61d017ee9F65C50e4AE0113D7";
const PRICE_THRESHOLD = 2000_00000000n;

// --- Section: Read & Render SVG with w3-kit NFTCard ---

function ReadSvgSection() {
  const client = usePublicClient();
  const { address } = useAccount();
  const [contractAddress, setContractAddress] = useState(DEFAULT_NFT_CONTRACT);
  const [tokenId, setTokenId] = useState("1");
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [rawUri, setRawUri] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const svgContent = useMemo(() => (metadata ? extractSvg(metadata) : null), [metadata]);

  // Build an NFT object for the w3-kit NFTCard component
  const nftForCard: NFT | null = useMemo(() => {
    if (!metadata) return null;
    return {
      id: `${contractAddress}-${tokenId}`,
      name: metadata.name || `NFT #${tokenId}`,
      description: metadata.description,
      image: metadata.image || "",
      owner: address || "0x0000000000000000000000000000000000000000",
      collection: "On-chain SVG",
      tokenId: tokenId,
      contractAddress: contractAddress,
      chainId: 1,
      attributes: metadata.attributes,
    };
  }, [metadata, contractAddress, tokenId, address]);

  const handleFetch = async () => {
    if (!client || !contractAddress || !tokenId) return;
    setIsFetching(true);
    setError(null);
    setMetadata(null);
    setRawUri(null);

    try {
      const uri = await client.readContract({
        address: contractAddress as `0x${string}`,
        abi: erc721TokenURIAbi,
        functionName: "tokenURI",
        args: [BigInt(tokenId)],
      });
      setRawUri(uri);
      const decoded = decodeOnchainMetadata(uri);
      if (decoded) { setMetadata(decoded); return; }
      const res = await fetch(uri);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      setMetadata(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--w3-accent-subtle)" }}>
            <ImageIcon className="h-4 w-4" style={{ color: "var(--w3-accent)" }} />
          </div>
          <div>
            <CardTitle>Read On-chain SVG</CardTitle>
            <CardDescription>Decode base64 tokenURI and render with <code className="text-xs font-mono px-1 py-0.5 rounded bg-muted">w3-kit/NFTCard</code></CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input value={contractAddress} onChange={(e) => setContractAddress(e.target.value)} placeholder="NFT contract address (0x...)" className="flex-1 font-mono text-xs" />
            <Input value={tokenId} onChange={(e) => setTokenId(e.target.value)} placeholder="Token ID" className="w-full sm:w-28" />
          </div>
          <Button onClick={handleFetch} disabled={isFetching || !contractAddress || !tokenId}>
            {isFetching ? <><Loader2 className="h-4 w-4 animate-spin" /> Fetching...</> : <><Search className="h-4 w-4" /> Fetch SVG NFT</>}
          </Button>
        </div>

        {rawUri && (
          <div className="mt-4 rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">tokenURI:</span>{" "}
              <code className="break-all">{rawUri.length > 100 ? `${rawUri.slice(0, 100)}...` : rawUri}</code>
            </p>
          </div>
        )}

        {/* Show on-chain SVG in sandboxed iframe + w3-kit NFTCard side by side */}
        {metadata && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {/* Raw SVG render */}
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Sandboxed SVG</p>
              {svgContent ? (
                <div className="overflow-hidden rounded-xl border border-border">
                  <iframe sandbox="" srcDoc={svgContent} className="h-72 w-full border-0" title="On-chain SVG NFT" />
                </div>
              ) : metadata.image ? (
                <div className="overflow-hidden rounded-xl border border-border">
                  <img src={metadata.image} alt={metadata.name} className="h-72 w-full object-contain bg-muted" />
                </div>
              ) : null}
            </div>

            {/* w3-kit NFTCard component */}
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                w3-kit <code className="font-mono">NFTCard</code>
              </p>
              {nftForCard && (
                <NFTCard
                  nft={{
                    ...nftForCard,
                    // Use the SVG data URI directly for the NFTCard image
                    image: svgContent
                      ? `data:image/svg+xml;base64,${btoa(svgContent)}`
                      : nftForCard.image,
                  }}
                />
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 overflow-hidden rounded-lg p-3 text-sm" style={{ background: "rgba(239,68,68,0.08)", color: "#dc2626" }}>
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="min-w-0 break-words">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Section: Chainlink Price Feed with w3-kit PriceTicker ---

function PriceFeedSection() {
  const [priceFeedAddress, setPriceFeedAddress] = useState(DEFAULT_PRICE_FEED);

  const { data: roundData } = useReadContract({
    address: priceFeedAddress as `0x${string}`,
    abi: aggregatorV3Abi,
    functionName: "latestRoundData",
    query: { enabled: !!priceFeedAddress, refetchInterval: 30_000 },
  });

  const ethPrice = roundData ? Number(formatUnits(roundData[1], 8)) : null;
  const isBullish = roundData ? roundData[1] > PRICE_THRESHOLD : false;

  // Build token data for w3-kit PriceTicker component
  const tokens: Token[] = ethPrice
    ? [
        {
          name: "Ethereum",
          symbol: "ETH",
          price: ethPrice,
          priceChange: { "1h": 0, "24h": isBullish ? 2.5 : -1.8, "7d": 0, "30d": 0 },
          marketCap: ethPrice * 120_000_000,
          volume: { "24h": 15_000_000_000 },
          circulatingSupply: 120_000_000,
          maxSupply: null,
          logoURI: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
          lastUpdated: new Date().toISOString(),
        },
      ]
    : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--w3-accent-subtle)" }}>
            <Coins className="h-4 w-4" style={{ color: "var(--w3-accent)" }} />
          </div>
          <div>
            <CardTitle>Chainlink Price Feed</CardTitle>
            <CardDescription>
              Live data via <code className="text-xs font-mono px-1 py-0.5 rounded bg-muted">w3-kit/PriceTicker</code>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Input value={priceFeedAddress} onChange={(e) => setPriceFeedAddress(e.target.value)} placeholder="Price feed address" className="mb-4 font-mono text-xs" />

        {tokens.length > 0 ? (
          <div className="space-y-4">
            <PriceTicker tokens={tokens} />
            <div className="flex items-center justify-center gap-2">
              {isBullish ? (
                <Badge className="gap-1" style={{ background: "rgba(16,185,129,0.1)", color: "#059669" }}>
                  <TrendingUp className="h-3 w-3" /> Above $2k threshold — NFT shows happy face
                </Badge>
              ) : (
                <Badge className="gap-1" style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626" }}>
                  <TrendingDown className="h-3 w-3" /> Below $2k threshold — NFT shows sad face
                </Badge>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <Loader2 className="mx-auto h-8 w-8 text-muted-foreground animate-spin" />
            <p className="mt-2 text-sm text-muted-foreground">Loading price data from Chainlink...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Reusable "Not Connected" prompt with connect button ---

function NotConnectedPrompt() {
  const { connect, connectors } = useConnect();
  return (
    <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-3">
      <Wallet className="mx-auto h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Connect your wallet to get started</p>
      <div className="flex justify-center gap-2">
        {connectors.map((connector) => (
          <Button key={connector.uid} variant="outline" size="sm" onClick={() => connect({ connector })}>
            <Wallet className="mr-2 h-4 w-4" />
            {connector.name}
          </Button>
        ))}
      </div>
    </div>
  );
}

// --- Section: Deploy + Mint ---

// ABI for the deployable DynamicSvgNft contract (safeMint takes only `to`, auto-increments tokenId)
const deployableMintAbi = [
  { name: "safeMint", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "to", type: "address" }],
    outputs: [{ name: "", type: "uint256" }] },
  { name: "tokenURI", type: "function", stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }] },
] as const;

function DeployAndMintSection() {
  const { address, chain } = useAccount();
  const [error, setError] = useState<string | null>(null);
  const [deployStatus, setDeployStatus] = useState<string | null>(null);
  const mountedRef = { current: true };

  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);

  const [mintedTokenId, setMintedTokenId] = useState<number | null>(null);
  const { writeContract: mintTx, data: mintHash, isPending: isMinting, error: mintError } = useWriteContract();
  const { isLoading: isMintConfirming, isSuccess: isMinted } = useWaitForTransactionReceipt({ hash: mintHash });

  const handleDeploy = async () => {
    if (!address) return;
    setError(null);
    setDeployStatus("Submitting transaction...");
    try {
      const { DYNAMIC_SVG_NFT_BYTECODE } = await import("../lib/contract-bytecode");
      if (typeof window === "undefined" || !window.ethereum) throw new Error("No wallet found");

      const tx = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: address, data: DYNAMIC_SVG_NFT_BYTECODE }],
      });

      setDeployStatus("Waiting for confirmation (~15-30 seconds on Sepolia)...");

      for (let i = 0; i < 30; i++) {
        if (!mountedRef.current) return;
        const receipt = await window.ethereum!.request({
          method: "eth_getTransactionReceipt",
          params: [tx as string],
        }) as { contractAddress?: string } | null;
        if (receipt?.contractAddress) {
          if (mountedRef.current) {
            setDeployedAddress(receipt.contractAddress);
            setDeployStatus(null);
          }
          return;
        }
        await new Promise(r => setTimeout(r, 3000));
      }
      throw new Error("Deploy timed out — check your transaction on Etherscan");
    } catch (e: unknown) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : String(e));
        setDeployStatus(null);
      }
    }
  };

  const handleMint = () => {
    if (!deployedAddress || !address) return;
    setError(null);
    try {
      mintTx({
        address: deployedAddress as `0x${string}`,
        abi: deployableMintAbi,
        functionName: "safeMint",
        args: [address],
      });
      setMintedTokenId((prev) => (prev ?? -1) + 1);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const isSepolia = chain?.id === 11155111;
  const anyError = mintError?.message || error;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--w3-accent-subtle)" }}>
            <Sparkles className="h-4 w-4" style={{ color: "var(--w3-accent)" }} />
          </div>
          <div>
            <CardTitle>Deploy & Mint</CardTitle>
            <CardDescription>Deploy your own on-chain SVG NFT contract on Sepolia, then mint</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!address ? (
          <NotConnectedPrompt />
        ) : !isSepolia ? (
          <div className="rounded-xl border border-dashed border-border p-4 text-center">
            <p className="text-sm text-muted-foreground">Switch to <strong>Sepolia</strong> testnet to deploy</p>
            <p className="mt-1 text-xs text-muted-foreground">Get free Sepolia ETH from <a href="https://sepoliafaucet.com" target="_blank" className="underline" style={{ color: "var(--w3-accent)" }}>sepoliafaucet.com</a></p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Step 1: Deploy */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Step 1 — Deploy Contract</p>
              {!deployedAddress ? (
                <Button onClick={handleDeploy} disabled={!!deployStatus}>
                  {deployStatus ? <><Loader2 className="h-4 w-4 animate-spin" /> Deploying...</> : <><Sparkles className="h-4 w-4" /> Deploy Dynamic SVG NFT</>}
                </Button>
              ) : (
                <div className="flex items-center gap-2 rounded-lg p-3 text-sm" style={{ background: "rgba(16,185,129,0.08)", color: "#059669" }}>
                  <Check className="h-4 w-4 shrink-0" />
                  <div className="min-w-0">
                    Deployed! <code className="font-mono text-xs break-all">{deployedAddress}</code>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Mint */}
            {deployedAddress && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Step 2 — Mint NFT</p>
                <Button onClick={handleMint} disabled={isMinting}>
                  {isMinting ? <><Loader2 className="h-4 w-4 animate-spin" /> Minting...</> : <><Sparkles className="h-4 w-4" /> Mint NFT</>}
                </Button>
                {isMintConfirming && (
                  <div className="flex items-center gap-2 rounded-lg p-3 text-sm" style={{ background: "rgba(245,158,11,0.08)", color: "#d97706" }}>
                    <Loader2 className="h-4 w-4 animate-spin" /> Confirming mint...
                  </div>
                )}
                {isMinted && mintedTokenId !== null && (
                  <div className="flex items-center gap-2 rounded-lg p-3 text-sm" style={{ background: "rgba(16,185,129,0.08)", color: "#059669" }}>
                    <Check className="h-4 w-4" /> Minted token #{mintedTokenId}! Now read it above with your contract address.
                  </div>
                )}
              </div>
            )}

            {/* Hint */}
            {deployedAddress && isMinted && (
              <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                <strong>Try it:</strong> Copy <code className="font-mono">{deployedAddress}</code> into the "Read On-chain SVG" section above with token ID <code className="font-mono">{mintedTokenId}</code> — you'll see your freshly minted dynamic SVG!
              </div>
            )}
          </div>
        )}

        {anyError && (
          <div className="mt-4 flex items-start gap-2 overflow-hidden rounded-lg p-3 text-sm" style={{ background: "rgba(239,68,68,0.08)", color: "#dc2626" }}>
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="min-w-0 break-words">{anyError}</p>
          </div>
        )}
        {deployStatus && (
          <div className="mt-4 flex items-center gap-2 rounded-lg p-3 text-sm" style={{ background: "rgba(245,158,11,0.08)", color: "#d97706" }}>
            <Loader2 className="h-4 w-4 animate-spin" /> {deployStatus}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Main Page ---

function OnchainSvgNftPage() {
  return (
    <RecipeLayout
      title="On-chain SVG NFT"
      description="Decode on-chain SVG NFTs, read Chainlink price feeds, and mint dynamic NFTs whose metadata changes based on real-world data."
      category="NFTs"
      chains={["evm"]}
    >
      <div className="flex flex-col gap-6">
        <ReadSvgSection />
        <div className="grid gap-6 md:grid-cols-2">
          <PriceFeedSection />
          <DeployAndMintSection />
        </div>
      </div>
    </RecipeLayout>
  );
}
