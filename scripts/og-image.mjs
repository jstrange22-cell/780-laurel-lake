import sharp from "sharp";
import path from "node:path";

const SRC = "C:/Users/recon/Downloads/FULL-20260427T205814Z-3-001/FULL/780 laurel lake cir-1.jpg";
const OUT = path.resolve("public/og-image.jpg");

await sharp(SRC)
  .rotate()
  .resize(1200, 630, { fit: "cover", position: "center" })
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(OUT);

console.log("✓", OUT);
