import type { SVGProps } from "react"

export type SemanticIconName =
  | "neutral"
  | "positive"
  | "negative"
  | "warning"
  | "sim"
  | "stale"
  | "degraded"
  | "pending"
  | "confirmed"
  | "rejected"

const ICON_PATHS: Record<SemanticIconName, JSX.Element> = {
  neutral: <circle cx="8" cy="8" r="2.1" />,
  positive: <path d="M3.25 8.1 6.5 11.4 12.75 4.9" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />,
  negative: <path d="m4.2 4.2 7.6 7.6m0-7.6-7.6 7.6" fill="none" strokeLinecap="round" strokeWidth="1.7" />,
  warning: <path d="M8 2.6 13.5 12H2.5L8 2.6Zm0 3.2V9.2M8 11.3h.01" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45" />,
  sim: <path d="M8 2.55 12.9 5.3v5.4L8 13.45 3.1 10.7V5.3L8 2.55Z" fill="none" strokeLinejoin="round" strokeWidth="1.4" />,
  stale: (
    <>
      <circle cx="8" cy="8" r="5.2" fill="none" strokeWidth="1.35" />
      <path d="M8 4.8v3.35L10.2 9.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.35" />
    </>
  ),
  degraded: (
    <>
      <path d="M2.9 10.4h2.3m1.6-2.8h2.3m1.6 2.8H13" fill="none" strokeLinecap="round" strokeWidth="1.35" />
      <path d="M8 2.6a5.4 5.4 0 1 1-5.4 5.4" fill="none" strokeLinecap="round" strokeWidth="1.35" />
    </>
  ),
  pending: (
    <>
      <circle cx="8" cy="8" r="4.8" fill="none" opacity="0.26" strokeWidth="1.3" />
      <path d="M8 3.2a4.8 4.8 0 0 1 4.8 4.8" fill="none" strokeLinecap="round" strokeWidth="1.55" />
    </>
  ),
  confirmed: <path d="M3.25 8.1 6.5 11.4 12.75 4.9" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />,
  rejected: <path d="m4.2 4.2 7.6 7.6m0-7.6-7.6 7.6" fill="none" strokeLinecap="round" strokeWidth="1.7" />,
}

type SemanticIconProps = SVGProps<SVGSVGElement> & {
  name: SemanticIconName
}

export function SemanticIcon({ name, className = "", ...props }: SemanticIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
      className={`ui-semantic-icon ui-semantic-icon--${name} ${className}`.trim()}
      {...props}
    >
      {ICON_PATHS[name]}
    </svg>
  )
}

