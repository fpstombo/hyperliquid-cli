import type { CSSProperties, HTMLAttributes } from "react"

type SkeletonBlockProps = HTMLAttributes<HTMLDivElement> & {
  width?: CSSProperties["width"]
  height?: CSSProperties["height"]
}

/**
 * Usage example:
 * <SkeletonBlock width="8rem" height="1rem" />
 * <SkeletonBlock width="100%" height="2.5rem" aria-label="Loading order row" />
 */
export function SkeletonBlock({ width = "100%", height = "1rem", style, className = "", ...props }: SkeletonBlockProps) {
  return (
    <div
      className={`ui-skeleton-block ${className}`.trim()}
      style={{
        "--skeleton-width": width,
        "--skeleton-height": height,
        ...style,
      } as CSSProperties}
      aria-busy="true"
      {...props}
    />
  )
}
