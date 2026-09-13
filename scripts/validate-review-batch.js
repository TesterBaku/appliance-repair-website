#!/usr/bin/env node
'use strict';

// Read-only intake checks. Rendering, hub reuse and published-count synchronization
// remain owned by content-integrity.js and build:review-counts.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const SPECIFIC_ITEM = /\b(?:refrigerator|fridge|washer|washing machine|dryer|dishwasher|oven|stove|cooktop|microwave|freezer|garbage disposal|wine cooler|Whirlpool|GE|Samsung|LG|Sub[\s-]?Zero|Wolf|Bosch|Viking|KitchenAid|Maytag|Frigidaire|Kenmore|Thermador|Miele|Dacor)\b/i;
// "A wide range of services" does not name a cooking appliance. For this
// ambiguous word, require possessive/equipment wording or a repair context.
const COOKING_RANGE = /\b(?:(?:my|our|the|gas|electric|dual[\s-]fuel)\s+range(?!\s+of\b)|range\s+(?:repair|repaired|fixed|igniter|burner))\b/i;

function imageSignature(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png';
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'jpeg';
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

function quoteEligibility(review) {
  const body = typeof review.body === 'string' ? review.body.trim() : '';
  const words = body ? body.split(/\s+/u).length : 0;
  let reason = 'Below the quoted-testimonial quality floor';
  let eligible = false;
  if (review.bodyStatus !== 'complete' || !body) reason = 'No complete review body';
  else if (review.rating !== 5) reason = 'Only five-star reviews qualify for quoted testimonials';
  else if (typeof review.reviewPhoto === 'string' && review.reviewPhoto.trim()) {
    eligible = words >= 2;
    reason = eligible ? 'Photo reference and at least two words' : 'Photo reference but fewer than two words';
  } else if (words >= 8) {
    eligible = true;
    reason = 'At least eight words';
  } else if (SPECIFIC_ITEM.test(body) || COOKING_RANGE.test(body)) {
    eligible = true;
    reason = 'Short body names an appliance or brand';
  }
  return { id: review.id, eligible, words, reason };
}

function validateReviewBatch(pool, batch = null, baseDir = process.cwd()) {
  const errors = [];
  const warnings = [];
  const reviews = Array.isArray(pool?.reviews) ? pool.reviews : [];
  if (!Array.isArray(pool?.reviews)) errors.push('Pool must contain a reviews array');
  const byId = new Map();
  for (const review of reviews) {
    if (!review || typeof review.id !== 'string' || !review.id.trim()) {
      errors.push('Every review needs a nonempty string id');
      continue;
    }
    if (byId.has(review.id)) errors.push(`Duplicate review id: ${review.id}`);
    byId.set(review.id, review);
    if (typeof review.source !== 'string' || !Object.hasOwn(pool?._meta?.sources || {}, review.source)) errors.push(`Unknown review source: ${review.id}`);
    if (typeof review.name !== 'string' || !review.name.trim()) errors.push(`Review needs a name: ${review.id}`);
    if (!Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5) errors.push(`Review rating must be an integer from 1 to 5: ${review.id}`);
    if (!['complete', 'photo-only', 'no-body'].includes(review.bodyStatus)) errors.push(`Invalid bodyStatus: ${review.id}`);
    else if (review.bodyStatus === 'complete') {
      if (typeof review.body !== 'string' || !review.body.trim()) errors.push(`Complete review needs body text: ${review.id}`);
    } else if (review.body !== null && review.body !== undefined && (typeof review.body !== 'string' || review.body.trim())) {
      errors.push(`Non-body review contains body text: ${review.id}`);
    }
    if (review.reviewPhoto !== undefined && review.reviewPhoto !== null && (typeof review.reviewPhoto !== 'string' || !review.reviewPhoto.trim())) errors.push(`Invalid reviewPhoto reference: ${review.id}`);
  }

  const counts = Object.create(null);
  const sources = pool?._meta?.sources;
  if (!sources?.google) errors.push('Missing Google source metadata');
  for (const [source, meta] of Object.entries(sources || {})) {
    if (!meta || typeof meta !== 'object') {
      errors.push(`Invalid source metadata: ${source}`);
      continue;
    }
    const captured = reviews.filter(review => review?.source === source).length;
    counts[source] = { captured, recordedCaptured: meta.capturedCount, listing: meta.totalReviewsOnListing };
    for (const field of ['capturedCount', 'totalReviewsOnListing']) {
      if (!Number.isSafeInteger(meta[field]) || meta[field] < 0) errors.push(`${source}.${field} must be a nonnegative integer`);
    }
    if (meta.capturedCount !== captured) errors.push(`${source}.capturedCount is ${meta.capturedCount}; pool contains ${captured}`);
    if (captured > meta.totalReviewsOnListing) warnings.push(`${source}: retained pool exceeds listing total; check whether the platform removed reviews`);
  }
  const google = sources?.google;
  if (google && counts.google) {
    counts.google.published = google.publishedCount;
    if (!Number.isSafeInteger(google.publishedCount) || google.publishedCount < 0) errors.push('google.publishedCount must be a nonnegative integer');
    else if (google.publishedCount > google.totalReviewsOnListing) errors.push('Google published count exceeds the observed listing total');
  }

  const eligibility = [];
  const evidence = [];
  if (batch !== null) {
    if (!batch || typeof batch !== 'object' || Array.isArray(batch)) {
      errors.push('Batch must be an object');
    } else {
      const readIds = (value, field, allowEmpty) => {
        if (!Array.isArray(value) || (!allowEmpty && !value.length) || value.some(id => typeof id !== 'string' || !id.trim())) {
          errors.push(`${field} must be ${allowEmpty ? 'an' : 'a nonempty'} array of review ids`);
          return [];
        }
        if (new Set(value).size !== value.length) errors.push(`${field} contains duplicate ids`);
        for (const id of value) if (!byId.has(id)) errors.push(`${field} references unknown review: ${id}`);
        return value;
      };
      const captured = readIds(batch.capturedReviewIds, 'capturedReviewIds', false);
      const quoted = readIds(batch.quotedReviewIds, 'quotedReviewIds', true);
      const capturedSet = new Set(captured);
      for (const id of quoted) if (!capturedSet.has(id)) errors.push(`Quoted review is outside this batch: ${id}`);
      for (const id of captured) {
        if (!byId.has(id)) continue;
        const result = quoteEligibility(byId.get(id));
        eligibility.push(result);
        if (quoted.includes(id) && !result.eligible) errors.push(`Quoted review is ineligible: ${id} (${result.reason})`);
      }
      if (captured.some(id => byId.get(id)?.source === 'google')) {
        if (!Number.isSafeInteger(batch.observedGoogleTotal) || batch.observedGoogleTotal < 0) errors.push('Google batches require observedGoogleTotal as a nonnegative integer');
        else if (batch.observedGoogleTotal !== google?.totalReviewsOnListing) errors.push('Observed Google total does not match pool listing metadata');
      }
      const covered = new Set();
      if (!Array.isArray(batch.evidence) || !batch.evidence.length) errors.push('Batch requires evidence entries');
      else for (const [index, item] of batch.evidence.entries()) {
        const label = `evidence[${index}]`;
        if (!item || typeof item !== 'object') { errors.push(`${label} must be an object`); continue; }
        const ids = readIds(item.reviewIds, `${label}.reviewIds`, false);
        for (const id of ids) if (!capturedSet.has(id)) errors.push(`${label} references a review outside the batch: ${id}`);
        if (item.reviewedByHuman !== true) errors.push(`${label} requires reviewedByHuman: true after visual transcription review`);
        if (typeof item.file !== 'string' || !item.file.trim() || !/^[a-f0-9]{64}$/i.test(item.sha256 || '')) {
          errors.push(`${label} needs a file path and a SHA-256 hash`);
          continue;
        }
        try {
          const file = path.resolve(baseDir, item.file);
          if (!fs.statSync(file).isFile()) throw new Error('not a regular file');
          const bytes = fs.readFileSync(file);
          const format = imageSignature(bytes);
          if (!format) { errors.push(`${label} is not a recognized PNG, JPEG or WebP image`); continue; }
          const digest = crypto.createHash('sha256').update(bytes).digest('hex');
          if (digest !== item.sha256.toLowerCase()) errors.push(`${label} SHA-256 mismatch`);
          else {
            evidence.push({ file: item.file, sha256: digest, format, reviewIds: ids });
            if (item.reviewedByHuman === true) for (const id of ids) covered.add(id);
          }
        } catch (error) { errors.push(`${label} cannot read evidence: ${error.message}`); }
      }
      for (const id of captured) if (!covered.has(id)) errors.push(`No hash-matched, human-reviewed evidence covers ${id}`);
    }
  }
  return {
    ok: errors.length === 0, mode: batch === null ? 'pool' : 'batch', counts, eligibility, evidence, errors, warnings,
    limitations: 'Image signatures and hashes identify bytes, not valid image contents or their truth; no decoding or OCR is performed. A human must compare names, stars, body text, photo attribution and listing total with the evidence. Eligibility is a mechanical candidate check; it does not publish, verify a photo reference, check hub reuse, or replace the existing site checks.'
  };
}

function main(argv) {
  let dataFile = path.resolve(__dirname, '../data/testimonials.json');
  let batchFile;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--help') {
      console.log('Usage: node scripts/validate-review-batch.js [--data pool.json] [--batch batch.json]\nRead-only JSON report; exit 0 = checks passed, 1 = validation failure.');
      return 0;
    }
    if (!['--data', '--batch'].includes(argv[i]) || !argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error(`Unknown or incomplete option: ${argv[i]}`);
    if (argv[i] === '--data') dataFile = path.resolve(argv[++i]);
    else batchFile = path.resolve(argv[++i]);
  }
  const read = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  const report = validateReviewBatch(read(dataFile), batchFile ? read(batchFile) : null, batchFile ? path.dirname(batchFile) : process.cwd());
  console.log(JSON.stringify(report, null, 2));
  return report.ok ? 0 : 1;
}

if (require.main === module) {
  try { process.exitCode = main(process.argv.slice(2)); }
  catch (error) { console.error(JSON.stringify({ ok: false, errors: [error.message] })); process.exitCode = 1; }
}
module.exports = { quoteEligibility, validateReviewBatch, main };
