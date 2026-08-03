import React, { useRef, useEffect, useState } from "react";
import {
  Send,
  Mic,
  MicOff,
  X,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  Paperclip,
  GraduationCap,
  Lightbulb,
  FileText,
  Sparkles,
  Music,
  Quote,
  CloudSun,
  Search,
  Wand2,
  BarChart3,
  MoreHorizontal,
  Pause,
  Play,
} from "lucide-react";
import { BrowserTaskCard } from "../components/chat/BrowserTaskCard";
import type { ChatMessage, ActiveDocument } from "../types/chat";
import type { CharacterActivity, CharacterRendererType } from "../types/character";
import type { CharacterExpression } from "../components/character/expressionTypes";
import type { AppSettings } from "../types/settings";
import "./HomePage.css";

interface HomePageProps {
  settings?: AppSettings;
  onUpdateSettings?: (updates: Partial<AppSettings>) => void;
  isBrowserMode?: boolean;
  onExitBrowserMode?: () => void;
  messages: ChatMessage[];
  chatStarted: boolean;
  inputMessage: string;
  isLoading: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  activity: CharacterActivity;
  expression?: CharacterExpression;
  characterRenderer?: CharacterRendererType;
  onToggleRenderer?: () => void;
  onChangeInput: (text: string) => void;
  onSendMessage: (e?: React.FormEvent) => void;
  activeDocument?: ActiveDocument | null;
  onUploadDocument?: (file: File) => void;
  onRemoveDocument?: () => void;
  onToggleVoice: () => void;
  onClearInput: () => void;
  onQuickAction: (text: string) => void;
  onSpeakText: (text: string) => void;
  onStopSpeaking: () => void;
  onRetryLast: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  settings,
  onUpdateSettings,
  isBrowserMode,
  onExitBrowserMode,
  messages,
  chatStarted,
  inputMessage,
  isLoading,
  isListening,
  isSpeaking,
  onChangeInput,
  onSendMessage,
  activeDocument,
  onUploadDocument,
  onRemoveDocument,
  onToggleVoice,
  onClearInput,
  onQuickAction,
  onSpeakText,
  onStopSpeaking,
  onRetryLast,
}) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState(true);
  const [activeChip, setActiveChip] = useState("think");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
         alert("Currently, only PDF files are supported for document analysis.");
         if (fileInputRef.current) fileInputRef.current.value = '';
         return;
      }
      if (onUploadDocument) onUploadDocument(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Determine current video source based on activity state
  const currentVideoSrc = isSpeaking
    ? "/dia/speaking.mp4"
    : isListening
    ? "/dia/listening.mp4"
    : "/dia/idle.mp4";

  // Preload all 3 video files into browser memory
  useEffect(() => {
    ["/dia/idle.mp4", "/dia/speaking.mp4", "/dia/listening.mp4"].forEach((url) => {
      const v = document.createElement("video");
      v.src = url;
      v.preload = "auto";
      v.muted = true;
      v.load();
    });
  }, []);

  // Update video playback when state switches (idle <-> speaking <-> listening)
  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    if (!video.src.endsWith(currentVideoSrc)) {
      video.src = currentVideoSrc;
      video.currentTime = 0;
      video.load();
      video.play().catch(() => {});
    } else if (video.paused) {
      video.play().catch(() => {});
    }
  }, [currentVideoSrc]);

  // Global Ctrl + K listener to focus the centered search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (chatStarted) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, chatStarted]);

  // Dynamic uppercase tracked date matching reference (e.g. "MONDAY, SEP 14, 2026")
  const formattedDate = new Date()
    .toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();

  // Dynamic greeting based on time of day
  const currentHour = new Date().getHours();
  const greetingTime =
    currentHour < 12
      ? "Good Morning,"
      : currentHour < 17
      ? "Good Afternoon,"
      : "Good Evening,";

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      e.preventDefault();
      onQuickAction(searchQuery.trim());
      setSearchQuery("");
    }
  };

  const displayedMessages = messages.filter(
    (m) => m.role === "user" || chatStarted
  );

  return (
    <div className={`dia-homepage-view ${chatStarted ? "chat-mode" : "hero-mode"}`}>
      {isBrowserMode && (
        <div className="browser-mode-banner" style={{ background: "rgba(139, 92, 246, 0.1)", color: "var(--dia-accent-purple)", padding: "8px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(139, 92, 246, 0.2)", fontSize: "0.9rem", fontWeight: 500 }}>
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>🌐 Browser Mode Active</span>
          <button onClick={onExitBrowserMode} style={{ background: "transparent", border: "none", color: "var(--dia-accent-purple)", cursor: "pointer", fontSize: "0.85rem", textDecoration: "underline" }}>Exit Mode</button>
        </div>
      )}
      {settings?.intimateModeEnabled && (
        <div className="browser-mode-banner" style={{ background: "rgba(255, 105, 180, 0.1)", color: "#FF69B4", padding: "8px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 105, 180, 0.2)", fontSize: "0.9rem", fontWeight: 500 }}>
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>♡ Intimate Mode · ON</span>
          <button onClick={() => onUpdateSettings && onUpdateSettings({ intimateModeEnabled: false })} style={{ background: "transparent", border: "none", color: "#FF69B4", cursor: "pointer", fontSize: "0.85rem", textDecoration: "underline" }}>Turn Off</button>
        </div>
      )}
      {/* ================================================== */}
      {/* 1. TOP CENTERED SEARCH BAR (Section 6 & 8)         */}
      {/* ================================================== */}
      <div className="dia-center-search-wrapper">
        <div className="dia-center-search-bar">
          <Search size={15} className="search-bar-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="search-bar-input"
            placeholder="Search anything..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchSubmit}
            aria-label="Search or prompt Dia"
          />
          <kbd className="search-bar-shortcut">Ctrl + K</kbd>
        </div>
      </div>

      {/* ================================================== */}
      {/* 2. FULL-WIDTH HERO VIDEO SECTION WITH DIRECT TEXT  */}
      {/* ================================================== */}
      {!chatStarted && (
        <section className="dia-hero-full-card" aria-label="Dia Welcome Banner">
          {/* Full-Width Video Background */}
          <div className="dia-hero-video-container">
            <video
              ref={heroVideoRef}
              src={currentVideoSrc}
              autoPlay
              loop
              muted
              playsInline
              controls={false}
              disablePictureInPicture
              disableRemotePlayback
              className="dia-hero-full-video"
            />
          </div>

          {/* Directional Dark Gradient Scrim to ensure 100% text readability without covering Dia */}
          <div className="dia-hero-scrim-overlay" />

          {/* Text & Quick Action Buttons Overlay Directly On Video */}
          <div className="dia-hero-text-overlay">
            {/* Uppercase Tracked Date */}
            <div className="hero-date-tag">{formattedDate}</div>

            {/* Main Greeting */}
            <h1 className="hero-greeting-line">
              <span className="hero-salutation">{greetingTime}</span>
              <span className="hero-username-gradient"> Lohith 👋</span>
            </h1>

            {/* Companion Intro & Description */}
            <p className="hero-intro-text">
              I’m Dia — your AI companion.
              <br />
              Here to help, support, and grow with you.
              <br />
              What’s on your mind today?
            </p>

            {/* Quick Action Buttons (Directly overlaid on video) */}
            <div className="hero-action-buttons-wrap">
              <button
                type="button"
                className="hero-action-button"
                onClick={() => onQuickAction("Help me learn something new today.")}
              >
                <div className="btn-icon-pill icon-blue">
                  <GraduationCap size={15} />
                </div>
                <span>Help me learn something new</span>
              </button>

              <button
                type="button"
                className="hero-action-button"
                onClick={() => onQuickAction("Give me creative ideas for my next project.")}
              >
                <div className="btn-icon-pill icon-amber">
                  <Lightbulb size={15} />
                </div>
                <span>Give me creative ideas</span>
              </button>

              <button
                type="button"
                className="hero-action-button"
                onClick={() => onQuickAction("Summarize this topic for me.")}
              >
                <div className="btn-icon-pill icon-cyan">
                  <FileText size={15} />
                </div>
                <span>Summarize this for me</span>
              </button>

              <button
                type="button"
                className="hero-action-button"
                onClick={() => onQuickAction("Help me solve a challenging problem step-by-step.")}
              >
                <div className="btn-icon-pill icon-pink">
                  <Sparkles size={15} />
                </div>
                <span>Help me solve a problem</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ================================================== */}
      {/* 3. CONVERSATION VIEWPORT (Active during Chat)      */}
      {/* ================================================== */}
      {chatStarted && (
        <section className="dia-conversation-stream" aria-label="Conversation View">
          {isBrowserMode && (
            <div className="browser-mode-banner" style={{ background: "rgba(139, 92, 246, 0.1)", color: "var(--dia-accent-purple)", padding: "8px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(139, 92, 246, 0.2)", fontSize: "0.9rem", fontWeight: 500, margin: "0 -24px 16px -24px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>🌐 Browser Mode Active</span>
              <button onClick={onExitBrowserMode} style={{ background: "transparent", border: "none", color: "var(--dia-accent-purple)", cursor: "pointer", fontSize: "0.85rem", textDecoration: "underline" }}>Exit Mode</button>
            </div>
          )}
          <div className="conversation-inner">
            {/* Live Speaking Alert / Quick Stop Banner */}
            {isSpeaking && (
              <div className="dia-speaking-banner">
                <div className="speaking-banner-pulse">
                  <Volume2 size={15} className="speaking-wave-icon" />
                  <span>Dia is speaking aloud...</span>
                </div>
                <button
                  type="button"
                  className="speaking-banner-stop-btn"
                  onClick={onStopSpeaking}
                  title="Stop voice playback"
                >
                  <VolumeX size={13} />
                  <span>Stop Speech</span>
                </button>
              </div>
            )}

            {displayedMessages.map((msg) => {
              const isDia = msg.role === "assistant";
              return (
                <div
                  key={msg.id}
                  className={`message-bubble-row ${
                    isDia ? "dia-row" : "user-row"
                  }`}
                >
                  {isDia && (
                    <div className="dia-avatar-bubble">
                      <img
                        src="/dia/dia_avatar.png"
                        alt="Dia"
                        className="dia-msg-avatar-img"
                        onError={(e) => {
                          e.currentTarget.src = "/dia/idle.png";
                        }}
                      />
                    </div>
                  )}

                  <div
                    className={`message-bubble-card ${
                      isDia ? "dia-card" : "user-card"
                    } ${msg.status === "error" ? "error-card" : ""}`}
                  >
                    {msg.content.startsWith("BROWSER_TASK:") ? (
                        <BrowserTaskCard 
                          tool={JSON.parse(msg.content.replace("BROWSER_TASK:", "")).tool} 
                          args={JSON.parse(msg.content.replace("BROWSER_TASK:", "")).arguments} 
                        />
                      ) : (
                        <p className="bubble-text">{msg.content}</p>
                      )}

                    {/* Dia Message Utilities */}
                    {isDia && (
                      <div className="bubble-controls">
                        <button
                          type="button"
                          className="control-btn"
                          onClick={() =>
                            isSpeaking ? onStopSpeaking() : onSpeakText(msg.content)
                          }
                          title={isSpeaking ? "Stop speech" : "Read aloud"}
                          aria-label="Speech Narration"
                        >
                          {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
                        </button>

                        <button
                          type="button"
                          className="control-btn"
                          onClick={() => handleCopy(msg.id, msg.content)}
                          title="Copy text"
                          aria-label="Copy Message"
                        >
                          {copiedId === msg.id ? (
                            <Check size={13} className="check-copied" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>

                        {msg.status === "error" && (
                          <button
                            type="button"
                            className="control-btn retry"
                            onClick={onRetryLast}
                            title="Retry response"
                            aria-label="Retry"
                          >
                            <RotateCcw size={13} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing status indicator */}
            {isLoading && (
              <div className="message-bubble-row dia-row">
                <div className="dia-avatar-bubble">
                  <img
                    src="/dia/dia_avatar.png"
                    alt="Dia"
                    className="dia-msg-avatar-img"
                  />
                </div>
                <div className="message-bubble-card dia-card thinking-card">
                  <div className="typing-pulse-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className="thinking-note">Dia is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </section>
      )}

      {/* ================================================== */}
      {/* 4. CHAT INPUT DOCK & ACTION CHIPS                  */}
      {/* ================================================== */}
      <section className="dia-chat-input-dock-section">
        {activeDocument && (
          <div className={`dia-composer-attachment-preview ${activeDocument.status}`}>
            <FileText size={14} className="attachment-icon" />
            <div className="attachment-info" style={{ display: 'flex', flexDirection: 'column', paddingLeft: '4px' }}>
              <span className="attachment-name" style={{ fontWeight: 'bold' }}>{activeDocument.fileName}</span>
              <span className="attachment-status" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                {activeDocument.status === 'reading' && 'Reading document...'}
                {activeDocument.status === 'error' && (activeDocument.errorMessage || 'Could not read PDF.')}
                {activeDocument.status === 'ready' && `${activeDocument.pageCount || '?'} pages • PDF processed`}
              </span>
            </div>
            <button 
              type="button" 
              className="attachment-remove-btn"
              title="Remove attachment"
              onClick={() => {
                if (onRemoveDocument) onRemoveDocument();
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            >
              <X size={13} />
            </button>
          </div>
        )}
        {/* Main Pill Input Bar */}
        <form className="dia-pill-input-form" onSubmit={onSendMessage}>
          {/* Voice Microphone Toggle */}
          <button
            type="button"
            className={`dia-input-mic-btn ${isListening ? "listening-active" : ""}`}
            onClick={onToggleVoice}
            disabled={isLoading}
            aria-label={isListening ? "Stop listening" : "Start voice input"}
            title={isListening ? "Listening... click to stop" : "Talk with Dia"}
          >
            {isListening ? <MicOff size={17} /> : <Mic size={17} />}
          </button>

          {/* Primary Text Input */}
          <input
            type="text"
            className="dia-main-text-input"
            value={inputMessage}
            onChange={(e) => onChangeInput(e.target.value)}
            placeholder={
              isListening
                ? "Listening to your voice..."
                : "Type a message or click the mic to talk with Dia..."
            }
            disabled={isLoading}
            aria-label="Message Input"
          />

          {/* Clear input button (if text present) */}
          {inputMessage.trim() && (
            <button
              type="button"
              className="dia-input-clear-btn"
              onClick={onClearInput}
              aria-label="Clear input text"
            >
              <X size={15} />
            </button>
          )}

          {/* Attachment Paperclip Button */}
          <button
            type="button"
            className="dia-input-attach-btn"
            title="Attach file"
            aria-label="Attach File"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip size={16} />
          </button>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.png,.jpg,.jpeg"
            onChange={handleFileChange}
          />

          {/* Quick Stop Button if speaking */}
          {isSpeaking && (
            <button
              type="button"
              className="dia-input-audio-btn is-speaking"
              onClick={onStopSpeaking}
              title="Dia is speaking — click to stop"
              aria-label="Stop speech"
            >
              <VolumeX size={16} className="audio-stop-icon" />
            </button>
          )}

          {/* Glowing Purple Circular Send Button */}
          <button
            type="submit"
            className="dia-input-send-circle-btn"
            disabled={(!inputMessage.trim() && !(activeDocument && activeDocument.status === 'ready')) || isLoading}
            aria-label="Send message"
          >
            {isLoading ? (
              <div className="send-spinner-circle" />
            ) : (
              <Send size={15} />
            )}
          </button>
        </form>

        {/* Action Filter Chips Beneath Input */}
        <div className="dia-input-action-chips">
          <button
            type="button"
            className={`dia-action-chip ${activeChip === "think" ? "active" : ""}`}
            onClick={() => setActiveChip(activeChip === "think" ? "" : "think")}
          >
            <Sparkles size={13} className="chip-icon" />
            <span>Deep Think</span>
          </button>

          <button
            type="button"
            className={`dia-action-chip ${activeChip === "search" ? "active" : ""}`}
            onClick={() => setActiveChip(activeChip === "search" ? "" : "search")}
          >
            <Search size={13} className="chip-icon" />
            <span>Search</span>
          </button>

          <button
            type="button"
            className={`dia-action-chip ${activeChip === "create" ? "active" : ""}`}
            onClick={() => setActiveChip(activeChip === "create" ? "" : "create")}
          >
            <Wand2 size={13} className="chip-icon" />
            <span>Create</span>
          </button>

          <button
            type="button"
            className={`dia-action-chip ${activeChip === "analyze" ? "active" : ""}`}
            onClick={() => setActiveChip(activeChip === "analyze" ? "" : "analyze")}
          >
            <BarChart3 size={13} className="chip-icon" />
            <span>Analyze</span>
          </button>

          <button
            type="button"
            className="dia-action-chip"
            onClick={() => onQuickAction("Show me more features and modes.")}
          >
            <MoreHorizontal size={13} className="chip-icon" />
            <span>More</span>
          </button>
        </div>
      </section>

      {/* ================================================== */}
      {/* 5. LOWER 3 CARDS (Home state only)                 */}
      {/* ================================================== */}
      {!chatStarted && (
        <section className="dia-lower-widgets-row" aria-label="Daily Status Cards">
          {/* Card 1: Now Playing */}
          <div className="dia-widget-card now-playing-card">
            <div className="widget-icon-box music-box">
              <Music size={18} />
            </div>
            <div className="widget-content-stack">
              <span className="widget-sub-label">Now Playing</span>
              <h4 className="widget-main-title">Kesariya</h4>
              <span className="widget-caption">Arijit Singh</span>
            </div>
            <button
              type="button"
              className="music-toggle-btn"
              onClick={() => setIsPlayingMusic(!isPlayingMusic)}
              aria-label={isPlayingMusic ? "Pause Music" : "Play Music"}
            >
              {isPlayingMusic ? <Pause size={14} /> : <Play size={14} />}
            </button>
          </div>

          {/* Card 2: Daily Inspiration */}
          <div className="dia-widget-card inspiration-card">
            <div className="widget-icon-box quote-box">
              <Quote size={18} />
            </div>
            <div className="widget-content-stack">
              <span className="widget-sub-label">Daily Inspiration</span>
              <p className="widget-quote-text">
                “Discipline today creates freedom tomorrow.”
              </p>
            </div>
          </div>

          {/* Card 3: Weather */}
          <div className="dia-widget-card weather-card">
            <div className="widget-icon-box weather-box">
              <CloudSun size={20} className="weather-sun-icon" />
            </div>
            <div className="widget-content-stack">
              <span className="widget-sub-label">Weather</span>
              <h4 className="widget-main-title">28°C</h4>
              <span className="widget-caption">Partly cloudy</span>
            </div>
          </div>
        </section>
      )}

      {/* Center Workspace Footer */}
      {!chatStarted && (
        <div className="dia-workspace-footer">
          <span>Dia v1.0.0 | Made for a smarter you.</span>
        </div>
      )}
    </div>
  );
};


