import { DEFAULT_SETTINGS, PRESETS, loadSettings, originPattern, saveSettings, type Settings } from './settings'
import { isGoogleKey, type StructuredMode } from '../core/llm'

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const status = $('status')
/** provider-specific request options carried over from the chosen preset */
let providerExtras: Pick<Settings, 'temperature' | 'reasoningEffort'> = {}

function fill(s: Settings) {
  $<HTMLInputElement>('baseURL').value = s.baseURL
  $<HTMLInputElement>('model').value = s.model
  $<HTMLInputElement>('apiKey').value = s.apiKey
  $<HTMLSelectElement>('structuredMode').value = s.structuredMode
  $<HTMLInputElement>('maxCalls').value = String(s.maxCalls)
}

async function main() {
  const presetSel = $<HTMLSelectElement>('preset')
  for (const p of PRESETS) {
    const o = document.createElement('option')
    o.value = p.label
    o.textContent = p.label
    presetSel.append(o)
  }
  presetSel.onchange = () => {
    const p = PRESETS.find((x) => x.label === presetSel.value)
    if (!p) return
    $<HTMLInputElement>('baseURL').value = p.baseURL
    $<HTMLInputElement>('model').value = p.model
    $<HTMLSelectElement>('structuredMode').value = p.structuredMode
    providerExtras = { temperature: p.temperature, reasoningEffort: p.reasoningEffort }
  }
  const current = await loadSettings()
  providerExtras = { temperature: current.temperature, reasoningEffort: current.reasoningEffort }
  fill(current)

  $('save').onclick = async () => {
    const s: Settings = {
      baseURL: $<HTMLInputElement>('baseURL').value.trim() || DEFAULT_SETTINGS.baseURL,
      model: $<HTMLInputElement>('model').value.trim() || DEFAULT_SETTINGS.model,
      apiKey: $<HTMLInputElement>('apiKey').value.trim(),
      structuredMode: $<HTMLSelectElement>('structuredMode').value as StructuredMode,
      maxCalls: Math.min(10, Math.max(1, Number($<HTMLInputElement>('maxCalls').value) || 4)),
      ...providerExtras,
    }
    // the most common setup mistake: a Gemini key with the OpenAI address (or the reverse)
    const gemini = PRESETS.find((p) => p.baseURL.includes('googleapis'))!
    const openai = PRESETS.find((p) => p.label === 'OpenAI')!
    let note = ''
    if (isGoogleKey(s.apiKey) && !s.baseURL.includes('googleapis')) {
      Object.assign(s, { baseURL: gemini.baseURL, model: gemini.model, structuredMode: gemini.structuredMode, temperature: gemini.temperature, reasoningEffort: gemini.reasoningEffort })
      note = 'Anahtar bir Google Gemini anahtarı; adres ve model Gemini olarak ayarlandı. '
    } else if (s.apiKey.startsWith('sk-') && !s.apiKey.startsWith('sk-or-') && s.baseURL.includes('googleapis')) {
      Object.assign(s, { baseURL: openai.baseURL, model: openai.model, structuredMode: openai.structuredMode, temperature: undefined, reasoningEffort: undefined })
      note = 'Anahtar bir OpenAI anahtarı; adres ve model OpenAI olarak ayarlandı. '
    }
    if (s.baseURL.includes('googleapis') && s.reasoningEffort === undefined) Object.assign(s, { temperature: gemini.temperature, reasoningEffort: gemini.reasoningEffort })
    fill(s)
    let origin: string
    try {
      origin = originPattern(s.baseURL)
      if (!/^https:\/\//.test(s.baseURL) && !/^http:\/\/(localhost|127\.0\.0\.1)/.test(s.baseURL)) throw new Error('only https (or local http) endpoints')
    } catch (e) {
      status.textContent = `Geçersiz adres: ${(e as Error).message}`
      return
    }
    // least privilege: host access only for the one LLM endpoint the user chose
    const granted = await chrome.permissions.request({ origins: [origin] })
    if (!granted) {
      status.textContent = `${origin} için izin verilmedi; analiz çalışmaz.`
      return
    }
    await saveSettings(s)
    status.textContent = `${note}Kaydedildi. Anahtar yalnızca bu cihazda (chrome.storage.local) tutulur ve yalnızca ${new URL(s.baseURL).host} adresine gönderilir.`
  }
}

void main()
