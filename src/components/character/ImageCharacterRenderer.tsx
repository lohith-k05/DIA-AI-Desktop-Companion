/**
 * ImageCharacterRenderer Component
 * Option 1: Official Realistic 2D Interactive Companion Renderer
 */

import React, { useState, useMemo } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import type {
  CharacterRendererProps,
  CharacterExpression,
} from "./characterTypes";
import {
  ALL_EXPRESSIONS,
  EXPRESSION_METADATA,
} from "./expressionTypes";
import { stateExpressionMap } from "./ExpressionController";
import { FacialLayerRenderer } from "./FacialLayerRenderer";
import { useFacialAnimation } from "./useFacialAnimation";
import "./characterAnimations.css";

const DEFAULT_CHARACTER_ASSET = "/dia/idle.png";

export const ImageCharacterRenderer: React.FC<CharacterRendererProps> = ({
  state = "idle",
  expression: propExpression,
  size = "hero",
  isSpeaking = false,
  isListening = false,
  audioLevel = 0,
  className = "",
  onClick,
  showStatusBadge = true,
  customAssetPath,
  facialLayers,
  mouthState: propMouthState,
  eyeState: propEyeState,
  devOverrides,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageKey, setImageKey] = useState(0);

  const assetSrc = customAssetPath || DEFAULT_CHARACTER_ASSET;

  // Resolve active expression (validating or mapping from state)
  const resolvedExpression: CharacterExpression = useMemo(() => {
    if (propExpression && ALL_EXPRESSIONS.includes(propExpression as CharacterExpression)) {
      return propExpression as CharacterExpression;
    }
    return stateExpressionMap[state] || "neutral";
  }, [propExpression, state]);

  // Status badge label and color indicator
  const statusInfo = useMemo(() => {
    if (state === "listening" || isListening) {
      return { label: "Listening...", dotClass: "dot-listening" };
    }
    if (state === "thinking") {
      return { label: "Thinking...", dotClass: "dot-thinking" };
    }
    if (state === "speaking") {
      return { label: "Speaking...", dotClass: "dot-speaking" };
    }
    if (state === "error") {
      return { label: "Notice", dotClass: "dot-error" };
    }
    if (state === "greeting") {
      return { label: "Dia is here", dotClass: "dot-friendly" };
    }

    const meta = EXPRESSION_METADATA[resolvedExpression];
    if (meta && resolvedExpression !== "neutral") {
      return { label: meta.statusBadgeText, dotClass: meta.dotColorClass };
    }

    return { label: "Dia AI Companion", dotClass: "dot-neutral" };
  }, [state, resolvedExpression]);

  const facialAnim = useFacialAnimation({
    state,
    expression: resolvedExpression,
    isSpeaking,
    audioLevel,
    isImageLoaded: imageLoaded && !imageError,
    canBlink: true,
    devOverrides,
  });

  const handleRetryImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageError(false);
    setImageLoaded(false);
    setImageKey((prev) => prev + 1);
  };

  return (
    <div
      className={`dia-char-renderer-root size-${size} state-${state} expr-${resolvedExpression} ${className}`}
      onClick={onClick}
      role="img"
      aria-label={`Dia AI Companion in ${state} state, ${resolvedExpression} expression`}
    >
      {/* Status indicator pill on larger views */}
      {showStatusBadge && size !== "sm" && !imageError && (
        <div className="dia-status-pill">
          <span className={`dia-status-dot ${statusInfo.dotClass}`} />
          <span>{statusInfo.label}</span>
        </div>
      )}

      {/* Atmospheric Soft Ambient Glow reacting to state & emotion */}
      <div
        className={`dia-char-ambient-aura aura-${state} expr-aura-${resolvedExpression}`}
      />

      {/* Main Character Stage */}
      <div className="dia-char-stage">
        {imageError ? (
          <div className="dia-char-fallback-card">
            <div className="dia-char-fallback-icon">
              <AlertCircle size={22} />
            </div>
            <h4 className="dia-char-fallback-title">Dia character asset unavailable</h4>
            <p className="dia-char-fallback-desc">
              Could not load <code>{assetSrc}</code>. Verify the transparent PNG is placed in public assets.
            </p>
            <button
              type="button"
              className="dia-char-fallback-btn"
              onClick={handleRetryImage}
            >
              <RefreshCw size={12} className="inline mr-1" />
              <span>Retry</span>
            </button>
          </div>
        ) : (
          <div className="dia-char-sprite-wrapper">
            <FacialLayerRenderer
              key={imageKey}
              baseAssetPath={assetSrc}
              blinking={facialAnim.isBlinking}
              eyeState={propEyeState || facialAnim.eyeState}
              mouthState={propMouthState || facialAnim.mouthState}
              expression={resolvedExpression}
              facialLayers={facialLayers}
              onBaseImageLoaded={() => setImageLoaded(true)}
              onBaseImageError={() => setImageError(true)}
            />

            {/* State-specific atmospheric visualizers */}
            {state === "listening" && <div className="dia-listening-ring" />}
            {state === "thinking" && <div className="dia-thinking-halo" />}
            {state === "speaking" && <div className="dia-speaking-wave" />}
          </div>
        )}
      </div>
    </div>
  );
};
