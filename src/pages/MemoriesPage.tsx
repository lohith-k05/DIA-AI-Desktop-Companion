import React, { useState, useMemo } from "react";
import {
  Brain,
  Plus,
  Search,
  Trash2,
  Edit3,
  ShieldCheck,
  Calendar,
  X,
  Check,
  Sparkles,
} from "lucide-react";
import type { MemoryItem, MemoryCategory } from "../types/memory";
import { MEMORY_CATEGORIES } from "../types/memory";
import "./MemoriesPage.css";

interface MemoriesPageProps {
  memories: MemoryItem[];
  onAddMemory: (data: { title: string; content: string; category: MemoryCategory }) => void;
  onUpdateMemory: (id: string, updates: Partial<MemoryItem>) => void;
  onDeleteMemory: (id: string) => void;
  onClearAllMemories: () => void;
}

export const MemoriesPage: React.FC<MemoriesPageProps> = ({
  memories,
  onAddMemory,
  onUpdateMemory,
  onDeleteMemory,
  onClearAllMemories,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<MemoryItem | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState<MemoryCategory>("preference");

  // Filter memories by category and search
  const filteredMemories = useMemo(() => {
    return memories.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [memories, selectedCategory, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingMemory(null);
    setFormTitle("");
    setFormContent("");
    setFormCategory("preference");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (memory: MemoryItem) => {
    setEditingMemory(memory);
    setFormTitle(memory.title);
    setFormContent(memory.content);
    setFormCategory(memory.category);
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    if (editingMemory) {
      onUpdateMemory(editingMemory.id, {
        title: formTitle.trim(),
        content: formContent.trim(),
        category: formCategory,
      });
    } else {
      onAddMemory({
        title: formTitle.trim(),
        content: formContent.trim(),
        category: formCategory,
      });
    }

    setIsModalOpen(false);
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="dia-memories-root">
      <div className="memories-container">
        {/* Header */}
        <header className="memories-header">
          <div className="memories-header-copy">
            <div className="memories-title-badge">
              <Brain size={18} className="badge-brain-icon" />
              <h2 className="memories-title">Sovereign Memory Vault</h2>
            </div>
            <p className="memories-subtitle">
              User-approved facts and context Dia remembers across conversations.
            </p>
          </div>

          <div className="memories-header-actions">
            <button
              type="button"
              className="memory-add-btn"
              onClick={handleOpenAddModal}
            >
              <Plus size={16} />
              <span>Add Memory</span>
            </button>

            {memories.length > 0 && (
              <button
                type="button"
                className="memory-purge-btn"
                onClick={onClearAllMemories}
                title="Clear all saved memories"
              >
                <Trash2 size={15} />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </header>

        {/* Privacy Assurance Banner */}
        <div className="memory-privacy-banner">
          <div className="privacy-banner-icon">
            <ShieldCheck size={20} />
          </div>
          <div className="privacy-banner-text">
            <strong>Absolute Local Privacy</strong>
            <p>
              Your memories are stored locally on this machine. Dia will never
              record a memory without your explicit action, and no information is synced to external clouds.
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="memories-filter-toolbar">
          <div className="memories-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search saved memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="memories-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery("")}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="category-filter-chips">
            <button
              type="button"
              className={`category-chip ${selectedCategory === "all" ? "active" : ""}`}
              onClick={() => setSelectedCategory("all")}
            >
              All ({memories.length})
            </button>

            {MEMORY_CATEGORIES.map((cat) => {
              const count = memories.filter((m) => m.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`category-chip ${cat.id} ${
                    selectedCategory === cat.id ? "active" : ""
                  }`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <span>{cat.label}</span>
                  <span className="cat-chip-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Memories Grid */}
        <div className="memories-grid">
          {filteredMemories.length === 0 ? (
            <div className="memories-empty-state">
              <div className="empty-brain-orb">
                <Brain size={36} />
              </div>
              <h3>No memories found</h3>
              <p>
                {searchQuery || selectedCategory !== "all"
                  ? "No memories match your search or filter criteria."
                  : "Dia hasn't stored any long-term memories yet."}
              </p>
              <button
                type="button"
                className="empty-create-btn"
                onClick={handleOpenAddModal}
              >
                <Plus size={15} />
                <span>Create a Memory</span>
              </button>
            </div>
          ) : (
            filteredMemories.map((memory) => {
              const catConfig =
                MEMORY_CATEGORIES.find((c) => c.id === memory.category) ||
                MEMORY_CATEGORIES[0];

              return (
                <div key={memory.id} className="memory-item-card">
                  <div className="memory-card-top">
                    <span className={`memory-category-tag ${catConfig.color}`}>
                      {catConfig.label}
                    </span>

                    <div className="memory-item-actions">
                      <button
                        type="button"
                        className="memory-action-icon-btn"
                        onClick={() => handleOpenEditModal(memory)}
                        title="Edit memory"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        className="memory-action-icon-btn delete"
                        onClick={() => onDeleteMemory(memory.id)}
                        title="Delete memory"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h3 className="memory-item-title">{memory.title}</h3>
                  <p className="memory-item-content">{memory.content}</p>

                  <div className="memory-card-footer">
                    <div className="memory-date-stamp">
                      <Calendar size={12} />
                      <span>{formatDate(memory.createdAt)}</span>
                    </div>
                    <span className="memory-verified-badge">
                      <Sparkles size={11} />
                      <span>Verified Fact</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* ADD / EDIT MEMORY MODAL                              */}
      {/* ---------------------------------------------------- */}
      {isModalOpen && (
        <div className="dia-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="dia-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="dia-modal-header">
              <h3>{editingMemory ? "Edit Memory" : "Add Approved Memory"}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="dia-modal-form">
              <div className="form-group">
                <label htmlFor="mem-title">Memory Title</label>
                <input
                  id="mem-title"
                  type="text"
                  placeholder="e.g. Favorite Coding Paradigm"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="modal-input"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="mem-category">Category</label>
                <select
                  id="mem-category"
                  value={formCategory}
                  onChange={(e) =>
                    setFormCategory(e.target.value as MemoryCategory)
                  }
                  className="modal-select"
                >
                  {MEMORY_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="mem-content">Content / Information</label>
                <textarea
                  id="mem-content"
                  rows={4}
                  placeholder="e.g. Lohith prefers using functional components with explicit TypeScript interfaces."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="modal-textarea"
                  required
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-submit-btn"
                  disabled={!formTitle.trim() || !formContent.trim()}
                >
                  <Check size={16} />
                  <span>{editingMemory ? "Save Changes" : "Save to Vault"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
