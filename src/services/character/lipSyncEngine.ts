/**
 * Real-Time Lip Synchronization Engine
 * Section 30.8 Lip Synchronization Specification
 * Maps audio analysis & TTS phoneme timings to mouth blend shapes and visemes
 */

import { CHARACTER_CONFIG } from "../../config/characterConfig";
import type { LipSyncState, VisemeType } from "../../types/character";

export class LipSyncEngine {
  private isSpeaking: boolean = false;
  private currentViseme: VisemeType = "rest";
  private openRatio: number = 0;
  private puckerRatio: number = 0;
  private smileRatio: number = 0;
  private audioLevel: number = 0;

  private targetOpen: number = 0;
  private targetPucker: number = 0;
  private targetSmile: number = 0;

  private speechTimer: ReturnType<typeof setTimeout> | null = null;
  private visemeCycleTimer: ReturnType<typeof setTimeout> | null = null;
  private lastAudioTimestamp: number = 0;

  // Web Audio analyser reference (optional live audio stream)
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;

  /**
   * Start lip-sync animation for a speech phrase
   * @param durationMs estimated speech duration
   */
  public startSpeaking(durationMs?: number): void {
    this.isSpeaking = true;
    this.lastAudioTimestamp = Date.now();
    this.startVisemeCycle();

    if (durationMs && durationMs > 0) {
      if (this.speechTimer) clearTimeout(this.speechTimer);
      this.speechTimer = setTimeout(() => {
        this.stopSpeaking();
      }, durationMs);
    }
  }

  /**
   * Stop lip-sync animation and smoothly reset mouth to rest
   */
  public stopSpeaking(): void {
    this.isSpeaking = false;
    this.currentViseme = "rest";
    this.targetOpen = 0;
    this.targetPucker = 0;
    this.targetSmile = 0;
    this.audioLevel = 0;

    if (this.speechTimer) {
      clearTimeout(this.speechTimer);
      this.speechTimer = null;
    }
    if (this.visemeCycleTimer) {
      clearTimeout(this.visemeCycleTimer);
      this.visemeCycleTimer = null;
    }
  }

  /**
   * Feed external audio amplitude (e.g. from Web Speech or audio player)
   */
  public feedAudioLevel(level: number): void {
    this.audioLevel = Math.max(0, Math.min(1, level));
    this.lastAudioTimestamp = Date.now();

    if (this.audioLevel > CHARACTER_CONFIG.LIP_SYNC.MIN_AMPLITUDE_THRESHOLD) {
      this.isSpeaking = true;
      this.targetOpen = this.audioLevel * CHARACTER_CONFIG.LIP_SYNC.MAX_MOUTH_OPEN;
    } else {
      // Natural silence pause
      this.targetOpen = 0;
    }
  }

  /**
   * Cycle phonetic visemes during active speech
   */
  private startVisemeCycle(): void {
    if (this.visemeCycleTimer) clearTimeout(this.visemeCycleTimer);

    const visemes: { viseme: VisemeType; open: number; pucker: number; smile: number }[] = [
      { viseme: "aa", open: 0.75, pucker: 0.1, smile: 0.2 },
      { viseme: "ih", open: 0.45, pucker: 0.05, smile: 0.6 },
      { viseme: "ee", open: 0.35, pucker: 0.0, smile: 0.8 },
      { viseme: "oh", open: 0.65, pucker: 0.7, smile: 0.0 },
      { viseme: "ou", open: 0.4, pucker: 0.85, smile: 0.0 },
      { viseme: "mbp", open: 0.05, pucker: 0.2, smile: 0.1 },
      { viseme: "fv", open: 0.2, pucker: 0.3, smile: 0.4 },
    ];

    const cycle = () => {
      if (!this.isSpeaking) {
        this.currentViseme = "rest";
        this.targetOpen = 0;
        this.targetPucker = 0;
        this.targetSmile = 0;
        return;
      }

      // Select random natural viseme
      const chosen = visemes[Math.floor(Math.random() * visemes.length)];
      this.currentViseme = chosen.viseme;
      this.targetOpen = chosen.open * (0.6 + Math.random() * 0.4);
      this.targetPucker = chosen.pucker;
      this.targetSmile = chosen.smile;

      // Phonetic cadence duration: 80ms to 160ms per syllable
      const stepDuration = 85 + Math.random() * 85;
      this.visemeCycleTimer = setTimeout(cycle, stepDuration);
    };

    cycle();
  }

  /**
   * Attach a live audio MediaStream for real-time Web Audio API analysis
   */
  public attachAudioStream(stream: MediaStream): void {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    } catch (err) {
      console.warn("[LipSyncEngine] Failed to attach live audio stream:", err);
    }
  }

  /**
   * Update lip-sync blend shapes on every animation frame
   * @param deltaSeconds delta time in seconds
   */
  public update(deltaSeconds: number): LipSyncState {
    // Read live Web Audio frequency data if stream is attached
    if (this.analyser && this.dataArray) {
      this.analyser.getByteFrequencyData(this.dataArray);
      let sum = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        sum += this.dataArray[i];
      }
      const avg = sum / (this.dataArray.length * 255);
      this.feedAudioLevel(avg);
    }

    // If no recent audio while supposedly speaking, smoothly decay
    if (this.isSpeaking && Date.now() - this.lastAudioTimestamp > CHARACTER_CONFIG.LIP_SYNC.REST_RESET_DELAY_MS) {
      this.targetOpen = 0;
      this.targetPucker = 0;
      this.targetSmile = 0;
      this.currentViseme = "rest";
    }

    // Smooth interpolation (lerp) toward target shapes
    const lerpSpeed = Math.min(1.0, deltaSeconds * 22);
    this.openRatio += (this.targetOpen - this.openRatio) * lerpSpeed;
    this.puckerRatio += (this.targetPucker - this.puckerRatio) * lerpSpeed;
    this.smileRatio += (this.targetSmile - this.smileRatio) * lerpSpeed;

    return {
      viseme: this.currentViseme,
      openRatio: this.openRatio,
      puckerRatio: this.puckerRatio,
      smileRatio: this.smileRatio,
      audioLevel: this.audioLevel,
      isSpeaking: this.isSpeaking,
    };
  }

  public destroy(): void {
    this.stopSpeaking();
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close().catch(() => {});
    }
  }
}
