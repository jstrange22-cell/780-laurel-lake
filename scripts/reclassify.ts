/**
 * Re-classifies imageManifest.json image types based on the known sequence-number
 * groupings from the original photographer (Hasselblad drone vs Nikon/Sony ground).
 *
 *   drone:    1-4, 54-55, 57, 59, 63-73
 *   exterior: 5-9, 56, 58, 60-62
 *   interior: 10-53
 *
 * Also picks a real drone hero image and tweaks `alt` text accordingly.
 */
import fs from "node:fs/promises";
import path from "node:path";

const MANIFEST = path.resolve("src/data/imageManifest.json");

const DRONE = new Set<number>([1, 2, 3, 4, 54, 55, 57, 59, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73]);
const EXTERIOR = new Set<number>([5, 6, 7, 8, 9, 56, 58, 60, 61, 62]);

type ImageType = "drone" | "interior" | "exterior";

function altFor(type: ImageType, n: number): string {
  if (type === "drone") return `Aerial view of 780 Laurel Lake Circle, photo ${n}`;
  if (type === "exterior") return `Exterior of 780 Laurel Lake Circle, photo ${n}`;
  return `Interior of 780 Laurel Lake Circle, photo ${n}`;
}

async function main() {
  const raw = await fs.readFile(MANIFEST, "utf-8");
  const m = JSON.parse(raw) as {
    images: { id: number; type: ImageType; alt: string; sizes: string }[];
    byType: { drone: number[]; exterior: number[]; interior: number[] };
    hero: number;
  };

  for (const img of m.images) {
    const newType: ImageType = DRONE.has(img.id)
      ? "drone"
      : EXTERIOR.has(img.id)
        ? "exterior"
        : "interior";
    img.type = newType;
    img.alt = altFor(newType, img.id);
    img.sizes = newType === "drone" ? "100vw" : "(min-width: 1024px) 50vw, 100vw";
  }

  m.byType = {
    drone: m.images.filter((i) => i.type === "drone").map((i) => i.id),
    exterior: m.images.filter((i) => i.type === "exterior").map((i) => i.id),
    interior: m.images.filter((i) => i.type === "interior").map((i) => i.id),
  };
  // Hero: first drone image (likely the establishing aerial)
  m.hero = m.byType.drone[0] ?? 1;

  await fs.writeFile(MANIFEST, JSON.stringify(m, null, 2), "utf-8");
  console.log(`✓ Reclassified ${m.images.length} images`);
  console.log(`  drone:    ${m.byType.drone.length}  (hero #${m.hero})`);
  console.log(`  exterior: ${m.byType.exterior.length}`);
  console.log(`  interior: ${m.byType.interior.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
