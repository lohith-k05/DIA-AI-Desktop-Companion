#!/usr/bin/env python3
"""
Dia STT Worker - Offline Speech-to-Text using Vosk
Usage: python stt_worker.py <audio_wav_path>
Output: JSON to stdout { "text": "...", "words": [...] }

Vosk uses the Kaldi ASR framework compiled as a prebuilt binary.
No internet connection required after the model is downloaded.
No GPU required. Runs in real-time on CPU.
"""

import sys
import json
import os
import wave
import struct

def get_model_path():
    home = os.path.expanduser("~")
    model_dir = os.path.join(home, "vosk-models", "vosk-model-small-en-us-0.15")
    return model_dir

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: stt_worker.py <audio_wav_path>"}))
        sys.exit(1)

    audio_path = sys.argv[1]

    if not os.path.exists(audio_path):
        print(json.dumps({"error": f"Audio file not found: {audio_path}"}))
        sys.exit(1)

    model_path = get_model_path()
    if not os.path.exists(model_path):
        print(json.dumps({
            "error": f"Vosk model not found at: {model_path}. Please ensure the model was downloaded during setup."
        }))
        sys.exit(1)

    try:
        import vosk

        # Silence vosk internal logs for clean JSON stdout
        vosk.SetLogLevel(-1)

        model = vosk.Model(model_path)

        wf = wave.open(audio_path, "rb")
        if wf.getnchannels() != 1 or wf.getsampwidth() != 2:
            # Vosk requires mono 16-bit PCM; Node.js ensures this before calling
            print(json.dumps({"error": "Audio must be mono 16-bit PCM WAV"}))
            sys.exit(1)

        sample_rate = wf.getframerate()
        rec = vosk.KaldiRecognizer(model, sample_rate)
        rec.SetWords(True)

        full_text = ""
        words = []

        while True:
            data = wf.readframes(4000)
            if len(data) == 0:
                break
            if rec.AcceptWaveform(data):
                part = json.loads(rec.Result())
                full_text += part.get("text", "") + " "
                words.extend(part.get("result", []))

        # Final partial result
        final = json.loads(rec.FinalResult())
        full_text += final.get("text", "")
        words.extend(final.get("result", []))

        wf.close()

        result = {
            "text": full_text.strip(),
            "words": words,
        }
        print(json.dumps(result))
        sys.exit(0)

    except ImportError:
        print(json.dumps({"error": "vosk is not installed. Run: pip install vosk"}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
