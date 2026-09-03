/**
 * Central Character Controller & Event System
 * Section 30.13 & 30.14 Specification
 * Coordinates activity state, expressions, ocular dynamics, lip-sync, and application events
 */

import { CharacterStateMachine } from "./characterStateMachine";
import { EmotionMapper } from "./emotionMapper";
import { EyeSystem } from "./eyeSystem";
import { LipSyncEngine } from "./lipSyncEngine";
import type {
  CharacterControllerState,
  DiaActivity,
  DiaCharacterEvent,
  DiaCharacterRendererType,
  DiaExpression,
} from "../../types/character";

type StateListener = (state: CharacterControllerState) => void;

class CharacterController {
  private stateMachine: CharacterStateMachine;
  private eyeSystem: EyeSystem;
  private lipSyncEngine: LipSyncEngine;

  private currentExpression: DiaExpression = "neutral";
  private expressionIntensity: number = 0.5;
  private expressionTimer: ReturnType<typeof setTimeout> | null = null;
  private currentRenderer: DiaCharacterRendererType = "2d";

  private listeners: Set<StateListener> = new Set();

  constructor() {
    this.stateMachine = new CharacterStateMachine("idle");
    this.eyeSystem = new EyeSystem();
    this.lipSyncEngine = new LipSyncEngine();
  }

  /**
   * Subscribe to character state updates
   */
  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  /**
   * Get complete snapshot of current character state
   */
  public getState(): CharacterControllerState {
    const lipSyncState = this.lipSyncEngine.update(0.016);
    const isThinking =
      this.stateMachine.getCurrent() === "thinking" ||
      this.stateMachine.getCurrent() === "processing";
    const eyeState = this.eyeSystem.update(0.016, isThinking);

    return {
      activity: this.stateMachine.getCurrent(),
      expression: this.currentExpression,
      expressionIntensity: this.expressionIntensity,
      isSpeaking: lipSyncState.isSpeaking,
      isListening: this.stateMachine.getCurrent() === "listening",
      audioLevel: lipSyncState.audioLevel,
      eyeState,
      lipSyncState,
      renderer: this.currentRenderer,
    };
  }

  /**
   * 30.14 Dispatch application lifecycle events to the character
   */
  public dispatchEvent(event: DiaCharacterEvent): void {
    switch (event.type) {
      case "APP_READY":
        this.setActivity("greeting", 2800);
        this.setExpression("friendly", 0.8, 3000);
        break;

      case "USER_STARTED_TYPING":
        if (this.stateMachine.getCurrent() === "idle") {
          this.setActivity("idle");
          this.setExpression("curious", 0.5, 2000);
        }
        break;

      case "USER_SENT_MESSAGE":
        this.setActivity("thinking");
        this.setExpression("thoughtful", 0.7, 6000);
        break;

      case "VOICE_LISTENING_STARTED":
        this.startListening();
        break;

      case "VOICE_LISTENING_STOPPED":
        this.stopListening();
        break;

      case "AI_REQUEST_STARTED":
        this.setActivity("thinking");
        this.setExpression("thoughtful", 0.7, 4000);
        break;

      case "AI_REQUEST_COMPLETED":
        if (event.replyText) {
          const decision = EmotionMapper.inferExpression(event.replyText, "assistant");
          this.setExpression(decision.expression, decision.intensity, decision.duration);
        }
        // If not actively speaking, transition to calm idle
        if (!this.lipSyncEngine.update(0).isSpeaking) {
          this.setActivity("idle");
        }
        break;

      case "AI_REQUEST_FAILED":
        this.setActivity("error", 3500);
        this.setExpression("concerned", 0.8, 3500);
        break;

      case "TTS_STARTED":
        this.startSpeaking();
        this.setActivity("speaking");
        break;

      case "TTS_ENDED":
        this.stopSpeaking();
        this.setActivity("idle");
        break;

      case "TOOL_EXECUTION_STARTED":
        this.setActivity("processing");
        this.setExpression("thoughtful", 0.6, 2500);
        break;

      case "TOOL_EXECUTION_COMPLETED":
        this.setActivity("happy", 2000);
        this.setExpression("happy", 0.7, 2000);
        break;

      case "SET_EXPRESSION":
        this.setExpression(event.expression, event.intensity, event.duration);
        break;

      case "SET_ACTIVITY":
        this.setActivity(event.activity);
        break;

      case "SET_AUDIO_LEVEL":
        this.feedAudioLevel(event.level);
        break;
    }
  }

  // --------------------------------------------------
  // Direct Control Methods (Section 30.13)
  // --------------------------------------------------

  public setActivity(activity: DiaActivity, autoResetMs?: number): void {
    const accepted = this.stateMachine.transitionTo(activity, autoResetMs);
    if (accepted) {
      this.notify();
    }
  }

  public setExpression(expression: DiaExpression, intensity = 0.7, durationMs = 2500): void {
    const sanitized = EmotionMapper.sanitizeExpression(expression);
    this.currentExpression = sanitized;
    this.expressionIntensity = Math.max(0.1, Math.min(1.0, intensity));

    if (this.expressionTimer) {
      clearTimeout(this.expressionTimer);
      this.expressionTimer = null;
    }

    if (durationMs > 0 && sanitized !== "neutral") {
      this.expressionTimer = setTimeout(() => {
        // If Dia is actively speaking, do not interrupt her expression; let stopSpeaking() handle post-speech decay
        if (this.lipSyncEngine.update(0).isSpeaking || this.stateMachine.getCurrent() === "speaking") {
          return;
        }
        this.currentExpression = "neutral";
        this.expressionIntensity = 0.5;
        this.notify();
      }, durationMs);
    }

    this.notify();
  }

  public startSpeaking(durationMs?: number): void {
    this.stateMachine.forceTransition("speaking");
    this.lipSyncEngine.startSpeaking(durationMs);
    this.notify();
  }

  public stopSpeaking(): void {
    this.lipSyncEngine.stopSpeaking();
    if (this.stateMachine.getCurrent() === "speaking") {
      this.stateMachine.forceTransition("idle");
    }
    // Hold active expression for ~3.5s after speech completes, then gracefully transition to neutral
    if (this.expressionTimer) {
      clearTimeout(this.expressionTimer);
    }
    if (this.currentExpression !== "neutral") {
      this.expressionTimer = setTimeout(() => {
        this.currentExpression = "neutral";
        this.expressionIntensity = 0.5;
        this.notify();
      }, 3500);
    }
    this.notify();
  }

  public startListening(): void {
    this.lipSyncEngine.stopSpeaking();
    this.stateMachine.forceTransition("listening");
    this.setExpression("listening", 0.7, 0);
    this.notify();
  }

  public stopListening(): void {
    if (this.stateMachine.getCurrent() === "listening") {
      this.stateMachine.forceTransition("idle");
      this.setExpression("neutral", 0.5, 1200);
    }
    this.notify();
  }

  public feedAudioLevel(level: number): void {
    this.lipSyncEngine.feedAudioLevel(level);
  }

  public setRenderer(renderer: DiaCharacterRendererType): void {
    this.currentRenderer = renderer;
    this.notify();
  }

  public triggerBlink(): void {
    this.eyeSystem.triggerBlink();
  }

  public reset(): void {
    this.stateMachine.forceTransition("idle");
    this.currentExpression = "neutral";
    this.expressionIntensity = 0.5;
    this.lipSyncEngine.stopSpeaking();
    this.notify();
  }

  public getEyeSystem(): EyeSystem {
    return this.eyeSystem;
  }

  public getLipSyncEngine(): LipSyncEngine {
    return this.lipSyncEngine;
  }
}

// Singleton global character controller
export const characterController = new CharacterController();
