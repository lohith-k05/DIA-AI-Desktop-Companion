import type { ChatMessage } from "../types/chat";

/**
 * Generates a clean Markdown transcript of the conversation and triggers a file download.
 */
export function exportConversationToMarkdown(
  messages: ChatMessage[],
  activeModel: string = "gemma3:1b"
) {
  if (!messages || messages.length === 0) return;

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  let markdown = `# Dia AI Companion — Conversation Transcript\n`;
  markdown += `**Export Date:** ${dateStr} at ${timeStr}  \n`;
  markdown += `**AI Model:** ${activeModel} (Local Ollama)  \n`;
  markdown += `**Total Messages:** ${messages.length}  \n\n`;
  markdown += `---\n\n`;

  messages.forEach((msg, idx) => {
    const isDia = msg.role === "assistant";
    const speaker = isDia ? "Dia" : "Lohith";
    const timestamp = msg.createdAt
      ? new Date(msg.createdAt).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    markdown += `### ${idx + 1}. ${speaker} ${timestamp ? `*(${timestamp})*` : ""}\n\n`;
    markdown += `${msg.content}\n\n`;
    markdown += `---\n\n`;
  });

  markdown += `\n*Exported from Dia — Sovereign Personal AI Companion*\n`;

  // Create downloadable blob
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const filename = `Dia-Conversation-${now.toISOString().slice(0, 10)}.md`;

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
