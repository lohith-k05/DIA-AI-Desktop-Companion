import type { ToolExecutionLog } from "../types/tools";

const STORAGE_LOGS_KEY = "dia-tool-execution-logs-v1";

export const toolService = {
  /**
   * Safe Arithmetic and Mathematical Calculator
   * Parses expressions safely without using arbitrary eval()
   */
  calculate(expression: string): { result: number; formatted: string; error?: string } {
    try {
      let sanitized = expression
        .toLowerCase()
        .replace(/pi/g, String(Math.PI))
        .replace(/e/g, String(Math.E))
        .replace(/\^/g, "**");

      // Replace sqrt(x) with Math.sqrt(x)
      sanitized = sanitized.replace(/sqrt\(([^)]+)\)/g, "Math.sqrt($1)");
      sanitized = sanitized.replace(/sin\(([^)]+)\)/g, "Math.sin($1)");
      sanitized = sanitized.replace(/cos\(([^)]+)\)/g, "Math.cos($1)");
      sanitized = sanitized.replace(/abs\(([^)]+)\)/g, "Math.abs($1)");

      // Guard: strictly allow only numbers, basic arithmetic symbols, and Math functions
      if (!/^[0-9+\-*/().,Mathsqrtincoabs\s*]+$/.test(sanitized)) {
        throw new Error("Invalid characters in mathematical expression.");
      }

      // Safe Function constructor scoped strictly to Math
      const evaluate = new Function(`"use strict"; return (${sanitized});`);
      const rawResult = evaluate();

      if (typeof rawResult !== "number" || isNaN(rawResult) || !isFinite(rawResult)) {
        throw new Error("Mathematical result is undefined or infinite.");
      }

      const formatted = Number.isInteger(rawResult)
        ? rawResult.toLocaleString()
        : Number(rawResult.toFixed(6)).toString();

      return { result: rawResult, formatted };
    } catch (err) {
      return {
        result: 0,
        formatted: "Error",
        error: err instanceof Error ? err.message : "Calculation failed",
      };
    }
  },

  /**
   * Unit & Digital Storage Converter
   */
  convert(
    value: number,
    fromUnit: string,
    toUnit: string,
    category: "data" | "temp" | "length"
  ): { result: number; formatted: string; error?: string } {
    try {
      if (category === "data") {
        const multipliers: Record<string, number> = {
          bytes: 1,
          kb: 1024,
          mb: 1024 ** 2,
          gb: 1024 ** 3,
          tb: 1024 ** 4,
        };
        const fromM = multipliers[fromUnit.toLowerCase()];
        const toM = multipliers[toUnit.toLowerCase()];
        if (!fromM || !toM) throw new Error("Unknown data unit");
        const inBytes = value * fromM;
        const finalVal = inBytes / toM;
        return {
          result: finalVal,
          formatted: `${finalVal.toFixed(2)} ${toUnit.toUpperCase()}`,
        };
      }

      if (category === "temp") {
        let inCelsius = value;
        const from = fromUnit.toLowerCase();
        const to = toUnit.toLowerCase();

        if (from === "fahrenheit" || from === "f") inCelsius = ((value - 32) * 5) / 9;
        if (from === "kelvin" || from === "k") inCelsius = value - 273.15;

        let finalVal = inCelsius;
        if (to === "fahrenheit" || to === "f") finalVal = (inCelsius * 9) / 5 + 32;
        if (to === "kelvin" || to === "k") finalVal = inCelsius + 273.15;

        return {
          result: finalVal,
          formatted: `${finalVal.toFixed(2)}° ${toUnit.toUpperCase()}`,
        };
      }

      if (category === "length") {
        const multipliers: Record<string, number> = {
          meters: 1,
          kilometers: 1000,
          centimeters: 0.01,
          inches: 0.0254,
          feet: 0.3048,
          miles: 1609.34,
        };
        const fromM = multipliers[fromUnit.toLowerCase()];
        const toM = multipliers[toUnit.toLowerCase()];
        if (!fromM || !toM) throw new Error("Unknown length unit");
        const inMeters = value * fromM;
        const finalVal = inMeters / toM;
        return {
          result: finalVal,
          formatted: `${finalVal.toFixed(4)} ${toUnit}`,
        };
      }

      throw new Error("Unsupported conversion category");
    } catch (err) {
      return {
        result: 0,
        formatted: "Error",
        error: err instanceof Error ? err.message : "Conversion failed",
      };
    }
  },

  /**
   * Safe URL Launcher
   */
  openUrl(rawUrl: string): { success: boolean; url: string; error?: string } {
    try {
      let formatted = rawUrl.trim();
      if (!formatted.startsWith("http://") && !formatted.startsWith("https://")) {
        formatted = `https://${formatted}`;
      }

      const parsed = new URL(formatted);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error("Only secure HTTP/HTTPS protocols are permitted.");
      }

      window.open(parsed.href, "_blank", "noopener,noreferrer");
      return { success: true, url: parsed.href };
    } catch (err) {
      return {
        success: false,
        url: rawUrl,
        error: err instanceof Error ? err.message : "Invalid URL",
      };
    }
  },

  /**
   * System Telemetry Collector
   */
  getSystemTelemetry(): Record<string, string | number | boolean> {
    return {
      platform: navigator.platform || "Windows 10/11",
      language: navigator.language,
      online: navigator.onLine,
      hardwareConcurrency: navigator.hardwareConcurrency || 8,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      colorDepth: `${window.screen.colorDepth}-bit`,
      userAgent: navigator.userAgent.split(")")[0] + ")",
      appVersion: "Dia v2.0-Sovereign",
    };
  },

  /**
   * Execution Logging
   */
  getLogs(): ToolExecutionLog[] {
    try {
      const raw = localStorage.getItem(STORAGE_LOGS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  addLog(log: Omit<ToolExecutionLog, "id" | "timestamp">): ToolExecutionLog {
    const logs = this.getLogs();
    const newLog: ToolExecutionLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toISOString(),
    };
    const updated = [newLog, ...logs].slice(0, 50); // Keep last 50
    localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(updated));
    return newLog;
  },

  clearLogs(): void {
    localStorage.removeItem(STORAGE_LOGS_KEY);
  },
};
