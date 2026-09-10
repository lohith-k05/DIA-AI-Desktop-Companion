/**
 * Expression Controller & Heuristic Response Classifier
 * Option 1: Emotional Expression System for Dia
 */

import { useState, useEffect, useRef, useCallback } from "react";
import type { CharacterState } from "./characterTypes";
import {
  type CharacterExpression,
  DEFAULT_EXPRESSION,
  EXPRESSION_METADATA,
} from "./expressionTypes";

/**
 * Default state-to-expression mapping for automatic state transitions
 */
export const stateExpressionMap: Record<CharacterState, CharacterExpression> = {
  idle: "neutral",
  greeting: "friendly",
  listening: "curious",
  thinking: "thoughtful",
  speaking: "friendly",
  happy: "happy",
  confused: "confused",
  error: "concerned",
};

/**
 * Lightweight rule-based expression detector for AI responses.
 * Classifies response tone into visual expression categories without
 * making medical, psychological, or sensitive assumptions.
 */
export function detectExpressionFromResponse(
  response: string,
  userMessage?: string
): CharacterExpression {
  if (!response || response.trim().length === 0) {
    return "neutral";
  }

  const cleanResp = response.toLowerCase();
  const cleanUser = userMessage ? userMessage.toLowerCase() : "";

  // 1. Error, limitation, or problem notice -> concerned
  if (
    cleanResp.includes("error") ||
    cleanResp.includes("unable to") ||
    cleanResp.includes("could not connect") ||
    cleanResp.includes("apologize") ||
    cleanResp.includes("troubleshoot") ||
    cleanResp.includes("failed to") ||
    cleanResp.includes("limitation") ||
    cleanResp.includes("sorry to hear")
  ) {
    return "concerned";
  }

  // 2. Sadness, grief, or empathy -> sad / empathetic
  if (
    cleanResp.includes("condolence") ||
    cleanResp.includes("heartbreaking") ||
    cleanResp.includes("deeply sorry") ||
    cleanResp.includes("mourning") ||
    cleanResp.includes("grief") ||
    cleanUser.includes("feeling sad") ||
    cleanUser.includes("depressed") ||
    cleanUser.includes("lost my")
  ) {
    return "sad";
  }

  // 3. Unclear query, clarification request -> confused / pondering
  if (
    cleanResp.includes("could you clarify") ||
    cleanResp.includes("not quite sure what you mean") ||
    cleanResp.includes("pardon") ||
    cleanResp.includes("could you rephrase") ||
    cleanResp.includes("ambiguous") ||
    cleanResp.includes("did you mean")
  ) {
    return "confused";
  }

  // 4. Surprising, astonishing, or extraordinary revelations -> surprised
  if (
    cleanResp.includes("astonishing") ||
    cleanResp.includes("mind-blowing") ||
    cleanResp.includes("fascinatingly") ||
    cleanResp.includes("unexpectedly") ||
    cleanResp.includes("whoa") ||
    cleanResp.includes("incredible fact") ||
    cleanResp.includes("unprecedented")
  ) {
    return "surprised";
  }

  // 5. Celebration, major milestone, high energy -> excited
  if (
    cleanResp.includes("congratulations!") ||
    cleanResp.includes("you did it!") ||
    cleanResp.includes("fantastic work") ||
    cleanResp.includes("incredible job") ||
    cleanResp.includes("so excited") ||
    cleanResp.includes("huge achievement") ||
    cleanResp.includes("hurray") ||
    cleanResp.includes("let's celebrate")
  ) {
    return "excited";
  }

  // 6. Warm gratitude, happiness, positive success -> happy
  if (
    cleanResp.includes("you're very welcome") ||
    cleanResp.includes("happy to help") ||
    cleanResp.includes("glad I could help") ||
    cleanResp.includes("my pleasure") ||
    cleanResp.includes("wonderful!") ||
    cleanResp.includes("great job") ||
    cleanResp.includes("delighted") ||
    cleanResp.includes("enjoy!") ||
    cleanResp.includes("have a great day")
  ) {
    return "happy";
  }

  // 7. Mindfulness, relaxation, peace -> calm
  if (
    cleanResp.includes("take a deep breath") ||
    cleanResp.includes("peaceful") ||
    cleanResp.includes("meditation") ||
    cleanResp.includes("mindfulness") ||
    cleanResp.includes("breathe in") ||
    cleanResp.includes("calm your mind") ||
    cleanResp.includes("relax and unwind")
  ) {
    return "calm";
  }

  // 8. Complex explanations, code, technical breakdowns -> thoughtful
  if (
    cleanResp.includes("```") ||
    cleanResp.includes("here's how it works:") ||
    cleanResp.includes("algorithm") ||
    cleanResp.includes("architecture") ||
    cleanResp.includes("mathematically") ||
    cleanResp.includes("step-by-step breakdown") ||
    cleanResp.includes("analysis:") ||
    cleanResp.includes("let's analyze")
  ) {
    return "thoughtful";
  }

  // 9. Inquisitive or wondering -> curious
  if (
    cleanResp.includes("have you ever wondered") ||
    cleanResp.includes("did you know that") ||
    cleanResp.includes("interesting question") ||
    cleanResp.includes("what if") ||
    cleanResp.includes("curious about") ||
    cleanUser.startsWith("why ") ||
    cleanUser.startsWith("how does ")
  ) {
    return "curious";
  }

  // 10. Greetings and friendly salutations -> friendly
  if (
    cleanResp.includes("hello") ||
    cleanResp.includes("hi there") ||
    cleanResp.includes("hey!") ||
    cleanResp.includes("good morning") ||
    cleanResp.includes("good afternoon") ||
    cleanResp.includes("good evening") ||
    cleanResp.includes("nice to see you") ||
    cleanResp.includes("how can i assist")
  ) {
    return "friendly";
  }

  // Default baseline for helpful assistant replies
  return "friendly";
}

interface UseExpressionControllerOptions {
  state?: CharacterState;
  isSpeaking?: boolean;
  initialExpression?: CharacterExpression;
  autoResetDelayMs?: number;
}

/**
 * Custom React hook for robust emotional expression lifecycle management
 */
export function useExpressionController({
  state = "idle",
  isSpeaking = false,
  initialExpression = DEFAULT_EXPRESSION,
  autoResetDelayMs = 3500,
}: UseExpressionControllerOptions = {}) {
  const [expression, setExpressionState] = useState<CharacterExpression>(initialExpression);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingResetRef = useRef<boolean>(false);

  const clearTimer = useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, []);

  // Update expression with optional timed decay to neutral
  const setExpression = useCallback(
    (newExpr: CharacterExpression, holdMs?: number) => {
      clearTimer();
      setExpressionState(newExpr);

      if (holdMs && holdMs > 0) {
        pendingResetRef.current = true;
        resetTimerRef.current = setTimeout(() => {
          // If still speaking, wait until speaking finishes
          if (!isSpeaking) {
            setExpressionState(stateExpressionMap[state] || "neutral");
            pendingResetRef.current = false;
          }
        }, holdMs);
      } else {
        pendingResetRef.current = false;
      }
    },
    [clearTimer, isSpeaking, state]
  );

  // When speech ends, release any held expression smoothly after a short delay
  useEffect(() => {
    if (!isSpeaking && pendingResetRef.current) {
      clearTimer();
      resetTimerRef.current = setTimeout(() => {
        setExpressionState((prev) => {
          if (prev !== "neutral") {
            return stateExpressionMap[state] || "neutral";
          }
          return prev;
        });
        pendingResetRef.current = false;
      }, autoResetDelayMs);
    }
  }, [isSpeaking, state, autoResetDelayMs, clearTimer]);

  // Clean up on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const resetToNeutral = useCallback(() => {
    clearTimer();
    pendingResetRef.current = false;
    setExpressionState("neutral");
  }, [clearTimer]);

  return {
    expression,
    setExpression,
    resetToNeutral,
    metadata: EXPRESSION_METADATA[expression] || EXPRESSION_METADATA.neutral,
  };
}
