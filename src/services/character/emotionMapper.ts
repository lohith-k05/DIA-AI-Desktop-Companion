/**
 * Emotional Response Mapping Layer
 * Section 30.12 Specification
 * Analyzes conversation text and intent to infer subtle, appropriate facial expressions
 */

import type { DiaExpression, ExpressionDecision } from "../../types/character";
import { detectExpressionFromResponse } from "../../components/character/ExpressionController";

export class EmotionMapper {
  /**
   * Infer an appropriate expression decision based on context and text content
   */
  public static inferExpression(
    text: string,
    _role: "user" | "assistant" = "assistant",
    userMessage?: string
  ): ExpressionDecision {
    if (!text || text.trim().length === 0) {
      return { expression: "neutral", intensity: 0.5, duration: 1500, reason: "default_neutral" };
    }

    const detected = detectExpressionFromResponse(text, userMessage);
    
    // Per-expression calibrated durations and intensities
    const durations: Record<DiaExpression, { duration: number; intensity: number }> = {
      neutral: { duration: 1500, intensity: 0.5 },
      happy: { duration: 3000, intensity: 0.8 },
      friendly: { duration: 2800, intensity: 0.75 },
      curious: { duration: 2600, intensity: 0.7 },
      thoughtful: { duration: 3500, intensity: 0.65 },
      surprised: { duration: 1200, intensity: 0.85 },
      confused: { duration: 2600, intensity: 0.6 },
      concerned: { duration: 3600, intensity: 0.7 },
      sad: { duration: 3600, intensity: 0.65 },
      excited: { duration: 3200, intensity: 0.9 },
      calm: { duration: 3000, intensity: 0.55 },
      speaking: { duration: 0, intensity: 0.7 },
      listening: { duration: 0, intensity: 0.7 },
    };

    const config = durations[detected as DiaExpression] || { duration: 2500, intensity: 0.7 };

    return {
      expression: detected as DiaExpression,
      intensity: config.intensity,
      duration: config.duration,
      reason: `response_classification_${detected}`,
    };
  }

  /**
   * Validate expression name to guarantee model stability
   */
  public static sanitizeExpression(raw: string): DiaExpression {
    const valid: DiaExpression[] = [
      "neutral",
      "happy",
      "friendly",
      "curious",
      "thoughtful",
      "surprised",
      "confused",
      "concerned",
      "sad",
      "excited",
      "calm",
      "speaking",
      "listening",
    ];

    if (raw === "supportive") return "friendly";
    return valid.includes(raw as DiaExpression) ? (raw as DiaExpression) : "neutral";
  }
}
