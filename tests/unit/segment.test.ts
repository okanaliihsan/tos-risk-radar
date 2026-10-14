import { test } from 'node:test'
import assert from 'node:assert/strict'
import { segmentText } from '../../src/core/segment'

test('inline markup split across lines is re-joined into one sentence', () => {
  // page-agent emits one line per text node: "<p>We <b>may</b> change...</p>"
  const segs = segmentText('1. Changes\nWe\nmay\nchange these Terms at any time.\n2. Fees')
  assert.deepEqual(
    segs.map((s) => s.text),
    ['1. Changes', 'We may change these Terms at any time.', '2. Fees'],
  )
})

test('long paragraphs are split into sentences, abbreviations respected', () => {
  const p =
    'We collect data, e.g. your e-mail address and device identifiers, when you use the Service and interact with our partners in the U.S. and elsewhere. ' +
    'We may share this data with advertisers. You can object at any time by writing to us; we will answer within thirty days of receipt of your request. ' +
    'Bu veriler süresiz olarak saklanabilir.'
  const segs = segmentText(p)
  assert.equal(segs.length, 4)
  assert.ok(segs[0]!.text.includes('e.g. your e-mail'))
  assert.equal(segs[1]!.text, 'We may share this data with advertisers.')
})

test('ids are sequential and segments are bounded in size', () => {
  const segs = segmentText('word '.repeat(2000))
  assert.ok(segs.every((s, i) => s.id === `S${i + 1}` && s.text.length <= 900))
})
