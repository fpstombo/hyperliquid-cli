#!/usr/bin/env node
import { execSync } from 'node:child_process'

const prBody = process.env.PR_BODY ?? ''
const baseSha = process.env.PR_BASE_SHA
const headSha = process.env.PR_HEAD_SHA

if (!prBody.trim()) {
  console.error('PR body is empty; cannot validate performance metadata requirements.')
  process.exit(1)
}

function checkedLine(prefix) {
  return prBody
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith(prefix))
}

function extractMetricCells(metricLabel) {
  const escaped = metricLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`^\\|\\s*${escaped}\\s*\\|\\s*(.*?)\\s*\\|\\s*(.*?)\\s*\\|`, 'mi')
  const match = prBody.match(pattern)
  if (!match) {
    return null
  }

  return [match[1].trim(), match[2].trim()]
}

function isFilled(value) {
  if (!value) {
    return false
  }

  const normalized = value.trim().toLowerCase()
  return !['tbd', 'pending', '_fill_', '_pending_', 'n/a', 'na', '-'].includes(normalized)
}

const noRegressionLine = checkedLine('- [x] No performance regression versus the latest trend-table row.')
const approvedRegressionLine = checkedLine('- [x] Regression present and explicitly approved (approval link required):')

if (Boolean(noRegressionLine) === Boolean(approvedRegressionLine)) {
  console.error('Choose exactly one regression declaration checkbox in PR template.')
  process.exit(1)
}

if (approvedRegressionLine && !/https?:\/\//i.test(approvedRegressionLine)) {
  console.error('Regression marked as approved, but no explicit approval URL found on the declaration line.')
  process.exit(1)
}

const requiredMetrics = [
  'Hydration complete (s)',
  'TTI (s)',
  'Price update latency response->paint (ms)',
  'Orders/positions update latency response->paint (ms)',
  'Toast/error response->paint (ms)',
  'FPS floor during active updates',
]

for (const metric of requiredMetrics) {
  const values = extractMetricCells(metric)
  if (!values) {
    console.error(`Missing required metric row in PR body: ${metric}`)
    process.exit(1)
  }

  const [dashboardValue, tradeValue] = values
  if (!isFilled(dashboardValue) || !isFilled(tradeValue)) {
    console.error(`Metric row must include both /dashboard and /trade/[symbol] values: ${metric}`)
    process.exit(1)
  }
}

const trendTableLinkLine = prBody
  .split('\n')
  .map((line) => line.trim())
  .find((line) => line.startsWith('- Link to the new row appended in `docs/web-ui-v1-performance-checklist.md`'))

if (!trendTableLinkLine || !/https?:\/\//i.test(trendTableLinkLine)) {
  console.error('PR body must include a concrete link to the appended trend-table row in docs/web-ui-v1-performance-checklist.md.')
  process.exit(1)
}

if (!baseSha || !headSha) {
  console.error('Missing PR_BASE_SHA or PR_HEAD_SHA environment variables.')
  process.exit(1)
}

const changedFilesOutput = execSync(`git diff --name-only ${baseSha}...${headSha}`, { encoding: 'utf8' })
const changedFiles = changedFilesOutput
  .split('\n')
  .map((file) => file.trim())
  .filter(Boolean)

const isUiPr = changedFiles.some((file) =>
  /^(apps\/web\/app\/(dashboard|trade)\/|apps\/web\/components\/|apps\/web\/app\/globals\.css|apps\/web\/lib\/hooks\/)/.test(file),
)

if (isUiPr && !changedFiles.includes('docs/web-ui-v1-performance-checklist.md')) {
  console.error('UI PRs must append a new trend-table row in docs/web-ui-v1-performance-checklist.md.')
  process.exit(1)
}

console.log('PR performance metadata + regression approval gate passed.')
