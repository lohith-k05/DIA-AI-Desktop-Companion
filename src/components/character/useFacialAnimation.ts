/**
 * useFacialAnimation Hook
 * Coordinates natural irregular blinking, speaking mouth alternation,
 * expression-to-mouth mapping, and developer test overrides.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type {
  CharacterState,
  CharacterExpression,
  MouthState,
  EyeState,
  FacialDevOverrides,
} from "./characterTypes";

interface UseFacialAnimationOptions {
  state?: CharacterState;
  expression?: CharacterExpression | string;
  isSpeaking?: boolean;
  audioLevel?: number;
  isImageLoaded?: boolean;
  canBlink?: boolean;
  devOverrides?: FacialDevOverrides;
}

export interface UseFacialAnimationReturn {
  eyeState: EyeState;
  mouthState: MouthState;
  isBlinking: boolean;
  triggerManualBlink: () => void;
}

export function useFacialAnimation({
  state = "idle",
  expression = "neutral",
  isSpeaking = false,
  audioLevel = 0,
  isImageLoaded = true,
  canBlink = true,
  devOverrides,
}: UseFacialAnimationOptions = {}): UseFacialAnimationReturn {
  const [isBlinking, setIsBlinking] = useState(false);
  const [speakingMouthOpen, setSpeakingMouthOpen] = useState(false);

  const blinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ----------------------------------------------------
  // 1. Natural Blinking Engine
  // ----------------------------------------------------
  const clearBlinkTimers = useCallback(() => {
    if (blinkTimeoutRef.current) {
      clearTimeout(blinkTimeoutRef.current);
      blinkTimeoutRef.current = null;
    }
    if (blinkEndTimeoutRef.current) {
      clearTimeout(blinkEndTimeoutRef.current);
      blinkEndTimeoutRef.current = null;
    }
  }, []);

  const performBlink = useCallback(() => {
    // If closed-eye asset is not available or reduced motion is preferred, don't toggle
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (!canBlink || prefersReducedMotion || !isImageLoaded) {
      return;
    }

    setIsBlinking(true);
    // Closed eye duration: 120ms - 170ms
    const closeDuration = Math.floor(Math.random() * 50) + 120;

    blinkEndTimeoutRef.current = setTimeout(() => {
      setIsBlinking(false);
    }, closeDuration);
  }, [canBlink, isImageLoaded]);

  const scheduleNextBlink = useCallback(() => {
    clearBlinkTimers();

    if (
      !canBlink ||
      !isImageLoaded ||
      (typeof document !== "undefined" && document.hidden)
    ) {
      return;
    }

    // Irregular interval between 3.0s and 7.0s (3000ms - 7000ms)
    const nextBlinkMs = Math.floor(Math.random() * 4000) + 3000;

    blinkTimeoutRef.current = setTimeout(() => {
      performBlink();
      scheduleNextBlink();
    }, nextBlinkMs);
  }, [canBlink, isImageLoaded, clearBlinkTimers, performBlink]);

  // Handle visibility changes to pause blinking when page is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearBlinkTimers();
        setIsBlinking(false);
      } else {
        scheduleNextBlink();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
      scheduleNextBlink();
    }

    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      clearBlinkTimers();
    };
  }, [scheduleNextBlink, clearBlinkTimers]);

  // Trigger manual blink from dev controls
  const triggerManualBlink = useCallback(() => {
    performBlink();
  }, [performBlink]);

  // Listen for dev force blink
  useEffect(() => {
    if (devOverrides?.forceBlink) {
      performBlink();
    }
  }, [devOverrides?.forceBlink, performBlink]);

  // ----------------------------------------------------
  // 2. Speaking Mouth Animation (Viseme alternating)
  // ----------------------------------------------------
  const effectiveSpeaking = isSpeaking || !!devOverrides?.isSpeakingLoop;

  useEffect(() => {
    if (speechIntervalRef.current) {
      clearInterval(speechIntervalRef.current);
      speechIntervalRef.current = null;
    }

    if (!effectiveSpeaking) {
      setSpeakingMouthOpen(false);
      return;
    }

    // Natural speech cadence: alternate open/neutral every 140ms - 180ms
    const intervalMs = 150;

    speechIntervalRef.current = setInterval(() => {
      // If audio level is available, use amplitude threshold; else alternate
      if (audioLevel > 0) {
        setSpeakingMouthOpen(audioLevel > 0.08);
      } else {
        setSpeakingMouthOpen((prev) => !prev);
      }
    }, intervalMs);

    return () => {
      if (speechIntervalRef.current) {
        clearInterval(speechIntervalRef.current);
        speechIntervalRef.current = null;
      }
      setSpeakingMouthOpen(false);
    };
  }, [effectiveSpeaking, audioLevel]);

  // ----------------------------------------------------
  // 3. Expression-to-Mouth Mapping
  // ----------------------------------------------------
  const resolvedMouthState: MouthState = useMemo(() => {
    // 1. Explicit dev override has top priority
    if (devOverrides?.mouthOverride) {
      return devOverrides.mouthOverride;
    }

    // 2. Active speech has second priority
    if (effectiveSpeaking) {
      return speakingMouthOpen ? "open" : "neutral";
    }

    // 3. Map expression to mouth shape
    const cleanExpr = String(expression).toLowerCase();

    if (
      cleanExpr === "happy" ||
      cleanExpr === "friendly" ||
      cleanExpr === "excited" ||
      state === "happy" ||
      state === "greeting"
    ) {
      return "smile";
    }

    if (cleanExpr === "surprised") {
      return "surprised";
    }

    if (
      cleanExpr === "concerned" ||
      cleanExpr === "sad" ||
      cleanExpr === "confused" ||
      state === "error" ||
      state === "confused"
    ) {
      return "concerned";
    }

    // Default resting mouth
    return "neutral";
  }, [
    devOverrides?.mouthOverride,
    effectiveSpeaking,
    speakingMouthOpen,
    expression,
    state,
  ]);

  // ----------------------------------------------------
  // 4. Resolve Eye State
  // ----------------------------------------------------
  const resolvedEyeState: EyeState = useMemo(() => {
    if (devOverrides?.eyeOverride) {
      return devOverrides.eyeOverride;
    }
    return isBlinking ? "closed" : "open";
  }, [devOverrides?.eyeOverride, isBlinking]);

  return {
    eyeState: resolvedEyeState,
    mouthState: resolvedMouthState,
    isBlinking,
    triggerManualBlink,
  };
}
