import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { SESSION_COOKIE } from "./lib/auth"

const protectedPrefixes = ["/dashboard", "/trade"]

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const isProtected = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))

  if (!isProtected) {
    return NextResponse.next()
  }

  const hasSession = request.cookies.get(SESSION_COOKIE)?.value === "1"
  if (hasSession) {
    return NextResponse.next()
  }

  const loginUrl = new URL("/auth", request.url)
  loginUrl.searchParams.set("next", `${pathname}${search}`)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/dashboard/:path*", "/trade/:path*"],
}
