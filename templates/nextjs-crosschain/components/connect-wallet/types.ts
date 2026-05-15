import type { ReactNode } from "react";

export interface WalletOption {
  id: string;
  name: string;
  icon: string | ReactNode;
  popular?: boolean;
  ecosystem?: "evm" | "solana" | "both";
  installed?: boolean;
  installUrl?: string;
}

export interface ConnectedAccount {
  address: string;
  walletId: string;
}

export interface Chain {
  chainId: number;
  name: string;
  color?: string;
  icon?: string;
}

export interface ConnectWalletProps {
  wallets: WalletOption[];
  connectedAccount?: ConnectedAccount | null;
  onConnect: (walletId: string) => void;
  onDisconnect?: () => void;
  chains?: Chain[];
  activeChain?: Chain;
  onChainSwitch?: (chainId: number) => void;
  recentWalletId?: string;
  variant?: "default" | "compact";
  loading?: boolean;
  className?: string;
}
