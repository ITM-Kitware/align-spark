"""Record the Spark demo at 4K via Playwright.

Serves static/ on a local port, opens /?demo, waits for the demo script to set
body[data-demo-done="1"], saves the WebM next to this script.
"""

import http.server
import socketserver
import subprocess
import threading
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).parent / "static"
OUT = Path(__file__).parent / "spark-demo-4k.webm"
PORT = 8765
# Render at a smaller logical viewport so content fills more of the frame.
# DPR=3 keeps the captured bitmap at true 4K (3840x2160).
LOGICAL_W, LOGICAL_H = 1280, 600
DPR = 3
W, H = LOGICAL_W * DPR, LOGICAL_H * DPR
# Chromium needs ~0.42s after page load to paint the title overlay; trim it
# so the recording starts with the title visible on the first frame.
TRIM_SECONDS = 0.5


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a, **kw):
        pass


def serve():
    handler = lambda *a, **kw: QuietHandler(*a, directory=str(ROOT), **kw)
    with socketserver.TCPServer(("127.0.0.1", PORT), handler) as srv:
        srv.serve_forever()


def main():
    server_thread = threading.Thread(target=serve, daemon=True)
    server_thread.start()
    time.sleep(0.5)

    video_dir = Path(__file__).parent / "_video"
    video_dir.mkdir(exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                f"--force-device-scale-factor={DPR}",
                f"--window-size={W},{H}",
            ],
        )
        context = browser.new_context(
            viewport={"width": LOGICAL_W, "height": LOGICAL_H},
            device_scale_factor=DPR,
            record_video_dir=str(video_dir),
            record_video_size={"width": W, "height": H},
        )
        page = context.new_page()
        page.on("console", lambda m: print(f"[{m.type}] {m.text}"))
        page.on("pageerror", lambda e: print(f"[pageerror] {e}"))
        page.goto(f"http://127.0.0.1:{PORT}/?demo")
        page.wait_for_function(
            "document.body.dataset.demoDone === '1'", timeout=60_000
        )
        time.sleep(0.5)
        path_in_context = page.video.path()
        context.close()
        browser.close()

    raw = Path(path_in_context)
    # -ss AFTER -i = accurate decode-then-discard seek; the first output frame
    # is the actual decoded frame at TRIM_SECONDS (avoids encoder keyframe
    # artifacts that input-side -ss can produce).
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-loglevel",
            "error",
            "-i",
            str(raw),
            "-ss",
            str(TRIM_SECONDS),
            "-c:v",
            "libvpx",
            "-b:v",
            "2M",
            str(OUT),
        ],
        check=True,
    )
    for stray in video_dir.glob("*.webm"):
        stray.unlink()
    video_dir.rmdir()
    print(f"Saved: {OUT}")


if __name__ == "__main__":
    main()
