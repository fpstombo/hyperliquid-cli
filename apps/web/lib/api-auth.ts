import { NextResponse } from "next/server"
import { loadConfig } from "../../../src/lib/config.js"
import { validateAddress } from "../../../src/lib/validation.js"
import { SESSION_COOKIE } from "./auth"
import { type AppEnvironment } from "./auth"
import { createApiError, type ApiError } from "./api-types"
import { verifySessionToken } from "./session-token"

type SessionPayload = {
  sub?: string
  walletAddress?: string | null
  environment?: AppEnvironment
}

export type AuthenticatedRequestContext = {
  userId: string
  walletAddress: string
  tradingAccount: string
  environment: AppEnvironment
}

function parseCookie(rawCookie: string | null, cookieName: string): string | null {
  if (!rawCookie) return null

  const cookies = rawCookie.split(";")
  for (const chunk of cookies) {
    const [name, ...rest] = chunk.trim().split("=")
    if (name === cookieName) {
      return decodeURIComponent(rest.join("="))
    }
  }

  return null
}

function normalizeAddress(address: string): string {
  return validateAddress(address).toLowerCase()
}

function resolveTradingAccount(walletAddress: string): string {
  const accountMapRaw = process.env.HYPERLIQUID_ACCOUNT_MAP

  if (accountMapRaw) {
    try {
      const accountMap = JSON.parse(accountMapRaw) as Record<string, string>
      const mapped = accountMap[walletAddress.toLowerCase()]
      if (mapped) {
        return normalizeAddress(mapped)
      }
    } catch {
      // Ignore malformed mapping and fall back to wallet identity.
    }
  }

  return normalizeAddress(walletAddress)
}

function authError(status: 401 | 403, code: "UNAUTHORIZED" | "FORBIDDEN", message: string): NextResponse<ApiError> {
  return NextResponse.json(createApiError(code, message), { status })
}

export async function requireApiAuth(request: Request): Promise<AuthenticatedRequestContext | NextResponse<ApiError>> {
  const sessionToken = parseCookie(request.headers.get("cookie"), SESSION_COOKIE)

  if (!sessionToken) {
    return authError(401, "UNAUTHORIZED", "Authentication required")
  }

  let payload: SessionPayload
  try {
    payload = (await verifySessionToken(sessionToken)) as SessionPayload
  } catch {
    return authError(401, "UNAUTHORIZED", "Invalid session")
  }

  if (!payload.sub || !payload.walletAddress) {
    return authError(403, "FORBIDDEN", "Session missing wallet identity")
  }

  if (payload.environment !== "mainnet" && payload.environment !== "testnet") {
    return authError(403, "FORBIDDEN", "Session missing environment")
  }

  try {
    const walletAddress = normalizeAddress(payload.walletAddress)

    return {
      userId: payload.sub,
      walletAddress,
      tradingAccount: resolveTradingAccount(walletAddress),
      environment: payload.environment,
    }
  } catch {
    return authError(403, "FORBIDDEN", "Invalid wallet identity")
  }
}

export function verifyAuthorizedTradingAccount(context: AuthenticatedRequestContext): NextResponse<ApiError> | null {
  const config = loadConfig(context.environment === "testnet")
  if (!config.privateKey) {
    return null
  }

  const configuredAccount = config.walletAddress
  if (!configuredAccount) {
    return authError(403, "FORBIDDEN", "Trading account is not configured")
  }

  try {
    const normalizedConfiguredAccount = normalizeAddress(configuredAccount)
    if (normalizedConfiguredAccount !== context.tradingAccount) {
      return authError(403, "FORBIDDEN", "Trading account does not match authenticated wallet")
    }

    return null
  } catch {
    return authError(403, "FORBIDDEN", "Configured trading account is invalid")
  }
}

export function createRouteRuntimeConfig(context: AuthenticatedRequestContext) {
  return {
    user: validateAddress(context.tradingAccount),
    isTestnet: context.environment === "testnet",
  }
}
