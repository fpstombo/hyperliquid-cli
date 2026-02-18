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
  logout: () => void
  connectWallet: () => Promise<void>
  switchEnvironment: (environment: AppEnvironment) => void
  switchChain: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function AuthContextProvider({ children }: { children: ReactNode }) {
  const { ready, authenticated, user, login, logout, connectWallet, getAccessToken } = usePrivy()
  const [environment, setEnvironment] = useState<AppEnvironment>(DEFAULT_SESSION.environment)
  const [chainId, setChainId] = useState<number>(DEFAULT_SESSION.chainId)

  const activeWallet = user?.wallet
  const walletAddress = activeWallet?.address ?? null

  useEffect(() => {
    const nextChainId = activeWallet?.chainId
    if (!nextChainId) return
    setChainId(nextChainId)
    setEnvironment(nextChainId === 42161 ? "mainnet" : "testnet")
  }, [activeWallet?.chainId])

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

      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, environment }),
        credentials: "include",
      })

      if (!response.ok) {
        return
      }

    }

    void syncTrustedSession()

  }, [authenticated, environment, getAccessToken, ready])

  const switchEnvironment = useCallback((nextEnvironment: AppEnvironment) => {
    setEnvironment(nextEnvironment)
    setChainId(nextEnvironment === "mainnet" ? 42161 : 421614)
  }, [])

  const switchChain = useCallback(async () => {
    const nextChain = chainId === 42161 ? 421614 : 42161

    try {
      if (activeWallet) {
        await activeWallet.switchChain(nextChain)
      }
    } finally {
      setChainId(nextChain)
      setEnvironment(nextChain === 42161 ? "mainnet" : "testnet")
    }
  }, [activeWallet, chainId])

  const session = useMemo<SessionState>(
    () => ({
      authenticated,
      userId: user?.id ?? null,
      walletAddress,
      linkedWallets: user?.linkedAccounts
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

  if (!appId) {
    throw new Error("Missing NEXT_PUBLIC_PRIVY_APP_ID")
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
