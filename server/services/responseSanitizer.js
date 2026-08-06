/**
 * Response Sanitizer Service
 * Cleans, sanitizes, and verifies raw LLM responses before delivery to client.
 */

export function sanitizeResponse(rawReply = "") {
  if (!rawReply || typeof rawReply !== "string") {
    return "I encountered an empty output from the inference engine. Please verify the active model state or try reformulating your inquiry.";
  }

  let text = rawReply;

  // 1. Remove hidden reasoning blocks (<think>...</think>, <thought>...</thought>)
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  text = text.replace(/<thought>[\s\S]*?<\/thought>/gi, "");

  // 2. Remove leaked system prompt prefixes or hallucinated role tags
  text = text.replace(/^(Dia:|Assistant:|AI:|System:)\s*/i, "");
  text = text.replace(/^(### DIA PERSONALITY[\s\S]*?### END)/i, "");

  // 3. Remove prompt leakage echoes like "User: ... \n Assistant:"
  text = text.replace(/^(User:.*?\n+Assistant:)/is, "");

  // 4. Normalize excessive newlines (more than 2 consecutive blank lines)
  text = text.replace(/\n{4,}/g, "\n\n\n");

  const trimmed = text.trim();

  if (!trimmed) {
    return "I generated a response, but it contained no valid text after sanitization. Please try asking again.";
  }

  return trimmed;
}
