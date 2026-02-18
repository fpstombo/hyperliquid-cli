import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { SESSION_COOKIE, type AppEnvironment } from "../../../../lib/auth"
import { createSessionToken } from "../../../../lib/session-token"

type PrivyIdentity = {
  userId: string
  walletAddress: string | null
}

async function verifyPrivyAccessToken(accessToken: string): Promise<PrivyIdentity> {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID
  const appSecret = process.env.PRIVY_APP_SECRET

  if (!appId || !appSecret) {
    throw new Error("Missing Privy server credentials")
  }

  const response = await fetch(`https://auth.privy.io/api/v1/apps/${appId}/users/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "privy-app-id": appId,
      "privy-app-secret": appSecret,
    },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error("Unable to validate Privy access token")
  }

  const payload = (await response.json()) as {
    id?: string
    wallet?: { address?: string }
    linked_accounts?: Array<{ type?: string; address?: string }>
  }

  const linkedWallet = payload.linked_accounts?.find((account) => account.type === "wallet" && !!account.address)

  if (!payload.id) {
    throw new Error("Privy response did not include a user id")
  }

  return {
    userId: payload.id,
    walletAddress: payload.wallet?.address ?? linkedWallet?.address ?? null,
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { accessToken?: string; environment?: AppEnvironment }
    if (!body.accessToken) {
      return NextResponse.json({ error: "Missing access token" }, { status: 400 })
    }

    if (body.environment !== "mainnet" && body.environment !== "testnet") {
      return NextResponse.json({ error: "Missing or invalid environment (mainnet|testnet)" }, { status: 400 })
    }

    const identity = await verifyPrivyAccessToken(body.accessToken)

    const token = await createSessionToken({
      sub: identity.userId,
      walletAddress: identity.walletAddress,
      environment: body.environment,
    })

    cookies().set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create session",
      },
      { status: 401 },
    )
  }
}

export async function DELETE() {
  cookies().delete(SESSION_COOKIE)
  return NextResponse.json({ ok: true })
}
