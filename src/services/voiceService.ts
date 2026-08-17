/**
 * Voice Service: SpeechSynthesis System & Voice Selection Engine
 * Option 1 & Section 30 Voice Synchronization Architecture
 * Full browser Speech Synthesis integration with female voice auto-preference,
 * real-time voice updates, event hooks, and Chromium reliability safeguards.
 */

export interface SavedVoiceSettings {
  voiceName: string;
  voiceLang: string;
  rate: number;
  pitch: number;
  volume: number;
  enabled: boolean;
}

export interface SpeakOptions {
  voiceName?: string;
  voiceLang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  enabled?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onError?: (err: any) => void;
}

// Known female voice naming patterns across Windows, macOS, Linux, Android, and Chromium
const FEMALE_VOICE_KEYWORDS = [
  "zira",
  "female",
  "jenny",
  "aria",
  "sonia",
  "hazel",
  "google uk english female",
  "google us english female",
  "samantha",
  "victoria",
  "karen",
  "moira",
  "tessa",
  "susan",
  "ava",
  "emma",
  "natasha",
  "neerja",
  "prabhat",
  "elena",
  "sabina",
  "lucia",
  "hortense",
  "julie",
  "hedda",
  "cosimo",
  "microsoft zira desktop",
];

// Human-friendly language formatter
export function formatVoiceLanguage(langCode: string): string {
  if (!langCode) return "Unknown Region";
  try {
    const displayNames = new Intl.DisplayNames(["en"], { type: "language" });
    const parts = langCode.split(/[-_]/);
    const lang = displayNames.of(parts[0]) || parts[0].toUpperCase();
    if (parts.length > 1) {
      const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
      const region = regionNames.of(parts[1].toUpperCase()) || parts[1].toUpperCase();
      return `${lang} (${region})`;
    }
    return lang;
  } catch {
    return langCode;
  }
}

// Format voice item label for dropdown display
export function formatVoiceDisplayLabel(voice: SpeechSynthesisVoice): string {
  const langLabel = formatVoiceLanguage(voice.lang);
  const locationTag = voice.localService ? "" : " (Online)";
  return `${voice.name} — ${langLabel}${locationTag}`;
}

// Check whether a voice matches female heuristics
export function isLikelyFemaleVoice(voice: SpeechSynthesisVoice): boolean {
  if (!voice || !voice.name) return false;
  const lowerName = voice.name.toLowerCase();
  return FEMALE_VOICE_KEYWORDS.some((kw) => lowerName.includes(kw));
}

// Check if any available voice on the system is likely female
export function hasLikelyFemaleVoice(voices: SpeechSynthesisVoice[]): boolean {
  return voices.some(isLikelyFemaleVoice);
}

/**
 * Strips markdown symbols, headers, code fences, and tables
 * to produce natural, fluent speech without syntax reading.
 */
export function cleanTextForSpeech(raw: string): string {
  if (!raw) return "";

  return raw
    // 0. Remove emojis, variation selectors, and ZWJ sequences completely
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\uFE0E\u200D]/gu, "")
    // 1. Remove XML/HTML tags and thought blocks
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<thought>[\s\S]*?<\/thought>/gi, "")
    .replace(/<[^>]+>/g, "")
    // 2. Remove code blocks or replace with concise audio cue
    .replace(/```[a-zA-Z0-9_-]*\n[\s\S]*?```/g, " As illustrated in the code snippet. ")
    .replace(/```[\s\S]*?```/g, " ")
    // 3. Remove inline code backticks
    .replace(/`([^`]+)`/g, "$1")
    // 4. Remove Markdown table syntax: lines starting and ending with |
    .replace(/^\|.*\|$/gm, (match) => {
      // If table divider line like |---|---| omit completely
      if (/^\|[\s\-:|]+\|$/.test(match)) return "";
      const cells = match.split("|").map((c) => c.trim()).filter(Boolean);
      return cells.join(", ");
    })
    // 5. Clean headers (e.g. ### 1. Definition -> Definition)
    .replace(/^#{1,6}\s+(?:\d+\.\s*)?/gm, "")
    // 6. Clean bold / italics / strikethrough symbols
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    // 7. Clean markdown links [label](url) -> label
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // 8. Clean blockquotes (> quote -> quote)
    .replace(/^>\s+/gm, "")
    // 9. Clean bullet points (- item or * item -> item)
    .replace(/^[\*\-]\s+/gm, "")
    // 10. Clean remaining syntax characters like |, #, *
    .replace(/[|#*_~]/g, " ")
    // 11. Normalize whitespace and newlines
    .replace(/\s+/g, " ")
    .trim();
}

class VoiceService {
  private availableVoices: SpeechSynthesisVoice[] = [];
  private listeners: Set<(voices: SpeechSynthesisVoice[]) => void> = new Set();
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private resumeTimer: ReturnType<typeof setInterval> | null = null;
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const refresh = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        this.availableVoices = voices;
        this.notifyListeners();
      }
    };

    // Initial query
    refresh();

    // Chromium asynchronously populates voices via onvoiceschanged
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = refresh;
    }

    // Safety polling retry in case onvoiceschanged fires before listener or fails
    setTimeout(refresh, 100);
    setTimeout(refresh, 500);
    setTimeout(refresh, 1500);

    this.isInitialized = true;
  }

  public isSpeaking(): boolean {
    return this.activeUtterance !== null || (typeof window !== "undefined" && window.speechSynthesis?.speaking === true);
  }

  public isReady(): boolean {
    return this.isInitialized && this.availableVoices.length > 0;
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.availableVoices);
    }
  }

  /**
   * Subscribe to system voice updates (e.g. when voices populate asynchronously)
   */
  public subscribe(listener: (voices: SpeechSynthesisVoice[]) => void): () => void {
    this.listeners.add(listener);
    if (this.availableVoices.length > 0) {
      listener(this.availableVoices);
    }
    return () => this.listeners.delete(listener);
  }

  /**
   * Get currently loaded system voices
   */
  public getVoices(): SpeechSynthesisVoice[] {
    if (this.availableVoices.length === 0 && typeof window !== "undefined" && "speechSynthesis" in window) {
      this.availableVoices = window.speechSynthesis.getVoices();
    }
    return this.availableVoices;
  }

  /**
   * Select the best voice following priority order:
   * 1. Voice explicitly selected by user (matching name and/or lang)
   * 2. Female voice matching preferred terms (Zira, Jenny, Aria, Sonia, Hazel, etc.)
   * 3. Voice matching preferred language (en-IN, en-US, en-GB, en)
   * 4. First available system voice
   */
  public findBestVoice(
    preferredName?: string,
    preferredLang?: string,
    providedVoices?: SpeechSynthesisVoice[]
  ): SpeechSynthesisVoice | null {
    const voices = providedVoices && providedVoices.length > 0 ? providedVoices : this.getVoices();
    if (!voices || voices.length === 0) return null;

    // 1. Explicit user selection by name
    if (preferredName) {
      const exactMatch = voices.find((v) => v.name === preferredName);
      if (exactMatch) return exactMatch;
      const looseMatch = voices.find((v) => v.name.toLowerCase() === preferredName.toLowerCase());
      if (looseMatch) return looseMatch;
    }

    // 2. Likely female voice (preferring English if available)
    const femaleEnglish = voices.find(
      (v) => isLikelyFemaleVoice(v) && v.lang.toLowerCase().startsWith("en")
    );
    if (femaleEnglish) return femaleEnglish;

    const anyFemale = voices.find(isLikelyFemaleVoice);
    if (anyFemale) return anyFemale;

    // 3. Preferred language match (e.g. en-IN, en-US, en)
    if (preferredLang) {
      const exactLang = voices.find(
        (v) => v.lang.toLowerCase() === preferredLang.toLowerCase()
      );
      if (exactLang) return exactLang;
      const prefixLang = voices.find((v) =>
        v.lang.toLowerCase().startsWith(preferredLang.slice(0, 2).toLowerCase())
      );
      if (prefixLang) return prefixLang;
    }

    const defaultEn = voices.find((v) => v.lang.toLowerCase().startsWith("en"));
    if (defaultEn) return defaultEn;

    // 4. Fallback to first voice
    return voices[0];
  }

  /**
   * Speak text using SpeechSynthesis with exact parameter assignment
   */
  public speak(text: string, options: SpeakOptions = {}): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        options.onError?.(new Error("SpeechSynthesis not supported in this environment."));
        resolve();
        return;
      }

      // Voice output disabled check
      if (options.enabled === false) {
        options.onEnd?.();
        resolve();
        return;
      }

      // Always cancel any prior speech before speaking new utterance
      this.stop();

      const cleanText = cleanTextForSpeech(text);

      if (!cleanText) {
        options.onEnd?.();
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Locate assigned voice
      const voices = this.getVoices();
      const resolvedVoice = this.findBestVoice(
        options.voiceName,
        options.voiceLang,
        voices
      );

      if (resolvedVoice) {
        utterance.voice = resolvedVoice;
        utterance.lang = resolvedVoice.lang;
      } else {
        utterance.lang = options.voiceLang || "en-US";
      }

      // Assign rate (clamp 0.5 to 2.0)
      const rate = typeof options.rate === "number" ? options.rate : 1.0;
      utterance.rate = Math.max(0.5, Math.min(2.0, rate));

      // Assign pitch (clamp 0.5 to 1.8)
      const pitch = typeof options.pitch === "number" ? options.pitch : 1.0;
      utterance.pitch = Math.max(0.5, Math.min(1.8, pitch));

      // Assign volume (clamp 0 to 1.0)
      const volume = typeof options.volume === "number" ? options.volume : 1.0;
      utterance.volume = Math.max(0.0, Math.min(1.0, volume));

      // Keep active reference to prevent Chromium garbage-collection cutoffs
      this.activeUtterance = utterance;

      let completed = false;
      const cleanup = () => {
        if (completed) return;
        completed = true;
        this.clearResumeTimer();
        this.activeUtterance = null;
      };

      utterance.onstart = () => {
        options.onStart?.();
        // Chromium heartbeat: resume every 10 seconds to prevent auto-pause bug on long texts
        this.startResumeHeartbeat();
      };

      utterance.onend = () => {
        cleanup();
        options.onEnd?.();
        resolve();
      };

      utterance.onpause = () => {
        options.onPause?.();
      };

      utterance.onresume = () => {
        options.onResume?.();
      };

      utterance.onerror = (event) => {
        cleanup();
        // Ignore "canceled" or "interrupted" as user stopped it deliberately
        if (event.error !== "canceled" && event.error !== "interrupted") {
          options.onError?.(event);
        } else {
          options.onEnd?.();
        }
        resolve();
      };

      try {
        window.speechSynthesis.speak(utterance);
        // On some versions of Chromium, speechSynthesis gets stuck in paused state
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch (err) {
        cleanup();
        options.onError?.(err);
        resolve();
      }
    });
  }

  /**
   * Stop active speech and clear timers
   */
  public stop(): void {
    this.clearResumeTimer();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // Ignore cancel errors
      }
    }
    this.activeUtterance = null;
  }

  private startResumeHeartbeat() {
    this.clearResumeTimer();
    this.resumeTimer = setInterval(() => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }
    }, 10000);
  }

  private clearResumeTimer() {
    if (this.resumeTimer) {
      clearInterval(this.resumeTimer);
      this.resumeTimer = null;
    }
  }
}

export const voiceService = new VoiceService();
export default voiceService;
