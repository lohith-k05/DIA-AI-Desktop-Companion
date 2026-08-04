import { useEffect, useRef, useState, type FormEvent } from "react";
import { AppShell } from "./components/layout/AppShell";
import { HomePage } from "./pages/HomePage";
import { ChatPage } from "./pages/ChatPage";
import { VoicePage } from "./pages/VoicePage";
import { MemoriesPage } from "./pages/MemoriesPage";
import { ToolsPage } from "./pages/ToolsPage";
import { NotebookPage } from "./pages/NotebookPage";
import { SettingsPage } from "./pages/SettingsPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { chatService } from "./services/api";
import { memoryService } from "./services/memoryService";
import { notebookService } from "./services/notebookService";
import { characterController } from "./services/character/characterController";
import { voiceService, cleanTextForSpeech } from "./services/voiceService";
import { offlineVoiceService } from "./services/offlineVoiceService";
import type { ChatMessage, ActiveDocument } from "./types/chat";
import type { NavigationPage } from "./types/navigation";
import type { CharacterActivity } from "./types/character";
import type { CharacterExpression } from "./components/character/expressionTypes";
import type { MemoryItem, MemoryCategory } from "./types/memory";
import type { Note } from "./types/notebook";
import { DEFAULT_SETTINGS, type AppSettings } from "./types/settings";
import "./styles/globals.css";
import "./App.css";

// --------------------------------------------------
// Web Speech API Types
// --------------------------------------------------
type SpeechRecognitionResultEventLike = Event & {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
};

type SpeechRecognitionErrorEventLike = Event & {
  error?: string;
};

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const STORAGE_MESSAGES_KEY = "dia-chat-messages-v1";
const STORAGE_SETTINGS_KEY = "dia-settings-v1";

export function App() {
  // ------------------------------------------------
  // Settings State
  // ------------------------------------------------
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          characterRenderer: "image-sprite",
          voiceEnabled: parsed.voiceEnabled !== undefined ? parsed.voiceEnabled : true,
          speechVolume: typeof parsed.speechVolume === "number" ? parsed.speechVolume : 1.0,
        };
      }
    } catch (err) {
      console.error("Failed to load saved settings:", err);
    }
    return DEFAULT_SETTINGS;
  });

  // ------------------------------------------------
  // Long-Term Sovereign Memories State
  // ------------------------------------------------
  const [memories, setMemories] = useState<MemoryItem[]>(() => {
    return memoryService.getMemories();
  });

  // ------------------------------------------------
  // Knowledge Notebook State
  // ------------------------------------------------
  const [notes, setNotes] = useState<Note[]>(() => {
    return notebookService.getNotes();
  });

  // ------------------------------------------------
  // Navigation & AI Connectivity State
  // ------------------------------------------------
  const [currentPage, setCurrentPage] = useState<NavigationPage>("home");
  const [isAiConnected, setIsAiConnected] = useState(false);
  const [activeModel, setActiveModel] = useState(settings.activeModel);


  // ------------------------------------------------
  // Chat & Activity State
  // ------------------------------------------------
  const [inputMessage, setInputMessage] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [chatStarted, setChatStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBrowserMode, setIsBrowserMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [offlineVoiceMode, setOfflineVoiceMode] = useState(false);
  const [activity, setActivity] = useState<CharacterActivity>("idle");
  const [expression, setExpression] = useState<CharacterExpression>("neutral");

  const [activeDocument, setActiveDocument] = useState<ActiveDocument | null>(null);

  const handleUploadDocument = async (file: File) => {
    setActiveDocument({
      id: "temp",
      fileName: file.name,
      status: "reading"
    });
    
    try {
      const res = await chatService.uploadDocument(file);
      if (res.success && res.document) {
        setActiveDocument({
          id: res.document.id,
          fileName: res.document.fileName,
          pageCount: res.document.pageCount,
          status: "ready"
        });
      } else {
        throw new Error(res.error || "Failed to process PDF.");
      }
    } catch (err: any) {
      setActiveDocument({
        id: "error",
        fileName: file.name,
        status: "error",
        errorMessage: err.message || "Could not read PDF. This may be a scanned/image-only PDF."
      });
    }
  };

  const handleRemoveDocument = () => {
    setActiveDocument(null);
  };

  // Load saved messages from LocalStorage
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MESSAGES_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((m: any, idx: number) => ({
          id: String(m.id || `msg-${idx}`),
          role: m.role || (m.sender === "user" ? "user" : "assistant"),
          content: m.content || m.text || "",
          createdAt: m.createdAt || new Date().toISOString(),
          status: m.status || "complete",
          model: m.model || "gemma3:1b",
        }));
      }
      return [];
    } catch {
      return [];
    }
  });

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  // ------------------------------------------------
  // Probe Ollama Connection & Subscribe to Character Updates
  // ------------------------------------------------
  useEffect(() => {
    const checkConnection = async () => {
      const status = await chatService.checkOllamaStatus();
      setIsAiConnected(status.connected);
      if (status.activeModel) {
        setActiveModel(status.activeModel);
      } else if (status.models && status.models.length > 0) {
        setActiveModel(status.models[0].name);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 15000);
    characterController.dispatchEvent({ type: "APP_READY" });

    const unsubscribeChar = characterController.subscribe((ctrlState) => {
      if (ctrlState.expression) {
        setExpression(ctrlState.expression as CharacterExpression);
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribeChar();
    };
  }, []);

  // Sync settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch (err) {
      console.error("Unable to save settings to local storage:", err);
    }
  }, [settings]);

  // Sync messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(messages));
    } catch (err) {
      console.error("Unable to save messages to local storage:", err);
    }
  }, [messages]);

  // Sync Activity state
  useEffect(() => {
    if (isLoading) {
      setActivity("thinking");
    } else if (isListening) {
      setActivity("listening");
    } else if (isSpeaking) {
      setActivity("speaking");
    } else {
      setActivity("idle");
    }
  }, [isLoading, isListening, isSpeaking]);

  // Subscribe to voices and ensure a female voice is automatically selected if none or invalid
  useEffect(() => {
    const unsubscribe = voiceService.subscribe((voices) => {
      if (voices.length > 0) {
        setSettings((prev) => {
          const currentVoice = prev.speechVoiceName
            ? voices.find((v) => v.name === prev.speechVoiceName)
            : null;

          if (!currentVoice) {
            const best = voiceService.findBestVoice(prev.speechVoiceName, prev.speechVoiceLang, voices);
            if (best) {
              return {
                ...prev,
                speechVoiceName: best.name,
                speechVoiceLang: best.lang,
              };
            }
          }
          return prev;
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Cleanup speech APIs on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      voiceService.stop();
    };
  }, []);
  // ------------------------------------------------
  // Text-To-Speech (SpeechSynthesis via voiceService or offlineVoiceService)
  // ------------------------------------------------
  const speakDiaReply = async (text: string) => {
    if (!settings.voiceEnabled) {
      return;
    }

    if (offlineVoiceMode) {
      try {
        setIsSpeaking(true);
        characterController.dispatchEvent({ type: "TTS_STARTED", text });
        
        const safeText = cleanTextForSpeech(text);

        if (!safeText.trim()) {
           setIsSpeaking(false);
           characterController.dispatchEvent({ type: "TTS_ENDED" });
           return;
        }

        const url = await offlineVoiceService.synthesize(safeText);
        offlineVoiceService.playAudio(url, {
          onStart: () => {},
          onEnd: () => {
            setIsSpeaking(false);
            characterController.dispatchEvent({ type: "TTS_ENDED" });
          },
          onError: (err) => {
            console.error("Offline TTS play error:", err);
            setIsSpeaking(false);
            characterController.dispatchEvent({ type: "TTS_ENDED" });
            alert("Offline voice is not configured. Please install or select an offline voice model.");
          }
        });
      } catch (err: any) {
        console.error("Offline TTS request failed:", err);
        setIsSpeaking(false);
        characterController.dispatchEvent({ type: "TTS_ENDED" });
        alert("Offline voice is not configured. Please install or select an offline voice model.");
      }
    } else {
      
      let targetPitch = settings.speechPitch;
      let targetRate = settings.speechRate;
      
      if (settings.intimateModeEnabled) {
        if (settings.intimateVoicePersonality === "warm") {
          targetPitch = 0.9;
          targetRate = 0.95;
        } else if (settings.intimateVoicePersonality === "playful") {
          targetPitch = 1.1;
          targetRate = 1.05;
        } else if (settings.intimateVoicePersonality === "romantic") {
          targetPitch = 0.85;
          targetRate = 0.9;
        }
      }
      voiceService.speak(text, {
        voiceName: settings.speechVoiceName,
        voiceLang: settings.speechVoiceLang,
        rate: targetRate,
        pitch: targetPitch,
        volume: settings.speechVolume ?? 1.0,
        enabled: settings.voiceEnabled,
        onStart: () => {
          setIsSpeaking(true);
          characterController.dispatchEvent({ type: "TTS_STARTED", text });
        },
        onEnd: () => {
          setIsSpeaking(false);
          characterController.dispatchEvent({ type: "TTS_ENDED" });
        },
        onPause: () => {
          setIsSpeaking(false);
          characterController.dispatchEvent({ type: "TTS_ENDED" });
        },
        onResume: () => {
          setIsSpeaking(true);
          characterController.dispatchEvent({ type: "TTS_STARTED", text });
        },
        onError: (err) => {
          console.error("SpeechSynthesis error:", err);
          setIsSpeaking(false);
          characterController.dispatchEvent({ type: "TTS_ENDED" });
        }
      });
    }
  };

  const stopSpeaking = () => {
    if (offlineVoiceMode) {
      offlineVoiceService.cancel();
    } else {
      voiceService.stop();
    }
    setIsSpeaking(false);
    characterController.dispatchEvent({ type: "TTS_ENDED" });
  };

  // ------------------------------------------------  // Dispatch Chat Turn (with injected Long-Term Memories)
  // ------------------------------------------------
  const executeSendMessage = async (rawMessage: string, file?: File | null) => {
    const trimmed = rawMessage.trim();
    if ((!trimmed && !(activeDocument && activeDocument.status === 'ready') && !file) || isLoading) return;

    setChatStarted(true);
    characterController.dispatchEvent({ type: "USER_SENT_MESSAGE", messageText: trimmed });
    characterController.dispatchEvent({ type: "AI_REQUEST_STARTED" });

    let contentToDisplay = trimmed;
    if (activeDocument && activeDocument.status === 'ready' && (!trimmed || trimmed === '')) {
       contentToDisplay = `[Attached Document: ${activeDocument.fileName}]`;
    }

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: contentToDisplay,
      createdAt: new Date().toISOString(),
      status: "complete",
    };

    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInputMessage("");
    setIsLoading(true);

    const memoryContext = memoryService.getMemoryContextString();

    try {
      let diaReply = "";
      
      if (activeDocument && activeDocument.status === 'ready') {
        const lowerTrimmed = trimmed.toLowerCase();
        if (lowerTrimmed === 'summarize this' || lowerTrimmed.includes('summarize this pdf') || lowerTrimmed.includes('summarize the document') || lowerTrimmed.includes('summarize this document') || lowerTrimmed.includes('summarize it') || lowerTrimmed === '') {
          const askRes = await chatService.summarizeDocument(activeDocument.id);
          diaReply = askRes.answer;
        } else {
           const askRes = await chatService.askDocument(activeDocument.id, trimmed);
           diaReply = askRes.answer;
           if (askRes.sources && askRes.sources.length > 0) {
             const pages = [...new Set(askRes.sources.map((s: any) => s.pageStart))].join(', ');
             diaReply += `\n\n*(Sources: Page ${pages})*`;
           }
        }
      } else {
        diaReply = await chatService.sendMessage(
          updatedHistory,
          settings.temperature,
          settings.userName,
          memoryContext,
          { enabled: settings.intimateModeEnabled, level: settings.intimateAffectionLevel }
        );
      }

      characterController.dispatchEvent({ type: "AI_REQUEST_COMPLETED", replyText: diaReply });

      const assistantMessage: ChatMessage = {
        id: `dia-${Date.now()}`,
        role: "assistant",
        content: diaReply,
        createdAt: new Date().toISOString(),
        status: "complete",
        model: activeModel,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Audio plays directly without human activation
      if (diaReply.startsWith("BROWSER_TASK:")) {
          speakDiaReply("Executing browser action.");
        } else {
          speakDiaReply(diaReply);
        }
    } catch (error) {
      console.error("Message transmission error:", error);
      const errorText =
        error instanceof Error
          ? error.message
          : "Unable to connect to Dia's local AI brain. Make sure Ollama is running.";

      characterController.dispatchEvent({ type: "AI_REQUEST_FAILED", error: errorText });

      const errorMessage: ChatMessage = {
        id: `dia-err-${Date.now()}`,
        role: "assistant",
        content: errorText,
        createdAt: new Date().toISOString(),
        status: "error",
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------------------------------------
  // Speech-To-Text (Web Speech API)
  // ------------------------------------------------
  const handleToggleVoice = () => {
    if (isLoading) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      characterController.dispatchEvent({ type: "VOICE_LISTENING_STOPPED" });
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Speech recognition is not supported in this environment. Please use Google Chrome or Microsoft Edge."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionResultEventLike) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const item = event.results[i];
        if (item.isFinal) {
          final += item[0].transcript;
        } else {
          interim += item[0].transcript;
        }
      }

      const textToShow = (final || interim).trim();
      if (textToShow) {
        setLiveTranscript(textToShow);
        setInputMessage(textToShow);
      }

      if (final.trim()) {
        if (currentPage === "voice") {
          executeSendMessage(final.trim());
          setLiveTranscript(final.trim());
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      setIsListening(false);
      characterController.dispatchEvent({ type: "VOICE_LISTENING_STOPPED" });
      if (event.error === "not-allowed") {
        alert("Microphone permission was denied. Please allow microphone access in browser settings.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      characterController.dispatchEvent({ type: "VOICE_LISTENING_STOPPED" });
    };
    recognitionRef.current = recognition;
    setIsListening(true);
    characterController.dispatchEvent({ type: "VOICE_LISTENING_STARTED" });

    try {
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleSendMessage = (e?: FormEvent) => {
    e?.preventDefault();
    executeSendMessage(inputMessage);
  };

  const handleQuickAction = (text: string) => {
    if (text === "/browser_mode") {
      setIsBrowserMode(true);
            const diaMsg: ChatMessage = {
        id: `dia-${Date.now()}`,
        role: "assistant",
        content: "Browser automation is ready. What task would you like me to do for you?",
        createdAt: new Date().toISOString(),
        status: "complete",
        model: activeModel,
      };
      setMessages((prev) => [...prev, diaMsg]);
      speakDiaReply(diaMsg.content);
      return;
    }
    executeSendMessage(text);
  };  // ------------------------------------------------
  // Offline Voice Handler
  // ------------------------------------------------
  const handleToggleOfflineVoice = async () => {
    if (isLoading) return;

    // If currently listening -> stop and transcribe
    if (isListening) {
      try {
        const wavBlob = await offlineVoiceService.stopRecording();
        setIsListening(false);
        characterController.dispatchEvent({ type: "VOICE_LISTENING_STOPPED" });

        if (!wavBlob) return;

        setIsLoading(true);
        characterController.dispatchEvent({ type: "AI_REQUEST_STARTED" });

        const transcript = await offlineVoiceService.transcribe(wavBlob);

        if (!transcript) {
          setIsLoading(false);
          characterController.dispatchEvent({ type: "AI_REQUEST_COMPLETED" });
          return;
        }

        setLiveTranscript(transcript);
        setInputMessage(transcript);

        // Send to existing AI pipeline (Ollama - unchanged)
        await executeSendMessage(transcript);

      } catch (err: any) {
        console.error("[Offline STT] Error:", err);
        setIsListening(false);
        setIsLoading(false);
        characterController.dispatchEvent({ type: "VOICE_LISTENING_STOPPED" });
        alert(`Offline STT error: ${err.message}`);
      }
      return;
    }

    // Start recording
    try {
      await offlineVoiceService.startRecording();
      setIsListening(true);
      setLiveTranscript("");
      characterController.dispatchEvent({ type: "VOICE_LISTENING_STARTED" });
    } catch (err: any) {
      console.error("[Offline Recording] Error:", err);
      alert(`Microphone error: ${err.message}`);
    }
  };

  const handleRetryLast = () => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMessage) {
      executeSendMessage(lastUserMessage.content);
    }
  };

  // ------------------------------------------------
  // Memory Vault Handlers
  // ------------------------------------------------
  const handleAddMemory = (data: { title: string; content: string; category: MemoryCategory }) => {
    memoryService.addMemory(data);
    setMemories(memoryService.getMemories());
  };

  const handleUpdateMemory = (id: string, updates: Partial<MemoryItem>) => {
    memoryService.updateMemory(id, updates);
    setMemories(memoryService.getMemories());
  };

  const handleDeleteMemory = (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this memory?");
    if (confirmed) {
      memoryService.deleteMemory(id);
      setMemories(memoryService.getMemories());
    }
  };

  const handleClearAllMemories = () => {
    const confirmed = window.confirm("Purge all memories from the vault? This cannot be undone.");
    if (confirmed) {
      memoryService.clearAll();
      setMemories([]);
    }
  };

  // ------------------------------------------------
  // Notebook Handlers
  // ------------------------------------------------
  const handleAddNote = (data: { title: string; content: string; tags: string[]; pinned?: boolean }) => {
    const created = notebookService.addNote(data);
    setNotes(notebookService.getNotes());
    return created;
  };

  const handleUpdateNote = (id: string, updates: Partial<Note>) => {
    notebookService.updateNote(id, updates);
    setNotes(notebookService.getNotes());
  };

  const handleDeleteNote = (id: string) => {
    notebookService.deleteNote(id);
    setNotes(notebookService.getNotes());
  };

  const handleTogglePinNote = (id: string) => {
    notebookService.togglePin(id);
    setNotes(notebookService.getNotes());
  };

  const handleExportNote = (note: Note) => {
    notebookService.exportNoteAsMarkdown(note);
  };

  const handleSaveChatToNotebook = (content: string) => {
    const previewTitle = content.slice(0, 40).replace(/\n/g, " ");
    const noteTitle = `Chat Insight: ${previewTitle}...`;
    handleAddNote({
      title: noteTitle,
      content,
      tags: ["Chat", "AI-Generated"],
      pinned: false,
    });
    alert("Saved message to Notebook!");
  };

  // ------------------------------------------------
  // Settings Handlers
  // ------------------------------------------------
  const handleUpdateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(next));
      } catch (err) {
        console.error("Unable to save settings to local storage:", err);
      }
      return next;
    });

    if (updates.activeModel) {
      setActiveModel(updates.activeModel);
      chatService.selectModel(updates.activeModel).catch(console.error);
    }
  };

  const handleToggleRenderer = () => {
    // Option 1: Official realistic 2D character is locked as canonical identity
    handleUpdateSettings({ characterRenderer: "image-sprite" });
    try {
      localStorage.setItem("dia-character-renderer-mode", "image-sprite");
    } catch {
      // Ignore
    }
  };

  const handleResetSettings = () => {
    const confirmed = window.confirm("Reset all settings to default values?");
    if (confirmed) {
      const bestVoice = voiceService.findBestVoice();
      setSettings({
        ...DEFAULT_SETTINGS,
        speechVoiceName: bestVoice ? bestVoice.name : "",
        speechVoiceLang: bestVoice ? bestVoice.lang : "",
      });
      setActiveModel(DEFAULT_SETTINGS.activeModel);
      chatService.selectModel(DEFAULT_SETTINGS.activeModel).catch(console.error);
    }
  };

  // ------------------------------------------------
  // Clear Conversation
  // ------------------------------------------------
  const handleClearConversation = () => {
    if (isLoading) {
      alert("Please wait until Dia finishes her response.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to clear your entire conversation history? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      localStorage.removeItem(STORAGE_MESSAGES_KEY);
    } catch (err) {
      console.error("Error clearing local storage:", err);
    }

    setMessages([]);
    setInputMessage("");
    setLiveTranscript("");
    setChatStarted(false);
    stopSpeaking();
  };

  const lastDiaReply = [...messages].reverse().find((m) => m.role === "assistant");

  // ------------------------------------------------
  // Workspace Dynamic View Router
  // ------------------------------------------------
  const renderWorkspaceContent = () => {
    if (currentPage === "home") {
      return (
        <HomePage
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            isBrowserMode={isBrowserMode}
            onExitBrowserMode={() => setIsBrowserMode(false)}
            messages={messages}
          chatStarted={chatStarted}
          inputMessage={inputMessage}
          isLoading={isLoading}
          isListening={isListening}
          isSpeaking={isSpeaking}
          activity={activity}
          expression={expression}
          characterRenderer={settings.characterRenderer}
          onToggleRenderer={handleToggleRenderer}
          onChangeInput={setInputMessage}
          onSendMessage={handleSendMessage}
          onToggleVoice={handleToggleVoice}
          activeDocument={activeDocument}
          onUploadDocument={handleUploadDocument}
          onRemoveDocument={handleRemoveDocument}
          onClearInput={() => setInputMessage("")}
          onQuickAction={handleQuickAction}
          onSpeakText={speakDiaReply}
          onStopSpeaking={stopSpeaking}
          onRetryLast={handleRetryLast}
        />
      );
    }

    if (currentPage === "chat") {
      return (
        <ChatPage
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            isBrowserMode={isBrowserMode}
            onExitBrowserMode={() => setIsBrowserMode(false)}
            messages={messages}
          inputMessage={inputMessage}
          isLoading={isLoading}
          isListening={isListening}
          isSpeaking={isSpeaking}
          activeModel={activeModel}
          onChangeInput={setInputMessage}
          onSendMessage={handleSendMessage}
          onToggleVoice={handleToggleVoice}
          onSpeakText={speakDiaReply}
          onStopSpeaking={stopSpeaking}
          onRetryLast={handleRetryLast}
          onClearConversation={handleClearConversation}
          onQuickAction={handleQuickAction}
          onSaveToNotebook={handleSaveChatToNotebook}
        />
      );
    }

    if (currentPage === "voice") {
      return (
        <VoicePage
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          activity={activity}
          expression={expression}
          isListening={isListening}
          isSpeaking={isSpeaking}
          isLoading={isLoading}
          activeModel={activeModel}
          transcriptText={liveTranscript}
          lastDiaReply={lastDiaReply}
          characterRenderer={settings.characterRenderer}
          onToggleRenderer={handleToggleRenderer}
          onToggleVoice={handleToggleVoice}
          onToggleOfflineVoice={handleToggleOfflineVoice}
          offlineVoiceMode={offlineVoiceMode}
          onToggleOfflineMode={() => setOfflineVoiceMode((v) => !v)}
          onStopSpeaking={stopSpeaking}
          onSpeakText={speakDiaReply}
          onQuickPrompt={(prompt) => executeSendMessage(prompt)}
        />
      );
    }

    if (currentPage === "memories") {
      return (
        <MemoriesPage
          memories={memories}
          onAddMemory={handleAddMemory}
          onUpdateMemory={handleUpdateMemory}
          onDeleteMemory={handleDeleteMemory}
          onClearAllMemories={handleClearAllMemories}
        />
      );
    }

    if (currentPage === "tools") {
      return <ToolsPage />;
    }

    if (currentPage === "notebook" || currentPage === "notes") {
      return (
        <NotebookPage
          notes={notes}
          onAddNote={handleAddNote}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={handleDeleteNote}
          onTogglePin={handleTogglePinNote}
          onExportNote={handleExportNote}
        />
      );
    }

    if (currentPage === "settings") {
      return (
        <SettingsPage
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onResetSettings={handleResetSettings}
          messageCount={messages.length}
          onClearConversation={handleClearConversation}
          currentExpression={expression}
          onTestExpression={(expr) =>
            characterController.dispatchEvent({
              type: "SET_EXPRESSION",
              expression: expr,
              intensity: 0.85,
              duration: 5000,
            })
          }
        />
      );
    }

    
    return (
      <PlaceholderPage
        page={currentPage}
        onReturnHome={() => setCurrentPage("home")}
      />
    );
  };

  return (
    <AppShell
      currentPage={currentPage}
      onSelectPage={(page) => setCurrentPage(page)}
      isAiConnected={isAiConnected}
      activeModel={activeModel}
      activity={activity}
      messageCount={messages.length}
      isSpeaking={isSpeaking}
      onStopSpeaking={stopSpeaking}
      onClearConversation={handleClearConversation}
      onTriggerPrompt={handleQuickAction}
    >
      {renderWorkspaceContent()}
    </AppShell>
  );
}

export default App;