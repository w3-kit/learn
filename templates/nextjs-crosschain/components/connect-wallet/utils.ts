export function truncateAddress(address: string): string {
  if (!address || address.length <= 13) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function findWallet<T extends { id: string }>(
  wallets: T[],
  walletId: string | undefined,
): T | undefined {
  if (!walletId) return undefined;
  return wallets.find((wallet) => wallet.id === walletId);
}
