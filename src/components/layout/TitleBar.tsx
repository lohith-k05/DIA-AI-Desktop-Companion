import React, { useEffect, useState } from "react";
import { Sun, Bell, Minus, Square, X, Copy } from "lucide-react";
import { minimizeWindow, toggleMaximizeWindow, closeWindow, isTauri } from "../../services/desktopBridge";
import "./TitleBar.css";

interface TitleBarProps {
  pageTitle?: string;
  onSearchSubmit?: (query: string) => void;
}

export const TitleBar: React.FC<TitleBarProps> = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Keyboard shortcut listener for Ctrl+K
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("dia-global-search-input");
        searchInput?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    
    // Tauri window state listener
    let unlisten: (() => void) | undefined;
    if (isTauri()) {
      import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
        const appWindow = getCurrentWindow();
        appWindow.isMaximized().then(setIsMaximized);
        appWindow.onResized(() => {
          appWindow.isMaximized().then(setIsMaximized);
        }).then(u => {
          unlisten = u;
        });
      });
    }
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (unlisten) unlisten();
    };
  }, []);

  const handleToggleMaximize = async () => {
    await toggleMaximizeWindow();
    // Optimistic UI update
    setIsMaximized(!isMaximized);
  };

  return (
    <header className="dia-titlebar" data-tauri-drag-region>
      {/* Left window branding badge */}
      <div className="titlebar-left" data-tauri-drag-region>
        <span className="window-app-name">Dia Sovereign Desktop</span>
      </div>

      {/* Center drag region */}
      <div className="titlebar-center" data-tauri-drag-region />

      {/* Right Controls: Theme, Notification, Window Buttons */}
      <div className="titlebar-right">
        <button
          type="button"
          className="titlebar-utility-btn"
          aria-label="Toggle Theme"
          title="Toggle Theme"
        >
          <Sun size={14} />
        </button>

        <button
          type="button"
          className="titlebar-utility-btn"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={14} />
          <span className="notif-dot" />
        </button>

        <span className="titlebar-divider">|</span>

        <button
          type="button"
          className="window-control-btn minimize"
          aria-label="Minimize Window"
          onClick={() => minimizeWindow()}
          title="Minimize"
        >
          <Minus size={13} />
        </button>
        <button
          type="button"
          className="window-control-btn maximize"
          aria-label={isMaximized ? "Restore Window" : "Maximize Window"}
          onClick={handleToggleMaximize}
          title="Maximize/Restore"
        >
          {isMaximized ? <Copy size={11} /> : <Square size={11} />}
        </button>
        <button
          type="button"
          className="window-control-btn close"
          aria-label="Close Window"
          onClick={() => closeWindow()}
          title="Close"
        >
          <X size={13} />
        </button>
      </div>
    </header>
  );
};
