# ALIGN Spark

Static HTML/CSS/JS demo showcasing the ALIGN system — an AI alignment tool that lets users adjust value dimensions and see how those values change an AI decision maker's choice in military medical triage scenarios.

No build step, no bundler, no framework — just ES modules served from `static/`.

## Quick Start

```bash
python3 -m http.server -d static 8000
```

Then open http://localhost:8000

The app requires `static/data/manifest.json` to be present (fetched at runtime).

## Tech Stack

- Vanilla ES modules (no build step)
- [Web Awesome](https://www.webawesome.com/) v3.2.1 for UI components
- CSS custom properties for theming
