/**
 * LLM client abstraction.
 *
 * `OpenAICompatibleClient` speaks the /chat/completions protocol, which covers
 * OpenAI, Gemini (OpenAI endpoint), OpenRouter, Groq, Together, DashScope/Qwen
 * (the provider page-agent's own docs use) and local servers such as Ollama.
 *
 * The client returns the raw text; parsing and validation are done elsewhere so
 * that every provider goes through the same deterministic checks.
 */
import { LLM_JSON_SCHEMA } from './schema'
import type { ChatMessage } from './prompt'

export type StructuredMode = 'json_schema' | 'json_object' | 'none'

export interface LlmConfig {
  baseURL: string
  apiKey: string
  model: string
  structuredMode?: StructuredMode
  /** null = do not send (Gemini 3 recommends its default; 0 can make it loop) */
  temperature?: number | null
  /** OpenAI-style reasoning_effort, e.g. 'low' for thinking models; omitted when undefined */
  reasoningEffort?: 'none' | 'minimal' | 'low' | 'medium' | 'high'
  timeoutMs?: number
  /** retries for 429 / 5xx (default 4) */
  maxRetries?: number
  /** extra headers, e.g. OpenRouter's HTTP-Referer */
  headers?: Record<string, string>
}

export interface LlmResponse {
  text: string
  model: string
  usage?: { prompt_tokens?: number; completion_tokens?: number }
  /** structured mode actually used (may fall back) */
  mode: StructuredMode
}

export interface LlmClient {
  readonly model: string
  complete(messages: ChatMessage[]): Promise<LlmResponse>
}

export class LlmHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
    readonly retryAfterMs?: number,
  ) {
    super(message)
  }
}

function responseFormat(mode: StructuredMode): Record<string, unknown> | undefined {
  if (mode === 'json_schema') {
    return { type: 'json_schema', json_schema: { name: 'tos_risk_findings', strict: true, schema: LLM_JSON_SCHEMA } }
  }
  if (mode === 'json_object') return { type: 'json_object' }
  return undefined
}

export class OpenAICompatibleClient implements LlmClient {
  readonly model: string
  private mode: StructuredMode

  constructor(
    private readonly cfg: LlmConfig,
    private readonly fetchImpl: typeof fetch = (...a) => fetch(...a),
    private readonly sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
  ) {
    if (!cfg.apiKey && !/localhost|127\.0\.0\.1/.test(cfg.baseURL)) {
      throw new Error('API key missing. Set your own key in the extension settings.')
    }
    this.model = cfg.model
    this.mode = cfg.structuredMode ?? 'json_schema'
  }

  /** Rate limits (429) and transient 5xx are retried with backoff; free tiers hit them often. */
  async complete(messages: ChatMessage[]): Promise<LlmResponse> {
    const maxRetries = this.cfg.maxRetries ?? 4
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.completeOnce(messages)
      } catch (e) {
        const retryable = e instanceof LlmHttpError && (e.status === 429 || e.status === 500 || e.status === 502 || e.status === 503)
        if (!retryable || attempt >= maxRetries) throw e
        const wait = e.retryAfterMs ?? Math.min(60_000, 5_000 * 2 ** attempt)
        await this.sleep(wait)
      }
    }
  }

  private async completeOnce(messages: ChatMessage[]): Promise<LlmResponse> {
    try {
      return await this.send(messages, this.mode)
    } catch (e) {
      // Some providers reject json_schema; fall back once, visibly (mode is reported).
      if (e instanceof LlmHttpError && e.status === 400 && this.mode === 'json_schema' && /response_format|json_schema|schema/i.test(e.body)) {
        this.mode = 'json_object'
        return await this.send(messages, this.mode)
      }
      throw e
    }
  }

  private async send(messages: ChatMessage[], mode: StructuredMode): Promise<LlmResponse> {
    const url = `${this.cfg.baseURL.replace(/\/+$/, '')}/chat/completions`
    const msgs =
      mode === 'json_schema'
        ? messages
        : [
            ...messages.slice(0, 1).map((m) => ({
              ...m,
              content: `${m.content}\n\nJSON SCHEMA (your output must validate against it):\n${JSON.stringify(LLM_JSON_SCHEMA)}`,
            })),
            ...messages.slice(1),
          ]
    const body: Record<string, unknown> = {
      model: this.cfg.model,
      messages: msgs,
    }
    if (this.cfg.temperature !== null) body.temperature = this.cfg.temperature ?? 0
    if (this.cfg.reasoningEffort) body.reasoning_effort = this.cfg.reasoningEffort
    const rf = responseFormat(mode)
    if (rf) body.response_format = rf

    const controller = new AbortController()
    const timeoutMs = this.cfg.timeoutMs ?? 180_000
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    let res: Response
    try {
      res = await this.fetchImpl(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(this.cfg.apiKey ? { authorization: `Bearer ${this.cfg.apiKey}` } : {}),
          ...this.cfg.headers,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
    } catch (e) {
      if (controller.signal.aborted) throw new LlmHttpError(`LLM request timed out after ${Math.round(timeoutMs / 1000)} s (HTTP 408)`, 408, '')
      throw new LlmHttpError(`Network error: ${(e as Error).message}`, 0, '')
    } finally {
      clearTimeout(timer)
    }
    const raw = await res.text()
    if (!res.ok) {
      const ra = Number(res.headers.get('retry-after'))
      throw new LlmHttpError(`LLM request failed with HTTP ${res.status}`, res.status, raw.slice(0, 2000), Number.isFinite(ra) && ra > 0 ? ra * 1000 : undefined)
    }
    let json: any
    try {
      json = JSON.parse(raw)
    } catch {
      throw new LlmHttpError('LLM endpoint did not return JSON', res.status, raw.slice(0, 2000))
    }
    const choice = json?.choices?.[0]
    const text: unknown = choice?.message?.content
    if (choice?.message?.refusal) throw new LlmHttpError(`Model refused: ${choice.message.refusal}`, 200, '')
    if (typeof text !== 'string') throw new LlmHttpError('LLM response has no message content', res.status, raw.slice(0, 2000))
    return { text, model: json.model ?? this.cfg.model, usage: json.usage, mode }
  }
}

/** Replays recorded responses; used by eval replay mode and tests. */
export class ScriptedClient implements LlmClient {
  readonly model: string
  private i = 0
  readonly calls: ChatMessage[][] = []
  constructor(
    private readonly responses: string[] | ((messages: ChatMessage[], call: number) => string),
    model = 'scripted',
  ) {
    this.model = model
  }
  async complete(messages: ChatMessage[]): Promise<LlmResponse> {
    this.calls.push(messages)
    const call = this.i++
    const text = typeof this.responses === 'function' ? this.responses(messages, call) : this.responses[call]
    if (text === undefined) throw new Error(`ScriptedClient has no response for call ${call}`)
    return { text, model: this.model, mode: 'json_schema' }
  }
}

/** Google AI Studio keys: classic "AIza..." and the newer "AQ." format. */
export function isGoogleKey(key: string): boolean {
  return key.startsWith('AIza') || key.startsWith('AQ.')
}
