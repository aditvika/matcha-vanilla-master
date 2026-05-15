## Splash Screen — Matcha Vanilla Production

Build a single full-screen splash route matching the reference image: dark charcoal-blue background with soft green/warm light bloom, centered MV monogram, title, and "Powered by Gemini AI" attribution.

### Scope
- Replace `src/routes/index.tsx` placeholder with the splash screen.
- Update `src/styles.css` with new design tokens (charcoal-blue bg, soft white, Gemini gradient).
- Add subtle entrance animation (fade + slight scale) using CSS keyframes.

### Visual spec
- **Background**: deep charcoal-blue (`oklch(0.22 0.02 240)`), with two large soft radial gradients — warm cream glow top-right, muted green glow bottom-left — to mimic the silk-like light bloom.
- **MV monogram**: rendered as bold SVG (chunky geometric M+V joined), white with soft drop-shadow glow. ~160px.
- **Title**: "Matcha Vanilla Production" — Inter/system sans, soft white (`oklch(0.95 0.01 90)`), centered, two lines, ~3rem, medium weight, tight tracking.
- **Attribution** (bottom ~15% from bottom): "Powered by" in small soft white, then "Gemini AI" wordmark with Google gradient (blue → purple → pink → orange → yellow) via `background-clip: text`. Small heart-sparkle icon between them.
- **Corner sparkle**: 4-point sparkle SVG bottom-right, subtle white.
- All text/logo elements get a faint glow via `text-shadow` / `filter: drop-shadow`.

### Files
- `src/routes/index.tsx` — splash component (full layout, inline SVGs for MV monogram + sparkle).
- `src/styles.css` — add `--splash-bg`, gradient tokens, Gemini gradient utility, fade-in keyframes.

### Technical notes
- Pure presentation, no state, no routing changes.
- SEO head: title "Matcha Vanilla Production", description matching brand.
- Mobile-first; works at portrait phone aspect (matches reference) and scales up.
