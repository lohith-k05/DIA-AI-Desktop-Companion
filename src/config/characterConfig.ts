/**
 * Central Character Configuration
 * Section 30.19 Asset Management & Parameters
 */

export const CHARACTER_CONFIG = {
  // Model Assets
  MODEL: {
    DEFAULT_PATH: "/assets/models/dia/dia.glb",
    FALLBACK_IMAGE_PATH: "/dia/idle.png",
    SCALE: 1.0,
    ROTATION_Y: 0,
    POSITION: [0, -1.2, 0] as [number, number, number],
  },

  // 30.7 Eye System Parameters
  EYE: {
    MIN_BLINK_INTERVAL_MS: 2600,
    MAX_BLINK_INTERVAL_MS: 6400,
    BLINK_DURATION_MS: 150,
    DOUBLE_BLINK_PROBABILITY: 0.16,
    MAX_GAZE_X: 0.25,
    MAX_GAZE_Y: 0.2,
    GAZE_LERP_SPEED: 0.08,
  },

  // 30.8 Lip-Sync Parameters
  LIP_SYNC: {
    SMOOTHING_FACTOR: 0.35,
    MIN_AMPLITUDE_THRESHOLD: 0.04,
    MAX_MOUTH_OPEN: 0.85,
    SAMPLE_RATE: 60, // updates per sec
    REST_RESET_DELAY_MS: 180,
  },

  // 30.15 3D Camera & Lighting
  SCENE: {
    CAMERA_FOV: 42,
    CAMERA_POSITION: [0, 0.2, 2.6] as [number, number, number],
    CAMERA_TARGET: [0, 0.1, 0] as [number, number, number],
    AMBIENT_LIGHT_COLOR: 0xffffff,
    AMBIENT_LIGHT_INTENSITY: 0.75,
    KEY_LIGHT_COLOR: 0xffeedd,
    KEY_LIGHT_INTENSITY: 1.8,
    KEY_LIGHT_POSITION: [2, 3, 3] as [number, number, number],
    RIM_LIGHT_COLOR: 0x8b5cf6, // Violet cyber rim
    RIM_LIGHT_INTENSITY: 2.2,
    RIM_LIGHT_POSITION: [-2.5, 2, -2] as [number, number, number],
    FILL_LIGHT_COLOR: 0x06b6d4, // Cyan fill
    FILL_LIGHT_INTENSITY: 0.9,
    FILL_LIGHT_POSITION: [-2, -1, 2] as [number, number, number],
  },

  // Storage Keys
  STORAGE: {
    RENDERER_KEY: "dia-character-renderer-mode",
  },
} as const;

export const DIA_MODEL_PATH = CHARACTER_CONFIG.MODEL.DEFAULT_PATH;
