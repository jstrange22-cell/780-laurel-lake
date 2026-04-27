import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
// `base` is set when deploying to GitHub Pages project pages
// (e.g. https://user.github.io/780-laurel-lake/). Override via env so a
// future custom domain (CNAME) build works without changing config.
const base = process.env["ASTRO_BASE"] ?? "/";
const site = process.env["ASTRO_SITE"] ?? "https://jstrange22-cell.github.io";

export default defineConfig({
  site,
  base,
  trailingSlash: "ignore",
  prefetch: { prefetchAll: true },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ["photoswipe", "lenis", "gsap", "leaflet"],
    },
  },
  image: {
    service: { entrypoint: "astro/assets/services/sharp" },
  },
  build: { inlineStylesheets: "auto" },
});
