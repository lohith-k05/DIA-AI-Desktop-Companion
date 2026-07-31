import type { CharacterExpression } from "./expressionTypes";

export type { CharacterExpression };

export type MouthState =
  | "neutral"
  | "smile"
  | "open"
  | "concerned"
  | "surprised";

export type EyeState = "open" | "closed";

export type CharacterState =
  | "idle"
  | "greeting"
  | "listening"
  | "thinking"
  | "speaking"
  | "happy"
  | "confused"
  | "error";

export type CharacterSize = "sm" | "md" | "lg" | "hero";

export interface FacialDevOverrides {
  forceBlink?: boolean;
  mouthOverride?: MouthState | null;
  eyeOverride?: EyeState | null;
  isSpeakingLoop?: boolean;
}

/**
 * Facial layer configuration for multi-layer 2D facial rigging
 */
export interface FacialLayers {
  baseLayerUrl?: string;
  eyesOpenUrl?: string;
  eyesClosedUrl?: string;
  mouthNeutralUrl?: string;
  mouthSmileUrl?: string;
  mouthOpenUrl?: string;
  mouthConcernedUrl?: string;
  mouthSurprisedUrl?: string;
  expressionOverlayUrl?: string;
}

export interface CharacterRendererProps {
  state?: CharacterState;
  expression?: CharacterExpression | string;
  size?: CharacterSize;
  isSpeaking?: boolean;
  isListening?: boolean;
  audioLevel?: number;
  className?: string;
  onClick?: () => void;
  showStatusBadge?: boolean;
  customAssetPath?: string;
  facialLayers?: FacialLayers;
  mouthState?: MouthState;
  eyeState?: EyeState;
  devOverrides?: FacialDevOverrides;
}

export interface CharacterControllerState {
  state: CharacterState;
  expression?: CharacterExpression;
  isSpeaking: boolean;
  isListening: boolean;
  audioLevel: number;
}
