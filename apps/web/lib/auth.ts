export const SESSION_COOKIE = "hl_session"
export const SESSION_STORAGE_KEY = "hl-web-session"

export type AppEnvironment = "mainnet" | "testnet"

export type SessionState = {
  authenticated: boolean
  walletAddress: string | null
  chainId: number
  chainName: string
  environment: AppEnvironment
}

export const DEFAULT_SESSION: SessionState = {
  authenticated: false,
  walletAddress: null,
  chainId: 42161,
  chainName: "Arbitrum",
  environment: "testnet",
}

export function shortenAddress(address: string | null): string {
  if (!address) return "No wallet"
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}
