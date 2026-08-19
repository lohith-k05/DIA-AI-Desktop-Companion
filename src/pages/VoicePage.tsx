import React from "react";
import {
  Mic,
  MicOff,
  VolumeX,
  Volume2,
  Sparkles,
  Radio,
  CornerDownRight,
} from "lucide-react";
import { DiaVideo } from "../components/character/DiaVideo";
import { VoiceVisualizer } from "../components/voice/VoiceVisualizer";
import type { CharacterActivity, CharacterRendererType, CharacterExpression } from "../types/character";
import type { ChatMessage } from "../types/chat";
import "./VoicePage.css";

import type { AppSettings } from "../types/settings";
interface VoicePageProps {
  settings?: AppSettings;
  onUpdateSettings?: (updates: Partial<AppSettings>) => void;
  activity: CharacterActivity;
  expression?: CharacterExpression;
  isListening: boolean;
  isSpeaking: boolean;
  isLoading: boolean;
  activeModel?: string;
  transcriptText: string;
  lastDiaReply?: ChatMessage;
  characterRenderer?: CharacterRendererType;
  onToggleRenderer?: () => void;
  onToggleVoice: () => void;
  onToggleOfflineVoice: () => void;
  offlineVoiceMode: boolean;
  onToggleOfflineMode: () => void;
  onStopSpeaking: () => void;
  onSpeakText: (text: string) => void;
  onQuickPrompt: (text: string) => void;
}

export const VoicePage: React.FC<VoicePageProps> = ({
  settings,
  onUpdateSettings,
  activity,
  expression: _expression,
  isListening,
  isSpeaking,
  isLoading,
  activeModel = "gemma3:1b",
  transcriptText,
  lastDiaReply,
  characterRenderer: _characterRenderer,
  onToggleRenderer: _onToggleRenderer,
  onToggleVoice,
  onToggleOfflineVoice,
  offlineVoiceMode,
  onToggleOfflineMode,
  onStopSpeaking,
  onSpeakText,
  onQuickPrompt,
}) => {
  const voicePrompts = [
    "Tell me an inspiring thought for today.",
    "Explain how neural networks learn.",
    "What can we collaborate on right now?",
    "Give me a quick 2-minute focus strategy.",
  ];

  return (
    <div className="dia-voice-page-root">
      {settings?.intimateModeEnabled && (
        <div className="browser-mode-banner" style={{ background: "rgba(255, 105, 180, 0.1)", color: "#FF69B4", padding: "8px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 105, 180, 0.2)", fontSize: "0.9rem", fontWeight: 500, position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}>
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>♡ Intimate Mode · ON</span>
          <button onClick={() => onUpdateSettings && onUpdateSettings({ intimateModeEnabled: false })} style={{ background: "transparent", border: "none", color: "#FF69B4", cursor: "pointer", fontSize: "0.85rem", textDecoration: "underline" }}>Turn Off</button>
        </div>
      )}
      {/* Studio Header */}
      <header className="voice-studio-header">
        <div className="voice-header-badge">
          <Radio size={14} className="radio-pulse" />
          <span>Bi-Directional Voice Studio</span>
        </div>
        <div className="voice-header-actions">
          <div className="voice-model-pill">
            <span>Engine: {activeModel}</span>
          </div>

          {/* Online / Offline mode toggle */}
          <div className="voice-mode-toggle">
            <button
              type="button"
              className={`mode-toggle-btn ${!offlineVoiceMode ? "active" : ""}`}
              onClick={() => { if (offlineVoiceMode) onToggleOfflineMode(); }}
              title="Online voice mode (browser SpeechRecognition)"
            >
              Online
            </button>
            <button
              type="button"
              className={`mode-toggle-btn ${offlineVoiceMode ? "active" : ""}`}
              onClick={() => { if (!offlineVoiceMode) onToggleOfflineMode(); }}
              title="Offline voice mode (local Vosk STT + pyttsx3 TTS)"
            >
              Offline
            </button>
          </div>

          <button
            type="button"
            className="floating-companion-btn"
            onClick={() => {
              import('../services/desktopBridge').then(m => m.openFloatingCompanion(true));
            }}
          >
            Launch Floating Companion
          </button>
        </div>
      </header>

      {/* Main Vocal Stage */}
      <main className="voice-stage-center">
        <div className="voice-character-wrapper">
          <VoiceVisualizer
            activity={activity}
            isListening={isListening}
            isSpeaking={isSpeaking}
          />

          <DiaVideo
            size="hero"
            activity={activity}
            isSpeaking={isSpeaking}
            isListening={isListening}
          />
        </div>

        {/* Status Cue */}
        <div className="voice-status-cue">
          {isListening && (
            <div className="status-badge listening">
              <span className="cue-dot pink" />
              <span>Listening to your voice... Speak naturally</span>
            </div>
          )}

          {isLoading && (
            <div className="status-badge thinking">
              <span className="cue-dot amber" />
              <span>Dia is thinking...</span>
            </div>
          )}

          {isSpeaking && (
            <div className="status-badge speaking">
              <span className="cue-dot violet" />
              <span>Dia is speaking</span>
            </div>
          )}

          {!isListening && !isLoading && !isSpeaking && (
            <div className="status-badge idle">
              <span className="cue-dot emerald" />
              <span>Ready • Press the microphone or tap below</span>
            </div>
          )}
        </div>

        {/* Live Transcript / Speech Display */}
        <div className="voice-transcript-card">
          {transcriptText ? (
            <div className="transcript-user-box">
              <span className="transcript-label">You said:</span>
              <p className="transcript-content">“{transcriptText}”</p>
            </div>
          ) : lastDiaReply ? (
            <div className="transcript-dia-box">
              <div className="dia-transcript-header">
                <span className="transcript-label dia">Dia said:</span>
                <button
                  type="button"
                  className="re-read-btn"
                  onClick={() =>
                    isSpeaking ? onStopSpeaking() : onSpeakText(lastDiaReply.content)
                  }
                  title="Re-read response aloud"
                >
                  {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
                  <span>{isSpeaking ? "Stop" : "Listen"}</span>
                </button>
              </div>
              <p className="transcript-content dia">
                {lastDiaReply.content.slice(0, 280)}
                {lastDiaReply.content.length > 280 ? "..." : ""}
              </p>
            </div>
          ) : (
            <p className="transcript-placeholder">
              Tap the microphone below and speak directly to Dia.
            </p>
          )}
        </div>

        {/* Big Glow Microphone Action Button */}
        <div className="voice-controls-dock">
          {isSpeaking ? (
            <button
              type="button"
              className="voice-action-circle interrupt-btn"
              onClick={onStopSpeaking}
              title="Interrupt & stop speaking"
              aria-label="Stop Dia speaking"
            >
              <VolumeX size={32} />
              <span className="circle-label">Stop</span>
            </button>
          ) : (
            <button
              type="button"
              className={`voice-action-circle ${isListening ? "active-listening" : "idle-mic"}${offlineVoiceMode ? " offline-mic" : ""}`}
              onClick={offlineVoiceMode ? onToggleOfflineVoice : onToggleVoice}
              disabled={isLoading}
              title={isListening ? "Stop & transcribe" : offlineVoiceMode ? "Tap to speak (Offline)" : "Tap to speak"}
              aria-label="Toggle voice input"
            >
              {isListening ? <MicOff size={32} /> : <Mic size={32} />}
              <span className="circle-label">
                {isListening ? (offlineVoiceMode ? "Processing..." : "Listening") : "Speak"}
              </span>
            </button>
          )}
        </div>

        {/* Quick Voice Suggestions */}
        <div className="voice-prompts-tray">
          <div className="tray-label">
            <Sparkles size={12} />
            <span>Try speaking:</span>
          </div>
          <div className="tray-chips">
            {voicePrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                className="voice-chip-btn"
                onClick={() => onQuickPrompt(prompt)}
              >
                <CornerDownRight size={12} className="chip-arrow" />
                <span>{prompt}</span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
