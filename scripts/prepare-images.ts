/**
 * Preprocesses 73 source JPGs into responsive AVIF + WebP at 4 widths each,
 * extracts blurhash placeholders, classifies by camera (drone/interior/exterior),
 * and emits src/data/imageManifest.json. Outputs go to public/img/property/.
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { encode } from "blurhash";

const SOURCE_DIR = "C:/Users/recon/Downloads/FULL-20260427T205814Z-3-001/FULL";
const OUT_DIR = path.resolve("public/img/property");
const MANIFEST_PATH = path.resolve("src/data/imageManifest.json");
const WIDTHS = [640, 1280, 1920] as const;
const AVIF_QUALITY = 55;
const WEBP_QUALITY = 78;
// effort 0=fastest 9=slowest. effort 1 is ~5x faster than 4 with negligible quality loss for web.
const AVIF_EFFORT = 1;
const WEBP_EFFORT = 1;

const DRONE_CAMERAS = new Set(["Hasselblad L2D-20c", "Hasselblad", "DJI"]);

type ImageType = "drone" | "interior" | "exterior";

interface ManifestImage {
  id: number;
  slug: string;
  src: string;
  baseSrc: string;
  width: number;
  height: number;
  aspect: number;
  camera: string;
  type: ImageType;
  orientation: "landscape" | "portrait" | "square";
  blurhash: string;
  alt: string;
  /** Pre-built srcset strings for AVIF and WebP for direct injection */
  avifSrcset: string;
  webpSrcset: string;
  /** Recommended `sizes` attribute */
  sizes: string;
}

const widthsForSource = (sourceWidth: number) => WIDTHS.filter((w) => w <= sourceWidth);

const classify = (camera: string, sequenceNumber: number): ImageType => {
  if (DRONE_CAMERAS.has(camera) || /hasselblad|dji|mavic/i.test(camera)) return "drone";
  // Heuristic: in this MLS-style numbered sequence the early/late ranges that aren't drone tend to be exterior ground shots
  if ((sequenceNumber >= 5 && sequenceNumber <= 9) || (sequenceNumber >= 56 && sequenceNumber <= 62))
    return "exterior";
  return "interior";
};

const altFor = (type: ImageType, n: number) => {
  if (type === "drone") return `Aerial view of 780 Laurel Lake Circle, photo ${n}`;
  if (type === "exterior") return `Exterior view of 780 Laurel Lake Circle, photo ${n}`;
  return `Interior of 780 Laurel Lake Circle, photo ${n}`;
};

async function getBlurhash(buffer: Buffer): Promise<string> {
  const { data, info } = await sharp(buffer)
    .raw()
    .ensureAlpha()
    .resize(32, 32, { fit: "inside" })
    .toBuffer({ resolveWithObject: true });
  return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4);
}

async function processOne(file: string, idx: number): Promise<ManifestImage> {
  const fullPath = path.join(SOURCE_DIR, file);
  const buf = await fs.readFile(fullPath);
  const meta = await sharp(buf).metadata();
  const sourceWidth = meta.width ?? 0;
  const sourceHeight = meta.height ?? 0;
  if (!sourceWidth || !sourceHeight) throw new Error(`No dimensions for ${file}`);

  // Sequence number from filename: "780 laurel lake cir-N.jpg"
  const seqMatch = file.match(/-(\d+)\.jpg$/i);
  const seq = seqMatch ? Number.parseInt(seqMatch[1] ?? "0", 10) : idx + 1;
  void meta; // currently unused beyond width/height; kept for future EXIF needs
  const camera = await readCamera(buf);
  const type = classify(camera, seq);
  const orientation: ManifestImage["orientation"] =
    sourceWidth > sourceHeight ? "landscape" : sourceWidth < sourceHeight ? "portrait" : "square";

  const slug = `prop-${String(seq).padStart(3, "0")}`;
  const aspect = sourceWidth / sourceHeight;
  const blurhash = await getBlurhash(buf);

  const widths = widthsForSource(sourceWidth);
  const avifSrcsetParts: string[] = [];
  const webpSrcsetParts: string[] = [];

  await Promise.all(
    widths.map(async (w) => {
      const resized = sharp(buf).rotate().resize({ width: w, withoutEnlargement: true });
      const avifPath = path.join(OUT_DIR, `${slug}-${w}.avif`);
      const webpPath = path.join(OUT_DIR, `${slug}-${w}.webp`);
      await resized
        .clone()
        .avif({ quality: AVIF_QUALITY, effort: AVIF_EFFORT })
        .toFile(avifPath);
      await resized
        .clone()
        .webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT })
        .toFile(webpPath);
      avifSrcsetParts.push(`/img/property/${slug}-${w}.avif ${w}w`);
      webpSrcsetParts.push(`/img/property/${slug}-${w}.webp ${w}w`);
    }),
  );

  const baseWidth = widths[widths.length - 1] ?? WIDTHS[0];
  const baseSrc = `/img/property/${slug}-${baseWidth}.webp`;
  const fallbackSrc = `/img/property/${slug}-1280.webp`;

  return {
    id: seq,
    slug,
    src: fallbackSrc,
    baseSrc,
    width: sourceWidth,
    height: sourceHeight,
    aspect,
    camera,
    type,
    orientation,
    blurhash,
    alt: altFor(type, seq),
    avifSrcset: avifSrcsetParts.sort().join(", "),
    webpSrcset: webpSrcsetParts.sort().join(", "),
    sizes: type === "drone" ? "100vw" : "(min-width: 1024px) 50vw, 100vw",
  };
}

async function readCamera(buf: Buffer): Promise<string> {
  try {
    const meta = await sharp(buf).metadata();
    if (!meta.exif) return "";
    // Light EXIF parse: look for Model tag (0x0110)
    const exif = meta.exif;
    // Easier: use sharp's metadata.exif as Buffer; a small string scan finds "Model" sometimes.
    const text = exif.toString("latin1");
    const knownCameras = ["Hasselblad L2D-20c", "NIKON D850", "ILCE-7RM5", "DJI"];
    for (const cam of knownCameras) if (text.includes(cam)) return cam;
    return "";
  } catch {
    return "";
  }
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const all = (await fs.readdir(SOURCE_DIR)).filter((f) => /\.jpe?g$/i.test(f));
  // Sort numerically by trailing -N
  all.sort((a, b) => {
    const an = Number.parseInt(a.match(/-(\d+)\.jpg$/i)?.[1] ?? "0", 10);
    const bn = Number.parseInt(b.match(/-(\d+)\.jpg$/i)?.[1] ?? "0", 10);
    return an - bn;
  });

  console.log(`Processing ${all.length} images → ${OUT_DIR}`);
  const start = Date.now();

  const out: ManifestImage[] = [];
  // Sequential to avoid memory spikes (sharp + AVIF is heavy)
  let done = 0;
  for (const file of all) {
    try {
      const img = await processOne(file, done);
      out.push(img);
      done += 1;
      if (done % 5 === 0 || done === all.length) {
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`  ${done}/${all.length} (${elapsed}s)`);
      }
    } catch (err) {
      console.error(`  ✗ ${file}`, err);
    }
  }

  // Sort by sequence
  out.sort((a, b) => a.id - b.id);

  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceDir: SOURCE_DIR,
    count: out.length,
    images: out,
    byType: {
      drone: out.filter((i) => i.type === "drone").map((i) => i.id),
      exterior: out.filter((i) => i.type === "exterior").map((i) => i.id),
      interior: out.filter((i) => i.type === "interior").map((i) => i.id),
    },
    hero: out.find((i) => i.type === "drone")?.id ?? out[0]?.id ?? 1,
  };

  await fs.mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf-8");

  const totalSec = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n✓ Done in ${totalSec}s`);
  console.log(`  drone:    ${manifest.byType.drone.length}`);
  console.log(`  exterior: ${manifest.byType.exterior.length}`);
  console.log(`  interior: ${manifest.byType.interior.length}`);
  console.log(`  Manifest: ${MANIFEST_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
