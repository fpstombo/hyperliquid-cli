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
import { DEFAULT_SESSION, SESSION_COOKIE, SESSION_STORAGE_KEY, type AppEnvironment, type SessionState } from "../lib/auth"

type AuthContextValue = {
  ready: boolean
  session: SessionState
  login: () => void
  logout: () => void
  connectWallet: () => void
  switchEnvironment: (environment: AppEnvironment) => void
  switchChain: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function setSessionCookie(authenticated: boolean) {
  if (authenticated) {
    document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=604800; samesite=lax`
    return
  }

  document.cookie = `${SESSION_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax`
}

function generateWalletAddress() {
  const suffix = Math.random().toString(16).replace("0.", "").padEnd(40, "0").slice(0, 40)
  return `0x${suffix}`
}

export function AppPrivyProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [session, setSession] = useState<SessionState>(DEFAULT_SESSION)

  useEffect(() => {
    const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY)
    if (rawSession) {
      try {
        const parsed = JSON.parse(rawSession) as SessionState
        setSession({ ...DEFAULT_SESSION, ...parsed })
      } catch {
        setSession(DEFAULT_SESSION)
      }
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
    setSessionCookie(session.authenticated)
  }, [ready, session])

  const login = useCallback(() => {
    setSession((current) => ({
      ...current,
      authenticated: true,
      walletAddress: current.walletAddress ?? generateWalletAddress(),
    }))
  }, [])

  const logout = useCallback(() => {
    setSession((current) => ({
      ...current,
      authenticated: false,
      walletAddress: null,
    }))
  }, [])

  const connectWallet = useCallback(() => {
    setSession((current) => ({ ...current, walletAddress: generateWalletAddress() }))
  }, [])

  const switchEnvironment = useCallback((environment: AppEnvironment) => {
    setSession((current) => ({
      ...current,
      environment,
      chainId: environment === "mainnet" ? 42161 : 421614,
      chainName: environment === "mainnet" ? "Arbitrum" : "Arbitrum Sepolia",
    }))
  }, [])

  const switchChain = useCallback(() => {
    setSession((current) => {
      if (current.chainId === 42161) {
        return {
          ...current,
          chainId: 421614,
          chainName: "Arbitrum Sepolia",
          environment: "testnet",
        }
      }

      return {
        ...current,
        chainId: 42161,
        chainName: "Arbitrum",
        environment: "mainnet",
      }
    })
  }, [])

  const value = useMemo(
    () => ({ ready, session, login, logout, connectWallet, switchEnvironment, switchChain }),
    [connectWallet, login, logout, ready, session, switchChain, switchEnvironment],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AppPrivyProvider")
  }

  return context
}
