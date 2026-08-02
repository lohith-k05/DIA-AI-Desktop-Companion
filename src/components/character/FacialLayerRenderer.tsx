/**
 * FacialLayerRenderer Component
 * Implements layered 2D transparent facial rendering over the base Dia character.
 * Renders:
 *   Base Character Image
 *     └── Eyes Layer (open / closed)
 *           └── Mouth Layer (neutral / smile / open / concerned / surprised)
 *                 └── Optional Expression Overlay Layer
 *
 * Ensures pixel-perfect alignment, zero distortion, smooth opacity cross-fades,
 * and robust asset safety (never renders broken image tags for missing files).
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import type {
  MouthState,
  EyeState,
  FacialLayers,
  CharacterExpression,
} from "./characterTypes";

export const EXPECTED_FACIAL_ASSETS = {
  base: "/dia/idle.png",
  eyesOpen: "/assets/dia-eyes-open.png",
  eyesClosed: "/assets/dia-eyes-closed.png",
  mouthNeutral: "/assets/dia-mouth-neutral.png",
  mouthSmile: "/assets/dia-mouth-smile.png",
  mouthOpen: "/assets/dia-mouth-open.png",
  mouthConcerned: "/assets/dia-mouth-concerned.png",
  mouthSurprised: "/assets/dia-mouth-surprised.png",
} as const;

export type FacialAssetKey = keyof typeof EXPECTED_FACIAL_ASSETS;

// Global memory cache to prevent duplicate probes across renders
const assetAvailabilityCache = new Map<string, boolean>();

/**
 * Check whether an image asset URL is available without creating broken DOM elements
 */
export function probeAssetAvailability(url: string): Promise<boolean> {
  if (assetAvailabilityCache.has(url)) {
    return Promise.resolve(assetAvailabilityCache.get(url)!);
  }

  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    const img = new Image();
    img.onload = () => {
      assetAvailabilityCache.set(url, true);
      resolve(true);
    };
    img.onerror = () => {
      assetAvailabilityCache.set(url, false);
      resolve(false);
    };
    img.src = url;
  });
}

export interface FacialLayerRendererProps {
  baseAssetPath?: string;
  blinking?: boolean;
  eyeState?: EyeState;
  mouthState?: MouthState;
  expression?: CharacterExpression | string;
  facialLayers?: FacialLayers;
  className?: string;
  onBaseImageLoaded?: () => void;
  onBaseImageError?: () => void;
}

export const FacialLayerRenderer: React.FC<FacialLayerRendererProps> = ({
  baseAssetPath = EXPECTED_FACIAL_ASSETS.base,
  blinking = false,
  eyeState = "open",
  mouthState = "neutral",
  expression = "neutral",
  facialLayers,
  className = "",
  onBaseImageLoaded,
  onBaseImageError,
}) => {
  const [availableAssets, setAvailableAssets] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const [key, path] of Object.entries(EXPECTED_FACIAL_ASSETS)) {
      if (assetAvailabilityCache.has(path)) {
        initial[key] = assetAvailabilityCache.get(path)!;
      }
    }
    return initial;
  });

  const isMountedRef = useRef(true);

  // Probe available facial assets on mount
  useEffect(() => {
    isMountedRef.current = true;

    const probeAll = async () => {
      const results: Record<string, boolean> = {};
      const entries = Object.entries(EXPECTED_FACIAL_ASSETS) as [FacialAssetKey, string][];

      await Promise.all(
        entries.map(async ([key, path]) => {
          const isAvail = await probeAssetAvailability(path);
          results[key] = isAvail;
        })
      );

      if (isMountedRef.current) {
        setAvailableAssets((prev) => ({ ...prev, ...results }));
      }
    };

    probeAll();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ----------------------------------------------------
  // 1. Resolve Eyes Layer URL
  // ----------------------------------------------------
  const resolvedEyeUrl: string | null = useMemo(() => {
    const isClosed = blinking || eyeState === "closed";

    if (isClosed) {
      const closedUrl = facialLayers?.eyesClosedUrl || EXPECTED_FACIAL_ASSETS.eyesClosed;
      if (availableAssets.eyesClosed || assetAvailabilityCache.get(closedUrl)) {
        return closedUrl;
      }
      // If closed eye layer is unavailable, do not render a broken overlay
      return null;
    }

    // Open eyes layer
    const openUrl = facialLayers?.eyesOpenUrl || EXPECTED_FACIAL_ASSETS.eyesOpen;
    if (availableAssets.eyesOpen || assetAvailabilityCache.get(openUrl)) {
      return openUrl;
    }

    return null;
  }, [blinking, eyeState, facialLayers, availableAssets]);

  // ----------------------------------------------------
  // 2. Resolve Mouth Layer URL
  // ----------------------------------------------------
  const resolvedMouthUrl: string | null = useMemo(() => {
    // Map mouthState to asset key
    let targetKey: FacialAssetKey = "mouthNeutral";
    let customUrl: string | undefined;

    switch (mouthState) {
      case "smile":
        targetKey = "mouthSmile";
        customUrl = facialLayers?.mouthSmileUrl;
        break;
      case "open":
        targetKey = "mouthOpen";
        customUrl = facialLayers?.mouthOpenUrl;
        break;
      case "concerned":
        targetKey = "mouthConcerned";
        customUrl = facialLayers?.mouthConcernedUrl;
        break;
      case "surprised":
        targetKey = "mouthSurprised";
        customUrl = facialLayers?.mouthSurprisedUrl;
        break;
      case "neutral":
      default:
        targetKey = "mouthNeutral";
        customUrl = facialLayers?.mouthNeutralUrl;
        break;
    }

    const candidateUrl = customUrl || EXPECTED_FACIAL_ASSETS[targetKey];
    if (availableAssets[targetKey] || assetAvailabilityCache.get(candidateUrl)) {
      return candidateUrl;
    }

    // Fallback: If requested mouth asset does not exist, fall back to neutral mouth if available
    const neutralUrl = facialLayers?.mouthNeutralUrl || EXPECTED_FACIAL_ASSETS.mouthNeutral;
    if (availableAssets.mouthNeutral || assetAvailabilityCache.get(neutralUrl)) {
      return neutralUrl;
    }

    // Otherwise, base character image already displays Dia's natural mouth
    return null;
  }, [mouthState, facialLayers, availableAssets]);

  // ----------------------------------------------------
  // 3. Resolve Optional Expression Overlay URL
  // ----------------------------------------------------
  const resolvedOverlayUrl: string | null = useMemo(() => {
    if (facialLayers?.expressionOverlayUrl) {
      return facialLayers.expressionOverlayUrl;
    }
    return null;
  }, [facialLayers]);

  return (
    <div className={`dia-facial-canvas ${className}`} aria-hidden="true">
      {/* 1. Base Character Foundation Image */}
      <img
        src={baseAssetPath}
        alt="Dia AI Companion"
        className="dia-char-image dia-facial-base"
        draggable={false}
        loading="eager"
        onLoad={onBaseImageLoaded}
        onError={onBaseImageError}
      />

      {/* 2. Transparent Eyes Layer (Open / Closed) */}
      {resolvedEyeUrl && (
        <img
          key={resolvedEyeUrl}
          src={resolvedEyeUrl}
          alt=""
          className={`dia-facial-layer dia-facial-layer-eyes ${
            blinking ? "is-blinking" : "is-open"
          }`}
          draggable={false}
          aria-hidden="true"
        />
      )}

      {/* 3. Transparent Mouth Layer (Neutral / Smile / Open / Concerned / Surprised) */}
      {resolvedMouthUrl && (
        <img
          key={resolvedMouthUrl}
          src={resolvedMouthUrl}
          alt=""
          className={`dia-facial-layer dia-facial-layer-mouth mouth-${mouthState}`}
          draggable={false}
          aria-hidden="true"
        />
      )}

      {/* 4. Optional Expression Overlay Layer */}
      {resolvedOverlayUrl && (
        <img
          key={resolvedOverlayUrl}
          src={resolvedOverlayUrl}
          alt=""
          className={`dia-facial-layer dia-facial-layer-overlay expr-${expression}`}
          draggable={false}
          aria-hidden="true"
        />
      )}
    </div>
  );
};
