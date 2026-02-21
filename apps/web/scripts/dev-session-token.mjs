import { SignJWT } from "jose"

const secret = process.env.PRIVY_SESSION_SECRET

if (!secret) {
  console.error('Missing PRIVY_SESSION_SECRET. Example: export PRIVY_SESSION_SECRET="dev-secret-123"')
  process.exit(1)
}

const walletAddress = process.env.DEV_WALLET_ADDRESS ?? "0x1111111111111111111111111111111111111111"
const environment = process.env.DEV_HL_ENV ?? "testnet"

const token = await new SignJWT({ walletAddress, environment })
  .setProtectedHeader({ alg: "HS256" })
  .setIssuer("hyperliquid-web")
  .setAudience("hyperliquid-protected-routes")
  .setSubject("dev-user")
  .setIssuedAt()
  .setExpirationTime("7d")
  .sign(new TextEncoder().encode(secret))

console.log(token)
