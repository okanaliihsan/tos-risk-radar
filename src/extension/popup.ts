import { renderDisclaimer, renderError, renderProgress, renderReport } from '../ui/render'
import { detectLegalPage } from '../core/detect'
import { tabKey, type TabState } from './settings'

const app = document.getElementById('app')!
const btn = document.getElementById('analyze') as HTMLButtonElement
const hint = document.getElementById('hint')!
const STALE_AFTER_S = 300
let lastState: TabState | undefined

async function activeTab(): Promise<chrome.tabs.Tab | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab
}

function show(state: TabState | undefined) {
  lastState = state
  app.replaceChildren()
  if (!state) {
    app.append(renderDisclaimer())
    return
  }
  if (state.state === 'running') {
    const secs = Math.round((Date.now() - state.startedAt) / 1000)
    if (secs > STALE_AFTER_S) {
      // the worker was stopped mid-run (browser restart, crash): never leave the user stuck
      btn.disabled = false
      btn.textContent = 'Tekrar dene'
      app.append(renderDisclaimer(), renderError(`Analiz ${Math.round(secs / 60)} dakikadır yanıt vermiyor ve yarıda kalmış görünüyor. "Tekrar dene"ye basın; sorun sürerse daha kısa bir sayfa deneyin.`))
      return
    }
    btn.disabled = true
    app.append(renderDisclaimer(), renderProgress(`${state.progress} · ${secs} sn`))
  } else if (state.state === 'error') {
    btn.disabled = false
    app.append(renderDisclaimer(), renderError(state.message))
    if (state.code === 'no_key' || state.code === 'no_permission') {
      const a = document.createElement('a')
      a.href = '#'
      a.textContent = 'Ayarları aç'
      a.onclick = (e) => {
        e.preventDefault()
        void chrome.runtime.openOptionsPage()
      }
      app.append(a)
    }
  } else {
    btn.disabled = false
    btn.textContent = 'Yeniden analiz et'
    app.append(renderReport(state.report, { extractor: state.extraction.extractor }))
  }
}

async function main() {
  const tab = await activeTab()
  if (!tab?.id || !tab.url || !/^https?:/.test(tab.url)) {
    btn.disabled = true
    hint.textContent = 'Bu sayfa analiz edilemez (yalnızca http/https sayfaları).'
    show(undefined)
    return
  }
  const kind = detectLegalPage(tab.url, tab.title ?? '')
  hint.textContent = kind
    ? 'Bu sayfa bir sözleşme / politika metnine benziyor.'
    : 'Sayfa adresi bir sözleşme metnine benzemiyor; yine de analiz edebilirsiniz.'

  const key = tabKey(tab.id)
  const stored = await chrome.storage.session.get(key)
  show(stored[key] as TabState | undefined)
  chrome.storage.session.onChanged.addListener((changes) => {
    if (changes[key]) show(changes[key].newValue as TabState | undefined)
  })
  // refresh the elapsed-time counter (and stale detection) while the popup is open
  setInterval(() => {
    if (lastState?.state === 'running') show(lastState)
  }, 1000)
  btn.onclick = () => {
    btn.disabled = true
    void chrome.runtime.sendMessage({ type: 'analyze', tabId: tab.id })
  }
  document.getElementById('settings')!.onclick = (e) => {
    e.preventDefault()
    void chrome.runtime.openOptionsPage()
  }
}

void main()
