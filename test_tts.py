import urllib.request
import json
import os

tests = [
    ("Short English sentence", "Hello, I am Dia."),
    ("Long paragraph", "Artificial intelligence is a branch of computer science. It involves the creation of intelligent machines that work and react like humans. This includes speech recognition, learning, planning, and problem-solving. Offline TTS handles this gracefully."),
    ("Punctuation", "Wait... what? That's amazing! Right, let's do it."),
    ("Numbers", "The answer is 42, with a probability of 99.9%."),
    ("Empty response", "   "),
]

url = 'http://127.0.0.1:5000/api/tts'

for name, text in tests:
    print(f'Testing {name}...')
    data = json.dumps({"text": text}).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    
    try:
        with urllib.request.urlopen(req) as response:
            result = response.read()
            print(f'  Success! Received {len(result)} bytes of audio.')
    except urllib.error.HTTPError as e:
        print(f'  Error {e.code}: {e.read().decode("utf-8")}')
    except Exception as e:
        print(f'  Failed: {str(e)}')
