/**
 * One-off: convert the 3 owner-supplied job photos (Ladera Ranch LG washer,
 * Newport Beach Bosch dishwasher x2) into the site's committed image trio
 * convention (.jpg + .webp at source resolution, plus a 480w.webp), matching
 * the pattern of images/real/business/completed-repair-oven-kitchenaid-double-wall-install-tustin.*
 *
 * Run once, then delete/ignore. Not npm-wired.
 */
const sharp = require('sharp');
const path = require('path');

const outDir = path.resolve(__dirname, '..', '..', 'images', 'real', 'business');

const jobs = [
  {
    src: "C:/Users/Rufat's/Downloads/ladera_ranch_lg_washer_drain_pump_replaced.jpeg",
    base: 'completed-repair-washer-lg-drain-pump-ladera-ranch',
  },
  {
    src: "C:/Users/Rufat's/AppData/Local/Temp/claude/C--Rufat-docs-Projects-Applience-site-appliance-repair-website/2340f88e-7b6b-4b95-82ba-93af7c9af41c/scratchpad/bosch_zip/WhatsApp Image 2026-08-06 at 8.48.47 AM.jpeg",
    base: 'completed-repair-dishwasher-bosch-not-draining-newport-beach',
  },
  {
    src: "C:/Users/Rufat's/AppData/Local/Temp/claude/C--Rufat-docs-Projects-Applience-site-appliance-repair-website/2340f88e-7b6b-4b95-82ba-93af7c9af41c/scratchpad/bosch_zip/WhatsApp Image 2026-08-06 at 8.48.47 AM (1).jpeg",
    base: 'completed-repair-dishwasher-bosch-not-draining-newport-beach-front',
  },
];

async function run() {
  for (const job of jobs) {
    const img = sharp(job.src).rotate(); // auto-orient per EXIF, then strip orientation
    const meta = await img.metadata();
    const width = meta.width;
    const height = meta.height;

    const jpgPath = path.join(outDir, job.base + '.jpg');
    const webpPath = path.join(outDir, job.base + '.webp');
    const webp480Path = path.join(outDir, job.base + '-480w.webp');
    const height480 = Math.round((480 / width) * height);

    await sharp(job.src).rotate().jpeg({ quality: 82, mozjpeg: true, progressive: true }).toFile(jpgPath);
    await sharp(job.src).rotate().webp({ quality: 80 }).toFile(webpPath);
    await sharp(job.src).rotate().resize(480, height480).webp({ quality: 80 }).toFile(webp480Path);

    console.log(job.base, width + 'x' + height, '-> 480w height', height480);
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
