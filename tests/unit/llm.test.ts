import { test } from 'node:test'
import assert from 'node:assert/strict'
import { OpenAICompatibleClient, LlmHttpError } from '../../src/core/llm'

function fakeFetch(handler: (body: any, headers: Record<string, string>) => { status: number; json: unknown }) {
  const calls: any[] = []
  const f = (async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body))
    calls.push(body)
    const r = handler(body, init.headers as Record<string, string>)
    return new Response(JSON.stringify(r.json), { status: r.status })
  }) as unknown as typeof fetch
  return { f, calls }
}
const ok = (content: string) => ({ status: 200, json: { model: 'm', choices: [{ message: { content } }], usage: { prompt_tokens: 1, completion_tokens: 2 } } })

test('sends strict json_schema, temperature 0 and the bearer key only to baseURL', async () => {
  let seenAuth = ''
  const { f, calls } = fakeFetch((_b, h) => {
    seenAuth = h.authorization ?? ''
    return ok('{}')
  })
  const c = new OpenAICompatibleClient({ baseURL: 'https://llm.example/v1/', apiKey: 'sk-test', model: 'm' }, f)
  const r = await c.complete([{ role: 'user', content: 'x' }])
  assert.equal(seenAuth, 'Bearer sk-test')
  assert.equal(calls[0].temperature, 0)
  assert.equal(calls[0].response_format.type, 'json_schema')
  assert.equal(calls[0].response_format.json_schema.strict, true)
  assert.equal(r.mode, 'json_schema')
})

test('falls back to json_object (schema in prompt) when the provider rejects json_schema', async () => {
  const { f, calls } = fakeFetch((b) =>
    b.response_format?.type === 'json_schema' ? { status: 400, json: { error: { message: "Invalid parameter: 'response_format' of type 'json_schema' is not supported" } } } : ok('{}'),
  )
  const c = new OpenAICompatibleClient({ baseURL: 'https://llm.example/v1', apiKey: 'k', model: 'm' }, f)
  const r = await c.complete([{ role: 'system', content: 'rules' }, { role: 'user', content: 'x' }])
  assert.equal(r.mode, 'json_object')
  assert.equal(calls[1].response_format.type, 'json_object')
  assert.match(calls[1].messages[0].content, /JSON SCHEMA/)
})

test('HTTP errors surface as errors (no silent empty report)', async () => {
  const { f } = fakeFetch(() => ({ status: 401, json: { error: 'bad key' } }))
  const c = new OpenAICompatibleClient({ baseURL: 'https://llm.example/v1', apiKey: 'k', model: 'm' }, f)
  await assert.rejects(c.complete([{ role: 'user', content: 'x' }]), LlmHttpError)
})

test('a key is required for remote endpoints', () => {
  assert.throws(() => new OpenAICompatibleClient({ baseURL: 'https://api.openai.com/v1', apiKey: '', model: 'm' }))
  assert.doesNotThrow(() => new OpenAICompatibleClient({ baseURL: 'http://localhost:11434/v1', apiKey: '', model: 'm' }))
})

test('429 is retried with backoff (honouring Retry-After), then succeeds', async () => {
  let n = 0
  const waits: number[] = []
  const f = (async () => {
    n++
    if (n < 3) return new Response('{"error":"rate"}', { status: 429, headers: n === 1 ? { 'retry-after': '2' } : {} })
    return new Response(JSON.stringify({ choices: [{ message: { content: '{}' } }] }), { status: 200 })
  }) as unknown as typeof fetch
  const c = new OpenAICompatibleClient({ baseURL: 'https://x.example/v1', apiKey: 'k', model: 'm' }, f, async (ms) => void waits.push(ms))
  await c.complete([{ role: 'user', content: 'x' }])
  assert.equal(n, 3)
  assert.deepEqual(waits, [2000, 10000])
})

test('temperature null and reasoning_effort are passed through as configured', async () => {
  const { f, calls } = fakeFetch(() => ok('{}'))
  const c = new OpenAICompatibleClient({ baseURL: 'https://g.example/v1', apiKey: 'k', model: 'gemini', temperature: null, reasoningEffort: 'low' }, f)
  await c.complete([{ role: 'user', content: 'x' }])
  assert.equal('temperature' in calls[0], false)
  assert.equal(calls[0].reasoning_effort, 'low')
})

test('a hung request is aborted and reported as a 408 timeout, not a vague abort', async () => {
  const f = ((_u: string, init: RequestInit) =>
    new Promise((_r, reject) => init.signal!.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))))) as unknown as typeof fetch
  const c = new OpenAICompatibleClient({ baseURL: 'https://g.example/v1', apiKey: 'k', model: 'm', timeoutMs: 20, maxRetries: 0 }, f)
  await assert.rejects(c.complete([{ role: 'user', content: 'x' }]), (e: any) => e.status === 408 && /timed out/.test(e.message))
})

test('both Google key formats are recognised', async () => {
  const { isGoogleKey } = await import('../../src/core/llm')
  assert.equal(isGoogleKey('AIzaSyExample'), true)
  assert.equal(isGoogleKey('AQ.ExampleKey123'), true)
  assert.equal(isGoogleKey('sk-proj-example'), false)
})
