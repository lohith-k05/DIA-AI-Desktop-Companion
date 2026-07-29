import React from "react";
import { TitleBar } from "./TitleBar";
import { Sidebar } from "../sidebar/Sidebar";
import { RightPanel } from "./RightPanel";
import type { NavigationPage } from "../../types/navigation";
import type { CharacterActivity } from "../../types/character";
import "./AppShell.css";

interface AppShellProps {
  currentPage: NavigationPage;
  onSelectPage: (page: NavigationPage) => void;
  isAiConnected: boolean;
  activeModel?: string;
  activity: CharacterActivity;
  messageCount: number;
  isSpeaking: boolean;
  onStopSpeaking: () => void;
  onClearConversation: () => void;
  onTriggerPrompt: (prompt: string) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentPage,
  onSelectPage,
  isAiConnected,
  activeModel,
  activity,
  messageCount,
  isSpeaking,
  onStopSpeaking,
  onClearConversation,
  onTriggerPrompt,
  children,
}) => {
  return (
    <div className="dia-app-shell">
      <TitleBar
        pageTitle={currentPage}
        onSearchSubmit={(query) => onTriggerPrompt(query)}
      />

      <div className="dia-body-layout">
        <Sidebar
          currentPage={currentPage}
          onSelectPage={onSelectPage}
          isAiConnected={isAiConnected}
          activeModel={activeModel}
        />

        <main className="dia-center-workspace">{children}</main>

        <RightPanel
          activity={activity}
          isAiConnected={isAiConnected}
          messageCount={messageCount}
          isSpeaking={isSpeaking}
          onStopSpeaking={onStopSpeaking}
          onClearConversation={onClearConversation}
          onTriggerPrompt={onTriggerPrompt}
        />
      </div>
    </div>
  );
};
