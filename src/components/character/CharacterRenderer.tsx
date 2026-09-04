/**
 * CharacterRenderer Component
 * Option 1: Main Reusable Character Renderer
 * Directly forwards to DiaVideo component
 */

import React, { useMemo } from "react";
import type { CharacterRendererProps, CharacterState } from "./characterTypes";
import { DiaVideo } from "./DiaVideo";

export const CharacterRenderer: React.FC<CharacterRendererProps> = ({
  state: propState,
  size = "hero",
  isSpeaking = false,
  isListening = false,
  className = "",
  onClick,
  showStatusBadge = true,
}) => {
  const resolvedState: CharacterState = useMemo(() => {
    if (propState) return propState;
    if (isListening) return "listening";
    if (isSpeaking) return "speaking";
    return "idle";
  }, [propState, isListening, isSpeaking]);

  return (
    <DiaVideo
      state={resolvedState}
      size={size}
      isSpeaking={isSpeaking}
      isListening={isListening}
      className={className}
      onClick={onClick}
      showStatusBadge={showStatusBadge}
    />
  );
};

export const DiaCharacter = CharacterRenderer;
