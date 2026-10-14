/**
 * Smoke test of the built MV3 extension in Chromium:
 * service worker boots, legal-page detection sets the badge, popup and options
 * pages render (with the legal disclaimer) without script errors.
 * Requires `npm run build` first.
 */
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { mkdtempSync } from 'node:fs'
import os from 'node:os'
import { chromium, type BrowserContext, type Worker } from 'playwright'
// @ts-expect-error plain JS module
import { startServer } from '../../scripts/serve.mjs'
import type { Server } from 'node:http'

const DIST = path.resolve(import.meta.dirname, '../../dist')
const PORT = 4196
let ctx: BrowserContext
let sw: Worker
let server: Server

before(async () => {
  server = await startServer(PORT)
  ctx = await chromium.launchPersistentContext(mkdtempSync(path.join(os.tmpdir(), 'tosr-')), {
    channel: 'chromium',
    args: [`--disable-extensions-except=${DIST}`, `--load-extension=${DIST}`],
  })
  sw = ctx.serviceWorkers()[0] ?? (await ctx.waitForEvent('serviceworker'))
  // the worker handle can appear before extension APIs are bound
  for (let i = 0; i < 50 && !(await sw.evaluate(() => typeof chrome !== 'undefined' && !!chrome.tabs).catch(() => false)); i++) {
    await new Promise((r) => setTimeout(r, 100))
  }
})
after(async () => {
  await ctx?.close()
  server?.close()
})

test('service worker boots and flags a terms page with a badge', async () => {
  const page = await ctx.newPage()
  await page.goto(`http://127.0.0.1:${PORT}/fixtures/bulutkutu-kosullar.html`)
  await page.waitForTimeout(500)
  const badge = await sw.evaluate(async () => {
    const [tab] = await chrome.tabs.query({ url: '*://127.0.0.1/*kosullar*' })
    return chrome.action.getBadgeText({ tabId: tab!.id! })
  })
  assert.equal(badge, '!')

  const blog = await ctx.newPage()
  await blog.goto(`http://127.0.0.1:${PORT}/fixtures/blog-post.html`)
  await blog.waitForTimeout(500)
  const badge2 = await sw.evaluate(async () => {
    const [tab] = await chrome.tabs.query({ url: '*://127.0.0.1/*blog-post*' })
    return chrome.action.getBadgeText({ tabId: tab!.id! })
  })
  assert.equal(badge2, '')
})

test('popup and options render the disclaimer without errors', async () => {
  const id = new URL(sw.url()).host
  for (const p of ['popup.html', 'options.html']) {
    const page = await ctx.newPage()
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(`chrome-extension://${id}/${p}`)
    await page.waitForTimeout(400)
    const text = await page.locator('body').innerText()
    assert.match(text, /Hukuki tavsiye değildir/)
    assert.deepEqual(errors, [])
  }
})

test('analysis without a key fails closed with a clear message (no network call)', async () => {
  const target = await ctx.newPage()
  await target.goto(`http://127.0.0.1:${PORT}/fixtures/streamly-terms.html`)
  const tabId = await sw.evaluate(async () => (await chrome.tabs.query({ url: '*://127.0.0.1/*streamly*' }))[0]!.id!)
  // send the same message the popup sends, from an extension page
  const id = new URL(sw.url()).host
  const popup = await ctx.newPage()
  await popup.goto(`chrome-extension://${id}/options.html`)
  const state = await popup.evaluate(async (tabId) => {
    const key = `tab:${tabId}`
    const done = new Promise<unknown>((resolve) => {
      chrome.storage.session.onChanged.addListener((ch) => {
        if (ch[key]?.newValue) resolve(ch[key].newValue)
      })
    })
    await chrome.runtime.sendMessage({ type: 'analyze', tabId })
    return done
  }, tabId)
  assert.equal((state as any).state, 'error')
  assert.equal((state as any).code, 'no_key')
  assert.match((state as any).message, /kendi anahtarınızı/)
})
