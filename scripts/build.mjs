// Builds the Chrome extension (dist/) and the dev harness used by Cypress (dist-harness/).
import { build } from 'esbuild'
import { cp, mkdir, rm, readFile, writeFile, readdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
process.chdir(root)

/**
 * Normally @page-agent/page-controller comes from npm. If it is not installed
 * (offline build), PAGE_CONTROLLER_SRC can point at packages/page-controller/src
 * of a page-agent checkout; its optional mask dependency is stubbed because we
 * never enable the mask (read-only use).
 */
const plugins = []
let pageControllerSource = 'npm'
try {
  require.resolve('@page-agent/page-controller')
} catch {
  const src = process.env.PAGE_CONTROLLER_SRC
  if (!src || !existsSync(path.join(src, 'PageController.ts'))) {
    console.error('@page-agent/page-controller is not installed. Run `npm install`, or set PAGE_CONTROLLER_SRC to a page-agent checkout (packages/page-controller/src).')
    process.exit(1)
  }
  pageControllerSource = src
  plugins.push({
    name: 'page-controller-from-source',
    setup(b) {
      b.onResolve({ filter: /^@page-agent\/page-controller$/ }, () => ({ path: path.join(src, 'PageController.ts') }))
      b.onResolve({ filter: /^ai-motion$/ }, () => ({ path: 'ai-motion', namespace: 'stub' }))
      b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: 'export class Motion { constructor(){ throw new Error("mask disabled") } }', loader: 'js' }))
    },
  })
}

const common = {
  bundle: true,
  target: 'chrome120',
  sourcemap: 'linked',
  legalComments: 'none',
  logLevel: 'warning',
  plugins,
  loader: { '.svg': 'dataurl', '.module.css': 'local-css' },
  define: { 'process.env.NODE_ENV': '"production"' },
}

const dist = path.join(root, 'dist')
const harness = path.join(root, 'dist-harness')
await rm(dist, { recursive: true, force: true })
await rm(harness, { recursive: true, force: true })
await mkdir(dist, { recursive: true })
await mkdir(harness, { recursive: true })

// Extension
await build({ ...common, entryPoints: { extractor: 'src/extractor/entry.ts' }, outdir: dist, format: 'iife' })
await build({ ...common, entryPoints: { background: 'src/extension/background.ts' }, outdir: dist, format: 'esm' })
await build({ ...common, entryPoints: { popup: 'src/extension/popup.ts', options: 'src/extension/options.ts' }, outdir: dist, format: 'iife' })
for (const f of ['manifest.json', 'popup.html', 'options.html']) await cp(path.join(root, 'src/extension', f), path.join(dist, f))
await cp(path.join(root, 'src/ui/report.css'), path.join(dist, 'report.css'))
await cp(path.join(root, 'src/extension/icons'), path.join(dist, 'icons'), { recursive: true })

// Harness (same extractor, same pipeline, same report renderer)
await build({ ...common, entryPoints: { harness: 'src/harness/harness.ts' }, outdir: harness, format: 'iife' })
await cp(path.join(dist, 'extractor.js'), path.join(harness, 'extractor.js'))
await cp(path.join(root, 'src/harness/index.html'), path.join(harness, 'index.html'))
await cp(path.join(root, 'src/ui/report.css'), path.join(harness, 'report.css'))
await cp(path.join(root, 'fixtures/pages'), path.join(harness, 'fixtures'), { recursive: true })

const manifest = JSON.parse(await readFile(path.join(dist, 'manifest.json'), 'utf8'))
const files = await readdir(dist)
console.log(`built ${manifest.name} v${manifest.version} -> dist/ (${files.length} files), harness -> dist-harness/; page-controller: ${pageControllerSource}`)
await writeFile(path.join(dist, 'BUILD_INFO.json'), JSON.stringify({ builtAt: new Date().toISOString(), pageController: pageControllerSource === 'npm' ? 'npm' : 'source' }, null, 2))
