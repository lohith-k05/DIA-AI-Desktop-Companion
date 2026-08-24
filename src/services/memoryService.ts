import type { MemoryItem, MemoryCategory } from "../types/memory";

const STORAGE_KEY = "dia-sovereign-memories-v1";

const initialDefaultMemories: MemoryItem[] = [
  {
    id: "mem-seed-1",
    title: "Operating System & Environment",
    content: "Lohith operates on a Windows 10/11 desktop with local Ollama setup.",
    category: "technical",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "mem-seed-2",
    title: "Preferred Tech Stack",
    content: "Specializes in React 19, TypeScript, Vite, Node.js Express, and modern dark desktop interfaces.",
    category: "preference",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "mem-seed-3",
    title: "Project Dia Vision",
    content: "Building Dia into a commercial-grade, sovereign Windows AI desktop companion with voice and 3D character readiness.",
    category: "project",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const memoryService = {
  /**
   * Load all saved memories from local storage
   */
  getMemories(): MemoryItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // Seed default initial memories on first run
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDefaultMemories));
        return initialDefaultMemories;
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error("Failed to read memories from storage:", err);
      return [];
    }
  },

  /**
   * Save a new memory
   */
  addMemory(data: { title: string; content: string; category: MemoryCategory }): MemoryItem {
    const memories = this.getMemories();
    const newMemory: MemoryItem = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: data.title.trim(),
      content: data.content.trim(),
      category: data.category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newMemory, ...memories];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newMemory;
  },

  /**
   * Update an existing memory
   */
  updateMemory(id: string, updates: Partial<Omit<MemoryItem, "id" | "createdAt">>): MemoryItem | null {
    const memories = this.getMemories();
    const index = memories.findIndex((m) => m.id === id);
    if (index === -1) return null;

    const existing = memories[index];
    const updated: MemoryItem = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    memories[index] = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
    return updated;
  },

  /**
   * Delete a single memory
   */
  deleteMemory(id: string): boolean {
    const memories = this.getMemories();
    const filtered = memories.filter((m) => m.id !== id);
    if (filtered.length === memories.length) return false;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },

  /**
   * Purge all memories
   */
  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
  },

  /**
   * Compact memories into an injection-ready string for Ollama context
   */
  getMemoryContextString(): string {
    const memories = this.getMemories();
    if (memories.length === 0) return "";

    let context = "SAVED LONG-TERM USER MEMORIES (Strictly approved by user):\n";
    memories.forEach((m) => {
      context += `- [${m.category.toUpperCase()}] ${m.title}: ${m.content}\n`;
    });
    return context.trim();
  },
};
