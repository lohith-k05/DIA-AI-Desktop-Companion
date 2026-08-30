import React, { useState, useEffect, useMemo } from "react";
import {
  Cpu,
  Sliders,
  Volume2,
  VolumeX,
  ShieldCheck,
  RotateCcw,
  RefreshCw,
  Copy,
  Check,
  Radio,
  ChevronDown,
  ChevronUp,
  User,
  Sparkles,
  AlertCircle,
  Square,
  Film,
  Wrench,
  Eye,
  Smile,
  Layers,
} from "lucide-react";
import { IntimateModeModal } from "../components/settings/IntimateModeModal";
import { chatService } from "../services/api";
import {
  voiceService,
  formatVoiceDisplayLabel,
  formatVoiceLanguage,
  isLikelyFemaleVoice,
  hasLikelyFemaleVoice,
} from "../services/voiceService";
import { characterController } from "../services/character/characterController";
import {
  ALL_EXPRESSIONS,
  EXPRESSION_METADATA,
  type CharacterExpression,
} from "../components/character/expressionTypes";
import { DiaCharacter } from "../components/character/DiaCharacter";
import {
  EXPECTED_FACIAL_ASSETS,
  probeAssetAvailability,
} from "../components/character/FacialLayerRenderer";
import type {
  MouthState,
  FacialDevOverrides,
} from "../components/character/characterTypes";
import type { AppSettings } from "../types/settings";
import type { OllamaModelInfo } from "../types/chat";
import "./SettingsPage.css";

interface SettingsPageProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onResetSettings: () => void;
  messageCount: number;
  onClearConversation: () => void;
  currentExpression?: CharacterExpression;
  onTestExpression?: (expression: CharacterExpression) => void;
}

// --------------------------------------------------
// OFFLINE VOICE DIAGNOSTICS WIDGET
// --------------------------------------------------
const OfflineVoiceDiagnostics: React.FC = () => {
  const [statuses, setStatuses] = useState({
    sttEngine: "Checking...",
    sttModel: "Checking...",
    ttsEngine: "Checking...",
    ollama: "Checking...",
    mic: "Checking...",
    speakers: "Checking..."
  });
  const [isTesting, setIsTesting] = useState(false);

  const runChecks = async () => {
    setStatuses(prev => ({
      ...prev, sttEngine: "Checking...", sttModel: "Checking...", ttsEngine: "Checking...", ollama: "Checking...", mic: "Checking...", speakers: "Checking..."
    }));

    try {
      // 1. Check Python / Backend Workers
      const diagRes = await fetch("http://127.0.0.1:5000/api/diagnostics").catch(() => null);
      if (diagRes && diagRes.ok) {
        const data = await diagRes.json();
        if (data.success && data.diagnostics) {
           setStatuses(prev => ({
             ...prev,
             sttEngine: data.diagnostics.sttEngine,
             sttModel: data.diagnostics.sttModel,
             ttsEngine: data.diagnostics.ttsEngine
           }));
        }
      } else {
        setStatuses(prev => ({
          ...prev, sttEngine: "Not running", sttModel: "Missing", ttsEngine: "Not running"
        }));
      }

      // 2. Check Ollama
      const ollamaRes = await chatService.checkOllamaStatus().catch(() => null);
      setStatuses(prev => ({
        ...prev, ollama: ollamaRes?.connected ? "Ready" : "Not running"
      }));

      // 3. Check Hardware
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
         try {
           // We only request device list, no popup unless they already granted it
           const devices = await navigator.mediaDevices.enumerateDevices();
           const hasMic = devices.some(d => d.kind === "audioinput");
           const hasSpeaker = devices.some(d => d.kind === "audiooutput");
           
           setStatuses(prev => ({
             ...prev, 
             mic: hasMic ? "Ready" : "Missing",
             speakers: hasSpeaker ? "Ready" : "Missing"
           }));
         } catch {
           setStatuses(prev => ({ ...prev, mic: "Error", speakers: "Error" }));
         }
      } else {
         setStatuses(prev => ({ ...prev, mic: "Not supported", speakers: "Not supported" }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    runChecks();
  }, []);

  const handleTest = async () => {
    if (isTesting) return;
    setIsTesting(true);
    try {
      const { offlineVoiceService } = await import("../services/offlineVoiceService");
      const url = await offlineVoiceService.synthesize("Offline voice system is fully operational.");
      offlineVoiceService.playAudio(url, {
         onEnd: () => setIsTesting(false),
         onError: () => {
           alert("Audio playback failed. Check speakers or TTS engine.");
           setIsTesting(false);
         }
      });
    } catch (err: any) {
      alert("Test failed: " + err.message);
      setIsTesting(false);
    }
  };

  const StatusRow = ({ label, status, hint }: { label: string, status: string, hint?: string }) => {
    let color = "#8a2be2";
    if (status === "Ready" || status === "Installed") color = "#00ff9d";
    else if (status.includes("Checking")) color = "#a1a1aa";
    else color = "#ff4757";

    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
           <span style={{ fontSize: "0.9rem", color: "#e2e8f0" }}>{label}</span>
           {hint && status.includes("Missing") && <span style={{ fontSize: "0.75rem", color: "#a1a1aa", marginTop: 4 }}>{hint}</span>}
           {hint && status.includes("Not running") && <span style={{ fontSize: "0.75rem", color: "#a1a1aa", marginTop: 4 }}>{hint}</span>}
        </div>
        <span style={{ fontSize: "0.85rem", fontWeight: 600, color, backgroundColor: `${color}15`, padding: "4px 10px", borderRadius: "12px" }}>
          {status}
        </span>
      </div>
    );
  };

  return (
    <div style={{ marginTop: 12, width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
      <StatusRow label="Microphone" status={statuses.mic} hint="Check Windows privacy settings for microphone access." />
      <StatusRow label="Offline STT Engine (Vosk)" status={statuses.sttEngine} hint="Run 'pip install vosk'." />
      <StatusRow label="STT Acoustic Model" status={statuses.sttModel} hint="Extract vosk-model to ~/vosk-models/vosk-model-small-en-us-0.15" />
      <StatusRow label="Local AI Engine (Ollama)" status={statuses.ollama} hint="Start Ollama application." />
      <StatusRow label="Offline TTS Engine (SAPI)" status={statuses.ttsEngine} hint="Run 'pip install pyttsx3'." />
      <StatusRow label="Audio Output" status={statuses.speakers} />
      
      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button className="save-settings-btn" style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} onClick={runChecks}>
          <RefreshCw size={14} style={{ marginRight: 6 }} /> Check System
        </button>
        <button className="save-settings-btn" style={{ flex: 1 }} onClick={handleTest} disabled={isTesting}>
          {isTesting ? "Testing..." : "Test Offline Voice"}
        </button>
      </div>
    </div>
  );
};

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
  onResetSettings,
  messageCount,
  onClearConversation,
  currentExpression,
  onTestExpression,
}) => {
  const [isIntimateModalOpen, setIsIntimateModalOpen] = useState(false);
    const [availableModels, setAvailableModels] = useState<OllamaModelInfo[]>([]);
  const [isRefreshingModels, setIsRefreshingModels] = useState(false);
  const [testedExpression, setTestedExpression] = useState<CharacterExpression>(
    currentExpression || "neutral"
  );
  const [connectionLatency, setConnectionLatency] = useState<number | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>(() =>
    voiceService.getVoices()
  );

  // Character Assets in public/dia/
  const EXPECTED_VIDEO_ASSETS: Record<string, string> = useMemo(
    () => ({
      "idle.png": "/dia/idle.png",
      "idle.mp4": "/dia/idle.mp4",
      "listening.mp4": "/dia/listening.mp4",
      "speaking.mp4": "/dia/speaking.mp4",
    }),
    []
  );
  const [videoStatuses, setVideoStatuses] = useState<Record<string, boolean>>({});

  // Facial Rig Developer Studio State
  const [isFacialDevExpanded, setIsFacialDevExpanded] = useState(false);
  const [facialOverrides, setFacialOverrides] = useState<FacialDevOverrides>({});
  const [assetStatuses, setAssetStatuses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Probe video assets
    Object.entries(EXPECTED_VIDEO_ASSETS).forEach(([key, path]) => {
      fetch(path, { method: "HEAD" })
        .then((res) => setVideoStatuses((prev) => ({ ...prev, [key]: res.ok })))
        .catch(() => setVideoStatuses((prev) => ({ ...prev, [key]: false })));
    });
  }, [EXPECTED_VIDEO_ASSETS]);

  useEffect(() => {
    if (isFacialDevExpanded) {
      Object.entries(EXPECTED_FACIAL_ASSETS).forEach(([key, path]) => {
        probeAssetAvailability(path).then((avail) => {
          setAssetStatuses((prev) => ({ ...prev, [key]: avail }));
        });
      });
    }
  }, [isFacialDevExpanded]);

  // Load models from Ollama
  const fetchModels = async () => {
    setIsRefreshingModels(true);
    try {
      const res = await chatService.getModels();
      if (res.models && res.models.length > 0) {
        setAvailableModels(res.models);
      }
    } finally {
      setIsRefreshingModels(false);
    }
  };

  // Test Ollama latency
  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      const res = await chatService.checkOllamaStatus();
      if (res.latencyMs !== undefined) {
        setConnectionLatency(res.latencyMs);
      }
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Load voices and system prompt on mount
  useEffect(() => {
    fetchModels();
    testConnection();

    chatService.getSystemPrompt().then((res) => {
      if (res.prompt) setSystemPrompt(res.prompt);
    });

    const unsubscribe = voiceService.subscribe((voices) => {
      setAvailableVoices(voices);
    });

    return () => {
      unsubscribe();
      voiceService.stop();
    };
  }, []);

  const activeVoiceObj = useMemo(() => {
    return voiceService.findBestVoice(
      settings.speechVoiceName,
      settings.speechVoiceLang,
      availableVoices
    );
  }, [settings.speechVoiceName, settings.speechVoiceLang, availableVoices]);

  const isCurrentFemale = useMemo(() => {
    return activeVoiceObj ? isLikelyFemaleVoice(activeVoiceObj) : false;
  }, [activeVoiceObj]);

  const hasAnyFemale = useMemo(() => {
    return hasLikelyFemaleVoice(availableVoices);
  }, [availableVoices]);

  useEffect(() => {
    if (currentExpression) {
      setTestedExpression(currentExpression);
    }
  }, [currentExpression]);

  const handleExpressionTest = (expr: CharacterExpression) => {
    setTestedExpression(expr);
    if (onTestExpression) {
      onTestExpression(expr);
    } else {
      characterController.dispatchEvent({
        type: "SET_EXPRESSION",
        expression: expr,
        intensity: 0.85,
        duration: 5000,
      });
    }
  };

  const handleModelChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    try {
      await chatService.selectModel(newModel);
      onUpdateSettings({ activeModel: newModel });
    } catch (err) {
      console.error("Failed to change model:", err);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(systemPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chosenName = e.target.value;
    const chosenVoice = availableVoices.find((v) => v.name === chosenName);
    onUpdateSettings({
      speechVoiceName: chosenName,
      speechVoiceLang: chosenVoice ? chosenVoice.lang : settings.speechVoiceLang,
    });
  };

  const testVoiceSample = () => {
    if (isTestingVoice) {
      voiceService.stop();
      setIsTestingVoice(false);
      return;
    }

    setIsTestingVoice(true);
    voiceService.speak("Hi, I’m Dia. This is my current voice.", {
      voiceName: settings.speechVoiceName,
      voiceLang: settings.speechVoiceLang,
      rate: settings.speechRate,
      pitch: settings.speechPitch,
      volume: settings.speechVolume ?? 1.0,
      enabled: true,
      onStart: () => setIsTestingVoice(true),
      onEnd: () => setIsTestingVoice(false),
      onError: () => setIsTestingVoice(false),
    });
  };

  return (
    <div className="dia-settings-root">
      <div className="settings-container">
        {/* Header */}
        <header className="settings-header">
          <div className="settings-header-copy">
            <h2 className="settings-title">Application Settings</h2>
            <p className="settings-subtitle">
              Configure local AI inference, Dia's personality, vocal synthesis, and storage.
            </p>
          </div>
          <div className="settings-header-badge">
            <Sparkles size={14} />
            <span>Dia v2.0 • Local Sovereign</span>
          </div>
        </header>

        <div className="settings-grid">
          {/* ------------------------------------------------ */}
          {/* SECTION 1: AI & INFERENCE ENGINE                 */}
          {/* ------------------------------------------------ */}
          <section className="settings-card">
            <div className="card-title-row">
              <div className="card-icon-frame purple">
                <Cpu size={18} />
              </div>
              <div className="card-meta">
                <h3>Local AI Engine & Models</h3>
                <p>Manage connection to Ollama and select active local LLM.</p>
              </div>
            </div>

            <div className="setting-control-group">
              <div className="setting-label-row">
                <label htmlFor="model-select">Active Ollama Model</label>
                <button
                  type="button"
                  className="card-ghost-btn"
                  onClick={fetchModels}
                  disabled={isRefreshingModels}
                  title="Refresh model inventory"
                >
                  <RefreshCw
                    size={12}
                    className={isRefreshingModels ? "spinning-icon" : ""}
                  />
                  <span>Refresh</span>
                </button>
              </div>

              <select
                id="model-select"
                className="settings-select"
                value={settings.activeModel}
                onChange={handleModelChange}
              >
                {availableModels.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} {m.details?.parameter_size ? `(${m.details.parameter_size})` : ""}
                  </option>
                ))}
                {availableModels.length === 0 && (
                  <option value={settings.activeModel}>
                    {settings.activeModel} (Active)
                  </option>
                )}
              </select>
            </div>

            <div className="setting-control-group">
              <div className="setting-label-row">
                <label>Inference Temperature</label>
                <span className="slider-value-badge">{settings.temperature}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.2"
                step="0.05"
                className="settings-slider"
                value={settings.temperature}
                onChange={(e) =>
                  onUpdateSettings({ temperature: parseFloat(e.target.value) })
                }
              />
              <div className="slider-indicators">
                <span>0.0 (Precise / Code)</span>
                <span>0.7 (Balanced)</span>
                <span>1.2 (Creative)</span>
              </div>
            </div>

            <div className="setting-control-group">
              <div className="setting-label-row">
                <label>Ollama Gateway Connection</label>
                <button
                  type="button"
                  className="card-ghost-btn"
                  onClick={testConnection}
                  disabled={isTestingConnection}
                >
                  <Radio size={12} />
                  <span>{connectionLatency ? `${connectionLatency}ms Latency` : "Test"}</span>
                </button>
              </div>
              <input
                type="text"
                className="settings-input"
                value={settings.ollamaUrl}
                disabled
                title="Ollama host URL"
              />
            </div>
          </section>

          {/* ------------------------------------------------ */}
          {/* SECTION 2: PERSONALITY & SYSTEM PROMPT           */}
          {/* ------------------------------------------------ */}
          <section className="settings-card">
            <div className="card-title-row">
              <div className="card-icon-frame blue">
                <User size={18} />
              </div>
              <div className="card-meta">
                <h3>Persona & Identity</h3>
                <p>Tailor how Dia recognizes you and inspect her system prompt.</p>
              </div>
            </div>

            <div className="setting-control-group">
              <label htmlFor="user-name-input">Your Preferred Name</label>
              <input
                id="user-name-input"
                type="text"
                className="settings-input"
                value={settings.userName}
                onChange={(e) => onUpdateSettings({ userName: e.target.value })}
                placeholder="Lohith"
              />
              <small className="control-help">
                Dia incorporates this name naturally into conversations.
              </small>
            </div>

            <div className="system-prompt-box">
              <div
                className="prompt-toggle-header"
                onClick={() => setIsPromptExpanded(!isPromptExpanded)}
              >
                <div className="prompt-header-left">
                  <Sliders size={14} className="prompt-icon" />
                  <span>Central Personality System Prompt</span>
                </div>
                {isPromptExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>

              {isPromptExpanded && (
                <div className="prompt-content-view">
                  <div className="prompt-actions-bar">
                    <span className="prompt-version-tag">Version 2.0 • Calibrated</span>
                    <button
                      type="button"
                      className="card-ghost-btn"
                      onClick={handleCopyPrompt}
                    >
                      {copiedPrompt ? (
                        <>
                          <Check size={12} className="copied-icon" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy Prompt</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="prompt-pre">{systemPrompt}</pre>
                </div>
              )}
            </div>
          </section>

          {/* ------------------------------------------------ */}
          {/* SECTION 3: VOICE & SPEECH CONFIGURATION          */}
          {/* ------------------------------------------------ */}
          <section className="settings-card">
            <div className="card-title-row">
              <div className="card-icon-frame pink">
                {settings.voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </div>
              <div className="card-meta">
                <h3>Voice & Speech Synthesis</h3>
                <p>Customize vocal output, choose system voices, and tune speech dynamics.</p>
              </div>
            </div>

            {/* Master Voice Enable/Disable Toggle */}
            <div className="setting-toggle-row">
              <div className="toggle-text">
                <strong>Voice Output Audio</strong>
                <p>Enable or mute all spoken responses from Dia across chat and voice modes.</p>
              </div>
              <label className="switch-label">
                <input
                  type="checkbox"
                  checked={settings.voiceEnabled}
                  onChange={(e) =>
                    onUpdateSettings({ voiceEnabled: e.target.checked })
                  }
                />
                <span className="switch-slider" />
              </label>
            </div>

            {/* Auto-Read Toggle */}
            <div className="setting-toggle-row">
              <div className="toggle-text">
                <strong>Auto-Read Dia Responses</strong>
                <p>Automatically narrate every assistant response aloud using speech synthesis.</p>
              </div>
              <label className="switch-label">
                <input
                  type="checkbox"
                  checked={settings.autoReadResponses}
                  onChange={(e) =>
                    onUpdateSettings({ autoReadResponses: e.target.checked })
                  }
                />
                <span className="switch-slider" />
              </label>
            </div>

            {/* Voice Selection Dropdown */}
            <div className="setting-control-group">
              <label htmlFor="voice-select">Speech Synthesis Voice</label>
              <select
                id="voice-select"
                className="settings-select"
                value={activeVoiceObj ? activeVoiceObj.name : settings.speechVoiceName}
                onChange={handleVoiceChange}
              >
                {availableVoices.length === 0 ? (
                  <option value="">Loading system voices...</option>
                ) : (
                  availableVoices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {formatVoiceDisplayLabel(v)}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Live Voice Status & Information */}
            <div className="voice-status-info-box">
              <div className="voice-status-meta-row">
                <span className="voice-meta-pill">Available voices: {availableVoices.length}</span>
                <span className="voice-meta-pill">Active voice: {activeVoiceObj ? activeVoiceObj.name : "None available"}</span>
                <span className="voice-meta-pill">Language: {activeVoiceObj ? formatVoiceLanguage(activeVoiceObj.lang) : "Unknown"}</span>
                {isCurrentFemale && (
                  <span className="female-preference-badge">
                    <Sparkles size={12} />
                    Female voice preference active
                  </span>
                )}
              </div>

              {!hasAnyFemale && availableVoices.length > 0 && (
                <div className="no-female-voice-warning">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>
                    No female voice is available on this system. Install another Windows/browser voice or choose from the available voices.
                  </span>
                </div>
              )}
            </div>

            {/* Speech Rate, Pitch & Volume Sliders */}
            <div className="three-col-sliders">
              <div className="setting-control-group">
                <div className="setting-label-row">
                  <label>Speech Rate</label>
                  <span className="slider-value-badge">{settings.speechRate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.4"
                  step="0.05"
                  className="settings-slider"
                  value={settings.speechRate}
                  onChange={(e) =>
                    onUpdateSettings({ speechRate: parseFloat(e.target.value) })
                  }
                />
              </div>

              <div className="setting-control-group">
                <div className="setting-label-row">
                  <label>Speech Pitch</label>
                  <span className="slider-value-badge">{settings.speechPitch.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.4"
                  step="0.05"
                  className="settings-slider"
                  value={settings.speechPitch}
                  onChange={(e) =>
                    onUpdateSettings({ speechPitch: parseFloat(e.target.value) })
                  }
                />
              </div>

              <div className="setting-control-group">
                <div className="setting-label-row">
                  <label>Speech Volume</label>
                  <span className="slider-value-badge">
                    {Math.round((settings.speechVolume ?? 1.0) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  className="settings-slider"
                  value={settings.speechVolume ?? 1.0}
                  onChange={(e) =>
                    onUpdateSettings({ speechVolume: parseFloat(e.target.value) })
                  }
                />
              </div>
            </div>

            <button
              type="button"
              className={`test-voice-button ${isTestingVoice ? "is-playing" : ""}`}
              onClick={testVoiceSample}
            >
              {isTestingVoice ? <Square size={15} /> : <Volume2 size={15} />}
              <span>{isTestingVoice ? "Stop Voice Sample" : "Test Voice"}</span>
            </button>
          </section>

          {/* ------------------------------------------------ */}
          {/* SECTION 4: CHARACTER & 3D STAGE ENGINE           */}
          {/* ------------------------------------------------ */}
          {/* ------------------------------------------------ */}
          {/* SECTION 4: DIA CHARACTER SYSTEM                  */}
          {/* ------------------------------------------------ */}
          <section className="settings-card">
            <div className="card-title-row">
              <div className="card-icon-frame violet">
                <Sparkles size={18} />
              </div>
              <div className="card-meta">
                <h3>Dia AI Companion Identity</h3>
                <p>Dia's official realistic 2D character with interactive animation and reactive states.</p>
              </div>
            </div>

            <div className="setting-control-group">
              <label>Always-On Floating Companion</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
                <button 
                  type="button" 
                  className="save-settings-btn" 
                  onClick={() => {
                    import('../services/desktopBridge').then(m => m.openFloatingCompanion(true));
                  }}
                >
                  Launch Floating Companion
                </button>
                <p className="settings-hint">Opens a resizable, drag-anywhere persistent companion window.</p>
              </div>
            </div>

            <div className="setting-control-group">
              <label>Official Character Visualizer</label>
              <div className="renderer-choice-grid">
                <div className="renderer-option-card active cursor-default">
                  <div className="option-card-header">
                    <Film size={18} className="text-violet-400" />
                    <strong>Dia Synchronized Video Animation Engine (Official)</strong>
                  </div>
                  <p>
                    Synchronized motion video engine powered by <code>idle.mp4</code>, <code>listening.mp4</code>, and <code>speaking.mp4</code>. Loops idle animation on standby, transitions smoothly to listening video during microphone input, and continuously loops speaking video synchronized to SpeechSynthesis TTS voice playback.
                  </p>
                </div>
              </div>
            </div>

            <div className="telemetry-info-row">
              <span className="telemetry-pill-tag">
                Engine: Synchronized Video-Based
              </span>
              <span className="telemetry-pill-tag">
                Videos: idle • listening • speaking
              </span>
              <span className="telemetry-pill-tag">
                TTS Voice Sync: Active
              </span>
              <span className="telemetry-pill-tag">
                Seamless Fallback: Layered 2D Rig
              </span>
            </div>

            {/* Developer Testing Expression Suite */}
            <div className="expression-tester-panel">
              <div className="expression-tester-header">
                <strong>
                  <Sparkles size={14} className="text-violet-400" />
                  Emotional Expression Tester
                </strong>
                <span className="expression-active-badge">
                  Active: {EXPRESSION_METADATA[testedExpression]?.statusBadgeText || testedExpression}
                </span>
              </div>
              <p className="telemetry-pill-tag" style={{ border: "none", padding: 0 }}>
                Instant live preview of all 11 realistic 2D expressions with kinetic postures and reactive ambient auras:
              </p>
              <div className="expression-button-grid" role="group" aria-label="Test Dia expressions">
                {ALL_EXPRESSIONS.map((expr) => {
                  const meta = EXPRESSION_METADATA[expr];
                  const isSelected = testedExpression === expr;
                  return (
                    <button
                      key={expr}
                      type="button"
                      className={`expression-pill-btn ${isSelected ? "is-selected" : ""}`}
                      onClick={() => handleExpressionTest(expr)}
                      title={`Trigger ${meta.name} expression`}
                    >
                      <span className={`dia-status-dot ${meta.dotColorClass}`} />
                      <span>{meta.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="expression-preview-meta">
                <span>Reaction Tone: <strong>{EXPRESSION_METADATA[testedExpression]?.statusBadgeText}</strong></span>
                <span className="meta-cue">"{EXPRESSION_METADATA[testedExpression]?.speechBubbleCue}"</span>
              </div>
            </div>

            {/* Developer Testing Studio Toggle */}
            <div className="facial-dev-toggle-row">
              <button
                type="button"
                className="facial-dev-toggle-btn"
                onClick={() => setIsFacialDevExpanded(!isFacialDevExpanded)}
              >
                <Wrench size={13} />
                <span>
                  {isFacialDevExpanded
                    ? "Hide Facial Rig Developer Studio"
                    : "ðŸ› ï¸ 2D Facial Rig Developer Studio (Dev Only)"}
                </span>
              </button>
            </div>

            {/* Collapsible Developer-Only Facial Rig Testing Studio */}
            {isFacialDevExpanded && (
              <div className="facial-dev-studio">
                <div className="facial-dev-studio-header">
                  <h4>
                    <Layers size={15} className="text-violet-400" />
                    2D Layered Facial Rig Developer Studio
                  </h4>
                  <button
                    type="button"
                    className="facial-dev-btn"
                    onClick={() => setFacialOverrides({})}
                    title="Reset overrides to autonomous state"
                  >
                    Reset Overrides
                  </button>
                </div>

                <div className="facial-dev-layout">
                  {/* Live Preview Box */}
                  <div className="facial-dev-preview-box">
                    <DiaCharacter
                      size="md"
                      expression={testedExpression}
                      devOverrides={facialOverrides}
                      showStatusBadge={false}
                    />
                    <span className="telemetry-pill-tag mt-2">
                      Mouth: {facialOverrides.mouthOverride || (facialOverrides.isSpeakingLoop ? "speaking" : "auto")} • Eyes: {facialOverrides.eyeOverride || "auto"}
                    </span>
                  </div>

                  {/* Control Actions & Asset Inventory */}
                  <div className="facial-dev-controls-col">
                    {/* Eye Blinking */}
                    <div className="facial-dev-group">
                      <label>Eye Layer Control</label>
                      <div className="facial-dev-btn-row">
                        <button
                          type="button"
                          className="facial-dev-btn"
                          onClick={() => {
                            setFacialOverrides((p) => ({ ...p, forceBlink: true }));
                            setTimeout(() => {
                              setFacialOverrides((p) => ({ ...p, forceBlink: false }));
                            }, 160);
                          }}
                        >
                          <Eye size={12} className="inline mr-1" />
                          Blink Now (160ms)
                        </button>
                        <button
                          type="button"
                          className={`facial-dev-btn ${facialOverrides.eyeOverride === "closed" ? "is-active" : ""}`}
                          onClick={() =>
                            setFacialOverrides((p) => ({
                              ...p,
                              eyeOverride: p.eyeOverride === "closed" ? null : "closed",
                            }))
                          }
                        >
                          Hold Eyes Closed
                        </button>
                      </div>
                    </div>

                    {/* Mouth Shapes */}
                    <div className="facial-dev-group">
                      <label>Mouth Viseme / Shape Control</label>
                      <div className="facial-dev-btn-row">
                        {(["neutral", "smile", "open", "concerned", "surprised"] as MouthState[]).map((m) => (
                          <button
                            key={m}
                            type="button"
                            className={`facial-dev-btn ${facialOverrides.mouthOverride === m ? "is-active" : ""}`}
                            onClick={() =>
                              setFacialOverrides((p) => ({
                                ...p,
                                mouthOverride: p.mouthOverride === m ? null : m,
                              }))
                            }
                          >
                            {m.charAt(0).toUpperCase() + m.slice(1)} Mouth
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Speaking Animation */}
                    <div className="facial-dev-group">
                      <label>Speech Synthesis Lip-Sync</label>
                      <div className="facial-dev-btn-row">
                        <button
                          type="button"
                          className={`facial-dev-btn highlight ${facialOverrides.isSpeakingLoop ? "is-active" : ""}`}
                          onClick={() =>
                            setFacialOverrides((p) => ({
                              ...p,
                              isSpeakingLoop: !p.isSpeakingLoop,
                            }))
                          }
                        >
                          <Smile size={12} className="inline mr-1" />
                          {facialOverrides.isSpeakingLoop ? "Stop Speaking Animation" : "Test Speaking Animation (Loop)"}
                        </button>
                      </div>
                    </div>

                    {/* Real-time Character Asset Inventory */}
                    <div className="facial-dev-group">
                      <label>Official Character Assets (/public/dia)</label>
                      <div className="asset-inventory-list">
                        {Object.entries(EXPECTED_VIDEO_ASSETS).map(([filename, path]) => {
                          const isFound = videoStatuses[filename];
                          return (
                            <div key={filename} className="asset-inventory-item">
                              <span>
                                {filename} (<code>{path}</code>)
                              </span>
                              <span className={`asset-badge ${isFound ? "found" : "missing"}`}>
                                {isFound ? "✓“ Active (Ready)" : "Missing asset"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Real-time Facial Asset Inventory Status */}
                    <div className="facial-dev-group">
                      <label>Fallback Facial Layer Asset Inventory (/public/assets)</label>
                      <div className="asset-inventory-list">
                        {Object.entries(EXPECTED_FACIAL_ASSETS).map(([key, path]) => {
                          const isFound = assetStatuses[key];
                          return (
                            <div key={key} className="asset-inventory-item">
                              <span>
                                {key} (<code>{path}</code>)
                              </span>
                              <span className={`asset-badge ${isFound ? "found" : "missing"}`}>
                                {isFound ? "✓“ Found" : "Awaiting user file"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ------------------------------------------------ */}
          {/* SECTION 5: OFFLINE VOICE DIAGNOSTICS */}
          <section className="settings-card">
            <div className="card-title-row">
              <div className="card-icon-frame cyan">
                <Wrench size={18} />
              </div>
              <div className="card-meta">
                <h3>Offline Voice Diagnostics</h3>
                <p>Check the status of the local speech pipeline</p>
              </div>
            </div>
            
            <div className="settings-row" style={{ display: "block" }}>
               <OfflineVoiceDiagnostics />
            </div>
          </section>

          {/* SECTION 6: STORAGE & PRIVACY VAULT               */}
          {/* ------------------------------------------------ */}
          <section className="settings-card">
            <div className="card-title-row">
              <div className="card-icon-frame green">
                <ShieldCheck size={18} />
              </div>
              <div className="card-meta">
                <h3>Storage & Privacy Vault</h3>
                <p>Review data stored on this machine and reset configuration.</p>
              </div>
            </div>

            <div className="storage-summary-box">
              <div className="storage-item">
                <span>Stored Conversation Messages</span>
                <strong>{messageCount}</strong>
              </div>
              <div className="storage-item">
                <span>Storage Medium</span>
                <strong>Local Machine (Zero Cloud)</strong>
              </div>
            </div>

            <p className="privacy-assurance-text">
              Dia operates locally. None of your conversations, settings, or voice inputs
              are transmitted to external servers without your explicit action.
            </p>

            <div className="danger-zone-actions">
              <button
                type="button"
                className="danger-outline-btn"
                onClick={onClearConversation}
              >
                Clear Conversation History
              </button>

              <button
                type="button"
                className="neutral-outline-btn"
                onClick={onResetSettings}
              >
                <RotateCcw size={14} />
                <span>Reset Settings to Defaults</span>
              </button>
            </div>
          </section>

          {/* SECTION 7: ABOUT DIA */}
          <section className="settings-card">
            <div className="card-title-row">
              <div className="card-icon-frame purple">
                <Sparkles size={18} />
              </div>
              <div className="card-meta">
                <h3>About DIA</h3>
                <p>Application information</p>
              </div>
            </div>
            <div className="card-content">
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px" }}>
                <div 
                  onDoubleClick={() => setIsIntimateModalOpen(true)}
                  style={{ 
                    width: "64px", height: "64px", borderRadius: "50%", 
                    background: "linear-gradient(135deg, #7C3AED, #EC4899)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: "16px", cursor: "default",
                    boxShadow: "0 4px 20px rgba(124, 58, 237, 0.4)"
                  }}
                  title="Double tap"
                >
                  <Sparkles size={32} color="white" />
                </div>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "1.2rem" }}>Dia Sovereign Desktop</h3>
                <p style={{ margin: 0, color: "#888", fontSize: "0.9rem" }}>Version 2.0.0 (Local Build)</p>
              </div>
            </div>
          </section>

        </div>
      </div>
      <IntimateModeModal 
        isOpen={isIntimateModalOpen} 
        onClose={() => setIsIntimateModalOpen(false)}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
      />
    </div>
  );
};
