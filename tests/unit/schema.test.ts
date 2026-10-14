import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseLlmOutput, LLM_JSON_SCHEMA } from '../../src/core/schema'
import { CATEGORY_IDS } from '../../src/core/taxonomy'

const good = {
  document_type: 'terms_of_service',
  findings: [
    {
      segment_id: 'S2',
      category: 'unilateral_change',
      severity: 'medium',
      quote: 'We may modify these Terms at any time',
      explanation_tr: 'Şirket şartları istediği zaman değiştirebilir.',
      confidence: 0.9,
    },
  ],
  suspicious_instructions: [],
}

test('valid output parses', () => {
  const r = parseLlmOutput(JSON.stringify(good))
  assert.ok(r.ok)
})

test('a single surrounding code fence is tolerated, nothing else', () => {
  assert.ok(parseLlmOutput('```json\n' + JSON.stringify(good) + '\n```').ok)
  const r = parseLlmOutput('Here is the JSON: ' + JSON.stringify(good))
  assert.equal(r.ok, false)
  assert.equal(!r.ok && r.stage, 'json')
})

test('free text is rejected', () => {
  const r = parseLlmOutput('This page looks risky because they can change the terms.')
  assert.equal(r.ok, false)
})

test('unknown category, extra keys, bad confidence and short explanation are rejected', () => {
  const bad = structuredClone(good) as any
  bad.findings[0].category = 'everything_is_fine'
  bad.findings[0].confidence = 1.7
  bad.findings[0].explanation_tr = 'kötü'
  bad.findings[0].risk_score = 0
  bad.overall_score = 0
  const r = parseLlmOutput(JSON.stringify(bad))
  assert.equal(r.ok, false)
  assert.equal(!r.ok && r.stage, 'schema')
  const joined = !r.ok ? r.errors.join('\n') : ''
  assert.match(joined, /category/)
  assert.match(joined, /confidence/)
})

test('model cannot smuggle a score: there is no score field in the contract', () => {
  const props = (LLM_JSON_SCHEMA as any).properties
  assert.deepEqual(Object.keys(props).sort(), ['document_type', 'findings', 'suspicious_instructions'])
})

test('JSON schema sent to the provider mirrors the Zod enums and is strict', () => {
  const finding = (LLM_JSON_SCHEMA as any).properties.findings.items
  assert.deepEqual(finding.properties.category.enum, [...CATEGORY_IDS])
  assert.equal(finding.additionalProperties, false)
  assert.deepEqual(finding.required.sort(), ['category', 'confidence', 'explanation_tr', 'quote', 'segment_id', 'severity'])
  // strict-mode-incompatible keywords are stripped (enforced by Zod instead)
  assert.equal(JSON.stringify(LLM_JSON_SCHEMA).includes('minLength'), false)
})
