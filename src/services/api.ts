import type {
  ChatMessage,
  ChatApiResponse,
  OllamaStatusResponse,
  ConversationPayloadMessage,
  OllamaModelInfo,
} from "../types/chat";

const API_BASE_URL = "http://127.0.0.1:5000";

export const chatService = {
  /**
   * Check connection status of Ollama via Express
   */
  async checkOllamaStatus(): Promise<OllamaStatusResponse & { latencyMs?: number; activeModel?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ollama-status`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        return {
          success: false,
          connected: false,
          error: `Server responded with status ${response.status}`,
        };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        connected: false,
        error: error instanceof Error ? error.message : "Unable to reach Dia backend",
      };
    }
  },

  /**
   * Fetch all installed Ollama models
   */
  async getModels(): Promise<{ success: boolean; activeModel: string; models: OllamaModelInfo[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/models`);
      if (!response.ok) {
        throw new Error(`Failed to fetch models: HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      return {
        success: false,
        activeModel: "gemma3:1b",
        models: [],
      };
    }
  },

  /**
   * Switch the active inference model on backend
   */
  async selectModel(modelName: string): Promise<{ success: boolean; activeModel: string; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/models/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: modelName }),
      });
      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to switch model");
    }
  },

  /**
   * Retrieve active system prompt
   */
  async getSystemPrompt(): Promise<{ success: boolean; prompt: string; version: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/system-prompt`);
      return await response.json();
    } catch {
      return {
        success: false,
        prompt: "Dia System Prompt",
        version: "2.0",
      };
    }
  },

  /**
   * Send conversation turns to Dia backend -> Ollama
   */
  async sendMessage(
    messages: ChatMessage[],
    temperature: number = 0.7,
    userName: string = "Lohith",
    memoryContext: string = "", intimateSettings?: { enabled: boolean, level: string }
  ): Promise<string> {
    const payload: ConversationPayloadMessage[] = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: payload,
          temperature,
          userName,
          memoryContext, intimateSettings,
        }),
      });

      let data: ChatApiResponse;
      try {
        data = await response.json();
      } catch {
        throw new Error("Dia backend returned an invalid JSON response.");
      }

      if (!response.ok) {
        throw new Error(data.error || `Dia error (HTTP ${response.status})`);
      }

      if (!data.reply || typeof data.reply !== "string") {
        throw new Error("Dia returned an empty response. Check if model is running in Ollama.");
      }

      return data.reply.trim();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Cannot connect to Dia's backend on port 5000. Please ensure the server is running."
        );
      }
      throw error;
    }
  },

  // --------------------------------------------------------------------------
  // Document Analysis APIs
  // --------------------------------------------------------------------------
  
  async uploadDocument(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.error('[API] Document upload error:', err);
      throw err;
    }
  },

  async summarizeDocument(docId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/${docId}/summarize`, {
        method: 'POST'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Summarize failed: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.error('[API] Summarize error:', err);
      throw err;
    }
  },

  async askDocument(docId: string, question: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/${docId}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Ask failed: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.error('[API] Ask document error:', err);
      throw err;
    }
  },

  async explainDocument(docId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/${docId}/explain`, {
        method: 'POST'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Explain failed: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.error('[API] Explain error:', err);
      throw err;
    }
  },

  async generateStudyNotes(docId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/${docId}/study-notes`, {
        method: 'POST'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Study notes failed: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.error('[API] Study notes error:', err);
      throw err;
    }
  }
};
