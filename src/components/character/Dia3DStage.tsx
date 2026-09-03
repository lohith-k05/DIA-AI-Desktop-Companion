/**
 * Dia3DStage (Legacy Compatibility Adapter)
 * Option 1: Official Realistic 2D Interactive Companion
 * Safely forwards to ImageCharacterRenderer without 3D cartoon placeholders
 */

import React from "react";
import type { Dia3DStageProps } from "../../types/character";
import type { CharacterState } from "./characterTypes";
import { ImageCharacterRenderer } from "./ImageCharacterRenderer";

export const Dia3DStage: React.FC<Dia3DStageProps> = ({
  activity = "idle",
  size = "hero",
  className = "",
}) => {
  return (
    <ImageCharacterRenderer
      state={(activity as CharacterState) || "idle"}
      size={size}
      className={className}
    />
  );
};

export default Dia3DStage;
