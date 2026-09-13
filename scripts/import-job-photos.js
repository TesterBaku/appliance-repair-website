/**
 * Validate and import owner-supplied job photos using the site's image trio.
 *
 * Usage:
 *   node scripts/import-job-photos.js manifest.json [--write]
 *     [--output images/real/business] [--report .audits/work/report.json]
 */
const fs = require('fs/promises');
const path = require('path');
const { createHash } = require('crypto');
const sharp = require('sharp');

const workspaceRoot = path.resolve(__dirname, '..');
const defaultOutputDir = path.join(workspaceRoot, 'images', 'real', 'business');
const basePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const protectedWorkspaceDirectories = new Set(['.git', '.agents', '.claude', '.codex', 'node_modules']);

function usage() {
  return [
    'Usage: node scripts/import-job-photos.js <manifest.json> [--write]',
    '  [--output <workspace-subdirectory>] [--report <workspace-json-path>]',
    '',
    'Dry run is the default. Every job must include privacyReviewed: true.',
  ].join('\n');
}

function parseArgs(args) {
  const options = { write: false, output: defaultOutputDir, report: null, manifest: null };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--write') {
      options.write = true;
    } else if (arg === '--output' || arg === '--report') {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`${arg} requires a path`);
      options[arg.slice(2)] = value;
      index += 1;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown option: ${arg}`);
    } else if (options.manifest) {
      throw new Error('Exactly one manifest path is allowed');
    } else {
      options.manifest = arg;
    }
  }
  if (!options.help && !options.manifest) throw new Error('A manifest path is required');
  return options;
}

function isProtectedWorkspacePath(relative) {
  return protectedWorkspaceDirectories.has(relative.split(path.sep)[0].toLowerCase());
}

function resolveWorkspaceSubpath(value, label) {
  const resolved = path.resolve(workspaceRoot, value);
  const relative = path.relative(workspaceRoot, resolved);
  if (!relative || relative.startsWith(`..${path.sep}`) || relative === '..' || path.isAbsolute(relative)) {
    throw new Error(`${label} must be inside a workspace subdirectory`);
  }
  if (isProtectedWorkspacePath(relative)) {
    throw new Error(`${label} cannot be inside a protected workspace directory`);
  }
  return resolved;
}

function slashPath(value) {
  return value.split(path.sep).join('/');
}

function workspacePath(value) {
  return slashPath(path.relative(workspaceRoot, value));
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function validateCrop(crop, jobIndex, errors) {
  if (crop === undefined) return null;
  if (!crop || typeof crop !== 'object' || Array.isArray(crop)) {
    errors.push(`jobs[${jobIndex}].crop must be an object`);
    return null;
  }
  const keys = Object.keys(crop).sort();
  const expected = ['height', 'left', 'top', 'width'];
  if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) {
    errors.push(`jobs[${jobIndex}].crop must contain only left, top, width, and height`);
    return null;
  }
  for (const key of expected) {
    const minimum = key === 'width' || key === 'height' ? 1 : 0;
    if (!Number.isInteger(crop[key]) || crop[key] < minimum) {
      errors.push(`jobs[${jobIndex}].crop.${key} must be an integer >= ${minimum}`);
    }
  }
  return { left: crop.left, top: crop.top, width: crop.width, height: crop.height };
}

function orientedDimensions(metadata) {
  const swapsAxes = [5, 6, 7, 8].includes(metadata.orientation);
  return {
    width: swapsAxes ? metadata.height : metadata.width,
    height: swapsAxes ? metadata.width : metadata.height,
  };
}

async function pathExists(value) {
  try {
    await fs.access(value);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function validateDirectoryIfPresent(value, label, errors) {
  try {
    const stat = await fs.stat(value);
    if (!stat.isDirectory()) errors.push(`${label} is not a directory: ${value}`);
  } catch (error) {
    if (error.code !== 'ENOENT') errors.push(`${label} cannot be inspected: ${error.message}`);
  }
}

async function validateRealWorkspacePath(value, label, errors) {
  let ancestor = value;
  while (true) {
    try {
      const [realAncestor, realWorkspace] = await Promise.all([
        fs.realpath(ancestor),
        fs.realpath(workspaceRoot),
      ]);
      const relative = path.relative(realWorkspace, realAncestor);
      if (relative.startsWith(`..${path.sep}`) || relative === '..' || path.isAbsolute(relative)) {
        errors.push(`${label} resolves outside the workspace through a link: ${value}`);
      } else if (isProtectedWorkspacePath(relative)) {
        errors.push(`${label} resolves into a protected workspace directory: ${value}`);
      }
      return;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        errors.push(`${label} cannot be resolved safely: ${error.message}`);
        return;
      }
      const parent = path.dirname(ancestor);
      if (parent === ancestor) {
        errors.push(`${label} has no existing workspace ancestor: ${value}`);
        return;
      }
      ancestor = parent;
    }
  }
}

function outputPaths(outputDir, base) {
  return [
    path.join(outputDir, `${base}.jpg`),
    path.join(outputDir, `${base}.webp`),
    path.join(outputDir, `${base}-480w.webp`),
  ];
}

async function preflight(manifestPath, outputDir, reportPath) {
  const errors = [];
  let manifest;
  try {
    const manifestText = await fs.readFile(manifestPath, 'utf8');
    manifest = JSON.parse(manifestText.replace(/^\uFEFF/, ''));
  } catch (error) {
    throw new Error(`Cannot read manifest: ${error.message}`);
  }
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest) || !Array.isArray(manifest.jobs)) {
    throw new Error('Manifest must be a JSON object with a jobs array');
  }
  if (manifest.jobs.length === 0) errors.push('Manifest jobs must not be empty');

  await Promise.all([
    validateDirectoryIfPresent(outputDir, 'Output path', errors),
    validateDirectoryIfPresent(path.dirname(reportPath), 'Report parent', errors),
    validateRealWorkspacePath(outputDir, 'Output path', errors),
    validateRealWorkspacePath(path.dirname(reportPath), 'Report parent', errors),
  ]);

  const bases = new Map();
  const sourceCrops = new Map();
  const candidates = [];
  for (let index = 0; index < manifest.jobs.length; index += 1) {
    const raw = manifest.jobs[index];
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      errors.push(`jobs[${index}] must be an object`);
      continue;
    }
    if (raw.privacyReviewed !== true) {
      errors.push(`jobs[${index}].privacyReviewed must be explicitly true after human review`);
    }
    if (typeof raw.source !== 'string' || !raw.source.trim()) {
      errors.push(`jobs[${index}].source must be a non-empty path`);
    }
    if (typeof raw.base !== 'string' || !basePattern.test(raw.base)) {
      errors.push(`jobs[${index}].base must use lowercase letters, digits, and single hyphens`);
    }
    const crop = validateCrop(raw.crop, index, errors);
    if (typeof raw.source !== 'string' || !raw.source.trim() || typeof raw.base !== 'string' || !basePattern.test(raw.base)) {
      continue;
    }
    const sourcePath = path.resolve(path.dirname(manifestPath), raw.source);
    if (bases.has(raw.base)) {
      errors.push(`Duplicate base in jobs[${bases.get(raw.base)}] and jobs[${index}]: ${raw.base}`);
    } else {
      bases.set(raw.base, index);
    }
    const sourceCropKey = `${path.normalize(sourcePath).toLowerCase()}\0${JSON.stringify(crop)}`;
    if (sourceCrops.has(sourceCropKey)) {
      errors.push(`Duplicate source/crop in jobs[${sourceCrops.get(sourceCropKey)}] and jobs[${index}]`);
    } else {
      sourceCrops.set(sourceCropKey, index);
    }
    candidates.push({ index, raw, crop, sourcePath, paths: outputPaths(outputDir, raw.base) });
  }

  const inspected = await Promise.all(candidates.map(async (job) => {
    try {
      const stat = await fs.stat(job.sourcePath);
      if (!stat.isFile()) throw new Error('path is not a file');
      const sourceBuffer = await fs.readFile(job.sourcePath);
      const metadata = await sharp(sourceBuffer).metadata();
      if (!metadata.width || !metadata.height) throw new Error('image dimensions are unavailable');
      return {
        job,
        metadata,
        dimensions: orientedDimensions(metadata),
        sourceBuffer,
        sourceSha256: sha256(sourceBuffer),
      };
    } catch (error) {
      errors.push(`jobs[${job.index}].source cannot be decoded: ${error.message}`);
      return null;
    }
  }));

  for (const item of inspected.filter(Boolean)) {
    const { crop } = item.job;
    if (crop && (crop.left + crop.width > item.dimensions.width || crop.top + crop.height > item.dimensions.height)) {
      errors.push(
        `jobs[${item.job.index}].crop exceeds auto-oriented dimensions ` +
        `${item.dimensions.width}x${item.dimensions.height}`,
      );
    }
  }

  const destinations = candidates.flatMap((job) => job.paths);
  const existing = await Promise.all([...destinations, reportPath].map(async (value) => ({
    value,
    exists: await pathExists(value),
  })));
  for (const item of existing) {
    if (item.exists) errors.push(`Refusing to overwrite existing file: ${item.value}`);
  }

  if (errors.length) {
    throw new Error(`Preflight failed:\n- ${errors.join('\n- ')}`);
  }
  return inspected.filter(Boolean);
}

function pipelineFor(job, sourceBuffer) {
  let pipeline = sharp(sourceBuffer).rotate();
  if (job.crop) pipeline = pipeline.extract(job.crop);
  return pipeline;
}

async function inspectOutput(filePath, info) {
  const bytes = await fs.readFile(filePath);
  const metadata = await sharp(bytes).metadata();
  if (metadata.exif) {
    throw new Error(`Encoded output unexpectedly contains EXIF metadata: ${filePath}`);
  }
  return {
    path: workspacePath(filePath),
    format: info.format,
    width: info.width,
    height: info.height,
    bytes: info.size,
    sha256: sha256(bytes),
    hasExif: false,
  };
}

async function reserveOutputFiles(paths) {
  const reserved = [];
  try {
    for (const value of paths) {
      const handle = await fs.open(value, 'wx');
      await handle.close();
      reserved.push(value);
    }
    return reserved;
  } catch (error) {
    await Promise.allSettled(reserved.map((value) => fs.unlink(value)));
    throw error;
  }
}

async function writeJob(item) {
  const { job, sourceBuffer } = item;
  const [jpgPath, webpPath, responsivePath] = job.paths;
  const jpgInfo = await pipelineFor(job, sourceBuffer)
    .jpeg({ quality: 82, mozjpeg: true, progressive: true })
    .toFile(jpgPath);
  const webpInfo = await pipelineFor(job, sourceBuffer)
    .webp({ quality: 80 })
    .toFile(webpPath);
  const responsiveInfo = await pipelineFor(job, sourceBuffer)
    .resize({ width: 480, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(responsivePath);
  return Promise.all([
    inspectOutput(jpgPath, jpgInfo),
    inspectOutput(webpPath, webpInfo),
    inspectOutput(responsivePath, responsiveInfo),
  ]);
}

function defaultReportPath() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(workspaceRoot, '.audits', 'work', 'job-photo-import', `${timestamp}.json`);
}

async function run(args) {
  const options = parseArgs(args);
  if (options.help) return { help: usage() };
  const manifestPath = path.resolve(options.manifest);
  const outputDir = resolveWorkspaceSubpath(options.output, 'Output path');
  const reportPath = options.report
    ? resolveWorkspaceSubpath(options.report, 'Report path')
    : defaultReportPath();
  if (path.extname(reportPath).toLowerCase() !== '.json') {
    throw new Error('Report path must end in .json');
  }

  const inspected = await preflight(manifestPath, outputDir, reportPath);
  const report = {
    schemaVersion: 1,
    mode: options.write ? 'write' : 'dry-run',
    generatedAt: new Date().toISOString(),
    outputDirectory: workspacePath(outputDir),
    jobs: inspected.map(({ job, metadata, dimensions, sourceSha256 }) => {
      const finalWidth = job.crop ? job.crop.width : dimensions.width;
      const finalHeight = job.crop ? job.crop.height : dimensions.height;
      return {
        source: job.raw.source,
        sourceSha256,
        base: job.raw.base,
        privacyReviewed: true,
        crop: job.crop,
        sourceMetadata: {
          format: metadata.format,
          autoOrientedWidth: dimensions.width,
          autoOrientedHeight: dimensions.height,
        },
        plannedOutputs: [
          { path: workspacePath(job.paths[0]), format: 'jpeg', width: finalWidth, height: finalHeight },
          { path: workspacePath(job.paths[1]), format: 'webp', width: finalWidth, height: finalHeight },
          {
            path: workspacePath(job.paths[2]),
            format: 'webp',
            width: Math.min(480, finalWidth),
            height: Math.round(finalHeight * Math.min(1, 480 / finalWidth)),
          },
        ],
        outputs: null,
      };
    }),
  };

  const allOutputPaths = inspected.flatMap(({ job }) => job.paths);
  let reserved = [];
  let reportHandle = null;
  try {
    if (options.write) {
      await fs.mkdir(outputDir, { recursive: true });
      reserved = await reserveOutputFiles(allOutputPaths);
      for (let index = 0; index < inspected.length; index += 1) {
        report.jobs[index].outputs = await writeJob(inspected[index]);
      }
    }
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    reportHandle = await fs.open(reportPath, 'wx');
    await reportHandle.writeFile(`${JSON.stringify(report, null, 2)}\n`);
    await reportHandle.close();
    reportHandle = null;
  } catch (error) {
    if (reportHandle) {
      await reportHandle.close().catch(() => {});
      await fs.unlink(reportPath).catch(() => {});
    }
    if (options.write) await Promise.allSettled(reserved.map((value) => fs.unlink(value)));
    throw error;
  }

  return { report: workspacePath(reportPath), data: report };
}

if (require.main === module) {
  run(process.argv.slice(2)).then((result) => {
    if (result.help) {
      console.log(result.help);
    } else {
      console.log(JSON.stringify(result));
    }
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { run };
