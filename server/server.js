import express from "express";
import cors from "cors";
import { config } from "./config/ollamaConfig.js";
import { DIA_PERSONALITY_PROMPT, getSystemMessage } from "./config/diaPersonality.js";
import { classifyIntent } from "./services/intentClassifier.js";
import {
  prepareContextPayload,
  extractContextualReferences,
  buildConversationSummary,
} from "./services/contextManager.js";
import { sanitizeResponse } from "./services/responseSanitizer.js";
import { spawn } from "child_process";
import { promises as fs, createReadStream } from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer for in-memory audio blob uploads (STT endpoint)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const app = express();

let currentActiveModel = config.DEFAULT_MODEL;

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json({ limit: "4mb" }));

import documentsRouter from "./routes/documents.js";
app.use("/api/documents", documentsRouter);
import browserRouter from "./routes/browser.js";
app.use("/api/browser", browserRouter);

// --------------------------------------------------
// Health Check Endpoint
// --------------------------------------------------
app.get("/", (_req, res) => {
  res.json({
    success: true,
    name: "Dia Backend Intelligence Server",
    version: "2.1.0",
    activeModel: currentActiveModel,
    ollamaUrl: config.OLLAMA_URL,
    temperature: config.DEFAULT_TEMPERATURE,
  });
});

// --------------------------------------------------
// Ollama Status & Health Probe
// --------------------------------------------------
app.get("/api/ollama-status", async (_req, res) => {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${config.OLLAMA_URL}/api/tags`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return res.status(503).json({
        success: false,
        connected: false,
        error: `Ollama responded with HTTP ${response.status}`,
      });
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    return res.json({
      success: true,
      connected: true,
      latencyMs,
      activeModel: currentActiveModel,
      models: data.models || [],
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      connected: false,
      error: `Unable to connect to Ollama at ${config.OLLAMA_URL}. Ensure Ollama daemon is running.`,
    });
  }
});

// --------------------------------------------------
// Model Inventory & Selection
// --------------------------------------------------
app.get("/api/models", async (_req, res) => {
  try {
    const response = await fetch(`${config.OLLAMA_URL}/api/tags`);
    if (!response.ok) {
      return res.status(502).json({
        success: false,
        error: "Unable to retrieve models from Ollama.",
      });
    }

    const data = await response.json();
    const modelList = (data.models || []).map((m) => ({
      name: m.name,
      model: m.model,
      size: m.size,
      digest: m.digest,
      details: m.details,
    }));

    return res.json({
      success: true,
      activeModel: currentActiveModel,
      models: modelList,
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      error: "Ollama daemon unreachable.",
    });
  }
});

app.post("/api/models/select", (req, res) => {
  const { model } = req.body;
  if (!model || typeof model !== "string") {
    return res.status(400).json({
      success: false,
      error: "A valid model name string is required.",
    });
  }

  currentActiveModel = model.trim();
  console.log(`[Dia Backend] Switched active model to: ${currentActiveModel}`);

  return res.json({
    success: true,
    activeModel: currentActiveModel,
    message: `Active model successfully changed to ${currentActiveModel}`,
  });
});

// --------------------------------------------------
// System Prompt Endpoint
// --------------------------------------------------
app.get("/api/system-prompt", (_req, res) => {
  res.json({
    success: true,
    prompt: DIA_PERSONALITY_PROMPT,
    version: "2.1-intelligence-calibrated",
  });
});

// --------------------------------------------------
// Conversational Inference Gateway (React -> Express -> Ollama)
// --------------------------------------------------
app.post("/api/chat", async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      messages,
      temperature = config.DEFAULT_TEMPERATURE,
      userName = "Lohith",
      memoryContext = "",
        intimateSettings = { enabled: false, level: "playful" },
      } = req.body;

    // Validate messages array
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: "The request must contain a non-empty 'messages' array.",
      });
    }

    // Identify current user message
    const latestUserTurn = [...messages].reverse().find((m) => m && m.role === "user");
    const currentQuery = latestUserTurn ? latestUserTurn.content || "" : "";

    // 1. Intent Classification
    const intent = classifyIntent(currentQuery, messages.length > 1);

    // 2. Anaphora / Pronoun Context Binding
    const referenceContext = extractContextualReferences(currentQuery, messages.slice(0, -1));

    // 3. Compact Conversation Summary (for dialogues > 8 turns)
    const conversationSummary = buildConversationSummary(messages);

    // 4. Combine Directives
    const combinedDirectives = [intent.directive, referenceContext].filter(Boolean).join("\n\n");

    // 5. Build Canonical System Turn
    const systemTurn = getSystemMessage(
      userName,
      "",
      memoryContext,
      conversationSummary,
      combinedDirectives,
        intimateSettings
      );

    // 6. Sliding Window Context Packaging
    const contextTurns = prepareContextPayload(messages, systemTurn);

    // SHORT CIRCUIT FOR BROWSER TASK
    if (intent.category === "browser_task") {
      const rawReply = "BROWSER_TASK:" + JSON.stringify({ tool: "browser_task", arguments: { prompt: currentQuery } });
      return res.json({
        success: true,
        reply: rawReply,
        model: currentActiveModel,
        intent: intent.category,
        timestamp: new Date().toISOString(),
      });
    }

    // 7. Ollama Inference Request with Timeout Signal
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.REQUEST_TIMEOUT_MS);

    const targetTemperature =
      typeof temperature === "number" ? Math.max(0, Math.min(1.2, temperature)) : config.DEFAULT_TEMPERATURE;

    const ollamaResponse = await fetch(`${config.OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: currentActiveModel,
        messages: contextTurns,
        stream: false,
        options: {
          temperature: intent.category === 'greeting_casual' ? 0.7 : targetTemperature,
          num_predict: intent.category === 'greeting_casual' ? 80 : (intent.category === 'general_question' ? 200 : config.MAX_OUTPUT_TOKENS),
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();
      console.error(`[Dia Backend] Ollama generation error (${ollamaResponse.status}):`, errorText);
      return res.status(502).json({
        success: false,
        error: `Ollama error (${ollamaResponse.status}): Could not complete generation for model '${currentActiveModel}'.`,
      });
    }

    const data = await ollamaResponse.json();
    const latencyMs = Date.now() - startTime;
    let rawReply = data?.message?.content || "";
    if (intent.category === "browser_task") {
      try {
        const jsonMatch = rawReply.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.tool) {
            rawReply = "BROWSER_TASK:" + JSON.stringify(parsed);
          }
        }
      } catch (e) {
        console.error("Failed to parse browser JSON", e);
      }
    }

    // 8. Sanitize & Verify Response Quality
    const sanitizedReply = sanitizeResponse(rawReply);

    // Diagnostics Logging
    console.log(
      `[Dia AI] Intent: ${intent.category.padEnd(20)} | Model: ${currentActiveModel.padEnd(12)} | Latency: ${latencyMs}ms | Eval: ${data.eval_count || 0} tokens`
    );

    return res.json({
      success: true,
      reply: sanitizedReply,
      model: currentActiveModel,
      intent: intent.category,
      latencyMs,
      totalDuration: data.total_duration,
      evalCount: data.eval_count,
    });
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    if (error.name === "AbortError") {
      console.error(`[Dia Backend] Inference timed out after ${config.REQUEST_TIMEOUT_MS}ms`);
      return res.status(504).json({
        success: false,
        error: `Inference timed out after ${Math.round(config.REQUEST_TIMEOUT_MS / 1000)} seconds.`,
      });
    }

    console.error("[Dia Backend] Gateway error:", error);
    return res.status(500).json({
      success: false,
      error: "Unable to connect to Dia AI engine. Ensure Ollama is running.",
    });
  }
});

// --------------------------------------------------
// Offline Voice: STT (Speech-to-Text via Vosk)
// POST /api/stt  multipart audio (field: "audio")
// Returns: { success, text }
// --------------------------------------------------
app.post("/api/stt", upload.single("audio"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "No audio file uploaded. Field name must be 'audio'." });
  }

  const tmpWav = path.join(os.tmpdir(), `dia-stt-${Date.now()}.wav`);

  try {
    await fs.writeFile(tmpWav, req.file.buffer);
    const workerPath = path.join(__dirname, "workers", "stt_worker.py");

    const result = await new Promise((resolve, reject) => {
      const proc = spawn("python", [workerPath, tmpWav], { timeout: 30000 });
      let stdout = "";
      let stderr = "";

      proc.stdout.on("data", (d) => { stdout += d.toString(); });
      proc.stderr.on("data", (d) => { stderr += d.toString(); });

      proc.on("close", (code) => {
        if (code !== 0) {
          try {
            const errJson = JSON.parse(stdout.trim());
            reject(new Error(errJson.error || `stt_worker exited with code ${code}`));
          } catch {
            reject(new Error(stderr || `stt_worker exited with code ${code}`));
          }
        } else {
          try {
            resolve(JSON.parse(stdout.trim()));
          } catch {
            reject(new Error(`Invalid JSON from stt_worker: ${stdout}`));
          }
        }
      });
      proc.on("error", reject);
    });

    return res.json({ success: true, text: result.text || "", words: result.words || [] });
  } catch (err) {
    console.error("[Dia STT] Error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    fs.unlink(tmpWav).catch(() => {});
  }
});

// --------------------------------------------------
// Offline Voice: TTS (Text-to-Speech via pyttsx3)
// POST /api/tts  { text: "..." }
// Returns: audio/wav binary stream
// --------------------------------------------------
app.post("/api/tts", express.json(), async (req, res) => {
  const { text } = req.body || {};

  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ success: false, error: "Body must contain { text: '...' }" });
  }

  const tmpWav = path.join(os.tmpdir(), `dia-tts-${Date.now()}.wav`);
  const workerPath = path.join(__dirname, "workers", "tts_worker.py");
  const cleanText = text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\uFE0E\u200D]/gu, "").trim();

  try {
    const result = await new Promise((resolve, reject) => {
      const proc = spawn("python", [workerPath, cleanText, tmpWav], { timeout: 15000 });
      let stdout = "";
      let stderr = "";

      proc.stdout.on("data", (d) => { stdout += d.toString(); });
      proc.stderr.on("data", (d) => { stderr += d.toString(); });

      proc.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(stderr || `tts_worker exited with code ${code}`));
        } else {
          resolve(stdout.trim());
        }
      });
      proc.on("error", reject);
    });

    if (result !== "ok") {
      return res.status(500).json({ success: false, error: `TTS worker: ${result}` });
    }

    const wavData = await fs.readFile(tmpWav);
    res.set({
      "Content-Type": "audio/wav",
      "Content-Length": wavData.length,
      "Cache-Control": "no-store",
    });
    return res.send(wavData);
  } catch (err) {
    console.error("[Dia TTS] Error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    fs.unlink(tmpWav).catch(() => {});
  }
});

// --------------------------------------------------
// Offline Voice: Diagnostics
// GET /api/diagnostics
// Returns: { sttEngine, sttModel, ttsEngine }
// --------------------------------------------------
app.get("/api/diagnostics", async (req, res) => {
  const workerPath = path.join(__dirname, "workers", "diag_worker.py");
  try {
    const result = await new Promise((resolve, reject) => {
      const proc = spawn("python", [workerPath], { timeout: 10000 });
      let stdout = "";
      proc.stdout.on("data", (d) => { stdout += d.toString(); });
      proc.on("close", (code) => {
        if (code !== 0) {
          resolve({ sttEngine: "Error", sttModel: "Error", ttsEngine: "Error" });
        } else {
          try { resolve(JSON.parse(stdout.trim())); } 
          catch { resolve({ sttEngine: "Error", sttModel: "Error", ttsEngine: "Error" }); }
        }
      });
      proc.on("error", () => resolve({ sttEngine: "Error", sttModel: "Error", ttsEngine: "Error" }));
    });
    return res.json({ success: true, diagnostics: result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// --------------------------------------------------
// Fallback 404 Route
// --------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: "API endpoint not found.",
  });
});

// --------------------------------------------------
// Start Server
// --------------------------------------------------
app.listen(config.PORT, "127.0.0.1", () => {
  console.log(`=============================================`);
  console.log(`  Dia Intelligence Server running at: http://127.0.0.1:${config.PORT}`);
  console.log(`  Ollama endpoint:                    ${config.OLLAMA_URL}`);
  console.log(`  Active Model:                       ${currentActiveModel}`);
  console.log(`  Default Temperature:                ${config.DEFAULT_TEMPERATURE}`);
  console.log(`=============================================`);
});