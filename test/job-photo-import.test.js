const assert = require('node:assert/strict');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { after, before, test } = require('node:test');
const sharp = require('sharp');

// Windows can otherwise keep recently inspected output files open past the test callback.
sharp.cache(false);

const workspaceRoot = path.resolve(__dirname, '..');
const scriptPath = path.join(workspaceRoot, 'scripts', 'import-job-photos.js');
const scratchRoot = path.join(
  workspaceRoot,
  '.audits',
  'work',
  '2026-09-07-monogram-and-helpers',
  `job-photo-import-test-${process.pid}`,
);

function run(manifest, output, report, extra = []) {
  return spawnSync(process.execPath, [
    scriptPath,
    manifest,
    '--output', output,
    '--report', report,
    ...extra,
  ], { cwd: workspaceRoot, encoding: 'utf8' });
}

async function writeManifest(name, value, options = {}) {
  const manifestPath = path.join(scratchRoot, name);
  const json = JSON.stringify(value);
  await fsp.writeFile(manifestPath, options.bom ? `\uFEFF${json}` : json);
  return manifestPath;
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

before(async () => {
  await fsp.mkdir(scratchRoot, { recursive: true });
});

after(async () => {
  await fsp.rm(scratchRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

test('invalid jobs fail preflight without partial image writes', async () => {
  const source = path.join(scratchRoot, 'valid.png');
  await sharp({ create: { width: 20, height: 10, channels: 3, background: '#cc3300' } }).png().toFile(source);
  const output = path.join(scratchRoot, 'preflight-output');
  const report = path.join(scratchRoot, 'preflight-report.json');
  const manifest = await writeManifest('invalid.json', {
    jobs: [
      { source, base: 'valid-photo', privacyReviewed: true },
      { source: path.join(scratchRoot, 'missing.jpg'), base: 'missing-photo', privacyReviewed: true },
      { source, base: '../unsafe', privacyReviewed: true },
      { source, base: 'not-reviewed' },
    ],
  });

  const result = run(manifest, output, report, ['--write']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Preflight failed/);
  assert.match(result.stderr, /cannot be decoded/);
  assert.match(result.stderr, /privacyReviewed/);
  assert.equal(fs.existsSync(path.join(output, 'valid-photo.jpg')), false);
  assert.equal(fs.existsSync(report), false);

  const protectedResult = run(manifest, path.join(workspaceRoot, '.git', 'photo-output'), report);
  assert.equal(protectedResult.status, 1);
  assert.match(protectedResult.stderr, /protected workspace directory/);
});

test('successful dry run writes evidence but creates no image directory', async () => {
  const source = path.join(scratchRoot, 'dry-run.png');
  await sharp({ create: { width: 31, height: 17, channels: 3, background: '#8844aa' } }).png().toFile(source);
  const output = path.join(scratchRoot, 'dry-run-output');
  const report = path.join(scratchRoot, 'dry-run-report.json');
  const manifest = await writeManifest('dry-run.json', {
    jobs: [{ source, base: 'dry-run-photo', privacyReviewed: true }],
  }, { bom: true });

  const result = run(manifest, output, report);
  assert.equal(result.status, 0, result.stderr);
  const evidence = JSON.parse(await fsp.readFile(report, 'utf8'));
  assert.equal(evidence.mode, 'dry-run');
  assert.equal(evidence.jobs[0].outputs, null);
  assert.deepEqual(
    evidence.jobs[0].plannedOutputs.map(({ width, height }) => ({ width, height })),
    [{ width: 31, height: 17 }, { width: 31, height: 17 }, { width: 31, height: 17 }],
  );
  assert.equal(evidence.jobs[0].sourceSha256, sha256(await fsp.readFile(source)));
  assert.equal(fs.existsSync(output), false);
});

test('duplicate work and existing destinations are rejected before writes', async () => {
  const source = path.join(scratchRoot, 'duplicate.png');
  await sharp({ create: { width: 24, height: 16, channels: 3, background: '#3366cc' } }).png().toFile(source);
  const duplicateOutput = path.join(scratchRoot, 'duplicate-output');
  const duplicateReport = path.join(scratchRoot, 'duplicate-report.json');
  const duplicateManifest = await writeManifest('duplicate.json', {
    jobs: [
      { source, base: 'same-base', privacyReviewed: true },
      { source, base: 'same-base', privacyReviewed: true },
    ],
  });

  const duplicate = run(duplicateManifest, duplicateOutput, duplicateReport, ['--write']);
  assert.equal(duplicate.status, 1);
  assert.match(duplicate.stderr, /Duplicate base/);
  assert.match(duplicate.stderr, /Duplicate source\/crop/);
  assert.equal(fs.existsSync(duplicateOutput), false);

  const existingOutput = path.join(scratchRoot, 'existing-output');
  await fsp.mkdir(existingOutput);
  const existingJpg = path.join(existingOutput, 'existing-photo.jpg');
  await fsp.writeFile(existingJpg, 'keep me');
  const overwriteManifest = await writeManifest('overwrite.json', {
    jobs: [{ source, base: 'existing-photo', privacyReviewed: true }],
  });
  const overwrite = run(
    overwriteManifest,
    existingOutput,
    path.join(scratchRoot, 'overwrite-report.json'),
    ['--write'],
  );
  assert.equal(overwrite.status, 1);
  assert.match(overwrite.stderr, /Refusing to overwrite existing file/);
  assert.equal(await fsp.readFile(existingJpg, 'utf8'), 'keep me');
  assert.equal(fs.existsSync(path.join(existingOutput, 'existing-photo.webp')), false);

  const existingReport = path.join(scratchRoot, 'existing-report.json');
  await fsp.writeFile(existingReport, 'keep report');
  const reportGuardManifest = await writeManifest('report-guard.json', {
    jobs: [{ source, base: 'report-guard-photo', privacyReviewed: true }],
  });
  const reportGuard = run(reportGuardManifest, existingOutput, existingReport, ['--write']);
  assert.equal(reportGuard.status, 1);
  assert.match(reportGuard.stderr, /Refusing to overwrite existing file/);
  assert.equal(await fsp.readFile(existingReport, 'utf8'), 'keep report');
  assert.equal(fs.existsSync(path.join(existingOutput, 'report-guard-photo.jpg')), false);
});

test('auto-orientation precedes crop and reports actual metadata without enlargement', async () => {
  const source = path.join(scratchRoot, 'oriented.jpg');
  await sharp({ create: { width: 40, height: 20, channels: 3, background: '#33aa66' } })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toFile(source);
  const output = path.join(scratchRoot, 'oriented-output');
  const report = path.join(scratchRoot, 'oriented-report.json');
  const manifest = await writeManifest('oriented.json', {
    jobs: [{
      source,
      base: 'oriented-cropped-photo',
      privacyReviewed: true,
      crop: { left: 2, top: 25, width: 10, height: 12 },
    }],
  });

  const result = run(manifest, output, report, ['--write']);
  assert.equal(result.status, 0, result.stderr);
  const evidence = JSON.parse(await fsp.readFile(report, 'utf8'));
  assert.equal(evidence.mode, 'write');
  assert.deepEqual(
    evidence.jobs[0].outputs.map(({ format, width, height, hasExif }) => ({ format, width, height, hasExif })),
    [
      { format: 'jpeg', width: 10, height: 12, hasExif: false },
      { format: 'webp', width: 10, height: 12, hasExif: false },
      { format: 'webp', width: 10, height: 12, hasExif: false },
    ],
  );
  for (const outputEvidence of evidence.jobs[0].outputs) {
    const outputPath = path.join(workspaceRoot, outputEvidence.path);
    assert.equal(outputEvidence.sha256, sha256(await fsp.readFile(outputPath)));
  }
  for (const filename of [
    'oriented-cropped-photo.jpg',
    'oriented-cropped-photo.webp',
    'oriented-cropped-photo-480w.webp',
  ]) {
    const metadata = await sharp(path.join(output, filename)).metadata();
    assert.equal(metadata.width, 10);
    assert.equal(metadata.height, 12);
    assert.equal(metadata.exif, undefined);
    assert.equal(metadata.orientation, undefined);
  }
});
