export type ApprovalState = "missing" | "pending" | "active" | "expired" | "revoked"

export interface AgentApprovalRecord {
  userAddress: string
  agentAddress: string
  state: ApprovalState
  requestedAt: number
  approvedAt?: number
  revokedAt?: number
  validUntil?: number
  updatedAt: number
}

export interface TradingValidationResult {
  valid: boolean
  state: ApprovalState
  reason?: string
}

const STORAGE_KEY = "hyperliquid-agent-approval"
const DEFAULT_PENDING_MS = 20_000
const DEFAULT_APPROVAL_TTL_MS = 15 * 60_000

export function getApprovalUrl(isTestnet: boolean = false): string {
  return isTestnet ? "https://app.hyperliquid-testnet.xyz/API" : "https://app.hyperliquid.xyz/API"
}

export function createMockAgentAddress(): string {
  const hex = Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
  return `0x${hex}`
}

export function loadAgentApproval(): AgentApprovalRecord | null {
  if (typeof window === "undefined") return null

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as AgentApprovalRecord
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

function saveAgentApproval(record: AgentApprovalRecord): AgentApprovalRecord {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  }
  return record
}

export function beginApproval(userAddress: string, agentAddress: string, ttlMs: number = DEFAULT_APPROVAL_TTL_MS): AgentApprovalRecord {
  const now = Date.now()
  return saveAgentApproval({
    userAddress,
    agentAddress,
    state: "pending",
    requestedAt: now,
    validUntil: now + ttlMs,
    updatedAt: now,
  })
}

export function refreshApprovalState(pendingMs: number = DEFAULT_PENDING_MS): AgentApprovalRecord | null {
  const record = loadAgentApproval()
  if (!record) return null

  const now = Date.now()

  if (record.state === "pending" && now - record.requestedAt >= pendingMs) {
    return saveAgentApproval({ ...record, state: "active", approvedAt: now, updatedAt: now })
  }

  if (record.state === "active" && record.validUntil && now >= record.validUntil) {
    return saveAgentApproval({ ...record, state: "expired", updatedAt: now })
  }

  return record
}

export function revokeApproval(): AgentApprovalRecord | null {
  const record = loadAgentApproval()
  if (!record) return null
  const now = Date.now()
  return saveAgentApproval({ ...record, state: "revoked", revokedAt: now, updatedAt: now })
}

export function clearApproval(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY)
  }
}

export function recoverApproval(ttlMs: number = DEFAULT_APPROVAL_TTL_MS): AgentApprovalRecord | null {
  const record = loadAgentApproval()
  if (!record) return null

  const now = Date.now()
  return saveAgentApproval({
    ...record,
    state: "pending",
    requestedAt: now,
    approvedAt: undefined,
    revokedAt: undefined,
    validUntil: now + ttlMs,
    updatedAt: now,
  })
}

export function validateTradingContext(expectedUserAddress: string): TradingValidationResult {
  const current = refreshApprovalState()

  if (!current) {
    return { valid: false, state: "missing", reason: "No agent authorization found. Complete onboarding first." }
  }

  if (current.userAddress.toLowerCase() !== expectedUserAddress.toLowerCase()) {
    return {
      valid: false,
      state: current.state,
      reason: "Authorized wallet does not match connected wallet. Reconnect and re-approve your agent.",
    }
  }

  if (current.state !== "active") {
    const reasons: Record<Exclude<ApprovalState, "active">, string> = {
      missing: "No authorization was found.",
      pending: "Agent approval is still pending confirmation.",
      expired: "Agent authorization expired and must be renewed.",
      revoked: "Agent authorization was revoked. Re-approve to continue trading.",
    }
    return { valid: false, state: current.state, reason: reasons[current.state] }
  }

  return { valid: true, state: "active" }
}
