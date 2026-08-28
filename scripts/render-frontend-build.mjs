#!/usr/bin/env node
// Render Static Site build command for the Shahnisa frontend.
//
// Copies just the static site's own files into dist/ (leaving the backend/
// monorepo, node_modules, etc. out of what gets published) and writes
// dist/env-config.js from this service's MEDUSA_URL / MEDUSA_PUBLISHABLE_KEY
// env vars, so the deployed site knows which Medusa backend to call instead
// of the localhost default baked into js/api.js.

import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const dist = join(root, 'dist')

const PAGES = [
  'index.html',
  'shop.html',
  'product.html',
  'checkout.html',
  'account.html',
  'order-confirmation.html',
  'our-craft.html',
]
const DIRS = ['assets', 'css', 'js', 'data', 'partials']

rmSync(dist, { recursive: true, force: true })
mkdirSync(dist, { recursive: true })

for (const page of PAGES) {
  cpSync(join(root, page), join(dist, page))
}
for (const dir of DIRS) {
  cpSync(join(root, dir), join(dist, dir), { recursive: true })
}

const medusaUrl = process.env.MEDUSA_URL || ''
const publishableKey = process.env.MEDUSA_PUBLISHABLE_KEY || ''

if (!medusaUrl || !publishableKey) {
  console.warn(
    'WARNING: MEDUSA_URL and/or MEDUSA_PUBLISHABLE_KEY are not set — ' +
      'the deployed site will fall back to the localhost defaults in js/api.js.'
  )
}

writeFileSync(
  join(dist, 'env-config.js'),
  `window.__ENV__ = ${JSON.stringify({ MEDUSA_URL: medusaUrl, MEDUSA_PUBLISHABLE_KEY: publishableKey }, null, 2)};\n`
)

console.log(`Built dist/ (${PAGES.length} pages, ${DIRS.length} asset dirs) with env-config.js`)
