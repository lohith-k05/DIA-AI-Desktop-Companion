import React, { useState, useMemo } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Pin,
  Trash2,
  Download,
  Eye,
  Edit3,
  Tag,
  X,
} from "lucide-react";
import { MarkdownRenderer } from "../components/chat/MarkdownRenderer";
import type { Note } from "../types/notebook";
import "./NotebookPage.css";

interface NotebookPageProps {
  notes: Note[];
  onAddNote: (data: { title: string; content: string; tags: string[]; pinned?: boolean }) => Note;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (id: string) => void;
  onExportNote: (note: Note) => void;
}

export const NotebookPage: React.FC<NotebookPageProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onTogglePin,
  onExportNote,
}) => {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(
    notes.length > 0 ? notes[0].id : null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [tagInput, setTagInput] = useState("");

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [notes]);

  // Filtered & Pinned-sorted notes
  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => {
        const matchesTag =
          selectedTag === "all" || n.tags.includes(selectedTag);
        const matchesSearch =
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.content.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTag && matchesSearch;
      })
      .sort((a, b) => {
        // Pinned notes first, then latest updated
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [notes, selectedTag, searchQuery]);

  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === selectedNoteId) || null;
  }, [notes, selectedNoteId]);

  const handleCreateNewNote = () => {
    const created = onAddNote({
      title: "New Thought",
      content: "Start writing your notes, research, or documentation here in Markdown...",
      tags: ["general"],
    });
    setSelectedNoteId(created.id);
    setViewMode("edit");
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim() && activeNote) {
      e.preventDefault();
      const clean = tagInput.trim().toLowerCase();
      if (!activeNote.tags.includes(clean)) {
        onUpdateNote(activeNote.id, {
          tags: [...activeNote.tags, clean],
        });
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!activeNote) return;
    onUpdateNote(activeNote.id, {
      tags: activeNote.tags.filter((t) => t !== tagToRemove),
    });
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="dia-notebook-root">
      {/* ---------------------------------------------------- */}
      {/* LEFT PANE: NOTES EXPLORER                            */}
      {/* ---------------------------------------------------- */}
      <aside className="notebook-explorer-pane">
        <div className="explorer-header">
          <div className="explorer-title-box">
            <BookOpen size={16} className="book-icon" />
            <h3>Notebook</h3>
            <span className="notes-counter-badge">{notes.length}</span>
          </div>

          <button
            type="button"
            className="new-note-btn"
            onClick={handleCreateNewNote}
            title="Create new note"
          >
            <Plus size={15} />
            <span>New Note</span>
          </button>
        </div>

        {/* Search */}
        <div className="explorer-search-box">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="explorer-search-input"
          />
        </div>

        {/* Tag Filters */}
        <div className="explorer-tag-chips">
          <button
            type="button"
            className={`explorer-tag-chip ${selectedTag === "all" ? "active" : ""}`}
            onClick={() => setSelectedTag("all")}
          >
            All
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              type="button"
              className={`explorer-tag-chip ${selectedTag === t ? "active" : ""}`}
              onClick={() => setSelectedTag(t)}
            >
              #{t}
            </button>
          ))}
        </div>

        {/* Notes List */}
        <div className="explorer-notes-list">
          {filteredNotes.length === 0 ? (
            <div className="explorer-empty-notes">
              <p>No matching notes found.</p>
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isSelected = note.id === selectedNoteId;
              return (
                <div
                  key={note.id}
                  className={`explorer-note-card ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedNoteId(note.id)}
                >
                  <div className="card-top-row">
                    <h4 className="note-card-title">{note.title}</h4>
                    {note.pinned && (
                      <Pin size={12} className="pinned-indicator-icon" />
                    )}
                  </div>

                  <p className="note-card-snippet">
                    {note.content.replace(/[#*`>-]/g, "").slice(0, 90)}...
                  </p>

                  <div className="note-card-footer">
                    <span className="note-card-date">{formatDate(note.updatedAt)}</span>
                    <div className="card-tags-list">
                      {note.tags.slice(0, 2).map((t) => (
                        <span key={t} className="card-mini-tag">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ---------------------------------------------------- */}
      {/* RIGHT PANE: EDITOR & PREVIEW                         */}
      {/* ---------------------------------------------------- */}
      <main className="notebook-editor-pane">
        {activeNote ? (
          <div className="editor-container">
            {/* Toolbar */}
            <div className="editor-toolbar">
              <div className="view-mode-toggle">
                <button
                  type="button"
                  className={`mode-btn ${viewMode === "edit" ? "active" : ""}`}
                  onClick={() => setViewMode("edit")}
                >
                  <Edit3 size={14} />
                  <span>Editor</span>
                </button>
                <button
                  type="button"
                  className={`mode-btn ${viewMode === "preview" ? "active" : ""}`}
                  onClick={() => setViewMode("preview")}
                >
                  <Eye size={14} />
                  <span>Preview</span>
                </button>
              </div>

              <div className="toolbar-actions">
                <button
                  type="button"
                  className={`tool-icon-action ${activeNote.pinned ? "is-pinned" : ""}`}
                  onClick={() => onTogglePin(activeNote.id)}
                  title={activeNote.pinned ? "Unpin note" : "Pin note to top"}
                >
                  <Pin size={15} />
                </button>

                <button
                  type="button"
                  className="tool-icon-action"
                  onClick={() => onExportNote(activeNote)}
                  title="Export note as Markdown (.md)"
                >
                  <Download size={15} />
                </button>

                <button
                  type="button"
                  className="tool-icon-action delete"
                  onClick={() => {
                    const confirmed = window.confirm(
                      `Delete note "${activeNote.title}"?`
                    );
                    if (confirmed) {
                      onDeleteNote(activeNote.id);
                      setSelectedNoteId(null);
                    }
                  }}
                  title="Delete note"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* Note Title Input */}
            <div className="editor-title-box">
              <input
                type="text"
                className="note-title-input"
                value={activeNote.title}
                onChange={(e) =>
                  onUpdateNote(activeNote.id, { title: e.target.value })
                }
                placeholder="Note Title..."
              />
            </div>

            {/* Tags Bar */}
            <div className="editor-tags-bar">
              <Tag size={13} className="tag-bar-icon" />
              <div className="active-tags-flow">
                {activeNote.tags.map((t) => (
                  <span key={t} className="active-tag-pill">
                    #{t}
                    <button
                      type="button"
                      className="remove-tag-btn"
                      onClick={() => handleRemoveTag(t)}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                className="add-tag-input"
                placeholder="Add tag + Enter..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
              />
            </div>

            {/* Content Area (Edit vs Preview) */}
            <div className="editor-body">
              {viewMode === "edit" ? (
                <textarea
                  className="note-markdown-textarea"
                  value={activeNote.content}
                  onChange={(e) =>
                    onUpdateNote(activeNote.id, { content: e.target.value })
                  }
                  placeholder="Write in Markdown..."
                />
              ) : (
                <div className="note-preview-scroll">
                  <MarkdownRenderer content={activeNote.content} />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="editor-empty-state">
            <div className="empty-book-orb">
              <BookOpen size={40} />
            </div>
            <h3>No Note Selected</h3>
            <p>Select a note from the left sidebar or start a new one.</p>
            <button
              type="button"
              className="new-note-center-btn"
              onClick={handleCreateNewNote}
            >
              <Plus size={16} />
              <span>Create Note</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
