import React, { useState, useEffect } from "react";
import {
  Wrench,
  Calculator,
  ArrowRightLeft,
  ExternalLink,
  Cpu,
  History,
  Trash2,
  Check,
  AlertCircle,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { toolService } from "../services/toolService";
import type { ToolExecutionLog } from "../types/tools";
import "./ToolsPage.css";

export const ToolsPage: React.FC = () => {
  // Calculator State
  const [calcInput, setCalcInput] = useState("(125 * 4) + sqrt(144) - 2^5");
  const [calcResult, setCalcResult] = useState<string | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);

  // Converter State
  const [convertCat, setConvertCat] = useState<"data" | "temp" | "length">("data");
  const [convertVal, setConvertVal] = useState("1024");
  const [fromUnit, setFromUnit] = useState("mb");
  const [toUnit, setToUnit] = useState("gb");
  const [convertResult, setConvertResult] = useState<string | null>(null);

  // URL Opener State
  const [urlInput, setUrlInput] = useState("https://github.com");
  const [urlSuccess, setUrlSuccess] = useState<string | null>(null);

  // System Telemetry State
  const [telemetry, setTelemetry] = useState<Record<string, any>>({});

  // Audit Logs State
  const [logs, setLogs] = useState<ToolExecutionLog[]>([]);

  useEffect(() => {
    setTelemetry(toolService.getSystemTelemetry());
    setLogs(toolService.getLogs());
  }, []);

  // Calculator Runner
  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!calcInput.trim()) return;

    const res = toolService.calculate(calcInput);
    if (res.error) {
      setCalcError(res.error);
      setCalcResult(null);
      toolService.addLog({
        toolId: "calc",
        toolName: "Safe Calculator",
        input: { expression: calcInput },
        output: res.error,
        status: "error",
      });
    } else {
      setCalcResult(res.formatted);
      setCalcError(null);
      toolService.addLog({
        toolId: "calc",
        toolName: "Safe Calculator",
        input: { expression: calcInput },
        output: res.formatted,
        status: "success",
      });
    }
    setLogs(toolService.getLogs());
  };

  // Converter Runner
  const handleConvert = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(convertVal);
    if (isNaN(num)) return;

    const res = toolService.convert(num, fromUnit, toUnit, convertCat);
    if (res.error) {
      setConvertResult(`Error: ${res.error}`);
      toolService.addLog({
        toolId: "converter",
        toolName: "Unit Converter",
        input: { value: num, from: fromUnit, to: toUnit, category: convertCat },
        output: res.error,
        status: "error",
      });
    } else {
      setConvertResult(res.formatted);
      toolService.addLog({
        toolId: "converter",
        toolName: "Unit Converter",
        input: { value: num, from: fromUnit, to: toUnit, category: convertCat },
        output: res.formatted,
        status: "success",
      });
    }
    setLogs(toolService.getLogs());
  };

  // Safe URL Opener Runner
  const handleOpenUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    const res = toolService.openUrl(urlInput);
    if (res.success) {
      setUrlSuccess(`Opened: ${res.url}`);
      toolService.addLog({
        toolId: "url_opener",
        toolName: "External URL Opener",
        input: { url: urlInput },
        output: res.url,
        status: "success",
      });
      setTimeout(() => setUrlSuccess(null), 3000);
    } else {
      toolService.addLog({
        toolId: "url_opener",
        toolName: "External URL Opener",
        input: { url: urlInput },
        output: res.error,
        status: "error",
      });
    }
    setLogs(toolService.getLogs());
  };

  const handleClearLogs = () => {
    toolService.clearLogs();
    setLogs([]);
  };

  const formatLogTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="dia-tools-root">
      <div className="tools-container">
        {/* Header */}
        <header className="tools-header">
          <div className="tools-header-copy">
            <div className="tools-title-badge">
              <Wrench size={18} className="badge-wrench-icon" />
              <h2 className="tools-title">Desktop Productivity Tools</h2>
            </div>
            <p className="tools-subtitle">
              Sandboxed, human-authorized execution tools for mathematics, conversions, and desktop workflow.
            </p>
          </div>

          <div className="tools-header-status">
            <ShieldCheck size={16} className="shield-icon" />
            <span>Sandboxed & Safe</span>
          </div>
        </header>

        {/* Tools Grid */}
        <div className="tools-grid">
          {/* TOOL 1: Safe Calculator */}
          <div className="tool-card">
            <div className="tool-card-top">
              <div className="tool-icon-pill purple">
                <Calculator size={18} />
              </div>
              <div className="tool-meta">
                <h3>Safe Math Calculator</h3>
                <span>Arbitrary eval-free mathematical parser</span>
              </div>
            </div>

            <form onSubmit={handleCalculate} className="tool-form">
              <div className="form-input-box">
                <input
                  type="text"
                  value={calcInput}
                  onChange={(e) => setCalcInput(e.target.value)}
                  placeholder="Enter formula, e.g. (25 * 4) + sqrt(100)"
                  className="tool-text-input"
                />
                <button type="submit" className="tool-execute-btn">
                  Calculate
                </button>
              </div>

              {/* Formula helpers */}
              <div className="quick-formula-buttons">
                {["sqrt(", "^2", "pi", "e", "sin(", "cos("].map((op) => (
                  <button
                    key={op}
                    type="button"
                    className="calc-helper-btn"
                    onClick={() => setCalcInput((prev) => `${prev}${op}`)}
                  >
                    {op}
                  </button>
                ))}
              </div>

              {calcResult && (
                <div className="tool-result-callout success">
                  <Check size={14} />
                  <span>Result: <strong>{calcResult}</strong></span>
                </div>
              )}

              {calcError && (
                <div className="tool-result-callout error">
                  <AlertCircle size={14} />
                  <span>{calcError}</span>
                </div>
              )}
            </form>
          </div>

          {/* TOOL 2: Unit Converter */}
          <div className="tool-card">
            <div className="tool-card-top">
              <div className="tool-icon-pill cyan">
                <ArrowRightLeft size={18} />
              </div>
              <div className="tool-meta">
                <h3>Data & Unit Converter</h3>
                <span>Digital storage, temperature, and length metrics</span>
              </div>
            </div>

            <form onSubmit={handleConvert} className="tool-form">
              <div className="converter-tabs">
                <button
                  type="button"
                  className={`conv-tab ${convertCat === "data" ? "active" : ""}`}
                  onClick={() => {
                    setConvertCat("data");
                    setFromUnit("mb");
                    setToUnit("gb");
                  }}
                >
                  Digital Storage
                </button>
                <button
                  type="button"
                  className={`conv-tab ${convertCat === "temp" ? "active" : ""}`}
                  onClick={() => {
                    setConvertCat("temp");
                    setFromUnit("c");
                    setToUnit("f");
                  }}
                >
                  Temperature
                </button>
                <button
                  type="button"
                  className={`conv-tab ${convertCat === "length" ? "active" : ""}`}
                  onClick={() => {
                    setConvertCat("length");
                    setFromUnit("meters");
                    setToUnit("feet");
                  }}
                >
                  Length
                </button>
              </div>

              <div className="converter-inputs-row">
                <input
                  type="number"
                  value={convertVal}
                  onChange={(e) => setConvertVal(e.target.value)}
                  className="tool-number-input"
                  placeholder="Value"
                />

                <select
                  value={fromUnit}
                  onChange={(e) => setFromUnit(e.target.value)}
                  className="tool-select"
                >
                  {convertCat === "data" && (
                    <>
                      <option value="bytes">Bytes</option>
                      <option value="kb">KB</option>
                      <option value="mb">MB</option>
                      <option value="gb">GB</option>
                      <option value="tb">TB</option>
                    </>
                  )}
                  {convertCat === "temp" && (
                    <>
                      <option value="c">Celsius (°C)</option>
                      <option value="f">Fahrenheit (°F)</option>
                      <option value="k">Kelvin (K)</option>
                    </>
                  )}
                  {convertCat === "length" && (
                    <>
                      <option value="meters">Meters</option>
                      <option value="kilometers">Kilometers</option>
                      <option value="feet">Feet</option>
                      <option value="inches">Inches</option>
                      <option value="miles">Miles</option>
                    </>
                  )}
                </select>

                <span className="conv-to-arrow">→</span>

                <select
                  value={toUnit}
                  onChange={(e) => setToUnit(e.target.value)}
                  className="tool-select"
                >
                  {convertCat === "data" && (
                    <>
                      <option value="bytes">Bytes</option>
                      <option value="kb">KB</option>
                      <option value="mb">MB</option>
                      <option value="gb">GB</option>
                      <option value="tb">TB</option>
                    </>
                  )}
                  {convertCat === "temp" && (
                    <>
                      <option value="c">Celsius (°C)</option>
                      <option value="f">Fahrenheit (°F)</option>
                      <option value="k">Kelvin (K)</option>
                    </>
                  )}
                  {convertCat === "length" && (
                    <>
                      <option value="meters">Meters</option>
                      <option value="kilometers">Kilometers</option>
                      <option value="feet">Feet</option>
                      <option value="inches">Inches</option>
                      <option value="miles">Miles</option>
                    </>
                  )}
                </select>

                <button type="submit" className="tool-execute-btn">
                  Convert
                </button>
              </div>

              {convertResult && (
                <div className="tool-result-callout success">
                  <Check size={14} />
                  <span>Converted: <strong>{convertResult}</strong></span>
                </div>
              )}
            </form>
          </div>

          {/* TOOL 3: Safe Link Launcher */}
          <div className="tool-card">
            <div className="tool-card-top">
              <div className="tool-icon-pill pink">
                <ExternalLink size={18} />
              </div>
              <div className="tool-meta">
                <h3>Safe Web Resource Opener</h3>
                <span>Launches validated HTTP/HTTPS resources in default browser</span>
              </div>
            </div>

            <form onSubmit={handleOpenUrl} className="tool-form">
              <div className="form-input-box">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://ollama.com"
                  className="tool-text-input"
                />
                <button type="submit" className="tool-execute-btn">
                  Launch URL
                </button>
              </div>

              {urlSuccess && (
                <div className="tool-result-callout success">
                  <Check size={14} />
                  <span>{urlSuccess}</span>
                </div>
              )}
            </form>
          </div>

          {/* TOOL 4: System Telemetry */}
          <div className="tool-card">
            <div className="tool-card-top">
              <div className="tool-icon-pill green">
                <Cpu size={18} />
              </div>
              <div className="tool-meta">
                <h3>System Telemetry Monitor</h3>
                <span>Local desktop environment & hardware profile</span>
              </div>
            </div>

            <div className="telemetry-display-grid">
              <div className="telemetry-stat">
                <small>Platform</small>
                <strong>{String(telemetry.platform)}</strong>
              </div>
              <div className="telemetry-stat">
                <small>Resolution</small>
                <strong>{String(telemetry.screenResolution)}</strong>
              </div>
              <div className="telemetry-stat">
                <small>CPU Threads</small>
                <strong>{String(telemetry.hardwareConcurrency)} cores</strong>
              </div>
              <div className="telemetry-stat">
                <small>App Environment</small>
                <strong>{String(telemetry.appVersion)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------- */}
        {/* EXECUTION AUDIT LOG                                */}
        {/* -------------------------------------------------- */}
        <section className="audit-log-section">
          <div className="audit-header">
            <div className="audit-title-group">
              <History size={16} className="audit-history-icon" />
              <h3>Human-in-the-Loop Audit Log</h3>
              <span className="audit-count-badge">{logs.length} runs</span>
            </div>

            {logs.length > 0 && (
              <button
                type="button"
                className="clear-audit-btn"
                onClick={handleClearLogs}
                title="Clear audit log history"
              >
                <Trash2 size={13} />
                <span>Clear History</span>
              </button>
            )}
          </div>

          <div className="audit-log-flow">
            {logs.length === 0 ? (
              <div className="audit-empty">
                <Terminal size={24} />
                <p>No tools executed in this session yet. Run a tool above to inspect the audit trace.</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className={`audit-log-item status-${log.status}`}>
                  <div className="log-timestamp">{formatLogTime(log.timestamp)}</div>
                  <div className="log-tool-tag">{log.toolName}</div>
                  <div className="log-input">
                    <small>Input:</small>
                    <code>{JSON.stringify(log.input)}</code>
                  </div>
                  <div className="log-output">
                    <small>Output:</small>
                    <strong>{String(log.output)}</strong>
                  </div>
                  <div className={`log-badge ${log.status}`}>
                    {log.status === "success" ? <Check size={12} /> : <AlertCircle size={12} />}
                    <span>{log.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
