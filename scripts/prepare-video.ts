/**
 * Compresses 780Laurel Reel.mp4 (~131 MB) into:
 *   public/video/hero-loop.mp4   — H.264, 1080p, no audio, ~10s, ~3 MB
 *   public/video/hero-loop.webm  — VP9, same slice, ~2 MB
 *   public/video/reel.mp4        — H.264, 1080p, full reel, ~25-30 MB
 *   public/video/reel.webm       — VP9, full reel
 *   public/video/reel-poster.jpg — frame grab at 0.5s
 *
 * Uses the ffmpeg-static npm package — no system ffmpeg required.
 */
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ffmpegStatic = require("ffmpeg-static") as string;

const SOURCE = "C:/Users/recon/Downloads/FULL-20260427T205814Z-3-001/780Laurel Reel.mp4";
const OUT = path.resolve("public/video");

interface RunOptions {
  args: string[];
  label: string;
}

const run = ({ args, label }: RunOptions): Promise<void> =>
  new Promise((resolve, reject) => {
    console.log(`▸ ${label}`);
    const p = spawn(ffmpegStatic, args, { stdio: ["ignore", "ignore", "pipe"] });
    let lastLine = "";
    p.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      const m = text.match(/time=(\d+:\d+:\d+\.\d+)/);
      if (m) {
        process.stdout.write(`\r    ${label}: ${m[1]}      `);
        lastLine = m[1] ?? "";
      }
    });
    p.on("error", reject);
    p.on("close", (code) => {
      process.stdout.write("\n");
      if (code === 0) resolve();
      else reject(new Error(`${label} exited with code ${code} (last time: ${lastLine})`));
    });
  });

async function main() {
  const stat = await fs.stat(SOURCE).catch(() => null);
  if (!stat) {
    console.error(`✗ Source video not found: ${SOURCE}`);
    process.exit(1);
  }
  console.log(`Source: ${SOURCE} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
  console.log(`ffmpeg: ${ffmpegStatic}`);
  await fs.mkdir(OUT, { recursive: true });

  const heroMp4 = path.join(OUT, "hero-loop.mp4");
  const heroWebm = path.join(OUT, "hero-loop.webm");
  const reelMp4 = path.join(OUT, "reel.mp4");
  const reelWebm = path.join(OUT, "reel.webm");
  const poster = path.join(OUT, "reel-poster.jpg");

  // Hero loop: 0-12s, 1080p, no audio, optimized for web. Use first 12s — typically
  // the most cinematic intro shot in property reels.
  await run({
    label: "hero-loop.mp4 (H.264 1080p, ~12s, no audio)",
    args: [
      "-y",
      "-ss", "0",
      "-t", "12",
      "-i", SOURCE,
      "-an",
      "-vf", "scale='min(1920,iw)':-2",
      "-c:v", "libx264",
      "-preset", "slow",
      "-crf", "26",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      heroMp4,
    ],
  });

  await run({
    label: "hero-loop.webm (VP9 1080p, ~12s, no audio)",
    args: [
      "-y",
      "-ss", "0",
      "-t", "12",
      "-i", SOURCE,
      "-an",
      "-vf", "scale='min(1920,iw)':-2",
      "-c:v", "libvpx-vp9",
      "-b:v", "0",
      "-crf", "33",
      "-row-mt", "1",
      "-deadline", "good",
      "-cpu-used", "2",
      heroWebm,
    ],
  });

  // Full reel re-encoded at 1080p for web
  await run({
    label: "reel.mp4 (H.264 1080p, full duration)",
    args: [
      "-y",
      "-i", SOURCE,
      "-vf", "scale='min(1920,iw)':-2",
      "-c:v", "libx264",
      "-preset", "slow",
      "-crf", "24",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
      reelMp4,
    ],
  });

  await run({
    label: "reel.webm (VP9 1080p, full duration)",
    args: [
      "-y",
      "-i", SOURCE,
      "-vf", "scale='min(1920,iw)':-2",
      "-c:v", "libvpx-vp9",
      "-b:v", "0",
      "-crf", "32",
      "-row-mt", "1",
      "-deadline", "good",
      "-cpu-used", "2",
      "-c:a", "libopus",
      "-b:a", "96k",
      reelWebm,
    ],
  });

  // Poster: grab a frame ~0.5s in
  await run({
    label: "reel-poster.jpg",
    args: [
      "-y",
      "-ss", "0.5",
      "-i", SOURCE,
      "-vframes", "1",
      "-vf", "scale='min(1920,iw)':-2",
      "-q:v", "3",
      poster,
    ],
  });

  // Print sizes
  const files = [heroMp4, heroWebm, reelMp4, reelWebm, poster];
  console.log("\n✓ Outputs:");
  for (const f of files) {
    try {
      const s = await fs.stat(f);
      console.log(`  ${path.basename(f).padEnd(20)} ${(s.size / 1024 / 1024).toFixed(2)} MB`);
    } catch {
      console.log(`  ${path.basename(f).padEnd(20)} (missing)`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
