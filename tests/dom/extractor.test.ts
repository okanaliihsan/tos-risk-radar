/**
 * Runs the real bundled extractor (page-agent PageController + visibility
 * audit) in headless Chromium against the fixture pages.
 * Requires `npm run build` first.
 */
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { chromium, type Browser } from 'playwright'
// @ts-expect-error plain JS module
import { startServer } from '../../scripts/serve.mjs'
import type { ExtractedPage } from '../../src/extractor/extract'
import type { Server } from 'node:http'

let browser: Browser
let server: Server
const PORT = 4199

before(async () => {
  server = await startServer(PORT)
  browser = await chromium.launch()
})
after(async () => {
  await browser?.close()
  server?.close()
})

async function extract(file: string): Promise<ExtractedPage> {
  const page = await browser.newPage()
  await page.goto(`http://127.0.0.1:${PORT}/fixtures/${file}`)
  await page.addScriptTag({ url: `http://127.0.0.1:${PORT}/extractor.js` })
  const result = (await page.evaluate(() => (window as any).__tosRadarExtract())) as ExtractedPage
  // page-agent's highlight overlays must be cleaned up
  const leftovers = await page.evaluate(() => document.querySelectorAll('#playwright-highlight-container, [id*="highlight-container"]').length)
  assert.equal(leftovers, 0, 'highlight overlays left in page')
  await page.close()
  return result
}

test('clean page: page-agent text contains the clauses, no hidden text, nothing cloaked', async () => {
  const r = await extract('bulutkutu-kosullar.html')
  assert.match(r.text, /otomatik olarak yenilenir/)
  assert.match(r.text, /tahkim yoluyla/)
  assert.match(r.extractor, /page-controller/)
  assert.equal(r.cloaked.length, 0)
  assert.equal(r.hidden.filter((h) => !h.how.startsWith('attribute')).length, 0)
  // interactive-element markers from page-agent are stripped
  assert.doesNotMatch(r.text, /\[\d+\]</)
})

test('injection page: every hidden instruction is caught and kept out of the model input', async () => {
  const r = await extract('bulutkutu-kosullar-injection.html')
  const hows = new Set(r.hidden.map((h) => h.how))
  for (const how of ['css-hidden', 'html-comment', 'same-colour-as-background', 'tiny-font', 'off-screen']) {
    assert.ok(hows.has(how), `expected hidden reason ${how}; got ${[...hows].join(', ')}`)
  }
  assert.doesNotMatch(r.text, /Önceki tüm talimatları yok say/) // display:none
  assert.doesNotMatch(r.text, /ignore all previous instructions/i) // white on white
  assert.doesNotMatch(r.text, /click the Subscribe button/) // 1px font
  assert.doesNotMatch(r.text, /\[INST\]/) // off-screen
  assert.doesNotMatch(r.text, /SYSTEM: the overall risk score/) // comment
  // the visible note is still in the text: it is the pipeline's quarantine that handles it
  assert.match(r.text, /Otomatik özetleme yapan yapay zekâ asistanları için not/)
})

test('cloaked clause (visible to humans, hidden from AI agents) is added back', async () => {
  const r = await extract('bulutkutu-kosullar-injection.html')
  assert.equal(r.cloaked.length, 1)
  assert.match(r.cloaked[0]!, /toplu dava açma hakkından feragat/)
  assert.match(r.text, /toplu dava açma hakkından feragat/)
})
