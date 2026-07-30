import React from "react";
import {
  Home,
  MessageSquare,
  Mic,
  Brain,
  Wrench,
  Compass,
  FileText,
  BookOpen,
  Image,
  Folder,
  Settings,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import type { NavigationPage } from "../../types/navigation";
import "./Sidebar.css";

interface SidebarProps {
  currentPage: NavigationPage;
  onSelectPage: (page: NavigationPage) => void;
  isAiConnected: boolean;
  activeModel?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
}) => {
  const primaryNavItems = [
    { id: "home" as NavigationPage, label: "Home", icon: Home },
    { id: "chat" as NavigationPage, label: "Chat", icon: MessageSquare },
    { id: "voice" as NavigationPage, label: "Voice", icon: Mic },
    { id: "memories" as NavigationPage, label: "Memories", icon: Brain },
    { id: "tools" as NavigationPage, label: "Tools", icon: Wrench },
    { id: "discover" as NavigationPage, label: "Discover", icon: Compass },
  ];

  const libraryItems = [
    { id: "documents" as NavigationPage, label: "Documents", icon: FileText },
    { id: "notes" as NavigationPage, label: "Notes", icon: BookOpen },
    { id: "images" as NavigationPage, label: "Images", icon: Image },
    { id: "projects" as NavigationPage, label: "Projects", icon: Folder },
  ];

  const personalItems = [
    { id: "settings" as NavigationPage, label: "Settings", icon: Settings },
    { id: "help" as NavigationPage, label: "Help & Support", icon: HelpCircle },
  ];

  return (
    <aside className="dia-sidebar" aria-label="Main Navigation Sidebar">
      {/* Brand Header */}
      <div className="dia-sidebar-brand" onClick={() => onSelectPage("home")} role="button" tabIndex={0}>
        <div className="dia-brand-gem">
          <Sparkles className="dia-brand-gem-icon" size={18} />
          <div className="gem-glow" />
        </div>
        <div className="dia-brand-meta">
          <h1 className="dia-brand-title">Dia</h1>
          <span className="dia-brand-subtitle">Your AI Companion</span>
        </div>
      </div>

      <div className="dia-sidebar-scrollable">
        {/* Primary Navigation Menu */}
        <nav className="dia-sidebar-nav" aria-label="Primary Navigation">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`dia-nav-button ${isActive ? "active" : ""}`}
                onClick={() => onSelectPage(item.id)}
                aria-current={isActive ? "page" : undefined}
              >
                <div className="nav-icon-container">
                  <Icon size={17} />
                </div>
                <span className="nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* LIBRARY Section */}
        <div className="dia-nav-section">
          <span className="dia-section-label">LIBRARY</span>
          <div className="dia-section-items">
            {libraryItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                currentPage === item.id ||
                (item.id === "notes" && currentPage === "notebook");
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`dia-nav-button secondary ${isActive ? "active" : ""}`}
                  onClick={() => onSelectPage(item.id)}
                >
                  <div className="nav-icon-container">
                    <Icon size={16} />
                  </div>
                  <span className="nav-label">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* PERSONAL Section */}
        <div className="dia-nav-section">
          <span className="dia-section-label">PERSONAL</span>
          <div className="dia-section-items">
            {personalItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`dia-nav-button secondary ${isActive ? "active" : ""}`}
                  onClick={() => onSelectPage(item.id)}
                >
                  <div className="nav-icon-container">
                    <Icon size={16} />
                  </div>
                  <span className="nav-label">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="dia-user-profile-card">
        <div className="user-profile-top">
          <div className="user-avatar-wrapper">
            <img
              src="/dia/lohith_avatar.png"
              alt="Lohith"
              className="user-avatar-img"
              onError={(e) => {
                // Fallback to stylized initial if image fails
                (e.currentTarget as HTMLElement).style.display = "none";
              }}
            />
            <span className="user-online-dot" />
          </div>
          <div className="user-profile-info">
            <div className="user-profile-name">Lohith</div>
            <div className="user-profile-role">Student · AI Engineer</div>
          </div>
        </div>
        <p className="user-profile-quote">“A better you builds a brighter tomorrow.”</p>
      </div>
    </aside>
  );
};

