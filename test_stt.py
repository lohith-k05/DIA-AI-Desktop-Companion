import requests
import wave
import struct
import math
import tempfile
import sys

# Generate 2 seconds of a 440Hz sine wave as 16kHz 16-bit mono PCM
sample_rate = 16000
duration = 2
num_samples = sample_rate * duration

with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
    wav_path = f.name
    with wave.open(wav_path, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        
        for i in range(num_samples):
            value = int(32767.0 * math.sin(2.0 * math.pi * 440.0 * i / sample_rate))
            data = struct.pack("<h", value)
            wf.writeframesraw(data)

print(f"Generated test WAV: {wav_path}")

try:
    with open(wav_path, "rb") as audio:
        files = {"audio": ("test.wav", audio, "audio/wav")}
        resp = requests.post("http://127.0.0.1:5000/api/stt", files=files)
        print("Status:", resp.status_code)
        print("Response:", resp.text)
except Exception as e:
    print("Error:", e)
