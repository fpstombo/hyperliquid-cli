export type ApprovalState = "missing" | "pending" | "active" | "expired" | "revoked"

export interface AgentApprovalSnapshot {
  userAddress: string
  agentAddress: string
  state: ApprovalState
  validUntil?: number
  reason?: string
  updatedAt: number
}

export interface OnboardingContext {
  walletAddress: string
  agentAddress: string
  isTestnet: boolean
  termsAccepted: boolean
  backupConfirmed: boolean
  lastKnownState?: ApprovalState
  updatedAt: number
}

const ONBOARDING_CONTEXT_KEY = "hyperliquid-onboarding-context"

export function loadOnboardingContext(): OnboardingContext | null {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(ONBOARDING_CONTEXT_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as OnboardingContext
  } catch {
    window.localStorage.removeItem(ONBOARDING_CONTEXT_KEY)
    return null
  }
}

export function saveOnboardingContext(context: Omit<OnboardingContext, "updatedAt">): OnboardingContext {
  const value: OnboardingContext = { ...context, updatedAt: Date.now() }
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ONBOARDING_CONTEXT_KEY, JSON.stringify(value))
  }
  return value
}

export function clearOnboardingContext(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(ONBOARDING_CONTEXT_KEY)
  }
}

