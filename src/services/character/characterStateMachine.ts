/**
 * Character State Machine
 * Section 30.5 Character Activity States
 * Manages deterministic activity transitions and prevents conflicting states
 */

import type { DiaActivity } from "../../types/character";

// Priority map: higher value takes precedence in conflict resolution
const STATE_PRIORITY: Record<DiaActivity, number> = {
  error: 100,
  speaking: 90,
  listening: 80,
  processing: 70,
  thinking: 65,
  greeting: 50,
  happy: 40,
  surprised: 40,
  confused: 40,
  sad: 40,
  sleeping: 20,
  idle: 10,
};

export class CharacterStateMachine {
  private currentActivity: DiaActivity = "idle";
  private previousActivity: DiaActivity = "idle";
  private transitionTimestamp: number = Date.now();
  private autoIdleTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(initialActivity: DiaActivity = "idle") {
    this.currentActivity = initialActivity;
  }

  public getCurrent(): DiaActivity {
    return this.currentActivity;
  }

  public getPrevious(): DiaActivity {
    return this.previousActivity;
  }

  /**
   * Request transition to a new activity state
   * Returns true if transition was accepted, false if rejected due to conflict
   */
  public transitionTo(newActivity: DiaActivity, autoResetMs?: number): boolean {
    if (this.currentActivity === newActivity) {
      // Re-arm timer if requested
      if (autoResetMs && autoResetMs > 0) {
        this.scheduleAutoIdle(autoResetMs);
      }
      return true;
    }

    // 30.5 Prevent conflicting states
    // Rule 1: Cannot listen while actively speaking
    if (newActivity === "listening" && this.currentActivity === "speaking") {
      console.warn("[CharacterStateMachine] Cannot transition to 'listening' while speaking.");
      return false;
    }

    // Rule 2: Cannot drop to 'idle' while thinking or processing
    if (
      newActivity === "idle" &&
      (this.currentActivity === "thinking" || this.currentActivity === "processing")
    ) {
      console.warn("[CharacterStateMachine] Cannot go to 'idle' while still processing AI request.");
      return false;
    }

    // Clean up any pending auto-idle timer
    this.clearAutoIdleTimer();

    // Accept transition
    this.previousActivity = this.currentActivity;
    this.currentActivity = newActivity;
    this.transitionTimestamp = Date.now();

    // Auto-return to idle after specified duration (e.g. greeting, error, transient emotion)
    if (autoResetMs && autoResetMs > 0) {
      this.scheduleAutoIdle(autoResetMs);
    }

    return true;
  }

  /**
   * Force transition (used during user interrupt or error recovery)
   */
  public forceTransition(newActivity: DiaActivity): void {
    this.clearAutoIdleTimer();
    this.previousActivity = this.currentActivity;
    this.currentActivity = newActivity;
    this.transitionTimestamp = Date.now();
  }

  /**
   * Compare priority between two states
   */
  public hasHigherPriority(a: DiaActivity, b: DiaActivity): boolean {
    return (STATE_PRIORITY[a] ?? 0) > (STATE_PRIORITY[b] ?? 0);
  }

  public getDurationInCurrentState(): number {
    return Date.now() - this.transitionTimestamp;
  }

  private scheduleAutoIdle(delayMs: number): void {
    this.clearAutoIdleTimer();
    this.autoIdleTimer = setTimeout(() => {
      if (
        this.currentActivity !== "speaking" &&
        this.currentActivity !== "listening" &&
        this.currentActivity !== "thinking"
      ) {
        this.forceTransition("idle");
      }
    }, delayMs);
  }

  private clearAutoIdleTimer(): void {
    if (this.autoIdleTimer) {
      clearTimeout(this.autoIdleTimer);
      this.autoIdleTimer = null;
    }
  }

  public destroy(): void {
    this.clearAutoIdleTimer();
  }
}
