import React from "react";
import {
  Wrench,
  Brain,
  BookOpen,
  Settings,
  Mic,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import type { NavigationPage } from "../types/navigation";
import "./PlaceholderPage.css";

interface PlaceholderPageProps {
  page: NavigationPage;
  onReturnHome: () => void;
}

const pageConfigs: Record<
  string,
  {
    title: string;
    phase: string;
    icon: React.ElementType;
    description: string;
    features: string[];
  }
> = {
  voice: {
    title: "Voice Communion Studio",
    phase: "Phase 4",
    icon: Mic,
    description:
      "A full-screen, real-time vocal experience featuring audio-reactive waveforms, barge-in interruption, and natural Dia speech cadence.",
    features: [
      "Real-time speech-to-text transcript buffer",
      "Duplex voice activity detection (VAD)",
      "Expressive vocal pitch & rate customization",
      "Character reaction synchronized to spoken sentences",
    ],
  },
  tools: {
    title: "Sandboxed Productivity Tools",
    phase: "Phase 6",
    icon: Wrench,
    description:
      "Controlled desktop automation tools allowing Dia to execute math, launch web resources, create notes, and parse local files securely.",
    features: [
      "Human-in-the-loop (HITL) authorization modal for system actions",
      "Safe mathematical & conversion calculator",
      "Local file inspection and markdown generator",
      "System telemetry monitor (RAM, CPU, battery)",
    ],
  },
  memories: {
    title: "Sovereign Memory Vault",
    phase: "Phase 5",
    icon: Brain,
    description:
      "User-governed persistent memory bank. Dia only saves facts you explicitly approve—everything is stored locally on this machine.",
    features: [
      "Dual-tier separation: Ephemeral turns vs. Long-term vault",
      "Explicit 'Save to Memory' confirmation cards",
      "Inline editor for inspecting and editing saved facts",
      "One-click complete database purge and backup export",
    ],
  },
  notebook: {
    title: "Personal Knowledge Notebook",
    phase: "Phase 7",
    icon: BookOpen,
    description:
      "Distraction-free Markdown studio for organizing ideas, research summaries, and direct saves from your chat conversations.",
    features: [
      "Instant 'Save to Notebook' from any chat message",
      "Syntax-highlighted live Markdown editor",
      "Tag categorization & keyword search",
      "Pinning and export to local files",
    ],
  },
  settings: {
    title: "Application & Model Settings",
    phase: "Phase 3 / Phase 5",
    icon: Settings,
    description:
      "Granular configuration of Ollama models, inference temperatures, vocal synthesis, visual themes, and local storage audits.",
    features: [
      "Ollama model switcher (gemma3:1b, llama3.2, qwen2.5)",
      "Inference temperature & token limit sliders",
      "Auto-read speech toggles and voice selection",
      "Storage space auditor and reset triggers",
    ],
  },
  discover: {
    title: "Discover Skills & Prompts",
    phase: "Ecosystem",
    icon: Sparkles,
    description:
      "Explore community workflows, prompt presets, custom personalities, and extensions for your Dia desktop companion.",
    features: [
      "Curated AI prompt templates & personas",
      "Community skill pack repository",
      "One-click workflow installation",
      "Offline skill execution engine",
    ],
  },
  documents: {
    title: "Library Documents",
    phase: "Knowledge Base",
    icon: BookOpen,
    description:
      "Local documents storage, PDF analysis vault, and vector embedding repository indexed for fast semantic retrieval.",
    features: [
      "Local PDF and TXT document ingestion",
      "Offline RAG and contextual citations",
      "Document summarization and key takeaways",
      "Zero-cloud data privacy compliance",
    ],
  },
  images: {
    title: "Library Images & Gallery",
    phase: "Media Vault",
    icon: Sparkles,
    description:
      "Visual memory studio storing screenshots, diagrams, and visual references shared with Dia.",
    features: [
      "Companion screenshot capture & OCR",
      "Image understanding and visual QA",
      "Local gallery categorization",
      "Visual memory linking with conversations",
    ],
  },
  projects: {
    title: "Library Projects",
    phase: "Workspaces",
    icon: Wrench,
    description:
      "Multi-session project spaces grouping code repositories, notes, and task lists together with Dia.",
    features: [
      "Context-isolated project workspaces",
      "Git repository linking and file watchers",
      "Milestone tracking and focus sessions",
      "Project-specific memory and custom rules",
    ],
  },
  help: {
    title: "Help & Support",
    phase: "Dia Guide",
    icon: Sparkles,
    description:
      "Comprehensive user guide, keyboard shortcuts reference, and troubleshooting instructions for Dia sovereign desktop.",
    features: [
      "Quick keyboard shortcuts reference (Ctrl+K, etc.)",
      "Local Ollama configuration guide",
      "Audio and microphone diagnostic test",
      "Frequently asked questions and support links",
    ],
  },
};

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  page,
  onReturnHome,
}) => {
  const config = pageConfigs[page] || {
    title: "Feature Module",
    phase: "Roadmap",
    icon: Sparkles,
    description: "This module is scheduled for implementation in upcoming roadmap phases.",
    features: ["Architectural foundation prepared", "Local processing priority"],
  };

  const Icon = config.icon;

  return (
    <div className="dia-placeholder-container">
      <div className="placeholder-card">
        <div className="placeholder-badge">
          <Sparkles size={12} />
          <span>{config.phase} Implementation Target</span>
        </div>

        <div className="placeholder-icon-orb">
          <Icon size={36} />
        </div>

        <h2 className="placeholder-title">{config.title}</h2>
        <p className="placeholder-desc">{config.description}</p>

        <div className="placeholder-feature-box">
          <div className="feature-box-header">
            <ShieldCheck size={14} />
            <span>Planned Capabilities</span>
          </div>
          <ul className="feature-list">
            {config.features.map((feat, i) => (
              <li key={i}>{feat}</li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          className="placeholder-back-btn"
          onClick={onReturnHome}
        >
          <ArrowLeft size={16} />
          <span>Return to Home Dashboard</span>
        </button>
      </div>
    </div>
  );
};
