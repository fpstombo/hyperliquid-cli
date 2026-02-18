import { SignJWT, jwtVerify } from "jose"

const encoder = new TextEncoder()
const ISSUER = "hyperliquid-web"
const AUDIENCE = "hyperliquid-protected-routes"

type SessionClaims = {
  sub: string
  walletAddress: string | null
  environment: "mainnet" | "testnet"
}

function getSecret() {
  const secret = process.env.PRIVY_SESSION_SECRET
  if (!secret) {
    throw new Error("Missing PRIVY_SESSION_SECRET")
  }
  return encoder.encode(secret)
}

export async function createSessionToken(claims: SessionClaims) {
  return new SignJWT({ walletAddress: claims.walletAddress, environment: claims.environment })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret())
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret(), {
    issuer: ISSUER,
    audience: AUDIENCE,
  })

  return payload
}
