import type { Note } from "../types/notebook";

const STORAGE_KEY = "dia-sovereign-notebook-v1";

const initialDefaultNotes: Note[] = [
  {
    id: "note-seed-1",
    title: "Dia Architecture Blueprint & Design Principles",
    content: `# Dia AI Architecture Blueprint

Dia is engineered as a sovereign, local-first Windows companion:

- **Frontend**: React 19 + TypeScript + Vite + Modular CSS
- **Backend**: Node.js Express 5 gateway
- **AI Engine**: Ollama daemon at http://127.0.0.1:11434
- **Active Model**: gemma3:1b (fast, lightweight, highly responsive)
- **Audio**: Web Speech API STT + SpeechSynthesis TTS
- **Packaging Target**: Tauri 2.0 native Windows binary (\`Dia.exe\`)

### Core Guarantees
1. Zero unapproved cloud sync.
2. Complete transparency and local data sovereignty.
3. Decoupled 2D sprite to 3D VRM character bridge.`,
    tags: ["architecture", "dia", "roadmap"],
    pinned: true,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "note-seed-2",
    title: "Useful Ollama Commands & Model Library",
    content: `### Managing Local Ollama Models

Run these commands in Windows PowerShell:

\`\`\`powershell
# List installed models
ollama list

# Pull lightweight vision / conversation model
ollama pull llama3.2:1b

# Pull coding powerhouse
ollama pull qwen2.5-coder:1.5b

# Check Ollama daemon service status
Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags"
\`\`\`

Dia automatically discovers newly pulled models in the **Settings** console!`,
    tags: ["ollama", "models", "terminal"],
    pinned: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];

export const notebookService = {
  getNotes(): Note[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDefaultNotes));
        return initialDefaultNotes;
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  addNote(data: { title: string; content: string; tags: string[]; pinned?: boolean }): Note {
    const notes = this.getNotes();
    const newNote: Note = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: data.title.trim() || "Untitled Note",
      content: data.content.trim(),
      tags: data.tags || [],
      pinned: !!data.pinned,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newNote, ...notes];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newNote;
  },

  updateNote(id: string, updates: Partial<Omit<Note, "id" | "createdAt">>): Note | null {
    const notes = this.getNotes();
    const index = notes.findIndex((n) => n.id === id);
    if (index === -1) return null;

    const updated: Note = {
      ...notes[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    notes[index] = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    return updated;
  },

  deleteNote(id: string): boolean {
    const notes = this.getNotes();
    const filtered = notes.filter((n) => n.id !== id);
    if (filtered.length === notes.length) return false;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },

  togglePin(id: string): Note | null {
    const notes = this.getNotes();
    const note = notes.find((n) => n.id === id);
    if (!note) return null;

    return this.updateNote(id, { pinned: !note.pinned });
  },

  exportNoteAsMarkdown(note: Note): void {
    const header = `---
title: "${note.title}"
date: "${new Date(note.updatedAt).toLocaleDateString()}"
tags: [${note.tags.map((t) => `"${t}"`).join(", ")}]
---

`;
    const fullContent = `${header}# ${note.title}\n\n${note.content}\n`;
    const blob = new Blob([fullContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const sanitizedTitle = note.title.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();

    link.href = url;
    link.download = `${sanitizedTitle || "note"}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
