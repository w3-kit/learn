"use client";

import { useState, useCallback } from "react";
import { cn } from "../../lib/utils";
import type { NFT, NFTCardProps } from "./types";
import { formatAddress, getChainName } from "./utils";

export type { NFT, NFTCardProps };

export function NFTCard({ nft, onNFTClick, className }: NFTCardProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const isClickable = !!onNFTClick;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onNFTClick?.(nft);
      }
    },
    [onNFTClick, nft],
  );

  return (
    <div
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      className={cn(
        "rounded-xl border border-border bg-card overflow-hidden transition-colors duration-150",
        isClickable && "cursor-pointer hover:border-muted-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      onClick={() => onNFTClick?.(nft)}
    >
      <div className="relative aspect-square bg-muted">
        {!imageError ? (
          <img
            src={nft.image}
            alt={nft.name}
            onLoad={() => setIsImageLoaded(true)}
            onError={() => setImageError(true)}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-150",
              isImageLoaded ? "opacity-100" : "opacity-0",
            )}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
        {!isImageLoaded && !imageError && (
          <div className="absolute inset-0 animate-pulse bg-muted" />
        )}
      </div>

      <div className="px-4 pt-3 pb-4">
        <p className="text-sm font-medium text-foreground truncate">{nft.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {nft.collection && <>{nft.collection} · </>}
          <span className="font-mono">#{nft.tokenId}</span>
        </p>

        {nft.attributes && nft.attributes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {nft.attributes.slice(0, 4).map((attr, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                <span className="opacity-60 mr-1">{attr.trait_type}:</span>
                {attr.value}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="font-mono">{formatAddress(nft.owner)}</span>
          <span>{getChainName(nft.chainId)}</span>
        </div>
      </div>
    </div>
  );
}

export default NFTCard;
