/**
 * DiaVideo Component
 * Dedicated full-motion video character display for Dia
 * Renders video files directly as the character without static image fallbacks.
 */

import React, { useState, useRef, useEffect, useMemo } from "react";
import type { CharacterState, CharacterSize } from "./characterTypes";
import type { CharacterActivity } from "../../types/character";
import "./characterAnimations.css";
import "./DiaVideo.css";

export type DiaVideoState = "idle" | "listening" | "thinking" | "speaking" | "happy";

export const DIA_VIDEO_PATHS = {
  idle: "/dia/idle.mp4?v=2",
  listening: "/dia/listening.mp4?v=2",
  speaking: "/dia/speaking.mp4?v=2",
  thinking: "/dia/idle.mp4?v=2",
  happy: "/dia/idle.mp4?v=2",
} as const;

export interface DiaVideoProps {
  activity?: CharacterActivity | CharacterState | string;
  state?: CharacterState | string;
  isSpeaking?: boolean;
  isListening?: boolean;
  audioElement?: HTMLAudioElement | null;
  size?: CharacterSize;
  className?: string;
  onClick?: () => void;
  showStatusBadge?: boolean;
  // Overrides for custom video paths if needed
  idleVideoSrc?: string;
  listeningVideoSrc?: string;
  speakingVideoSrc?: string;
  thinkingVideoSrc?: string;
  happyVideoSrc?: string;
}

export const DiaVideo: React.FC<DiaVideoProps> = ({
  activity,
  state: propState,
  isSpeaking = false,
  isListening = false,
  audioElement = null,
  size = "hero",
  className = "",
  onClick,
  showStatusBadge = true,
  idleVideoSrc,
  listeningVideoSrc,
  speakingVideoSrc,
  thinkingVideoSrc,
  happyVideoSrc,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [audioSpeaking, setAudioSpeaking] = useState(false);
  const [videoError, setVideoError] = useState<{ src: string; message: string } | null>(null);

  // ----------------------------------------------------
  // 1. HTMLAudioElement Integration (if provided)
  // ----------------------------------------------------
  useEffect(() => {
    if (!audioElement) return;

    const handlePlay = () => setAudioSpeaking(true);
    const handleEnded = () => setAudioSpeaking(false);
    const handlePause = () => setAudioSpeaking(false);
    const handleError = () => setAudioSpeaking(false);

    audioElement.addEventListener("play", handlePlay);
    audioElement.addEventListener("playing", handlePlay);
    audioElement.addEventListener("ended", handleEnded);
    audioElement.addEventListener("pause", handlePause);
    audioElement.addEventListener("error", handleError);

    return () => {
      audioElement.removeEventListener("play", handlePlay);
      audioElement.removeEventListener("playing", handlePlay);
      audioElement.removeEventListener("ended", handleEnded);
      audioElement.removeEventListener("pause", handlePause);
      audioElement.removeEventListener("error", handleError);
    };
  }, [audioElement]);

  // Combined speaking state from Web SpeechSynthesis or HTMLAudioElement
  const effectiveSpeaking = isSpeaking || audioSpeaking;

  // ----------------------------------------------------
  // 2. Strict State-Based Video Switching Priority:
  //    speaking > listening > thinking > happy > idle
  // ----------------------------------------------------
  const activeVideoState = useMemo<DiaVideoState>(() => {
    // Speaking strictly matches active TTS audio playback
    if (effectiveSpeaking) {
      return "speaking";
    }
    // Listening strictly matches microphone activity
    if (isListening || propState === "listening" || activity === "listening") {
      return "listening";
    }
    // Thinking during model inference
    if (
      propState === "thinking" ||
      activity === "thinking" ||
      (activity as string) === "processing"
    ) {
      return "thinking";
    }
    // Happy reaction
    if (propState === "happy" || activity === "happy") {
      return "happy";
    }
    // Standby default
    return "idle";
  }, [effectiveSpeaking, isListening, propState, activity]);

  // Resolve target video source URL
  const targetVideoSrc = useMemo<string>(() => {
    switch (activeVideoState) {
      case "speaking":
        return speakingVideoSrc || DIA_VIDEO_PATHS.speaking;
      case "listening":
        return listeningVideoSrc || DIA_VIDEO_PATHS.listening;
      case "thinking":
        return thinkingVideoSrc || DIA_VIDEO_PATHS.thinking;
      case "happy":
        return happyVideoSrc || DIA_VIDEO_PATHS.happy;
      case "idle":
      default:
        return idleVideoSrc || DIA_VIDEO_PATHS.idle;
    }
  }, [
    activeVideoState,
    speakingVideoSrc,
    listeningVideoSrc,
    thinkingVideoSrc,
    happyVideoSrc,
    idleVideoSrc,
  ]);

  // ----------------------------------------------------
  // 3. Preload all video assets into browser memory cache
  // ----------------------------------------------------
  useEffect(() => {
    const videoUrls = [
      idleVideoSrc || DIA_VIDEO_PATHS.idle,
      listeningVideoSrc || DIA_VIDEO_PATHS.listening,
      speakingVideoSrc || DIA_VIDEO_PATHS.speaking,
    ];

    videoUrls.forEach((url) => {
      const v = document.createElement("video");
      v.src = url;
      v.preload = "auto";
      v.muted = true;
      v.load();
    });
  }, [idleVideoSrc, listeningVideoSrc, speakingVideoSrc]);

  // ----------------------------------------------------
  // 4. Video Element Lifecycle & Source Transitions
  // ----------------------------------------------------
  const currentSrcRef = useRef<string>("");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Enforce muted and playsInline for unconstrained autoplay compliance
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    if (currentSrcRef.current !== targetVideoSrc) {
      currentSrcRef.current = targetVideoSrc;
      video.src = targetVideoSrc;
      video.currentTime = 0;
      video.load();

      const playPromise = video.play();
      if (playPromise) {
        playPromise.catch((err) => {
          console.warn(`[DiaVideo] Autoplay for "${targetVideoSrc}" was interrupted:`, err);
        });
      }
    } else if (video.paused) {
      video.play().catch((err) => {
        console.warn(`[DiaVideo] Resume play notice for "${targetVideoSrc}":`, err);
      });
    }
  }, [targetVideoSrc]);

  // Initial playback on mount
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    if (!video.src || video.src === "") {
      video.src = targetVideoSrc;
      currentSrcRef.current = targetVideoSrc;
      video.load();
    }

    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch((err) => {
        console.warn(`[DiaVideo] Initial mount play notice:`, err);
      });
    }

    const handleFocusResume = () => {
      if (!document.hidden && videoRef.current && videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleFocusResume);
    window.addEventListener("focus", handleFocusResume);

    return () => {
      document.removeEventListener("visibilitychange", handleFocusResume);
      window.removeEventListener("focus", handleFocusResume);
    };
  }, []);

  // ----------------------------------------------------
  // 5. Error & Event Handlers
  // ----------------------------------------------------
  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const target = e.currentTarget;
    const mediaErr = target.error;
    const message = mediaErr
      ? `Code ${mediaErr.code}: ${mediaErr.message || "Decoding error"}`
      : "Network or file format error";
    const failedPath = target.currentSrc || target.src || targetVideoSrc;

    console.error(`[DiaVideo] Failed to load or play video: "${failedPath}"`, message, e);
    setVideoError({ src: failedPath, message });
  };

  const handleVideoPlay = () => {
    setVideoError(null);
  };

  // Status pill metadata
  const statusInfo = useMemo(() => {
    switch (activeVideoState) {
      case "listening":
        return { label: "Listening...", dotClass: "dot-listening" };
      case "thinking":
        return { label: "Thinking...", dotClass: "dot-thinking" };
      case "speaking":
        return { label: "Speaking...", dotClass: "dot-speaking" };
      case "happy":
        return { label: "Dia is Happy", dotClass: "dot-idle" };
      case "idle":
      default:
        return { label: "Dia AI Companion", dotClass: "dot-idle" };
    }
  }, [activeVideoState]);

  return (
    <div
      className={`dia-video-root size-${size} state-${activeVideoState} ${className}`}
      onClick={onClick}
      role="region"
      aria-label={`Dia AI Companion - ${activeVideoState} state`}
    >
      {/* Status indicator badge */}
      {showStatusBadge && size !== "sm" && (
        <div className="dia-video-status-pill">
          <span className={`dia-video-status-dot ${statusInfo.dotClass}`} />
          <span>{statusInfo.label}</span>
        </div>
      )}

      {/* Main Video Stage */}
      <div className="dia-video-stage">
        {/* Ambient atmospheric glow orb behind the video (z-index: 1) */}
        <div className={`dia-video-ambient-glow aura-${activeVideoState}`} />

        {/* Video Wrapper (z-index: 2 - above background glow, below controls) */}
        <div className="dia-video-container">
          {!videoError ? (
            <video
              ref={videoRef}
              src={targetVideoSrc}
              autoPlay
              muted
              loop
              playsInline
              controls={false}
              disablePictureInPicture
              disableRemotePlayback
              className="dia-video-player"
              onPlay={handleVideoPlay}
              onError={handleVideoError}
            />
          ) : (
            <img 
              src="/dia/idle.png" 
              alt="Dia AI Companion Fallback" 
              className="dia-video-player" 
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DiaVideo;
