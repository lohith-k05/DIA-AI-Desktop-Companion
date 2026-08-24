export type MemoryCategory =
  | "preference"
  | "technical"
  | "personal"
  | "project";

export interface MemoryItem {
  id: string;
  title: string;
  content: string;
  category: MemoryCategory;
  createdAt: string;
  updatedAt: string;
}

export const MEMORY_CATEGORIES: { id: MemoryCategory; label: string; color: string }[] = [
  { id: "preference", label: "Preferences", color: "purple" },
  { id: "technical", label: "Technical Stack", color: "blue" },
  { id: "personal", label: "Personal Facts", color: "pink" },
  { id: "project", label: "Project Context", color: "cyan" },
];
