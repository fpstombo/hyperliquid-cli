import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { SESSION_COOKIE } from "./lib/auth"
import { verifySessionToken } from "./lib/session-token"

const protectedPrefixes = ["/dashboard", "/trade"]

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const isProtected = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))

  if (!isProtected) {
    return NextResponse.next()
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value

  if (sessionToken) {
    try {
      await verifySessionToken(sessionToken)
      return NextResponse.next()
    } catch {
      // fall through to redirect
    }
  }

  const loginUrl = new URL("/auth", request.url)
  loginUrl.searchParams.set("next", `${pathname}${search}`)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/dashboard/:path*", "/trade/:path*"],
}
