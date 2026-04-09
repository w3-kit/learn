"use client";

import {
  createConfig,
  http,
  WagmiProvider,
  useAccount,
  useConnect,
  usePublicClient,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { formatUnits } from "viem";

const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

const queryClient = new QueryClient();

// ★ ERC-721 tokenURI — reads the on-chain metadata pointer
const erc721TokenURIAbi = [
  {
    name: "tokenURI",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

// ★ Chainlink AggregatorV3 — latestRoundData for price reads
const aggregatorV3Abi = [
  {
    name: "latestRoundData",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "roundId", type: "uint80" },
      { name: "answer", type: "int256" },
      { name: "startedAt", type: "uint256" },
      { name: "updatedAt", type: "uint256" },
      { name: "answeredInRound", type: "uint80" },
    ],
  },
] as const;

// ★ Minimal mint ABI for dynamic NFT contracts
const dynamicNftMintAbi = [
  {
    name: "safeMint",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

type NFTMetadata = {
  name?: string;
  description?: string;
  image?: string;
  animation_url?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
};

function decodeOnchainMetadata(uri: string): NFTMetadata | null {
  if (!uri.startsWith("data:application/json;base64,")) return null;
  try {
    return JSON.parse(atob(uri.split(",")[1]));
  } catch {
    return null;
  }
}

function extractSvg(metadata: NFTMetadata): string | null {
  const imageUri = metadata.image || metadata.animation_url;
  if (!imageUri) return null;
  if (imageUri.startsWith("data:image/svg+xml;base64,")) {
    try {
      return atob(imageUri.split(",")[1]);
    } catch {
      return null;
    }
  }
  if (imageUri.startsWith("data:image/svg+xml;utf8,") || imageUri.startsWith("data:image/svg+xml,")) {
    return decodeURIComponent(imageUri.split(",")[1]);
  }
  return null;
}

// ★ Chainlink ETH/USD on Sepolia — replace with mainnet address for production
const DEFAULT_PRICE_FEED = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
// ★ Nouns on mainnet — a real on-chain SVG NFT you can test with
const DEFAULT_NFT_CONTRACT = "0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03";
const PRICE_THRESHOLD = 2000_00000000n;

function OnchainSvgNftUI() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const client = usePublicClient();

  const [contractAddress, setContractAddress] = useState(DEFAULT_NFT_CONTRACT);
  const [tokenId, setTokenId] = useState("1");
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [rawUri, setRawUri] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [priceFeedAddress, setPriceFeedAddress] = useState(DEFAULT_PRICE_FEED);

  const { data: roundData } = useReadContract({
    address: priceFeedAddress as `0x${string}`,
    abi: aggregatorV3Abi,
    functionName: "latestRoundData",
    query: { refetchInterval: 30_000 },
  });

  const ethPrice = roundData ? formatUnits(roundData[1], 8) : null;
  const mood = roundData && roundData[1] > PRICE_THRESHOLD ? "bullish" : "bearish";

  const [mintContract, setMintContract] = useState("");
  const [mintTokenId, setMintTokenId] = useState("");
  const { writeContract, data: txHash, isPending, error: mintError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  if (!isConnected) {
    return (
      <div style={{ padding: "2rem", fontFamily: "monospace" }}>
        <h2>On-chain SVG NFT (EVM)</h2>
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            style={{ display: "block", margin: "0.5rem 0", padding: "0.5rem 1rem", cursor: "pointer" }}
          >
            Connect {connector.name}
          </button>
        ))}
      </div>
    );
  }

  const handleFetch = async () => {
    if (!client || !contractAddress || !tokenId) return;
    setIsFetching(true);
    setError(null);
    setMetadata(null);
    setSvgContent(null);
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
      if (decoded) {
        setMetadata(decoded);
        const svg = extractSvg(decoded);
        if (svg) setSvgContent(svg);
        return;
      }

      const res = await fetch(uri);
      const json = await res.json();
      setMetadata(json);
      const svg = extractSvg(json);
      if (svg) setSvgContent(svg);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsFetching(false);
    }
  };

  const handleMint = () => {
    if (!mintContract || !mintTokenId) return;
    writeContract({
      address: mintContract as `0x${string}`,
      abi: dynamicNftMintAbi,
      functionName: "safeMint",
      args: [(address || "0x0") as `0x${string}`, BigInt(mintTokenId)],
    });
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace" }}>
      <h2>On-chain SVG NFT (EVM)</h2>
      <p><strong>Wallet:</strong> {address}</p>
      <p><strong>Chain:</strong> {chain?.name}</p>

      {/* --- Read & render on-chain SVG --- */}
      <fieldset style={{ marginTop: "1rem", padding: "1rem" }}>
        <legend><strong>Read On-chain SVG</strong></legend>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: "480px" }}>
          <input
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="NFT contract address (0x...)"
            style={{ padding: "0.5rem", fontFamily: "monospace" }}
          />
          <input
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            placeholder="Token ID"
            style={{ padding: "0.5rem", fontFamily: "monospace" }}
          />
          <button
            onClick={handleFetch}
            disabled={isFetching || !contractAddress || !tokenId}
            style={{ padding: "0.5rem 1rem", cursor: "pointer" }}
          >
            {isFetching ? "Fetching..." : "Fetch SVG NFT"}
          </button>
        </div>

        {rawUri && (
          <p style={{ marginTop: "1rem", wordBreak: "break-all" }}>
            URI: <code style={{ fontSize: "0.75rem" }}>{rawUri.slice(0, 80)}...</code>
          </p>
        )}

        {svgContent && (
          <iframe
            sandbox=""
            srcDoc={svgContent}
            style={{ width: "300px", height: "300px", border: "1px solid #ccc", marginTop: "1rem" }}
            title="On-chain SVG NFT"
          />
        )}

        {metadata && (
          <div style={{ marginTop: "1rem", border: "1px solid #ccc", padding: "1rem", maxWidth: "480px" }}>
            {metadata.name && <h3 style={{ margin: "0 0 0.5rem" }}>{metadata.name}</h3>}
            {metadata.description && <p style={{ margin: "0.5rem 0" }}>{metadata.description}</p>}
            {metadata.attributes && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
                {metadata.attributes.map((attr, i) => (
                  <span
                    key={i}
                    style={{ background: "#f0f0f0", padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                  >
                    {attr.trait_type}: {attr.value}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </fieldset>

      {/* --- Chainlink price feed --- */}
      <fieldset style={{ marginTop: "1rem", padding: "1rem" }}>
        <legend><strong>Chainlink ETH/USD Price</strong></legend>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: "480px" }}>
          <input
            value={priceFeedAddress}
            onChange={(e) => setPriceFeedAddress(e.target.value)}
            placeholder="Price feed address"
            style={{ padding: "0.5rem", fontFamily: "monospace" }}
          />
        </div>
        {ethPrice && (
          <p style={{ marginTop: "0.5rem" }}>
            ETH/USD: <strong>${Number(ethPrice).toLocaleString()}</strong>{" "}
            {mood === "bullish" ? "— bullish" : "— bearish"}
          </p>
        )}
        <p style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.5rem" }}>
          Dynamic NFTs use this price to change their artwork in real time.
        </p>
      </fieldset>

      {/* --- Mint dynamic NFT --- */}
      <fieldset style={{ marginTop: "1rem", padding: "1rem" }}>
        <legend><strong>Mint Dynamic NFT</strong></legend>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: "480px" }}>
          <input
            value={mintContract}
            onChange={(e) => setMintContract(e.target.value)}
            placeholder="★ Your deployed dynamic NFT contract (0x...)"
            style={{ padding: "0.5rem", fontFamily: "monospace" }}
          />
          <input
            value={mintTokenId}
            onChange={(e) => setMintTokenId(e.target.value)}
            placeholder="Token ID to mint"
            style={{ padding: "0.5rem", fontFamily: "monospace" }}
          />
          <button
            onClick={handleMint}
            disabled={isPending || !mintContract || !mintTokenId}
            style={{ padding: "0.5rem 1rem", cursor: "pointer" }}
          >
            {isPending ? "Minting..." : "Mint NFT"}
          </button>
        </div>
        {isConfirming && <p style={{ marginTop: "0.5rem" }}>Waiting for confirmation...</p>}
        {isSuccess && <p style={{ marginTop: "0.5rem" }}>NFT minted! Tx: {txHash}</p>}
        {mintError && <p style={{ color: "red", marginTop: "0.5rem" }}>Error: {mintError.message}</p>}
      </fieldset>

      {error && <p style={{ color: "red", marginTop: "1rem" }}>Error: {error}</p>}
    </div>
  );
}

export default function OnchainSvgNftPage() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainSvgNftUI />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
