export const SESSION_COOKIE = "hl_session"

export type AppEnvironment = "mainnet" | "testnet"

export type SessionState = {
  authenticated: boolean
  userId: string | null
  walletAddress: string | null
  linkedWallets: string[]
  chainId: number
  chainName: string
  environment: AppEnvironment
}

export const DEFAULT_SESSION: SessionState = {
  authenticated: false,
  userId: null,
  walletAddress: null,
  linkedWallets: [],
  chainId: 421614,
  chainName: "Arbitrum Sepolia",
  environment: "testnet",
}

export function shortenAddress(address: string | null): string {
  if (!address) return "No wallet"
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}
