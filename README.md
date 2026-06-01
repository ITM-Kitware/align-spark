# ALIGN Spark

Static HTML/CSS/JS demo showcasing the ALIGN system — an AI alignment tool that lets users adjust value dimensions and see how those values change an AI decision maker's choice in military medical triage scenarios.

No build step, no bundler, no framework — just ES modules served from `static/`.

## Quick Start

```bash
python3 -m http.server -d static 8000
```

Then open http://localhost:8000

The app requires `static/data/manifest.json` to be present (fetched at runtime).

## Updating manifest.json

The manifest is built from experiment data and stored as a GitHub release asset. Netlify downloads it at build time via `build.sh`.

1. **Rebuild** from experiment data:
   ```bash
   python build.py <experiments_dir> --config build_config.yaml --output-dir static/data
   ```
2. **Upload** to the GitHub release:
   ```bash
   ./upload-data.sh
   ```

## Tech Stack

- Vanilla ES modules (no build step)
- [Web Awesome](https://www.webawesome.com/) v3.2.1 for UI components
- CSS custom properties for theming

## Recording a demo clip

Append `?demo` to the URL to run an auto-piloted walkthrough: title intro → Implicit Values → Personal Values → Compare (with view-transition morphs between screens). The TOC, top nav, and Back/Next buttons are hidden in this mode. Used for marketing/demo videos.

To capture it as a video:

```bash
pip install playwright
playwright install chromium
python3 record_demo.py
```

Output: `spark-demo-4k.webm` (3840×1800). Convert to MP4 / HD with ffmpeg:

```bash
ffmpeg -i spark-demo-4k.webm -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p spark-demo-4k.mp4
ffmpeg -i spark-demo-4k.webm -vf "scale=1920:900:flags=lanczos" -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p spark-demo-hd.mp4
```

Implementation: `static/demo.js` drives `goToStep` and value changes via a `window.__demo` hook (gated on `?demo` in `guide.js`); `static/demo.css` hides chrome and applies the flat background. The recording script trims the first 0.5s so the title is on frame 0.
