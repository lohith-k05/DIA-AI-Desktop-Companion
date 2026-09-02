/**
 * Ocular Dynamics & Blinking System
 * Section 30.7 Eye System Specification
 */

import { CHARACTER_CONFIG } from "../../config/characterConfig";
import type { EyeState } from "../../types/character";

export class EyeSystem {
  private blinkLeft: number = 0;
  private blinkRight: number = 0;
  private gazeX: number = 0;
  private gazeY: number = 0;
  private targetGazeX: number = 0;
  private targetGazeY: number = 0;

  private nextBlinkTime: number = 0;
  private isBlinking: boolean = false;
  private blinkStartTime: number = 0;
  private blinkDuration: number = CHARACTER_CONFIG.EYE.BLINK_DURATION_MS;
  private isDoubleBlinkPending: boolean = false;

  private nextSaccadeTime: number = 0;

  constructor() {
    this.scheduleNextBlink();
    this.scheduleNextSaccade();
  }

  /**
   * Update ocular state on each animation frame
   * @param deltaSeconds delta time in seconds
   * @param isThinking whether Dia is currently thinking (deviates gaze slightly)
   */
  public update(deltaSeconds: number, isThinking = false): EyeState {
    const now = Date.now();

    // 1. Process Blinking
    if (!this.isBlinking && now >= this.nextBlinkTime) {
      this.triggerBlink();
    }

    if (this.isBlinking) {
      const elapsed = now - this.blinkStartTime;
      const progress = elapsed / this.blinkDuration;

      if (progress >= 1.0) {
        this.blinkLeft = 0;
        this.blinkRight = 0;
        this.isBlinking = false;

        if (this.isDoubleBlinkPending) {
          this.isDoubleBlinkPending = false;
          // Short pause before second blink
          this.nextBlinkTime = now + 90;
        } else {
          this.scheduleNextBlink();
        }
      } else {
        // Natural sine curve for smooth eyelid motion (close then open)
        const curve = Math.sin(progress * Math.PI);
        this.blinkLeft = curve;
        this.blinkRight = curve;
      }
    }

    // 2. Process Saccadic Micro-Movements
    if (now >= this.nextSaccadeTime) {
      this.scheduleNextSaccade();

      if (isThinking) {
        // Look slightly up and away while thinking
        this.targetGazeX = (Math.random() - 0.3) * CHARACTER_CONFIG.EYE.MAX_GAZE_X * 1.5;
        this.targetGazeY = 0.12 + Math.random() * 0.1;
      } else {
        // Subtle ambient saccades centered near user/camera
        this.targetGazeX = (Math.random() - 0.5) * CHARACTER_CONFIG.EYE.MAX_GAZE_X;
        this.targetGazeY = (Math.random() - 0.5) * CHARACTER_CONFIG.EYE.MAX_GAZE_Y;
      }
    }

    // 3. Smooth Gaze Interpolation
    const lerpSpeed = Math.min(1.0, deltaSeconds * 12);
    this.gazeX += (this.targetGazeX - this.gazeX) * lerpSpeed;
    this.gazeY += (this.targetGazeY - this.gazeY) * lerpSpeed;

    return {
      blinkLeft: this.blinkLeft,
      blinkRight: this.blinkRight,
      gazeX: this.gazeX,
      gazeY: this.gazeY,
      isLookingAtUser: Math.abs(this.gazeX) < 0.1 && Math.abs(this.gazeY) < 0.1,
    };
  }

  public triggerBlink(): void {
    this.isBlinking = true;
    this.blinkStartTime = Date.now();
    this.blinkDuration = CHARACTER_CONFIG.EYE.BLINK_DURATION_MS;

    // Check randomized double-blink chance
    if (Math.random() < CHARACTER_CONFIG.EYE.DOUBLE_BLINK_PROBABILITY) {
      this.isDoubleBlinkPending = true;
    }
  }

  private scheduleNextBlink(): void {
    const min = CHARACTER_CONFIG.EYE.MIN_BLINK_INTERVAL_MS;
    const max = CHARACTER_CONFIG.EYE.MAX_BLINK_INTERVAL_MS;
    const interval = min + Math.random() * (max - min);
    this.nextBlinkTime = Date.now() + interval;
  }

  private scheduleNextSaccade(): void {
    // Saccades happen every 1.5 to 4 seconds
    const interval = 1500 + Math.random() * 2500;
    this.nextSaccadeTime = Date.now() + interval;
  }
}
