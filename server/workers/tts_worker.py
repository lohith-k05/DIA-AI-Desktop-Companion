#!/usr/bin/env python3
"""
Dia TTS Worker - Offline Text-to-Speech using pyttsx3 (Windows SAPI)
Usage: python tts_worker.py <text> <output_wav_path>
Output: writes WAV file to output_wav_path, prints "ok" on success

pyttsx3 uses Windows SAPI5 which is installed by default on all Windows machines.
No internet required. No external API calls.
Voices available: Microsoft Zira (female), Microsoft David (male).
"""

import sys
import json
import os

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: tts_worker.py <text> <output_wav_path>"}))
        sys.exit(1)

    text = sys.argv[1]
    output_path = sys.argv[2]

    if not text.strip():
        print(json.dumps({"error": "Text is empty"}))
        sys.exit(1)

    try:
        import pyttsx3

        engine = pyttsx3.init()

        # Find and use Zira (female) voice, fall back to David
        voices = engine.getProperty('voices')
        selected_voice = None
        for v in voices:
            if 'Zira' in v.name:
                selected_voice = v
                break
        if selected_voice is None:
            for v in voices:
                if 'David' in v.name:
                    selected_voice = v
                    break
        if selected_voice is None and voices:
            selected_voice = voices[0]

        if selected_voice:
            engine.setProperty('voice', selected_voice.id)

        engine.setProperty('rate', 155)    # Words per minute (natural pace)
        engine.setProperty('volume', 1.0)  # Full volume

        # Save to WAV file
        engine.save_to_file(text, output_path)
        engine.runAndWait()

        if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            print("ok")
            sys.exit(0)
        else:
            print(json.dumps({"error": "TTS produced empty output file"}))
            sys.exit(1)

    except ImportError:
        print(json.dumps({"error": "pyttsx3 is not installed. Run: pip install pyttsx3"}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
