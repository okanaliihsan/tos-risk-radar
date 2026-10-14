/**
 * MV3 service worker. Owns the API key and the only network call (to the
 * configured LLM endpoint). Page content arrives as data from the extractor;
 * nothing from the page can reach chrome.* APIs or the key.
 */
import { analyze } from '../core/analyze'
import { OpenAICompatibleClient } from '../core/llm'
import { detectLegalPage } from '../core/detect'
import type { ExtractedPage } from '../extractor/extract'
import { loadSettings, originPattern, tabKey, type TabState } from './settings'

async function setState(tabId: number, s: TabState) {
  await chrome.storage.session.set({ [tabKey(tabId)]: s })
}

// 1. Detection: badge on pages that look like terms / privacy / subscription.
chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status !== 'complete' || !tab.url) return
  const kind = detectLegalPage(tab.url, tab.title ?? '')
  void chrome.action.setBadgeText({ tabId, text: kind ? '!' : '' })
  if (kind) {
    void chrome.action.setBadgeBackgroundColor({ tabId, color: '#b45309' })
    void chrome.action.setTitle({ tabId, title: 'ToS Risk Radar: bu sayfa bir sözleşme/politika metnine benziyor. Analiz için tıklayın.' })
  }
  // a navigated tab must not show the previous page's report
  if (info.status === 'complete') void chrome.storage.session.remove(tabKey(tabId))
})

chrome.tabs.onRemoved.addListener((tabId) => void chrome.storage.session.remove(tabKey(tabId)))

// 2. Analysis, started from the popup (user gesture -> activeTab grant).
/**
 * MV3 can stop an idle service worker after ~30 s, and waiting on a fetch does
 * not count as activity. A slow LLM call (long page, model "thinking", free-tier
 * rate-limit backoff) could therefore be killed silently. Calling a trivial
 * extension API every 20 s keeps the worker alive for the duration of the run.
 */
function keepAlive(): () => void {
  const timer = setInterval(() => void chrome.runtime.getPlatformInfo(), 20_000)
  return () => clearInterval(timer)
}

async function runAnalysis(tabId: number): Promise<void> {
  const stop = keepAlive()
  try {
    await runAnalysisInner(tabId)
  } finally {
    stop()
  }
}

async function runAnalysisInner(tabId: number): Promise<void> {
  const settings = await loadSettings()
  if (!settings.apiKey && !/localhost|127\.0\.0\.1/.test(settings.baseURL)) {
    return setState(tabId, { state: 'error', code: 'no_key', message: 'LLM API anahtarı ayarlanmamış. Ayarlar sayfasından kendi anahtarınızı girin.' })
  }
  const origin = originPattern(settings.baseURL)
  if (!(await chrome.permissions.contains({ origins: [origin] }))) {
    return setState(tabId, { state: 'error', code: 'no_permission', message: `${origin} adresine erişim izni verilmemiş. Ayarlar sayfasında "Kaydet"e basarak izin verin.` })
  }

  const startedAt = Date.now()
  await setState(tabId, { state: 'running', progress: 'Sayfa metni okunuyor (page-agent)', startedAt })
  let page: ExtractedPage
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['extractor.js'], world: 'ISOLATED' })
    const [res] = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'ISOLATED',
      func: () => (globalThis as unknown as { __tosRadarExtract: () => Promise<unknown> }).__tosRadarExtract(),
    })
    page = res?.result as ExtractedPage
    if (!page || typeof page.text !== 'string') throw new Error('extractor returned nothing')
  } catch (e) {
    return setState(tabId, { state: 'error', code: 'extract_failed', message: `Sayfa metni okunamadı: ${(e as Error).message}` })
  }

  try {
    const client = new OpenAICompatibleClient({
      baseURL: settings.baseURL,
      apiKey: settings.apiKey,
      model: settings.model,
      structuredMode: settings.structuredMode,
      // Gemini endpoint: never force temperature 0 on thinking models; keep thinking short
      temperature: settings.baseURL.includes('googleapis') ? null : settings.temperature,
      reasoningEffort: settings.baseURL.includes('googleapis') ? (settings.reasoningEffort ?? 'low') : settings.reasoningEffort,
    })
    const report = await analyze(
      { url: page.url, title: page.title, text: page.text, hidden: page.hidden, cloaked: page.cloaked },
      client,
      {
        maxCalls: settings.maxCalls,
        // smaller parts answer faster and fail less often on free tiers
        maxCharsPerCall: 20_000,
        onProgress: (p) => void setState(tabId, { state: 'running', progress: p, startedAt }),
      },
    )
    await setState(tabId, { state: 'done', report, extraction: { stats: page.stats, extractor: page.extractor } })
  } catch (e) {
    await setState(tabId, { state: 'error', code: 'llm_failed', message: `Analiz başarısız: ${(e as Error).message}` })
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // only our own extension pages (popup/options) may start an analysis; scripts
  // injected into web pages run with the page's URL and are rejected here
  if (sender.id !== chrome.runtime.id || !sender.url?.startsWith(chrome.runtime.getURL(''))) return
  if (msg?.type === 'analyze' && typeof msg.tabId === 'number') {
    void runAnalysis(msg.tabId)
    sendResponse({ started: true })
  }
})
