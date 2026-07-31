/**
 * Dia Emotional Expression System Types & Metadata
 * Realistic 2D Interactive AI Companion Architecture
 */

export type CharacterExpression =
  | "neutral"
  | "happy"
  | "friendly"
  | "curious"
  | "thoughtful"
  | "surprised"
  | "confused"
  | "concerned"
  | "sad"
  | "excited"
  | "calm";

export const ALL_EXPRESSIONS: CharacterExpression[] = [
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
];

export const DEFAULT_EXPRESSION: CharacterExpression = "neutral";

export interface ExpressionMetadata {
  id: CharacterExpression;
  name: string;
  statusBadgeText: string;
  dotColorClass: string;
  auraClass: string;
  speechBubbleCue: string;
  description: string;
}

export const EXPRESSION_METADATA: Record<CharacterExpression, ExpressionMetadata> = {
  neutral: {
    id: "neutral",
    name: "Neutral",
    statusBadgeText: "Dia AI Companion",
    dotColorClass: "dot-neutral",
    auraClass: "expr-aura-neutral",
    speechBubbleCue: "What would you like to explore today?",
    description: "Calm, natural baseline presence with gentle breathing.",
  },
  happy: {
    id: "happy",
    name: "Happy",
    statusBadgeText: "Feeling happy",
    dotColorClass: "dot-happy",
    auraClass: "expr-aura-happy",
    speechBubbleCue: "Happy to help you with this! ✨",
    description: "Warm rose-violet glow with gentle upward float.",
  },
  friendly: {
    id: "friendly",
    name: "Friendly",
    statusBadgeText: "Warm & welcoming",
    dotColorClass: "dot-friendly",
    auraClass: "expr-aura-friendly",
    speechBubbleCue: "Always here for you! ♡",
    description: "Soft inviting aura with relaxed posture.",
  },
  curious: {
    id: "curious",
    name: "Curious",
    statusBadgeText: "Curious",
    dotColorClass: "dot-curious",
    auraClass: "expr-aura-curious",
    speechBubbleCue: "Ooh, tell me more about that! 🔍",
    description: "Subtle 1.1° head tilt and attentive cyan-violet highlight.",
  },
  thoughtful: {
    id: "thoughtful",
    name: "Thoughtful",
    statusBadgeText: "Thinking deeply",
    dotColorClass: "dot-thoughtful",
    auraClass: "expr-aura-thoughtful",
    speechBubbleCue: "Analyzing the possibilities... 💡",
    description: "Deep indigo glow with slow floating contemplation.",
  },
  surprised: {
    id: "surprised",
    name: "Surprised",
    statusBadgeText: "Fascinated",
    dotColorClass: "dot-surprised",
    auraClass: "expr-aura-surprised",
    speechBubbleCue: "Wow, that's fascinating! ⚡",
    description: "Brief subtle scale-up and vibrant pulse without distortion.",
  },
  confused: {
    id: "confused",
    name: "Confused",
    statusBadgeText: "Pondering",
    dotColorClass: "dot-confused",
    auraClass: "expr-aura-confused",
    speechBubbleCue: "Let me understand that better...",
    description: "Subtle reverse side tilt with calm inquiring presence.",
  },
  concerned: {
    id: "concerned",
    name: "Concerned",
    statusBadgeText: "Here to support",
    dotColorClass: "dot-concerned",
    auraClass: "expr-aura-concerned",
    speechBubbleCue: "Let me help sort this out for you.",
    description: "Soft supportive amber-rose glow with steady presence.",
  },
  sad: {
    id: "sad",
    name: "Sad",
    statusBadgeText: "Empathizing",
    dotColorClass: "dot-sad",
    auraClass: "expr-aura-sad",
    speechBubbleCue: "I'm right here with you.",
    description: "Subtly muted, respectful blue-slate tone.",
  },
  excited: {
    id: "excited",
    name: "Excited",
    statusBadgeText: "Excited",
    dotColorClass: "dot-excited",
    auraClass: "expr-aura-excited",
    speechBubbleCue: "This is so exciting! Let's do it! 🚀",
    description: "Vibrant gold-magenta aura with energetic gentle lift.",
  },
  calm: {
    id: "calm",
    name: "Calm",
    statusBadgeText: "Calm & centered",
    dotColorClass: "dot-calm",
    auraClass: "expr-aura-calm",
    speechBubbleCue: "Peaceful focus. Take your time.",
    description: "Deep, slow breathing cycle with serene indigo-sky glow.",
  },
};
