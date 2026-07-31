/**
 * Professional 3D Dia Character System Type Definitions
 * Section 30 Specification
 */

// --------------------------------------------------
// 30.5 Character Activity States
// --------------------------------------------------
export type DiaActivity =
  | "idle"
  | "greeting"
  | "listening"
  | "processing"
  | "thinking"
  | "speaking"
  | "happy"
  | "confused"
  | "surprised"
  | "sad"
  | "error"
  | "sleeping";

// Backward-compatibility alias
export type CharacterActivity = DiaActivity;

// --------------------------------------------------
// 30.6 Facial Expression System
// --------------------------------------------------
export type DiaExpression =
  | "neutral"
  | "happy"
  | "friendly"
  | "curious"
  | "thoughtful"
  | "surprised"
  | "confused"
  | "concerned"
  | "sad"
  | "excited"
  | "calm"
  | "speaking"
  | "listening";

// Backward-compatibility alias (including "supportive" mapped to "friendly")
export type CharacterExpression = DiaExpression | "supportive";

// --------------------------------------------------
// 30.4 Character Renderer Types
// --------------------------------------------------
export type DiaCharacterRendererType =
  | "2d"
  | "3d"
  | "image"
  | "auto"
  | "image-sprite"
  | "threejs-vrm";

// Backward-compatibility alias
export type CharacterRendererType = DiaCharacterRendererType;

// --------------------------------------------------
// 30.12 Emotional Response Mapping
// --------------------------------------------------
export interface ExpressionDecision {
  expression: DiaExpression;
  intensity: number;
  duration: number;
  reason?: string;
}

// --------------------------------------------------
// 30.8 Lip Synchronization Types
// --------------------------------------------------
export type VisemeType =
  | "rest"
  | "aa"
  | "ee"
  | "ih"
  | "oh"
  | "ou"
  | "mbp"
  | "fv";

export interface LipSyncState {
  viseme: VisemeType;
  openRatio: number;      // 0.0 (closed) to 1.0 (fully open)
  puckerRatio: number;   // 0.0 to 1.0
  smileRatio: number;    // 0.0 to 1.0
  audioLevel: number;    // RMS amplitude 0.0 to 1.0
  isSpeaking: boolean;
}

// --------------------------------------------------
// 30.7 Eye System State
// --------------------------------------------------
export interface EyeState {
  blinkLeft: number;     // 0.0 (open) to 1.0 (closed)
  blinkRight: number;    // 0.0 (open) to 1.0 (closed)
  gazeX: number;         // -1.0 (left) to 1.0 (right)
  gazeY: number;         // -1.0 (down) to 1.0 (up)
  isLookingAtUser: boolean;
}

// --------------------------------------------------
// 30.14 Character Event System
// --------------------------------------------------
export type DiaCharacterEvent =
  | { type: "APP_READY" }
  | { type: "USER_STARTED_TYPING" }
  | { type: "VOICE_LISTENING_STARTED" }
  | { type: "VOICE_LISTENING_STOPPED" }
  | { type: "AI_REQUEST_STARTED" }
  | { type: "AI_REQUEST_COMPLETED"; replyText?: string }
  | { type: "AI_REQUEST_FAILED"; error?: string }
  | { type: "TTS_STARTED"; text?: string }
  | { type: "TTS_ENDED" }
  | { type: "USER_SENT_MESSAGE"; messageText?: string }
  | { type: "TOOL_EXECUTION_STARTED"; toolName?: string }
  | { type: "TOOL_EXECUTION_COMPLETED"; toolName?: string }
  | { type: "SET_EXPRESSION"; expression: DiaExpression; intensity?: number; duration?: number }
  | { type: "SET_ACTIVITY"; activity: DiaActivity }
  | { type: "SET_AUDIO_LEVEL"; level: number };

// --------------------------------------------------
// Character Controller State
// --------------------------------------------------
export interface CharacterControllerState {
  activity: DiaActivity;
  expression: DiaExpression;
  expressionIntensity: number;
  isSpeaking: boolean;
  isListening: boolean;
  audioLevel: number;
  eyeState: EyeState;
  lipSyncState: LipSyncState;
  renderer: DiaCharacterRendererType;
}

// --------------------------------------------------
// Component Props
// --------------------------------------------------
export interface DiaCharacterProps {
  renderer?: DiaCharacterRendererType;
  activity?: DiaActivity;
  expression?: DiaExpression | "supportive";
  isSpeaking?: boolean;
  isListening?: boolean;
  audioLevel?: number;
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
  onClick?: () => void;
  onToggleRenderer?: () => void;
  modelPath?: string;
}

export interface ThreeCharacterRendererProps {
  activity?: DiaActivity;
  expression?: DiaExpression;
  isSpeaking?: boolean;
  isListening?: boolean;
  audioLevel?: number;
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
  modelPath?: string;
  onToggleRenderer?: () => void;
  onModelLoaded?: (modelName: string) => void;
  onError?: (err: Error) => void;
}

export interface ImageCharacterRendererProps {
  activity?: DiaActivity;
  expression?: DiaExpression | "supportive";
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
  onClick?: () => void;
  onToggleRenderer?: () => void;
}

export interface Dia3DStageProps {
  activity?: CharacterActivity;
  expression?: CharacterExpression;
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
  onToggleRenderer?: () => void;
  onModelLoaded?: (modelName: string) => void;
}

export interface VrmModelMetadata {
  name: string;
  author?: string;
  version?: string;
  fileSize?: number;
  loadedAt: string;
}
