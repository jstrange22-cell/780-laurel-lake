/**
 * Strongly-typed accessor for the build-time image manifest.
 * Falls back to an empty manifest when `pnpm assets:images` hasn't been run yet,
 * so the dev server can boot without errors.
 */
import rawManifest from "~/data/imageManifest.json";

export type ImageType = "drone" | "interior" | "exterior";
export type Orientation = "landscape" | "portrait" | "square";

export interface ManifestImage {
  id: number;
  slug: string;
  src: string;
  baseSrc: string;
  width: number;
  height: number;
  aspect: number;
  camera: string;
  type: ImageType;
  orientation: Orientation;
  blurhash: string;
  alt: string;
  avifSrcset: string;
  webpSrcset: string;
  sizes: string;
}

export interface Manifest {
  generatedAt: string;
  sourceDir: string;
  count: number;
  images: ManifestImage[];
  byType: { drone: number[]; exterior: number[]; interior: number[] };
  hero: number;
}

const empty: Manifest = {
  generatedAt: "",
  sourceDir: "",
  count: 0,
  images: [],
  byType: { drone: [], exterior: [], interior: [] },
  hero: 1,
};

/** Prefix all `/img/property/...` paths in the manifest with import.meta.env.BASE_URL
 *  so the site works from a GitHub Pages project subpath as well as the root. */
function withBase(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return base ? `${base}${path}` : path;
}

function applyBase(m: Manifest): Manifest {
  const transformSrcset = (s: string) =>
    s
      .split(",")
      .map((part) => {
        const [url, descriptor] = part.trim().split(/\s+/);
        return `${withBase(url ?? "")} ${descriptor ?? ""}`.trim();
      })
      .join(", ");

  return {
    ...m,
    images: m.images.map((img) => ({
      ...img,
      src: withBase(img.src),
      baseSrc: withBase(img.baseSrc),
      avifSrcset: transformSrcset(img.avifSrcset),
      webpSrcset: transformSrcset(img.webpSrcset),
    })),
  };
}

const parsed: Manifest =
  rawManifest && typeof rawManifest === "object" && "images" in rawManifest
    ? (rawManifest as unknown as Manifest)
    : empty;

export const manifest: Manifest = applyBase(parsed);

/** Public helper: prefix any absolute path with import.meta.env.BASE_URL */
export function path(p: string): string {
  return withBase(p);
}

export function imageById(id: number): ManifestImage | undefined {
  return manifest.images.find((i) => i.id === id);
}

export function imagesByIds(ids: number[]): ManifestImage[] {
  return ids
    .map((id) => imageById(id))
    .filter((i): i is ManifestImage => Boolean(i));
}

export function heroImage(): ManifestImage | undefined {
  return imageById(manifest.hero) ?? manifest.images[0];
}

export function imagesOfType(t: ImageType): ManifestImage[] {
  return manifest.images.filter((i) => i.type === t);
}
