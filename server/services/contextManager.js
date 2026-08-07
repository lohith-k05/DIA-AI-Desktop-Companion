/**
 * Context Manager Service
 * Manages conversational history sliding windows, reference resolution (anaphora),
 * and dynamic conversation summaries for multi-turn dialogues.
 */

import { config } from "../config/ollamaConfig.js";

/**
 * Validates, trims, and normalizes conversation turns
 */
export function sanitizeMessageHistory(rawMessages = []) {
  if (!Array.isArray(rawMessages)) return [];

  const valid = [];
  for (const item of rawMessages) {
    if (!item || typeof item !== "object") continue;

    const role = item.role;
    if (role !== "user" && role !== "assistant") continue;

    const content = typeof item.content === "string" ? item.content.trim() : "";
    if (!content) continue;

    valid.push({
      role,
      content: content.slice(0, config.MAX_MESSAGE_LENGTH),
    });
  }

  return valid;
}

/**
 * Resolves conversational pronouns and references in the active prompt
 * by examining the immediately preceding turns.
 */
export function extractContextualReferences(currentQuery = "", recentTurns = []) {
  const query = currentQuery.trim().toLowerCase();
  const references = [];

  const hasReferenceWord =
    query.includes("that") ||
    query.includes("this") ||
    query.includes("it") ||
    query.includes("the previous example") ||
    query.includes("the code above") ||
    query.includes("explain it again") ||
    query.includes("continue from where we stopped");

  if (!hasReferenceWord || recentTurns.length === 0) {
    return "";
  }

  // Find the last assistant response or last user topic
  const lastAssistantTurn = [...recentTurns].reverse().find((t) => t.role === "assistant");
  const lastUserTurn = [...recentTurns].reverse().find((t) => t.role === "user");

  if (lastAssistantTurn) {
    // Extract first 150 chars or first line of last response
    const snippet = lastAssistantTurn.content.split("\n")[0].slice(0, 180);
    references.push(`Immediate prior topic discussed by DIA: "${snippet}..."`);
  }

  if (lastUserTurn && lastUserTurn.content !== currentQuery) {
    references.push(`Prior inquiry from user: "${lastUserTurn.content.slice(0, 120)}"`);
  }

  if (references.length > 0) {
    return `### PRONOUN & REFERENCE RESOLUTION:\nThe user's prompt references prior discussion. Bind terms like 'that', 'this', or 'the previous example' to:\n- ${references.join("\n- ")}`;
  }

  return "";
}

/**
 * Builds a compact running summary for long conversations (> 8 turns)
 */
export function buildConversationSummary(history = []) {
  if (history.length < 8) {
    return "";
  }

  // Extract key topics discussed in older turns (excluding the last 4 messages)
  const olderTurns = history.slice(0, -4);
  const userPrompts = olderTurns
    .filter((t) => t.role === "user")
    .map((t) => t.content.slice(0, 80));

  const summary = [
    `Session turns: ${history.length} messages.`,
    `Topics explored in session: ${userPrompts.slice(-3).map((p) => `"${p}"`).join(", ")}.`,
    `Objective: Technical exploration and guided problem-solving. Maintain continuity.`,
  ];

  return summary.join("\n");
}

/**
 * Assembles the final message context payload for Ollama:
 * [SystemTurn, ...SlidingWindowRecentTurns, CurrentUserTurn]
 */
export function prepareContextPayload(messages = [], systemMessage = {}) {
  const sanitized = sanitizeMessageHistory(messages);

  if (sanitized.length === 0) {
    return [systemMessage];
  }

  // Sliding window: keep up to MAX_CONVERSATION_MESSAGES
  const windowLimit = config.MAX_CONVERSATION_MESSAGES || 14;
  const slicedTurns = sanitized.slice(-windowLimit);

  return [systemMessage, ...slicedTurns];
}
