const API_BASE = "http://127.0.0.1:5000";

export interface OfflineVoiceCallbacks {
  onTranscript?: (text: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (msg: string) => void;
}

class OfflineVoiceService {
  private stream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  
  private leftChannel: Float32Array[] = [];
  private recordingLength = 0;
  private activeAudio: HTMLAudioElement | null = null;

  public isRecording = false;
  public isSynthesizing = false;

    public async checkDiagnostics(): Promise<any> {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/diagnostics");
      if (!response.ok) return { sttEngine: "Error", sttModel: "Error", ttsEngine: "Error" };
      const data = await response.json();
      return data.diagnostics;
    } catch {
      return { sttEngine: "Not running", sttModel: "Missing", ttsEngine: "Not running" };
    }
  }

  async startRecording(): Promise<void> {
    if (this.isRecording) return;
    this.leftChannel = [];
    this.recordingLength = 0;

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.audioCtx = new AudioCtx({ sampleRate: 16000 });
    
    this.source = this.audioCtx.createMediaStreamSource(this.stream);
    
    // Use ScriptProcessor (deprecated but works universally for simple PCM capture)
    this.processor = this.audioCtx.createScriptProcessor(4096, 1, 1);
    
    this.processor.onaudioprocess = (e) => {
      if (!this.isRecording) return;
      const channelData = e.inputBuffer.getChannelData(0);
      this.leftChannel.push(new Float32Array(channelData));
      this.recordingLength += 4096;
    };

    this.source.connect(this.processor);
    this.processor.connect(this.audioCtx.destination);
    
    this.isRecording = true;
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      this.isRecording = false;
      
      if (this.processor && this.source) {
        this.source.disconnect();
        this.processor.disconnect();
      }
      if (this.audioCtx && this.audioCtx.state !== 'closed') {
        this.audioCtx.close();
      }
      if (this.stream) {
        this.stream.getTracks().forEach((t) => t.stop());
      }
      
      const flatBuffer = new Float32Array(this.recordingLength);
      let offset = 0;
      for (let i = 0; i < this.leftChannel.length; i++) {
        flatBuffer.set(this.leftChannel[i], offset);
        offset += this.leftChannel[i].length;
      }
      
      const wavBlob = this.encodePcmToWav(flatBuffer, 16000);
      resolve(wavBlob);
    });
  }

  private encodePcmToWav(samples: Float32Array, sampleRate: number): Blob {
    const numSamples = samples.length;
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, s: string) => {
      for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);          
    view.setUint16(20, 1, true);           
    view.setUint16(22, 1, true);           
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); 
    view.setUint16(32, 2, true);           
    view.setUint16(34, 16, true);          
    writeString(36, "data");
    view.setUint32(40, numSamples * 2, true);

    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }

    return new Blob([buffer], { type: "audio/wav" });
  }

  async transcribe(wavBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append("audio", wavBlob, "recording.wav");

    const response = await fetch(`${API_BASE}/api/stt`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: "Unknown STT error" }));
      throw new Error(err.error || `STT HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) throw new Error(data.error || "STT returned no text");
    return (data.text || "").trim();
  }

  async synthesize(text: string): Promise<string> {
    const response = await fetch(`${API_BASE}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`TTS failed with status ${response.status}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  playAudio(url: string, callbacks?: OfflineVoiceCallbacks) {
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio.src = "";
    }

    this.isSynthesizing = true;
    callbacks?.onStart?.();

    const audio = new Audio(url);
    this.activeAudio = audio;

    audio.onended = () => {
      this.isSynthesizing = false;
      URL.revokeObjectURL(url);
      callbacks?.onEnd?.();
    };

    audio.onerror = () => {
      this.isSynthesizing = false;
      URL.revokeObjectURL(url);
      callbacks?.onError?.("Audio playback failed");
    };

    audio.play().catch((err) => {
      this.isSynthesizing = false;
      URL.revokeObjectURL(url);
      callbacks?.onError?.("Audio play blocked or failed: " + err.message);
    });
  }

  cancel() {
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio.src = "";
      this.isSynthesizing = false;
    }
  }
}

export const offlineVoiceService = new OfflineVoiceService();
