'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { quoteEligibility, validateReviewBatch } = require('../scripts/validate-review-batch');

const review = (overrides = {}) => ({
  id: 'google-example', source: 'google', name: 'Example Customer', rating: 5, bodyStatus: 'complete',
  body: 'The technician explained everything clearly and repaired it carefully.',
  reviewPhoto: null, ...overrides
});
const pool = (reviews = [review()]) => ({
  _meta: { sources: { google: { capturedCount: reviews.length, totalReviewsOnListing: reviews.length + 1, publishedCount: reviews.length } } }, reviews
});

test('pool checks distinguish captured, published and listing counts', () => {
  const good = pool();
  assert.equal(validateReviewBatch(good).ok, true);
  good._meta.sources.google.capturedCount++;
  assert.match(validateReviewBatch(good).errors.join('\n'), /pool contains 1/);
  good._meta.sources.google.capturedCount--;
  good._meta.sources.google.publishedCount = 3;
  assert.match(validateReviewBatch(good).errors.join('\n'), /exceeds the observed listing/);
  good._meta.sources.google.publishedCount = 0;
  good._meta.sources.google.totalReviewsOnListing = 0;
  const filtered = validateReviewBatch(good);
  assert.equal(filtered.ok, true, 'Retained historic reviews may exceed a filtered listing');
  assert.equal(filtered.warnings.length, 1);
});

test('duplicate ids and malformed source metadata cannot pass', () => {
  assert.match(validateReviewBatch(pool([review(), review()])).errors.join('\n'), /Duplicate review id/);
  for (const value of [null, 'invalid', {}]) {
    const input = pool(); input._meta.sources.google = value;
    assert.equal(validateReviewBatch(input).ok, false);
  }
  assert.equal(validateReviewBatch({ reviews: [null] }).ok, false);
  for (const source of ['toString', 'constructor', '__proto__']) {
    assert.match(validateReviewBatch(pool([review({ source })])).errors.join('\n'), /Unknown review source/);
  }
  for (const change of [{ name: '' }, { rating: 0 }, { rating: '5' }, { bodyStatus: undefined }, { body: null }, { bodyStatus: 'no-body', body: 'Unclassified text' }]) {
    assert.equal(validateReviewBatch(pool([review(change)])).ok, false, JSON.stringify(change));
  }
});

test('eligibility handles the actual short-review boundaries and profile photos', () => {
  const cases = [
    [{ body: 'Excellent service.', reviewPhoto: 'images/real/reviews/job.webp' }, true],
    [{ body: 'Excellent', reviewPhoto: 'images/real/reviews/job.webp' }, false],
    [{ body: 'Had it fixed in about a hour!' }, false],
    [{ body: 'Had it fixed in about a hour!', profilePhoto: 'profile.jpg' }, false],
    [{ body: 'Good dryer repair.' }, true],
    [{ body: 'Great Samsung service.' }, true],
    [{ body: 'My appliance is fixed.' }, false],
    [{ body: 'Bridge repair was great.' }, false],
    [{ body: 'A wide range of services.', bodyStatus: 'no-body' }, false],
    [{ body: 'A wide range of services.' }, false],
    [{ body: 'The range of services is impressive.' }, false],
    [{ body: 'He fixed our range.' }, true],
    [{ body: 'Excellent gas range repair.' }, true],
    [{ body: 'Good oven repair.', rating: 4 }, false],
    [{ body: 'Good oven repair.', bodyStatus: 'photo-only', reviewPhoto: 'photo.jpg' }, false],
    [{ body: 'One two three four five six seven eight' }, true]
  ];
  for (const [change, expected] of cases) assert.equal(quoteEligibility(review(change)).eligible, expected, JSON.stringify(change));
});

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'review-batch-test-'));
  t.after(() => {
    assert.equal(path.dirname(path.resolve(dir)), path.resolve(os.tmpdir()));
    fs.rmSync(dir, { recursive: true, force: true });
  });
  // Valid 1px image fixture; the validator deliberately does not claim to read it.
  const bytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aJ1kAAAAASUVORK5CYII=', 'base64');
  fs.writeFileSync(path.join(dir, 'evidence.png'), bytes);
  const batch = {
    capturedReviewIds: ['google-example'], quotedReviewIds: ['google-example'], observedGoogleTotal: 2,
    evidence: [{ file: 'evidence.png', sha256: crypto.createHash('sha256').update(bytes).digest('hex'), reviewIds: ['google-example'], reviewedByHuman: true }]
  };
  return { dir, batch };
}

test('batch checks evidence bytes, explicit review and complete ID coverage', t => {
  const { dir, batch } = fixture(t);
  const before = JSON.stringify(batch);
  assert.equal(validateReviewBatch(pool(), batch, dir).ok, true);
  assert.equal(JSON.stringify(batch), before, 'Validation must not mutate input');
  batch.evidence[0].sha256 = '0'.repeat(64);
  assert.match(validateReviewBatch(pool(), batch, dir).errors.join('\n'), /SHA-256 mismatch/);
  batch.evidence[0].sha256 = JSON.parse(before).evidence[0].sha256;
  batch.evidence[0].reviewedByHuman = false;
  assert.match(validateReviewBatch(pool(), batch, dir).errors.join('\n'), /requires reviewedByHuman/);
  batch.evidence[0].reviewedByHuman = true;
  batch.evidence[0].file = 'missing.png';
  assert.match(validateReviewBatch(pool(), batch, dir).errors.join('\n'), /cannot read evidence/);
  fs.writeFileSync(path.join(dir, 'text.json'), '{}');
  batch.evidence[0].file = 'text.json';
  batch.evidence[0].sha256 = crypto.createHash('sha256').update('{}').digest('hex');
  assert.match(validateReviewBatch(pool(), batch, dir).errors.join('\n'), /not a recognized PNG/);
  assert.equal(validateReviewBatch(pool([{ id: 'google-example', source: 'google' }]), JSON.parse(before), dir).ok, false, 'Evidence cannot make an incomplete record valid');
});

test('batch rejects unknown IDs, ineligible quotes and inconsistent listing totals', t => {
  const { dir, batch } = fixture(t);
  assert.match(validateReviewBatch(pool([review({ body: 'Good service.' })]), batch, dir).errors.join('\n'), /Quoted review is ineligible/);
  batch.quotedReviewIds = [];
  assert.equal(validateReviewBatch(pool([review({ body: 'Good service.' })]), batch, dir).ok, true, 'Short reviews can be captured without being quoted');
  batch.observedGoogleTotal = 100;
  assert.match(validateReviewBatch(pool(), batch, dir).errors.join('\n'), /does not match pool/);
  batch.capturedReviewIds.push('missing-review');
  assert.match(validateReviewBatch(pool(), batch, dir).errors.join('\n'), /unknown review/);
});

test('CLI is read-only, handles BOM manifests and returns useful failure exit codes', t => {
  const { dir, batch } = fixture(t);
  const dataFile = path.join(dir, 'pool.json'), batchFile = path.join(dir, 'batch.json');
  fs.writeFileSync(dataFile, JSON.stringify(pool()));
  fs.writeFileSync(batchFile, '\uFEFF' + JSON.stringify(batch));
  const script = path.resolve(__dirname, '../scripts/validate-review-batch.js');
  const args = [script, '--data', dataFile, '--batch', batchFile];
  const run = () => spawnSync(process.execPath, args, { encoding: 'utf8' });
  const before = fs.readFileSync(dataFile, 'utf8');
  const good = run();
  assert.equal(good.status, 0, good.stderr);
  assert.equal(JSON.parse(good.stdout).ok, true);
  assert.equal(fs.readFileSync(dataFile, 'utf8'), before);
  batch.evidence[0].reviewedByHuman = false;
  fs.writeFileSync(batchFile, JSON.stringify(batch));
  assert.equal(run().status, 1);
  assert.equal(spawnSync(process.execPath, [script, '--unknown'], { encoding: 'utf8' }).status, 1);
});
