import type { StructuredMode } from '../core/llm'

export interface Settings {
  baseURL: string
  model: string
  apiKey: string
  structuredMode: StructuredMode
  maxCalls: number
  /** null = provider default */
  temperature?: number | null
  reasoningEffort?: 'low' | 'medium' | 'high'
}

export const DEFAULT_SETTINGS: Settings = {
  baseURL: 'https://api.openai.com/v1',
  model: 'gpt-4.1-mini',
  apiKey: '',
  structuredMode: 'json_schema',
  maxCalls: 4,
}

export const PRESETS: { label: string; baseURL: string; model: string; structuredMode: StructuredMode; temperature?: number | null; reasoningEffort?: 'low' | 'medium' | 'high' }[] = [
  { label: 'OpenAI', baseURL: 'https://api.openai.com/v1', model: 'gpt-4.1-mini', structuredMode: 'json_schema' },
  { label: 'OpenRouter', baseURL: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4.1-mini', structuredMode: 'json_schema' },
  { label: 'Google Gemini (OpenAI uyumlu)', baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-3.5-flash-lite', structuredMode: 'json_schema', temperature: null, reasoningEffort: 'low' },
  { label: 'Alibaba DashScope / Qwen', baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus', structuredMode: 'json_object' },
  { label: 'Ollama (yerel)', baseURL: 'http://localhost:11434/v1', model: 'qwen2.5:14b', structuredMode: 'json_schema' },
]

/** API key lives in chrome.storage.local only (never sync, never sent anywhere but baseURL). */
export async function loadSettings(): Promise<Settings> {
  const stored = (await chrome.storage.local.get('settings')) as { settings?: Partial<Settings> }
  return { ...DEFAULT_SETTINGS, ...(stored.settings ?? {}) }
}

export async function saveSettings(s: Settings): Promise<void> {
  await chrome.storage.local.set({ settings: s })
}

export function originPattern(baseURL: string): string {
  const u = new URL(baseURL)
  return `${u.protocol}//${u.hostname}/*`
}

export type TabState =
  | { state: 'running'; progress: string; startedAt: number }
  | { state: 'done'; report: import('../core/report').Report; extraction: { stats: unknown; extractor: string } }
  | { state: 'error'; code: 'no_key' | 'no_permission' | 'extract_failed' | 'llm_failed' | 'unsupported_page'; message: string }

export const tabKey = (tabId: number) => `tab:${tabId}`
