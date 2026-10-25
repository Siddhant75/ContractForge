import os
import sys
import subprocess
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = Path(__file__).resolve().parents[1]
RECORDINGS_DIR = PROJECT_ROOT / "recordings"

VIDEO_INPUT = RECORDINGS_DIR / "demo-video-presentation.webm"
AUDIO_INPUT = RECORDINGS_DIR / "voiceover_master.wav"

OUTPUT_MP4 = RECORDINGS_DIR / "ContractForge-Demo-Final.mp4"
OUTPUT_WEBM = RECORDINGS_DIR / "ContractForge-Demo-Final.webm"

def merge():
    print("🎬 Merging Presentation Video and Kokoro AI Voiceover...")

    if not VIDEO_INPUT.exists():
        raise FileNotFoundError(f"Missing video input: {VIDEO_INPUT}")
    if not AUDIO_INPUT.exists():
        raise FileNotFoundError(f"Missing audio input: {AUDIO_INPUT}")

    # Generate MP4 (Universal H.264 + AAC, Devpost & YouTube standard)
    print(f"\n📦 Rendering Master MP4: {OUTPUT_MP4.name}...")
    cmd_mp4 = [
        "ffmpeg", "-y",
        "-i", str(VIDEO_INPUT),
        "-i", str(AUDIO_INPUT),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "fast",
        "-crf", "20",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        str(OUTPUT_MP4)
    ]
    subprocess.run(cmd_mp4, check=True)
    print(f"✅ Generated: {OUTPUT_MP4} ({round(OUTPUT_MP4.stat().st_size / 1024 / 1024, 2)} MB)")

    # Generate WebM (Web-optimized VP9 + Opus)
    print(f"\n📦 Rendering Master WebM: {OUTPUT_WEBM.name}...")
    cmd_webm = [
        "ffmpeg", "-y",
        "-i", str(VIDEO_INPUT),
        "-i", str(AUDIO_INPUT),
        "-c:v", "copy",
        "-c:a", "libopus",
        "-b:a", "128k",
        "-shortest",
        str(OUTPUT_WEBM)
    ]
    subprocess.run(cmd_webm, check=True)
    print(f"✅ Generated: {OUTPUT_WEBM} ({round(OUTPUT_WEBM.stat().st_size / 1024 / 1024, 2)} MB)")

    print("\n🎉 Master demo video formulation complete!")

if __name__ == "__main__":
    merge()
