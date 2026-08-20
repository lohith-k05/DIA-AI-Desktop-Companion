/**
 * CharacterController Component & Hook
 * Option 1: Coordinates CharacterState transitions with voice & chat lifecycle
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { CharacterState } from "./characterTypes";

interface UseCharacterControllerProps {
  isLoading?: boolean;
  isListening?: boolean;
  isSpeaking?: boolean;
  initialState?: CharacterState;
}

export function useCharacterController({
  isLoading = false,
  isListening = false,
  isSpeaking = false,
  initialState = "idle",
}: UseCharacterControllerProps = {}) {
  const [characterState, setCharacterState] = useState<CharacterState>(initialState);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, []);

  // Synchronize state with reactive voice/chat props
  useEffect(() => {
    clearTimer();
    if (isListening) {
      setCharacterState("listening");
    } else if (isLoading) {
      setCharacterState("thinking");
    } else if (isSpeaking) {
      setCharacterState("speaking");
    } else {
      // Return to idle if previously in a transient active state
      setCharacterState((prev) => {
        if (prev === "listening" || prev === "thinking" || prev === "speaking") {
          return "idle";
        }
        return prev;
      });
    }
  }, [isLoading, isListening, isSpeaking, clearTimer]);

  // Transient state triggers with auto-reset to idle
  const triggerGreeting = useCallback((durationMs = 2800) => {
    clearTimer();
    setCharacterState("greeting");
    resetTimerRef.current = setTimeout(() => {
      setCharacterState("idle");
    }, durationMs);
  }, [clearTimer]);

  const triggerHappy = useCallback((durationMs = 2600) => {
    clearTimer();
    setCharacterState("happy");
    resetTimerRef.current = setTimeout(() => {
      setCharacterState("idle");
    }, durationMs);
  }, [clearTimer]);

  const triggerConfused = useCallback((durationMs = 2400) => {
    clearTimer();
    setCharacterState("confused");
    resetTimerRef.current = setTimeout(() => {
      setCharacterState("idle");
    }, durationMs);
  }, [clearTimer]);

  const triggerError = useCallback((durationMs = 3500) => {
    clearTimer();
    setCharacterState("error");
    resetTimerRef.current = setTimeout(() => {
      setCharacterState("idle");
    }, durationMs);
  }, [clearTimer]);

  const resetToIdle = useCallback(() => {
    clearTimer();
    setCharacterState("idle");
  }, [clearTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return {
    characterState,
    setCharacterState,
    triggerGreeting,
    triggerHappy,
    triggerConfused,
    triggerError,
    resetToIdle,
  };
}

export type CharacterControllerReturn = ReturnType<typeof useCharacterController>;
