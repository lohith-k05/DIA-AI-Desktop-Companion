import React, { useState } from "react";
import {
  Globe,
  FileText,
  PenTool,
  Code2,
  Target,
  AlignLeft,
  CalendarCheck,
  Sprout,
  Check,
  Plus,
} from "lucide-react";
import type { CharacterActivity } from "../../types/character";
import "./RightPanel.css";

interface RightPanelProps {
  activity: CharacterActivity;
  isAiConnected: boolean;
  messageCount: number;
  isSpeaking: boolean;
  onStopSpeaking: () => void;
  onClearConversation: () => void;
  onTriggerPrompt: (prompt: string) => void;
  }

interface FocusTask {
  id: string;
  text: string;
  completed: boolean;
  highlighted?: boolean;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  activity,
  isSpeaking,
  onTriggerPrompt,
  }) => {
  // Focus Tasks State
  const [tasks, setTasks] = useState<FocusTask[]>([
    { id: "1", text: "Complete DSA practice", completed: false, highlighted: true },
    { id: "2", text: "Work on Rakshak project", completed: false },
    { id: "3", text: "Prepare for next exam", completed: false },
    { id: "4", text: "Read a research paper", completed: false },
    { id: "5", text: "Stay consistent", completed: false },
  ]);
  const [isEditing, setIsEditing] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const addTask = () => {
    if (!newTaskText.trim()) return;
    setTasks((prev) => [
      ...prev,
      { id: `task-${Date.now()}`, text: newTaskText.trim(), completed: false },
    ]);
    setNewTaskText("");
  };

  const quickTools = [
    {
      id: "browser",
      label: "Browser",
      icon: Globe,
      color: "tool-blue",
      prompt: "/browser_mode"
    },
    {
      id: "explain",
      label: "Explain",
      icon: FileText,
      color: "tool-blue",
      prompt: "Explain this concept in simple, intuitive terms: ",
    },
    {
      id: "write",
      label: "Write",
      icon: PenTool,
      color: "tool-pink",
      prompt: "Help me write high quality content for: ",
    },
    {
      id: "code",
      label: "Code",
      icon: Code2,
      color: "tool-purple",
      prompt: "Help me write and optimize clean code for: ",
    },
    {
      id: "solve",
      label: "Solve",
      icon: Target,
      color: "tool-cyan",
      prompt: "Help me break down and solve this problem step-by-step: ",
    },
    {
      id: "summarize",
      label: "Summarize",
      icon: AlignLeft,
      color: "tool-magenta",
      prompt: "Summarize the key takeaways and core insights from this: ",
    },
    {
      id: "plan",
      label: "Plan",
      icon: CalendarCheck,
      color: "tool-green",
      prompt: "Help me structure an actionable, phased plan for: ",
    },
  ];

  return (
    <aside className="dia-right-panel" aria-label="Information Panel">
      {/* 1. Dia Status Card */}
      <div className="dia-status-card">
        <div className="dia-status-card-header">
          <div className="dia-avatar-box">
            <img
              src="/dia/dia_avatar.png"
              alt="Dia"
              className="dia-status-avatar-img"
              onError={(e) => {
                // Fallback to idle if avatar not found
                e.currentTarget.src = "/dia/idle.png";
              }}
            />
            <span className="dia-status-online-dot" />
          </div>

          <div className="dia-status-meta">
            <h3 className="dia-status-name">Dia</h3>
            <span className="dia-status-online-label">
              <span className="status-indicator-circle" /> Online
            </span>
          </div>

          {/* Audio Waveform Equalizer */}
          <div
            className={`dia-audio-waveform ${
              isSpeaking || activity === "speaking"
                ? "is-speaking"
                : activity === "listening"
                ? "is-listening"
                : "is-idle"
            }`}
          >
            <span className="wave-bar bar-1" />
            <span className="wave-bar bar-2" />
            <span className="wave-bar bar-3" />
            <span className="wave-bar bar-4" />
            <span className="wave-bar bar-5" />
            <span className="wave-bar bar-6" />
            <span className="wave-bar bar-7" />
          </div>
        </div>

        {/* Quote Capsule Inside Card */}
        <div className="dia-status-quote-box">
          <p className="dia-status-quote-text">
            “You can tell me anything. I'm always here for you.”
          </p>
        </div>
      </div>

      {/* 2. Today's Focus Card */}
      <div className="dia-focus-card">
        <div className="dia-focus-header">
          <h4 className="dia-card-title">Today's Focus</h4>
          <button
            type="button"
            className="dia-card-action-btn"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Done" : "Edit"}
          </button>
        </div>

        <div className="dia-focus-list">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`dia-focus-item ${task.completed ? "completed" : ""} ${
                task.highlighted && !task.completed ? "highlighted" : ""
              }`}
              onClick={() => toggleTask(task.id)}
              role="button"
              tabIndex={0}
            >
              <div className="dia-focus-ring">
                {task.completed ? (
                  <Check size={12} className="check-icon" />
                ) : null}
              </div>
              <span className="dia-focus-label">{task.text}</span>
            </div>
          ))}

          {isEditing && (
            <div className="dia-focus-add-row">
              <input
                type="text"
                className="dia-focus-input"
                placeholder="Add new task..."
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
              />
              <button
                type="button"
                className="dia-focus-add-btn"
                onClick={addTask}
                aria-label="Add task"
              >
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Small Steps, Big Progress Card */}
      <div className="dia-progress-card">
        <div className="dia-sprout-badge">
          <Sprout size={18} className="sprout-icon" />
        </div>
        <div className="dia-progress-meta">
          <h4 className="dia-progress-title">Small Steps, Big Progress</h4>
          <p className="dia-progress-desc">
            “Progress is the result of consistent effort.”
          </p>
        </div>
      </div>

      {/* 4. Quick Tools Grid */}
      <div className="dia-quick-tools-section">
        <div className="dia-tools-header">
          <h4 className="dia-card-title">Quick Tools</h4>
          <button
            type="button"
            className="dia-card-action-btn see-all"
            onClick={() => onTriggerPrompt("What tools are available?")}
          >
            See all →
          </button>
        </div>

        <div className="dia-tools-grid">
          {quickTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                type="button"
                className={`dia-tool-cell ${tool.color}`}
                onClick={() => onTriggerPrompt(tool.prompt)}
                title={tool.prompt}
              >
                <div className="dia-tool-icon-wrap">
                  <Icon size={16} />
                </div>
                <span className="dia-tool-cell-label">{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Right Panel Footer */}
      <div className="dia-right-footer">
        <span>Always here. Always with you. ♡</span>
      </div>
    </aside>
  );
};

