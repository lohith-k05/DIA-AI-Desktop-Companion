import type { CharacterRendererType } from "./character";

export interface AppSettings {
  activeModel: string;
  temperature: number;
  userName: string;
  voiceEnabled: boolean;
  autoReadResponses: boolean;
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
  speechVoiceName?: string;
  speechVoiceLang?: string;
  ollamaUrl: string;
  characterRenderer: CharacterRendererType;
  intimateModeEnabled: boolean;
  intimateAffectionLevel: "gentle" | "playful" | "romantic";
  intimateVoicePersonality: "default" | "warm" | "playful" | "romantic";
}

export const DEFAULT_SETTINGS: AppSettings = {
  activeModel: "gemma3:1b",
  temperature: 0.7,
  userName: "Lohith",
  voiceEnabled: true,
  autoReadResponses: false,
  speechRate: 1.0,
  speechPitch: 1.0,
  speechVolume: 1.0,
  speechVoiceName: "",
  speechVoiceLang: "",
  ollamaUrl: "http://127.0.0.1:11434",
  characterRenderer: "image-sprite",
  intimateModeEnabled: false,
  intimateAffectionLevel: "playful",
  intimateVoicePersonality: "default",
};
