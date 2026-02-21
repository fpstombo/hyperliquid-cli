"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { PrivyProvider, usePrivy } from "@privy-io/react-auth"
import { DEFAULT_SESSION, type AppEnvironment, type SessionState } from "../lib/auth"

type AuthContextValue = {
  ready: boolean
  session: SessionState
  login: () => void
  logout: () => Promise<void>
  connectWallet: () => void
  switchEnvironment: (environment: AppEnvironment) => void
  switchChain: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function NoPrivyAuthContextProvider({ children }: { children: ReactNode }) {
  const [environment, setEnvironment] = useState<AppEnvironment>(DEFAULT_SESSION.environment)
  const [chainId, setChainId] = useState<number>(DEFAULT_SESSION.chainId)

  const switchEnvironment = useCallback((nextEnvironment: AppEnvironment) => {
    setEnvironment(nextEnvironment)
    setChainId(nextEnvironment === "mainnet" ? 42161 : 421614)
  }, [])

  const switchChain = useCallback(async () => {
    const nextChain = chainId === 42161 ? 421614 : 42161
    setChainId(nextChain)
    setEnvironment(nextChain === 42161 ? "mainnet" : "testnet")
  }, [chainId])

  const logout = useCallback(async () => {
    await fetch("/api/auth/session", { method: "DELETE", credentials: "include" })
  }, [])

  const session = useMemo<SessionState>(
    () => ({
      ...DEFAULT_SESSION,
      chainId,
      chainName: chainId === 42161 ? "Arbitrum" : "Arbitrum Sepolia",
      environment,
    }),
    [chainId, environment],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      ready: true,
      session,
      login: () => undefined,
      logout,
      connectWallet: () => undefined,
      switchEnvironment,
      switchChain,
    }),
    [logout, session, switchChain, switchEnvironment],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function AuthContextProvider({ children }: { children: ReactNode }) {
  const { ready, authenticated, user, login, logout, connectWallet, getAccessToken } = usePrivy()
  const [environment, setEnvironment] = useState<AppEnvironment>(DEFAULT_SESSION.environment)
  const [chainId, setChainId] = useState<number>(DEFAULT_SESSION.chainId)

  const walletAddress = user?.wallet?.address ?? null

  useEffect(() => {
    async function syncTrustedSession() {
      if (!ready) return

      if (!authenticated) {
        await fetch("/api/auth/session", { method: "DELETE", credentials: "include" })
        return
      }

      const accessToken = await getAccessToken()
      if (!accessToken) {
        return
      }

      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, environment }),
        credentials: "include",
      })
    }

    void syncTrustedSession()
  }, [authenticated, environment, getAccessToken, ready])

  const switchEnvironment = useCallback((nextEnvironment: AppEnvironment) => {
    setEnvironment(nextEnvironment)
    setChainId(nextEnvironment === "mainnet" ? 42161 : 421614)
  }, [])

  const switchChain = useCallback(async () => {
    const nextChain = chainId === 42161 ? 421614 : 42161
    setChainId(nextChain)
    setEnvironment(nextChain === 42161 ? "mainnet" : "testnet")
  }, [chainId])

  const session = useMemo<SessionState>(
    () => ({
      authenticated,
      userId: user?.id ?? null,
      walletAddress,
      linkedWallets:
        user?.linkedAccounts
          ?.filter((account): account is typeof account & { type: "wallet"; address: string } => account.type === "wallet")
          .map((wallet) => wallet.address) ?? [],
      chainId,
      chainName: chainId === 42161 ? "Arbitrum" : "Arbitrum Sepolia",
      environment,
    }),
    [authenticated, chainId, environment, user?.id, user?.linkedAccounts, walletAddress],
  )

  const value = useMemo(
    () => ({ ready, session, login, logout, connectWallet, switchEnvironment, switchChain }),
    [connectWallet, login, logout, ready, session, switchChain, switchEnvironment],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function AppPrivyProvider({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID
  const disablePrivy = process.env.NEXT_PUBLIC_DISABLE_PRIVY === "true"
  const isLocalPlaceholderAppId = !appId || appId.startsWith("local-") || appId === "test"

  if (disablePrivy || (process.env.NODE_ENV !== "production" && isLocalPlaceholderAppId)) {
    return <NoPrivyAuthContextProvider>{children}</NoPrivyAuthContextProvider>
  }

  if (!appId) {
    throw new Error("Missing NEXT_PUBLIC_PRIVY_APP_ID (or set NEXT_PUBLIC_DISABLE_PRIVY=true for local dev)")
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["wallet", "email"],
        appearance: {
          theme: "dark",
          accentColor: "#4c6fff",
        },
      }}
    >
      <AuthContextProvider>{children}</AuthContextProvider>
    </PrivyProvider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AppPrivyProvider")
  }

  return context
}
