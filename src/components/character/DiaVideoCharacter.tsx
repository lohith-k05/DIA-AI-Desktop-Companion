/**
 * DiaVideoCharacter Component
 * Synchronized Video-based Dia Animation Engine
 * Synchronizes idle.mp4, listening.mp4, and speaking.mp4 with SpeechSynthesis TTS playback.
 */

import React, { useState, useRef, useEffect, useMemo } from "react";
import type {
  CharacterRendererProps,
  CharacterExpression,
} from "./characterTypes";
import {
  ALL_EXPRESSIONS,
  EXPRESSION_METADATA,
} from "./expressionTypes";
import { stateExpressionMap } from "./ExpressionController";
import { ImageCharacterRenderer } from "./ImageCharacterRenderer";
import "./characterAnimations.css";
import "./DiaVideoCharacter.css";

const DEFAULT_POSTER_ASSET = "/dia/idle.png";
const DEFAULT_IDLE_VIDEO = "/dia/idle.mp4";
const DEFAULT_LISTENING_VIDEO = "/dia/listening.mp4";
const DEFAULT_SPEAKING_VIDEO = "/dia/speaking.mp4";

export interface DiaVideoCharacterProps extends CharacterRendererProps {
  idleVideoSrc?: string;
  listeningVideoSrc?: string;
  speakingVideoSrc?: string;
  fallbackToImageOnError?: boolean;
  forceImageRenderer?: boolean;
}

export const DiaVideoCharacter: React.FC<DiaVideoCharacterProps> = (props) => {
  const {
    state = "idle",
    expression: propExpression,
    size = "hero",
    isSpeaking = false,
    isListening = false,
    audioLevel: _audioLevel = 0,
    className = "",
    onClick,
    showStatusBadge = true,
    customAssetPath,
    idleVideoSrc = DEFAULT_IDLE_VIDEO,
    listeningVideoSrc = DEFAULT_LISTENING_VIDEO,
    speakingVideoSrc = DEFAULT_SPEAKING_VIDEO,
    fallbackToImageOnError = true,
    forceImageRenderer = false,
    devOverrides,
  } = props;

  const [hasVideoError, setHasVideoError] = useState(false);
  const [idleCanPlay, setIdleCanPlay] = useState(false);

  const idleVideoRef = useRef<HTMLVideoElement>(null);
  const listeningVideoRef = useRef<HTMLVideoElement>(null);
  const speakingVideoRef = useRef<HTMLVideoElement>(null);

  const posterSrc = customAssetPath || DEFAULT_POSTER_ASSET;

  // Check if developer studio overrides are active for multi-layer facial slices
  const hasFacialOverrides = Boolean(
    devOverrides?.forceBlink ||
    devOverrides?.mouthOverride ||
    devOverrides?.eyeOverride
  );

  // If explicit dev overrides or forceImageRenderer or video error occurred, fall back to ImageCharacterRenderer
  const shouldFallbackToImage = forceImageRenderer || hasFacialOverrides || (hasVideoError && fallbackToImageOnError);

  // Resolve active expression metadata
  const resolvedExpression: CharacterExpression = useMemo(() => {
    if (propExpression && ALL_EXPRESSIONS.includes(propExpression as CharacterExpression)) {
      return propExpression as CharacterExpression;
    }
    return stateExpressionMap[state] || "neutral";
  }, [propExpression, state]);

  // Strict state priority: speaking > listening > idle
  // Notice: isLoading (thinking) does NOT trigger speaking.mp4; speaking.mp4 strictly requires active TTS audio!
  type VideoState = "speaking" | "listening" | "idle";
  const activeVideoState: VideoState = useMemo(() => {
    if (isSpeaking || devOverrides?.isSpeakingLoop) {
      return "speaking";
    }
    if (isListening || state === "listening") {
      return "listening";
    }
    return "idle";
  }, [isSpeaking, isListening, state, devOverrides?.isSpeakingLoop]);

  // Manage video playback transitions and mute enforcement
  useEffect(() => {
    const videos = [idleVideoRef.current, listeningVideoRef.current, speakingVideoRef.current];
    videos.forEach((video) => {
      if (video) {
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
      }
    });

    if (activeVideoState === "speaking") {
      if (speakingVideoRef.current) {
        speakingVideoRef.current.currentTime = 0;
        const playPromise = speakingVideoRef.current.play();
        if (playPromise) {
          playPromise.catch((err) => console.debug("Dia speaking video play notice:", err));
        }
      }
    } else if (activeVideoState === "listening") {
      if (listeningVideoRef.current) {
        listeningVideoRef.current.currentTime = 0;
        const playPromise = listeningVideoRef.current.play();
        if (playPromise) {
          playPromise.catch((err) => console.debug("Dia listening video play notice:", err));
        }
      }
      if (speakingVideoRef.current) {
        speakingVideoRef.current.pause();
        speakingVideoRef.current.currentTime = 0;
      }
    } else {
      // Idle state
      if (idleVideoRef.current) {
        const playPromise = idleVideoRef.current.play();
        if (playPromise) {
          playPromise.catch((err) => console.debug("Dia idle video play notice:", err));
        }
      }
      if (speakingVideoRef.current) {
        speakingVideoRef.current.pause();
        speakingVideoRef.current.currentTime = 0;
      }
      if (listeningVideoRef.current) {
        listeningVideoRef.current.pause();
        listeningVideoRef.current.currentTime = 0;
      }
    }
  }, [activeVideoState]);

  // Status badge label and color indicator
  const statusInfo = useMemo(() => {
    if (activeVideoState === "listening" || isListening) {
      return { label: "Listening...", dotClass: "dot-listening" };
    }
    if (state === "thinking") {
      return { label: "Thinking...", dotClass: "dot-thinking" };
    }
    if (activeVideoState === "speaking" || isSpeaking) {
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
  }, [activeVideoState, state, resolvedExpression, isListening, isSpeaking]);

  const handleVideoError = (event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.warn("Dia video asset load failure, switching to 2D image renderer:", event);
    setHasVideoError(true);
  };

  // Graceful fallback to ImageCharacterRenderer
  if (shouldFallbackToImage) {
    return <ImageCharacterRenderer {...props} />;
  }

  return (
    <div
      className={`dia-char-renderer-root is-video size-${size} state-${state} video-state-${activeVideoState} expr-${resolvedExpression} ${className}`}
      onClick={onClick}
      role="img"
      aria-label={`Dia AI Companion - ${activeVideoState} state, ${resolvedExpression} expression`}
    >
      {/* Status indicator pill on larger views */}
      {showStatusBadge && size !== "sm" && (
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
      <div className="dia-video-stage">
        <div className="dia-video-wrapper">
          {/* Base poster layer (avoids any blank flash during initial decoder warm up) */}
          <img
            src={posterSrc}
            alt="Dia Companion"
            className={`dia-video-poster-layer ${idleCanPlay ? "is-hidden" : ""}`}
          />

          {/* Idle Video Layer */}
          <video
            ref={idleVideoRef}
            src={idleVideoSrc}
            autoPlay
            muted
            loop
            playsInline
            controls={false}
            disablePictureInPicture
            className={`dia-video-element dia-video-idle ${
              activeVideoState === "idle" ? "is-active" : "is-inactive"
            }`}
            onCanPlay={() => setIdleCanPlay(true)}
            onError={handleVideoError}
          />

          {/* Listening Video Layer */}
          <video
            ref={listeningVideoRef}
            src={listeningVideoSrc}
            muted
            loop
            playsInline
            controls={false}
            disablePictureInPicture
            preload="auto"
            className={`dia-video-element dia-video-listening ${
              activeVideoState === "listening" ? "is-active" : "is-inactive"
            }`}
            onError={handleVideoError}
          />

          {/* Speaking Video Layer (strictly synchronized with TTS audio) */}
          <video
            ref={speakingVideoRef}
            src={speakingVideoSrc}
            muted
            loop
            playsInline
            controls={false}
            disablePictureInPicture
            preload="auto"
            className={`dia-video-element dia-video-speaking ${
              activeVideoState === "speaking" ? "is-active" : "is-inactive"
            }`}
            onError={handleVideoError}
          />

          {/* State-specific atmospheric visualizer overlays */}
          {activeVideoState === "listening" && <div className="dia-listening-ring" />}
          {state === "thinking" && <div className="dia-thinking-halo" />}
          {activeVideoState === "speaking" && <div className="dia-speaking-wave" />}
        </div>
      </div>
    </div>
  );
};

export default DiaVideoCharacter;
