import { cookies } from "next/headers"
import { SESSION_COOKIE, type AppEnvironment } from "./auth"
import { verifySessionToken } from "./session-token"

export type AuthenticatedSession = {
  userId: string
  walletAddress: string | null
  environment: AppEnvironment
}

export async function requireAuthenticatedSession(): Promise<AuthenticatedSession> {
  const token = cookies().get(SESSION_COOKIE)?.value
  if (!token) {
    throw new Error("Missing authenticated session. Sign in again and retry.")
  }

  const payload = await verifySessionToken(token)
  const userId = typeof payload.sub === "string" ? payload.sub : null
  const walletAddress = typeof payload.walletAddress === "string" ? payload.walletAddress : null
  const environment = payload.environment

  if (environment !== "mainnet" && environment !== "testnet") {
    throw new Error("Session is missing environment. Re-authenticate to continue.")
  }

  if (!userId) {
    throw new Error("Session is missing user id. Re-authenticate to continue.")
  }

  return { userId, walletAddress, environment }
}
