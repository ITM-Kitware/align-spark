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
