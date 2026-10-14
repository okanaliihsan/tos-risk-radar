/**
 * LLM client for the eval scripts, configured from environment variables:
 *   LLM_API_KEY (required), LLM_BASE_URL, LLM_MODEL, LLM_STRUCTURED
 * A Google key (AIza... or AQ....) without LLM_BASE_URL selects the Gemini endpoint and
 * 3.5 Flash-Lite (largest free-tier quota). Gemini gets the same request
 * options as the extension: provider-default temperature, low reasoning effort.
 */
import { isGoogleKey, OpenAICompatibleClient, type StructuredMode } from '../src/core/llm'

export function evalModelName(): string {
  const key = process.env.LLM_API_KEY ?? ''
  return process.env.LLM_MODEL ?? (isGoogleKey(key) ? 'gemini-3.5-flash-lite' : 'gpt-4.1-mini')
}

export function makeEvalClient(): OpenAICompatibleClient {
  const apiKey = process.env.LLM_API_KEY ?? ''
  if (!apiKey) throw new Error('LLM_API_KEY is not set')
  const baseURL = process.env.LLM_BASE_URL ?? (isGoogleKey(apiKey) ? 'https://generativelanguage.googleapis.com/v1beta/openai' : 'https://api.openai.com/v1')
  const gemini = baseURL.includes('googleapis')
  return new OpenAICompatibleClient({
    baseURL,
    apiKey,
    model: evalModelName(),
    structuredMode: (process.env.LLM_STRUCTURED as StructuredMode) ?? 'json_schema',
    temperature: gemini ? null : 0,
    reasoningEffort: gemini ? 'low' : undefined,
    maxRetries: 6,
  })
}
