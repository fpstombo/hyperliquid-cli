import { appendFileSync } from "node:fs"
import { SERVER_LOG_PATH } from "../lib/paths.js"

export function createStructuredLogger(base: Record<string, unknown> = {}): (entry: Record<string, unknown>) => void {
  return (entry: Record<string, unknown>) => {
    const line = JSON.stringify({ ts: new Date().toISOString(), ...base, ...entry }) + "\n"
    appendFileSync(SERVER_LOG_PATH, line)
  }
}
