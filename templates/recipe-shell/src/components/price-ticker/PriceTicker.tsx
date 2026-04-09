"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { TokenIcon } from "../ui/token-icon";
import type { Token, PriceTickerProps } from "./types";
import { formatCurrency, formatLargeNumber, formatPercentage } from "./utils";

export type { Token, PriceTickerProps };

export function PriceTicker({ tokens, className, onTokenClick }: PriceTickerProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card overflow-hidden", className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Market Prices</h3>
        <span className="text-xs text-muted-foreground">{tokens.length} tokens</span>
      </div>

      <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2 border-b border-border text-xs text-muted-foreground">
        <span>Token</span>
        <span className="w-24 text-right">Price</span>
        <span className="w-20 text-right">24h</span>
        <span className="w-24 text-right hidden lg:block">Market Cap</span>
      </div>

      <div className="divide-y divide-border">
        {tokens.map((token) => {
          const isPositive = token.priceChange["24h"] >= 0;
          return (
            <div
              key={token.symbol}
              className={cn(
                "grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-4 py-3 transition-colors duration-150",
                onTokenClick ? "cursor-pointer hover:bg-muted" : "",
              )}
              onClick={() => onTokenClick?.(token)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <TokenIcon symbol={token.symbol} logoURI={token.logoURI} size="md" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{token.name}</p>
                  <p className="text-xs text-muted-foreground">{token.symbol}</p>
                </div>
              </div>

              <div className="w-24 text-right">
                <p className="text-sm font-medium text-foreground tabular-nums">{formatCurrency(token.price)}</p>
              </div>

              <div className="w-20 text-right hidden sm:block">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                    isPositive ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400" : "text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400",
                  )}
                >
                  {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {formatPercentage(token.priceChange["24h"])}
                </span>
              </div>

              <div className="w-24 text-right hidden lg:block">
                <p className="text-sm text-muted-foreground tabular-nums">{formatLargeNumber(token.marketCap)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PriceTicker;
