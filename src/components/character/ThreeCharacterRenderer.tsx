/**
 * ThreeCharacterRenderer (Legacy Compatibility Adapter)
 * Option 1: Official Realistic 2D Interactive Companion
 * Safely forwards to ImageCharacterRenderer without 3D cartoon placeholders
 */

import React from "react";
import type { ThreeCharacterRendererProps } from "../../types/character";
import type { CharacterState } from "./characterTypes";
import { ImageCharacterRenderer } from "./ImageCharacterRenderer";

export const ThreeCharacterRenderer: React.FC<ThreeCharacterRendererProps> = ({
  activity = "idle",
  isSpeaking = false,
  isListening = false,
  size = "hero",
  className = "",
}) => {
  const resolvedState: CharacterState = isListening
    ? "listening"
    : isSpeaking
    ? "speaking"
    : (activity as CharacterState) || "idle";

  return (
    <ImageCharacterRenderer
      state={resolvedState}
      size={size}
      className={className}
    />
  );
};

export default ThreeCharacterRenderer;
