import sys, json, os

results = {
    "sttEngine": "Not running",
    "sttModel": "Missing",
    "ttsEngine": "Not running"
}

# Check STT (Vosk)
try:
    import vosk
    results["sttEngine"] = "Ready"
    home = os.path.expanduser("~")
    model_dir = os.path.join(home, "vosk-models", "vosk-model-small-en-us-0.15")
    if os.path.exists(model_dir):
        results["sttModel"] = "Installed"
except ImportError:
    pass

# Check TTS (pyttsx3)
try:
    import pyttsx3
    results["ttsEngine"] = "Ready"
except ImportError:
    pass

print(json.dumps(results))
