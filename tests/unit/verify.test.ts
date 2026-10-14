import { test } from 'node:test'
import assert from 'node:assert/strict'
import { QuoteIndex } from '../../src/core/verify'
import { normalize } from '../../src/core/normalize'

const segs = [
  { id: 'S1', text: 'Welcome to Acme. These Terms govern your use of the service.' },
  {
    id: 'S2',
    text: 'We may modify these Terms at any time, in our sole discretion, without notice to you.',
  },
  {
    id: 'S3',
    text: 'Aboneliğiniz, dönem sonunda iptal etmediğiniz sürece otomatik olarak yenilenir ve ücret İADE EDİLMEZ.',
  },
]
const idx = new QuoteIndex(segs)

test('verbatim quote in the cited segment is verified', () => {
  const r = idx.verify('We may modify these Terms at any time', 'S2')
  assert.ok(r.ok)
  assert.equal(r.ok && r.segmentId, 'S2')
  assert.equal(r.ok && r.segmentCorrected, false)
})

test('typography, case and whitespace differences are tolerated; original span is returned', () => {
  const r = idx.verify('we   MAY modify these terms at any time,  in our sole discretion', 'S2')
  assert.ok(r.ok)
  assert.equal(r.ok && r.original, 'We may modify these Terms at any time, in our sole discretion')
})

test('Turkish dotted/dotless i and upper case are folded', () => {
  const r = idx.verify('ücret iade edilmez', 'S3')
  assert.equal(r.ok, false, 'too short (3 words) must be rejected')
  const r2 = idx.verify('otomatik olarak yenilenir ve ücret iade edilmez', 'S3')
  assert.ok(r2.ok)
  assert.equal(r2.ok && r2.original, 'otomatik olarak yenilenir ve ücret İADE EDİLMEZ')
})

test('a paraphrase is rejected', () => {
  const r = idx.verify('We can change these Terms whenever we want without telling you', 'S2')
  assert.deepEqual(r, { ok: false, reason: 'quote_not_found' })
})

test('a single changed word is rejected', () => {
  const r = idx.verify('We may modify these Terms at any moment', 'S2')
  assert.equal(r.ok, false)
})

test('wrong segment id is corrected when the quote exists elsewhere', () => {
  const r = idx.verify('We may modify these Terms at any time', 'S1')
  assert.ok(r.ok)
  assert.equal(r.ok && r.segmentId, 'S2')
  assert.equal(r.ok && r.segmentCorrected, true)
})

test('unknown segment and missing text -> distinct reason', () => {
  assert.deepEqual(idx.verify('this sentence does not appear anywhere at all', 'S99'), {
    ok: false,
    reason: 'unknown_segment_and_not_found',
  })
})

test('ellipsis joins two in-order verbatim fragments of one segment', () => {
  const r = idx.verify('We may modify these Terms ... without notice to you', 'S2')
  assert.ok(r.ok)
  assert.equal(r.ok && r.original, 'We may modify these Terms at any time, in our sole discretion, without notice to you')
})

test('ellipsis fragments out of order are rejected', () => {
  const r = idx.verify('without notice to you ... We may modify these Terms', 'S2')
  assert.equal(r.ok, false)
})

test('ellipsis cannot be used to glue tiny fragments', () => {
  const r = idx.verify('We may … notice to you and more words', 'S2')
  assert.deepEqual(r, { ok: false, reason: 'ellipsis_fragment_too_short' })
})

test('quotes cannot span two segments', () => {
  const r = idx.verify('use of the service. We may modify these Terms', 'S1')
  assert.equal(r.ok, false)
})

test('normalize strips invisible characters used to split words', () => {
  assert.equal(normalize('mo​dify  the­se'), 'modify these')
})
