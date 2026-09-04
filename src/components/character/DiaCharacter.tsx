/**
 * DiaCharacter Component
 * Option 1: Official Full-Motion Video AI Companion
 * Directly renders DiaVideo using /dia/idle.mp4, /dia/listening.mp4, and /dia/speaking.mp4
 */

import React, { useMemo } from "react";
import type {
  CharacterState,
  CharacterSize,
  FacialLayers,
  CharacterExpression,
  MouthState,
  EyeState,
  FacialDevOverrides,
} from "./characterTypes";
import type { DiaActivity } from "../../types/character";
import { DiaVideo } from "./DiaVideo";

export interface DiaCharacterProps {
  activity?: CharacterState | DiaActivity | string;
  state?: CharacterState;
  expression?: CharacterExpression | string;
  isSpeaking?: boolean;
  isListening?: boolean;
  audioLevel?: number;
  size?: CharacterSize;
  className?: string;
  onClick?: () => void;
  showStatusBadge?: boolean;
  customAssetPath?: string;
  idleVideoSrc?: string;
  listeningVideoSrc?: string;
  speakingVideoSrc?: string;
  thinkingVideoSrc?: string;
  happyVideoSrc?: string;
  facialLayers?: FacialLayers;
  mouthState?: MouthState;
  eyeState?: EyeState;
  devOverrides?: FacialDevOverrides;
  // Legacy compatibility props
  renderer?: string;
  onToggleRenderer?: () => void;
  modelPath?: string;
}

export const DiaCharacter: React.FC<DiaCharacterProps> = ({
  activity,
  state: propState,
  isSpeaking = false,
  isListening = false,
  size = "hero",
  className = "",
  onClick,
  showStatusBadge = true,
  idleVideoSrc = "/dia/idle.mp4?v=2",
  listeningVideoSrc = "/dia/listening.mp4?v=2",
  speakingVideoSrc = "/dia/speaking.mp4?v=2",
  thinkingVideoSrc = "/dia/idle.mp4?v=2",
  happyVideoSrc = "/dia/idle.mp4?v=2",
}) => {
  // Resolve active character state
  const resolvedState: CharacterState = useMemo(() => {
    if (propState) return propState;
    if (activity) {
      if (activity === "greeting") return "greeting";
      if (activity === "listening") return "listening";
      if (activity === "thinking" || (activity as string) === "processing") return "thinking";
      if (activity === "speaking") return "speaking";
      if (activity === "happy") return "happy";
      if (activity === "confused") return "confused";
      if (activity === "error") return "error";
      return "idle";
    }
    if (isListening) return "listening";
    if (isSpeaking) return "speaking";
    return "idle";
  }, [propState, activity, isListening, isSpeaking]);

  return (
    <DiaVideo
      state={resolvedState}
      activity={activity}
      size={size}
      isSpeaking={isSpeaking}
      isListening={isListening}
      className={className}
      onClick={onClick}
      showStatusBadge={showStatusBadge}
      idleVideoSrc={idleVideoSrc}
      listeningVideoSrc={listeningVideoSrc}
      speakingVideoSrc={speakingVideoSrc}
      thinkingVideoSrc={thinkingVideoSrc}
      happyVideoSrc={happyVideoSrc}
    />
  );
};

export { DiaVideo };
export default DiaCharacter;
