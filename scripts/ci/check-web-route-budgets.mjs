#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const repoRoot = process.cwd()
const nextDir = join(repoRoot, 'apps/web/.next')

const BUDGETS = {
  '/dashboard/page': 220,
  '/trade/[symbol]/page': 240,
}

const SECONDARY_DASHBOARD_CHUNK_LIMIT_KB = 45

const appBuildManifest = JSON.parse(readFileSync(join(nextDir, 'app-build-manifest.json'), 'utf8'))
const reactLoadableManifest = JSON.parse(readFileSync(join(nextDir, 'react-loadable-manifest.json'), 'utf8'))

function toKilobytes(bytes) {
  return bytes / 1024
}

function gzipSizeForAsset(assetPath) {
  const absolutePath = join(nextDir, assetPath)
  const source = readFileSync(absolutePath)
  return gzipSync(source).length
}

let hasFailure = false

for (const [route, maxKb] of Object.entries(BUDGETS)) {
  const assets = appBuildManifest.pages[route]
  if (!assets) {
    console.error(`Missing route "${route}" in app-build-manifest.`)
    hasFailure = true
    continue
  }

  const totalGzipBytes = assets
    .filter((asset) => asset.endsWith('.js'))
    .reduce((sum, asset) => sum + gzipSizeForAsset(asset), 0)

  const totalGzipKb = toKilobytes(totalGzipBytes)
  console.log(`${route} initial JS (gzip): ${totalGzipKb.toFixed(2)} KB (limit ${maxKb} KB)`)

  if (totalGzipKb > maxKb) {
    console.error(`Route budget exceeded for ${route}: ${totalGzipKb.toFixed(2)} KB > ${maxKb} KB`)
    hasFailure = true
  }
}

const secondaryPanelsEntry = Object.entries(reactLoadableManifest).find(([key]) =>
  key.includes('dashboard-secondary-panels'),
)

if (!secondaryPanelsEntry) {
  console.error('Missing lazy secondary dashboard chunk in react-loadable-manifest.')
  hasFailure = true
} else {
  const [, secondaryPanelsData] = secondaryPanelsEntry
  const secondaryFiles = secondaryPanelsData.files.filter((file) => file.endsWith('.js'))

  if (secondaryFiles.length === 0) {
    console.error('No JS assets found for secondary dashboard chunk entry.')
    hasFailure = true
  }

  for (const asset of secondaryFiles) {
    const gzipKb = toKilobytes(gzipSizeForAsset(asset))
    console.log(`Secondary dashboard chunk ${asset} (gzip): ${gzipKb.toFixed(2)} KB (limit ${SECONDARY_DASHBOARD_CHUNK_LIMIT_KB} KB)`)
    if (gzipKb > SECONDARY_DASHBOARD_CHUNK_LIMIT_KB) {
      console.error(
        `Secondary dashboard chunk budget exceeded for ${asset}: ${gzipKb.toFixed(2)} KB > ${SECONDARY_DASHBOARD_CHUNK_LIMIT_KB} KB`,
      )
      hasFailure = true
    }
  }
}

if (hasFailure) {
  process.exit(1)
}
