import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeScore } from '../../src/core/score'

test('no findings -> 0 / low', () => {
  const s = computeScore([])
  assert.equal(s.value, 0)
  assert.equal(s.band, 'low')
})

test('score is per category: repeating a clause adds little', () => {
  const one = computeScore([{ category: 'arbitration', severity: 'high' }])
  const many = computeScore(Array.from({ length: 10 }, () => ({ category: 'arbitration' as const, severity: 'high' as const })))
  assert.equal(one.value, 20)
  assert.equal(many.value, 24) // 20 + capped extra 4
})

test('max severity in category wins and the score is capped at 100', () => {
  const s = computeScore([
    { category: 'liability_limitation', severity: 'low' },
    { category: 'liability_limitation', severity: 'high' },
  ])
  assert.equal(s.breakdown[0]!.maxSeverity, 'high')
  const big = computeScore(
    (['arbitration', 'liability_limitation', 'data_sharing', 'cancellation_refund', 'unilateral_change', 'auto_renewal'] as const).map((c) => ({
      category: c,
      severity: 'high' as const,
    })),
  )
  assert.equal(big.value, 100)
  assert.equal(big.band, 'very_high')
})

test('deterministic: same input, same output', () => {
  const f = [
    { category: 'tracking_profiling' as const, severity: 'medium' as const },
    { category: 'auto_renewal' as const, severity: 'medium' as const },
  ]
  assert.deepEqual(computeScore(f), computeScore([...f].reverse()))
})
