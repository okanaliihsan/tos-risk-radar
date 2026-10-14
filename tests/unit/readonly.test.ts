/**
 * Capability minimisation, enforced statically:
 *  - page-agent is only used to READ the page (updateTree / cleanUpHighlights);
 *  - no innerHTML / eval in our code, so page or model text cannot become markup or code.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const SRC = path.resolve(import.meta.dirname, '../../src')
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f)
    return statSync(p).isDirectory() ? files(p) : /\.ts$/.test(f) ? [p] : []
  })
}
const sources = files(SRC).map((p) => ({ p: path.relative(SRC, p), code: readFileSync(p, 'utf8') }))

test('no page-agent action method is ever called', () => {
  const actions = ['clickElement', 'inputText', 'selectOption', 'scroll', 'scrollHorizontally', 'executeJavascript', 'showMask', 'execute']
  for (const { p, code } of sources) {
    for (const a of actions) {
      assert.doesNotMatch(code, new RegExp(`\\.${a}\\s*\\(`), `${p} calls ${a}()`)
    }
  }
})

test('only the read-only PageController is imported from page-agent, and only in the extractor', () => {
  for (const { p, code } of sources) {
    const imports = [...code.matchAll(/from ['"](@page-agent\/[^'"]+|page-agent)['"]/g)].map((m) => m[1])
    if (p === path.join('extractor', 'extract.ts')) assert.deepEqual(imports, ['@page-agent/page-controller'])
    else assert.deepEqual(imports, [], `${p} imports page-agent`)
  }
})

test('no innerHTML / outerHTML / insertAdjacentHTML / eval / new Function in our code', () => {
  for (const { p, code } of sources) {
    assert.doesNotMatch(code, /\.(innerHTML|outerHTML)\s*=|insertAdjacentHTML|\beval\s*\(|new Function\s*\(/, p)
  }
})
