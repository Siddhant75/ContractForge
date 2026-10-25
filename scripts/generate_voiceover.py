import os
import sys
import json
from pathlib import Path

# Ensure espeak-ng DLL is found on Windows if installed
espeak_win_path = r"C:\Program Files\eSpeak NG\libespeak-ng.dll"
if os.path.exists(espeak_win_path):
    os.environ["PHONEMIZER_ESPEAK_LIBRARY"] = espeak_win_path

import numpy as np
import soundfile as sf
import torch
from kokoro import KPipeline

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = Path(__file__).resolve().parents[1]
AUDIO_DIR = PROJECT_ROOT / "recordings" / "audio_segments"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

# 6 Segments perfectly matched to the 5 Acts of the Developer Flow
SEGMENTS = [
    {
        "id": "act1_agony",
        "title": "Act 1: The Agony & Real-World Pain Point",
        "text": (
            "If you've ever built autonomous AI agents with OpenAI Structured Outputs or Claude Tools, "
            "you know this pain: one missing required field, an unhandled optional property, or an omitted "
            "additionalProperties: false, and your agent loop crashes with an API 400 error. "
            "Meanwhile, converting real-world API responses or messy cURL commands into bulletproof schemas "
            "takes hours of boilerplate typing."
        ),
        "voice": "am_adam",
        "speed": 1.05
    },
    {
        "id": "act1_ingestion",
        "title": "Act 1: Real-World Ingestion",
        "text": (
            "Enter ContractForge: the universal API and Agent Schema Studio. "
            "With zero configuration, ContractForge ingests raw JSON or messy multi-line cURLs "
            "straight from Chrome DevTools or your terminal. "
            "Notice how our lexer tokenizes shell arguments, strips authentication headers, and "
            "normalizes line continuations in under fifteen milliseconds."
        ),
        "voice": "am_adam",
        "speed": 1.05
    },
    {
        "id": "act2_query_autofix",
        "title": "Act 2: Query-Param Schemas & Resilient Auto-Sanitizer",
        "text": (
            "Even if a GET request has no body, ContractForge automatically extracts URL query parameters "
            "into a typed root schema. "
            "And if you paste corrupted developer JSON with trailing commas and comments, our resilient parser "
            "instantly detects it, auto-sanitizes the syntax, and formats it cleanly with a single click."
        ),
        "voice": "am_adam",
        "speed": 1.05
    },
    {
        "id": "act3_multitarget",
        "title": "Act 3: Deep Schemas & 4 Multi-Target Generators",
        "text": (
            "On the right, ContractForge immediately synthesizes four production-ready contracts: "
            "idiomatic TypeScript interfaces, and runtime Zod schemas with detected regex semantics "
            "for ISO timestamps, UUIDs, and emails. "
            "And most importantly, frontier AI Agent tools. Look at our OpenAI Strict Mode output: "
            "it strictly enforces strict true, stamps additionalProperties false recursively across every object level, "
            "and maps optional fields into nullable unions so OpenAI will never reject your payload."
        ),
        "voice": "am_adam",
        "speed": 1.05
    },
    {
        "id": "act4_chaos_fuzzer",
        "title": "Act 4: The Unique Kernel — In-Browser Chaos Mock Runner",
        "text": (
            "Now for the killer feature: how do you know this contract actually works? "
            "Without running a mock server or writing test code, click Run Chaos Mock. "
            "ContractForge compiles the Zod schema live directly in browser memory. "
            "It synthesizes a valid Happy Path payload returning 200 OK, plus three deterministic chaos mutations: "
            "omitted required keys, corrupt primitives, and boundary violations. "
            "Here, our fuzzer deleted the required ID, and the in-memory runner instantly caught and intercepted it "
            "with a 422 error and exact field diagnostics."
        ),
        "voice": "am_adam",
        "speed": 1.05
    },
    {
        "id": "act5_outro",
        "title": "Act 5: 1-Click Clipboard & Autonomous MCP Wrap",
        "text": (
            "ContractForge is 100% free and open source, running completely client-side with zero backend servers, "
            "zero latency, and zero hosting costs. "
            "And for autonomous AI agents, it exposes a native Model Context Protocol server over stdio. "
            "Check out our repository on GitHub to try it live or run our test suite. Thank you!"
        ),
        "voice": "am_adam",
        "speed": 1.05
    }
]

def generate_voiceovers():
    print("🎙️ Initializing Kokoro TTS Pipeline (American English)...")
    pipeline = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M")
    sample_rate = 24000
    timings = {}

    for seg in SEGMENTS:
        seg_id = seg["id"]
        text = seg["text"]
        voice = seg["voice"]
        speed = seg.get("speed", 1.0)
        out_path = AUDIO_DIR / f"{seg_id}.wav"

        print(f"🔊 Synthesizing [{seg_id}] with voice '{voice}' at speed {speed}...")
        generator = pipeline(text, voice=voice, speed=speed)
        
        audio_chunks = []
        for _, _, audio in generator:
            audio_chunks.append(audio)

        full_audio = np.concatenate(audio_chunks)
        sf.write(str(out_path), full_audio, sample_rate)

        duration_sec = len(full_audio) / sample_rate
        timings[seg_id] = {
            "title": seg["title"],
            "duration_sec": round(duration_sec, 2),
            "file": str(out_path.name)
        }
        print(f"  -> Generated {out_path.name} ({round(duration_sec, 2)}s)")

    # Save timings manifest
    manifest_path = AUDIO_DIR / "voiceover_manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(timings, f, indent=2)

    print(f"\n✅ All voiceovers generated successfully! Manifest saved to: {manifest_path}")

    # Build master audio file with natural pauses
    build_master_audio(timings, sample_rate)

def build_master_audio(timings, sample_rate):
    print("\n🎛️ Combining audio segments into master narration track...")
    combined_audio = []
    pause_between_acts = np.zeros(int(sample_rate * 0.8), dtype=np.float32) # 0.8s pause between segments

    for idx, seg in enumerate(SEGMENTS):
        seg_id = seg["id"]
        seg_file = AUDIO_DIR / f"{seg_id}.wav"
        data, sr = sf.read(str(seg_file))
        if len(combined_audio) > 0:
            combined_audio.append(pause_between_acts)
        combined_audio.append(data)

    master_audio = np.concatenate(combined_audio)
    master_path = PROJECT_ROOT / "recordings" / "voiceover_master.wav"
    sf.write(str(master_path), master_audio, sample_rate)
    
    total_dur = len(master_audio) / sample_rate
    print(f"🎬 Master voiceover track saved to: {master_path}")
    print(f"⏱️ Total Voiceover Duration: {round(total_dur, 2)}s ({round(total_dur / 60, 2)} minutes)")

if __name__ == "__main__":
    generate_voiceovers()
