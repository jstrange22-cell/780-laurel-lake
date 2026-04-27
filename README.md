# 780 Laurel Lake Circle — Listing Microsite

A cinematic single-property microsite for **780 Laurel Lake Circle, Madisonville, TN 37354**. Built with Astro 5, Tailwind v4, GSAP + Lenis cinematic scroll, PhotoSwipe lightbox, Leaflet (no API key), and an end-to-end image/video build pipeline.

## What's in the box

```
780-laurel-lake/
├── scripts/
│   ├── prepare-images.ts   # 73 source JPGs → AVIF + WebP @ 640/1280/1920 + blurhash
│   ├── prepare-video.ts    # 131 MB reel → 9 MB hero loop (12s) + 35 MB full reel + poster
│   ├── reclassify.ts       # tags drone vs interior vs exterior by photo sequence #
│   └── og-image.mjs        # 1200×630 OG card from the hero aerial
├── src/
│   ├── data/
│   │   ├── property.ts          ← FILL THIS IN before launch
│   │   ├── nearby.ts            # Tellico Lake / Rarity Bay / WindRiver POIs
│   │   └── imageManifest.json   # generated; do not edit
│   ├── components/         # Hero, Story, DroneShowcase, GallerySection, LakeLife, Location, Specs, etc.
│   ├── lib/                # motion.ts (GSAP/Lenis), seo.ts (JSON-LD), manifest.ts
│   ├── layouts/Base.astro
│   ├── pages/index.astro
│   └── pages/404.astro
├── public/
│   ├── img/property/       # generated AVIF+WebP @ 3 widths × 73 photos = 438 files
│   ├── video/              # hero-loop.mp4, reel.mp4, reel-poster.jpg
│   ├── favicon.svg
│   ├── og-image.jpg        # 1200×630
│   ├── robots.txt
│   └── sitemap.xml
└── deploy.py               # optional Hostinger SFTP deploy
```

## Step 1 — Fill in the listing data

Open `src/data/property.ts` and replace every `TODO` with the actual MLS data:

- **Required for full SEO + render**: price, beds, baths, sqft, lot acres, year built, MLS number, full description (paste verbatim from MLS — 250+ words helps SEO)
- **Feature lists**: interior, exterior, appliances, flooring, heating, cooling, parking, fireplace, view, waterfront
- **Financial**: HOA dues, annual property tax, school district
- **Listing agent**: name, brokerage, phone, email, headshot path, license #
- **Form endpoint**: `contactWebhookUrl` (Zapier / Formspree / n8n / your own endpoint). If empty, form submissions log to console (dev mode).

The site renders gracefully if any field is empty — the corresponding section/row hides itself rather than showing zeros or blanks.

If you have a **listing-agent headshot**, drop it at `public/agent/headshot.jpg` and set `agent.photo: "/agent/headshot.jpg"` in the config.

## Step 2 — Run the asset pipelines (one-time, ~3 min total)

```bash
pnpm install
pnpm run assets   # runs prepare-images.ts + prepare-video.ts
```

Outputs:
- `public/img/property/` — 438 files (~93 MB) of AVIF+WebP at 640/1280/1920 widths
- `public/video/hero-loop.mp4` — 9 MB, 12-second hero loop, no audio
- `public/video/reel.mp4` — 35 MB, full reel re-encoded for web
- `src/data/imageManifest.json` — manifest with blurhash, dimensions, type classification

If you replace any source photos, re-run `pnpm run assets`.

## Step 3 — Develop

```bash
pnpm run dev
```

Opens at `http://localhost:4321`. Hot-reload on every save. The dev server respects `--host` so you can test on a real phone over your local network.

## Step 4 — Build & deploy

```bash
pnpm run build       # runs assets + astro build → dist/
pnpm run preview     # serves dist/ locally on http://localhost:4321
```

`dist/` is a fully static site. Deploy options:

### A. Vercel / Netlify / Cloudflare Pages (recommended)

```bash
# Vercel
vercel deploy dist --prod

# Netlify
netlify deploy --dir=dist --prod

# Cloudflare Pages
wrangler pages deploy dist
```

Or just connect the GitHub repo via the Vercel/Netlify/Cloudflare dashboard and it auto-deploys on push.

### B. Hostinger SFTP (matches your other projects)

```bash
python deploy.py
```

Reads SFTP credentials from `.env`:
```
HOSTINGER_HOST=...
HOSTINGER_USER=...
HOSTINGER_PASS=...
HOSTINGER_PATH=/home/.../public_html/laurel-lake
```

## Sections

1. **Hero** — Full-bleed muted hero loop video (AVIF aerial fallback) with address, tagline, and stat chips (price / beds / baths / sqft / acres). Magnetic CTA → "View the Property".
2. **Sticky stats bar** — Pins under the nav after the hero scrolls past. Hidden on hero.
3. **The Story** — Pinned scrollytelling section. Description text reveals line-by-line on the left as a stack of 3 drone aerials cross-fades on the right.
4. **Aerial Showcase** — Horizontal-scrolling gallery of all 19 drone shots (Hasselblad L2D-20c). Drag, scroll, or arrow-key navigation.
5. **Interior Gallery** — Masonry grid of curated interior + exterior photos with PhotoSwipe v5 lightbox. Pinch-zoom, keyboard nav, share, fullscreen. Lazy-loads PhotoSwipe on first visibility.
6. **Watch the Reel** — Custom poster + gold play button; full-tour video plays in place.
7. **Lake Life** — Editorial section celebrating the private 60-acre community lake.
8. **The Setting** — Leaflet map (Stadia Alidade Smooth Dark, no API key required) with property pin and 9 verified POIs (Tellico Lake, marinas, golf, town, airport).
9. **Specs & Features** — Detailed 3-column grid + features chips block.
10. **Listing Agent** — Headshot, contact, and tour CTA. Hidden if `agent.name` is empty.
11. **Schedule a Tour** — React form with honeypot + time-since-render bot deterrent + webhook submission.
12. **Footer** — Navigation, contact, equal-housing, MLS#, disclaimer.

## Performance

After full asset pipeline:
- **Initial JS (gzipped)**: ~52 KB (GSAP + Lenis bootstrap)
- **Deferred islands**: PhotoSwipe (~22 KB gz, on gallery view), Leaflet (~44 KB gz, on map view), React client (~58 KB gz, on first interactive island)
- **Hero LCP target**: ≤ 1.5 s (preloaded AVIF + sub-300 KB)
- **Total page weight**: ~12 MB images progressively loaded; only ~600 KB needed for hero

## Tech stack

- **Astro 5.18** — static-first, ships ~0 JS by default
- **React 19** — for islands (gallery, map, contact form) only
- **Tailwind CSS 4** — utility-first with `@theme` design tokens
- **GSAP 3 + ScrollTrigger** — pinned story, hero parallax, magnetic cursor
- **Lenis 1.3** — smooth scroll, disabled with `prefers-reduced-motion`
- **PhotoSwipe 5** — accessible lightbox
- **Leaflet 1.9** + **Stadia Alidade Smooth Dark** tiles — interactive map, no API key
- **sharp** + **blurhash** — image pipeline
- **ffmpeg-static** — video pipeline (no system ffmpeg required)

## Accessibility

- All images have generated `alt` text (refine room descriptors in the manifest if you want)
- Visible focus rings on all interactive elements
- Keyboard nav in lightbox, gallery rail, contact form, map
- `prefers-reduced-motion` disables GSAP and Lenis; sections fall back to a CSS IntersectionObserver reveal
- 44×44 px minimum touch targets
- Color contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text

## SEO

- `<title>` and `<meta description>` derived from `property.ts`
- Schema.org `RealEstateListing` + `SingleFamilyResidence` + `RealEstateAgent` JSON-LD in `<head>` (auto-generated from `property.ts` via `lib/seo.ts`)
- Open Graph + Twitter Card meta with the 1200×630 OG image
- `geo.region`, `geo.placename`, `geo.position`, `ICBM` meta tags
- `canonical` URL, `sitemap.xml`, `robots.txt`

## Next steps you might want

- Add a Matterport / iGuide URL to `property.virtualTourUrl` to surface the 3D tour CTA in the hero
- Wire `contactWebhookUrl` to your CRM (GoHighLevel, n8n, Zapier)
- Replace the `og-image.jpg` with one that overlays the price + bedroom chip if you want richer social cards
- Drop a custom domain in `astro.config.mjs` `site:` (currently `https://780laurellake.com`)
- Add Google Analytics / Plausible by editing `src/layouts/Base.astro`

## License

Private project for Strange Digital Group. Listing imagery © original photographers.
