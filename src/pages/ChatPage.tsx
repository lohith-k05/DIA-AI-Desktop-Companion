import React, { useRef, useEffect, useState } from "react";
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  Download,
  Trash2,
  Sparkles,
  Bot,
  User,
  CornerDownLeft,
  BookmarkPlus,
} from "lucide-react";
import { MarkdownRenderer } from "../components/chat/MarkdownRenderer";
import { BrowserTaskCard } from "../components/chat/BrowserTaskCard";
import { exportConversationToMarkdown } from "../services/chatExport";
import { characterController } from "../services/character/characterController";
import type { ChatMessage } from "../types/chat";
import "./ChatPage.css";

import type { AppSettings } from "../types/settings";
interface ChatPageProps {
  settings?: AppSettings;
  onUpdateSettings?: (updates: Partial<AppSettings>) => void;
  isBrowserMode?: boolean;
  onExitBrowserMode?: () => void;
  messages: ChatMessage[];
  inputMessage: string;
  isLoading: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  activeModel?: string;
  onChangeInput: (text: string) => void;
  onSendMessage: (e?: React.FormEvent) => void;
  onToggleVoice: () => void;
  onSpeakText: (text: string) => void;
  onStopSpeaking: () => void;
  onRetryLast: () => void;
  onClearConversation: () => void;
  onQuickAction: (prompt: string) => void;
  onSaveToNotebook?: (content: string) => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({
  isBrowserMode,
  settings,
  onUpdateSettings,
  onExitBrowserMode,
  messages,
  inputMessage,
  isLoading,
  isListening,
  isSpeaking,
  activeModel = "gemma3:1b",
  onChangeInput,
  onSendMessage,
  onToggleVoice,
  onSpeakText,
  onStopSpeaking,
  onRetryLast,
  onClearConversation,
  onQuickAction,
  onSaveToNotebook,
}) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`;
    }
  }, [inputMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExport = () => {
    exportConversationToMarkdown(messages, activeModel);
  };

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  };

  const sampleStarters = [
    "Write a TypeScript utility function to debounce async requests.",
    "Explain how local Ollama inference works compared to cloud APIs.",
    "Help me design a clean database schema for a notes application.",
    "Give me 3 creative brainstorming concepts for a desktop AI companion.",
  ];

  return (
    <div className="dia-chat-page-root">
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
      {/* ---------------------------------------------------- */}
      {/* CHAT SESSION HEADER                                  */}
      {/* ---------------------------------------------------- */}
      <header className="chat-page-header">
        <div className="chat-header-info">
          <div className="chat-session-badge">
            <Bot size={16} className="badge-bot-icon" />
            <span className="session-title">Dia Conversational Workspace</span>
          </div>
          <div className="session-stats">
            <span className="model-chip">{activeModel}</span>
            <span className="message-counter">
              {messages.length} {messages.length === 1 ? "turn" : "turns"}
            </span>
          </div>
        </div>

        <div className="chat-header-actions">
          {/* Quick Stop Button when speaking */}
          {isSpeaking && (
            <button
              type="button"
              className="chat-action-btn audio-btn is-speaking"
              onClick={onStopSpeaking}
              title="Dia is speaking — click to stop speech"
              aria-label="Stop speech"
            >
              <VolumeX size={15} className="audio-stop-icon" />
              <span>Stop Speech</span>
            </button>
          )}

          <button
            type="button"
            className="chat-action-btn export-btn"
            onClick={handleExport}
            disabled={messages.length === 0}
            title="Download conversation transcript as Markdown"
            aria-label="Export conversation"
          >
            <Download size={15} />
            <span>Export (.md)</span>
          </button>

          <button
            type="button"
            className="chat-action-btn clear-btn"
            onClick={onClearConversation}
            disabled={isLoading || messages.length <= 1}
            title="Clear all messages in conversation"
            aria-label="Clear conversation"
          >
            <Trash2 size={15} />
            <span>Clear</span>
          </button>
        </div>
      </header>

      {/* ---------------------------------------------------- */}
      {/* MESSAGES STREAM VIEWPORT                            */}
      {/* ---------------------------------------------------- */}
      <div className="chat-page-stream" role="log" aria-live="polite">
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <div className="empty-avatar-circle">
              <img
                src="/dia/idle.png"
                alt="Dia"
                className="empty-avatar-img"
              />
            </div>
            <h3>Conversation Empty</h3>
            <p>Start a new dialogue with Dia below or pick a prompt starter.</p>
            <div className="empty-starters-grid">
              {sampleStarters.map((starter, i) => (
                <button
                  key={i}
                  type="button"
                  className="empty-starter-pill"
                  onClick={() => onQuickAction(starter)}
                >
                  <Sparkles size={14} className="starter-icon" />
                  <span>{starter}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="messages-flow-container">
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

            {messages.map((msg) => {
              const isDia = msg.role === "assistant";
              return (
                <div
                  key={msg.id}
                  className={`chat-turn-row ${
                    isDia ? "turn-assistant" : "turn-user"
                  }`}
                >
                  <div className="turn-avatar">
                    {isDia ? (
                      <div className="dia-avatar-frame">
                        <img
                          src="/dia/idle.png"
                          alt="Dia"
                          className="dia-turn-avatar-img"
                        />
                      </div>
                    ) : (
                      <div className="user-avatar-frame">
                        <User size={16} />
                      </div>
                    )}
                  </div>

                  <div className="turn-content-block">
                    <div className="turn-metadata">
                      <span className="turn-sender">
                        {isDia ? "Dia" : "Lohith"}
                      </span>
                      <span className="turn-time">
                        {formatTimestamp(msg.createdAt)}
                      </span>
                      {isDia && msg.model && (
                        <span className="turn-model-tag">{msg.model}</span>
                      )}
                    </div>

                    <div
                      className={`turn-bubble ${
                        isDia ? "dia-turn-bubble" : "user-turn-bubble"
                      } ${msg.status === "error" ? "bubble-error" : ""}`}
                    >
                      {msg.content.startsWith("BROWSER_TASK:") ? (
                        <BrowserTaskCard 
                          tool={JSON.parse(msg.content.replace("BROWSER_TASK:", "")).tool} 
                          args={JSON.parse(msg.content.replace("BROWSER_TASK:", "")).arguments} 
                        />
                      ) : (
                        <MarkdownRenderer content={msg.content} />
                      )}
                    </div>

                    {/* Action Bar for Dia messages */}
                    {isDia && (
                      <div className="turn-actions-bar">
                        <button
                          type="button"
                          className="turn-action-button"
                          onClick={() =>
                            isSpeaking
                              ? onStopSpeaking()
                              : onSpeakText(msg.content)
                          }
                          title={isSpeaking ? "Stop speaking" : "Listen to speech"}
                          aria-label="Toggle text-to-speech"
                        >
                          {isSpeaking ? (
                            <VolumeX size={14} />
                          ) : (
                            <Volume2 size={14} />
                          )}
                          <span>{isSpeaking ? "Stop" : "Listen"}</span>
                        </button>

                        <button
                          type="button"
                          className="turn-action-button"
                          onClick={() => handleCopy(msg.id, msg.content)}
                          title="Copy message to clipboard"
                          aria-label="Copy message"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check size={14} className="copied-check" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        {onSaveToNotebook && (
                          <button
                            type="button"
                            className="turn-action-button"
                            onClick={() => {
                              onSaveToNotebook(msg.content);
                              setSavedId(msg.id);
                              setTimeout(() => setSavedId(null), 2500);
                            }}
                            title="Save response to Notebook"
                            aria-label="Save to Notebook"
                          >
                            {savedId === msg.id ? (
                              <>
                                <Check size={14} className="copied-check" />
                                <span>Saved</span>
                              </>
                            ) : (
                              <>
                                <BookmarkPlus size={14} />
                                <span>Notebook</span>
                              </>
                            )}
                          </button>
                        )}

                        {msg.status === "error" && (
                          <button
                            type="button"
                            className="turn-action-button retry-btn"
                            onClick={onRetryLast}
                            title="Retry response generation"
                            aria-label="Retry generation"
                          >
                            <RotateCcw size={14} />
                            <span>Retry</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Loading typing bubble */}
            {isLoading && (
              <div className="chat-turn-row turn-assistant">
                <div className="turn-avatar">
                  <div className="dia-avatar-frame thinking-frame">
                    <img
                      src="/dia/idle.png"
                      alt="Dia"
                      className="dia-turn-avatar-img"
                    />
                  </div>
                </div>
                <div className="turn-content-block">
                  <div className="turn-metadata">
                    <span className="turn-sender">Dia</span>
                    <span className="turn-thinking-label">Thinking...</span>
                  </div>
                  <div className="turn-bubble dia-turn-bubble thinking-bubble-box">
                    <div className="typing-dot-wave">
                      <span />
                      <span />
                      <span />
                    </div>
                    <span className="thinking-text">
                      Synthesizing response with {activeModel}...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* BOTTOM INPUT CONSOLE                                */}
      {/* ---------------------------------------------------- */}
      <footer className="chat-page-footer">
        <form className="chat-input-form" onSubmit={onSendMessage}>
          <button
            type="button"
            className={`chat-voice-trigger ${isListening ? "listening-active" : ""}`}
            onClick={onToggleVoice}
            disabled={isLoading}
            title={isListening ? "Click to stop listening" : "Click to speak"}
            aria-label="Voice input"
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          {/* Quick Stop Button when speaking */}
          {isSpeaking && (
            <button
              type="button"
              className="chat-voice-trigger audio-quick-btn is-speaking"
              onClick={onStopSpeaking}
              title="Dia is speaking — click to stop"
              aria-label="Stop speech"
            >
              <VolumeX size={17} className="speaking-stop-icon" />
            </button>
          )}

          <textarea
            ref={textareaRef}
            className="chat-textarea"
            rows={1}
            value={inputMessage}
            onChange={(e) => {
              onChangeInput(e.target.value);
              characterController.dispatchEvent({ type: "USER_STARTED_TYPING" });
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? "Listening... speak now"
                : "Type your message to Dia... (Enter to send, Shift+Enter for new line)"
            }
            disabled={isLoading}
            aria-label="Message Dia"
          />

          <button
            type="submit"
            className="chat-submit-btn"
            disabled={!inputMessage.trim() || isLoading}
            aria-label="Send message"
          >
            {isLoading ? (
              <div className="chat-submit-spinner" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </form>

        <div className="chat-input-hints">
          <div className="hint-item">
            <CornerDownLeft size={11} />
            <span>Enter to Send</span>
          </div>
          <span className="hint-divider">•</span>
          <div className="hint-item">
            <span>Shift + Enter for new line</span>
          </div>
          <span className="hint-divider">•</span>
          <div className="hint-item">
            <span>Markdown supported</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
