"use client";

import { useMemo, useState } from "react";
import {
  usePublicClient,
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatUnits } from "viem";

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

// ★ Chainlink AggregatorV3 — only need latestRoundData for price reads
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

// ★ Decode base64-encoded on-chain JSON metadata from a data URI
function decodeOnchainMetadata(uri: string): NFTMetadata | null {
  if (!uri.startsWith("data:application/json;base64,")) return null;
  try {
    const json = atob(uri.split(",")[1]);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// ★ Extract raw SVG markup from a base64 or UTF-8 data URI
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

// ★ Chainlink ETH/USD on mainnet — works without wallet connection
const DEFAULT_PRICE_FEED = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
const PRICE_THRESHOLD = 2000_00000000n; // $2,000 with 8 decimals

export function OnchainSvgNft() {
  const client = usePublicClient();
  const { address } = useAccount();

  // --- Read & display state ---
  const [contractAddress, setContractAddress] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [rawUri, setRawUri] = useState<string | null>(null);

  // ★ Derive SVG content from metadata instead of storing as separate state
  const svgContent = useMemo(() => (metadata ? extractSvg(metadata) : null), [metadata]);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Chainlink price feed state ---
  const [priceFeedAddress, setPriceFeedAddress] = useState(DEFAULT_PRICE_FEED);

  // ★ Live ETH/USD price — refetches every 30 seconds
  const { data: roundData } = useReadContract({
    address: priceFeedAddress as `0x${string}`,
    abi: aggregatorV3Abi,
    functionName: "latestRoundData",
    query: { enabled: !!priceFeedAddress, refetchInterval: 30_000 },
  });

  const ethPrice = roundData ? formatUnits(roundData[1], 8) : null;
  const mood = roundData && roundData[1] > PRICE_THRESHOLD ? "bullish" : "bearish";

  // --- Mint state ---
  const [mintContract, setMintContract] = useState("");
  const [mintTokenId, setMintTokenId] = useState("");
  const { writeContract, data: txHash, isPending, error: mintError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  // ★ Fetch tokenURI, decode base64 JSON, extract embedded SVG
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
      if (decoded) {
        setMetadata(decoded);
        return;
      }

      const res = await fetch(uri);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      setMetadata(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsFetching(false);
    }
  };

  const handleMint = () => {
    if (!mintContract || !mintTokenId || !address) return;
    try {
      writeContract({
        address: mintContract as `0x${string}`,
        abi: dynamicNftMintAbi,
        functionName: "safeMint",
        args: [address, BigInt(mintTokenId)],
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div>
      <h2>On-chain SVG NFT</h2>

      {/* --- Section 1: Read & render on-chain SVG --- */}
      <fieldset style={{ marginBottom: "1.5rem" }}>
        <legend>Read On-chain SVG</legend>
        <input
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
          placeholder="NFT contract address (0x...)"
          style={{ display: "block", marginBottom: "0.5rem", width: "100%" }}
        />
        <input
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          placeholder="Token ID"
          style={{ display: "block", marginBottom: "0.5rem", width: "100%" }}
        />
        <button onClick={handleFetch} disabled={isFetching || !contractAddress || !tokenId}>
          {isFetching ? "Fetching..." : "Fetch SVG NFT"}
        </button>

        {rawUri && (
          <p style={{ wordBreak: "break-all", fontSize: "0.85rem" }}>
            URI: <code>{rawUri.length > 80 ? `${rawUri.slice(0, 80)}...` : rawUri}</code>
          </p>
        )}

        {/* ★ Render on-chain SVG in a sandboxed iframe to prevent XSS */}
        {svgContent && (
          <iframe
            sandbox=""
            srcDoc={svgContent}
            style={{ width: "300px", height: "300px", border: "1px solid #ccc", marginTop: "1rem" }}
            title="On-chain SVG NFT"
          />
        )}

        {metadata && (
          <div style={{ marginTop: "1rem" }}>
            {metadata.name && <h3>{metadata.name}</h3>}
            {metadata.description && <p>{metadata.description}</p>}
            {metadata.attributes && (
              <ul>
                {metadata.attributes.map((attr, i) => (
                  <li key={i}>
                    {attr.trait_type}: {attr.value}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </fieldset>

      {/* --- Section 2: Chainlink price feed --- */}
      <fieldset style={{ marginBottom: "1.5rem" }}>
        <legend>Chainlink ETH/USD Price</legend>
        <input
          value={priceFeedAddress}
          onChange={(e) => setPriceFeedAddress(e.target.value)}
          placeholder="Price feed address"
          style={{ display: "block", marginBottom: "0.5rem", width: "100%" }}
        />
        {ethPrice && (
          <p>
            ETH/USD: <strong>${Number(ethPrice).toLocaleString()}</strong>{" "}
            {mood === "bullish" ? "— bullish" : "— bearish"}
          </p>
        )}
        <p style={{ fontSize: "0.85rem", color: "#666" }}>
          Dynamic NFTs use this price to change their artwork in real time.
        </p>
      </fieldset>

      {/* --- Section 3: Mint dynamic NFT --- */}
      <fieldset>
        <legend>Mint Dynamic NFT</legend>
        <input
          value={mintContract}
          onChange={(e) => setMintContract(e.target.value)}
          placeholder="Dynamic NFT contract address (0x...)"
          style={{ display: "block", marginBottom: "0.5rem", width: "100%" }}
        />
        <input
          value={mintTokenId}
          onChange={(e) => setMintTokenId(e.target.value)}
          placeholder="Token ID to mint"
          style={{ display: "block", marginBottom: "0.5rem", width: "100%" }}
        />
        <button onClick={handleMint} disabled={isPending || !mintContract || !mintTokenId || !address}>
          {isPending ? "Minting..." : "Mint NFT"}
        </button>
        {isConfirming && <p>Waiting for confirmation...</p>}
        {isSuccess && <p>NFT minted! Tx: {txHash}</p>}
        {mintError && <p>Error: {mintError.message}</p>}
      </fieldset>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}
    </div>
  );
}
