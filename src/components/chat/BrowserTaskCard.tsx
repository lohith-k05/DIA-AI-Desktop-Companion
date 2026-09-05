import React, { useState, useEffect, useRef } from "react";
import { Globe, StopCircle, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import "./BrowserTaskCard.css";

interface BrowserTaskCardProps {
  tool: string;
  args: any;
}

export const BrowserTaskCard: React.FC<BrowserTaskCardProps> = ({ tool, args }) => {
    const [logs, setLogs] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasRunRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
        let pollInterval: any;

    const pollStatus = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/api/browser/status");
        const data = await res.json();
        if (isMounted && data.success && data.status) {
                      setLogs(prev => {
             if (prev[prev.length - 1] !== data.status && data.status !== "Browser not started") {
               return [...prev, data.status];
             }
             return prev;
           });
        }
      } catch (e) {}
    };

    const runTask = async () => {
      if (hasRunRef.current) return;
      hasRunRef.current = true;
      try {
        let endpoint = "";
        let body: any = {};
        let initialStatus = "";

        if (tool === "browser_task") {
          endpoint = "/api/browser/task";
          body = { prompt: args.prompt };
          initialStatus = `Analyzing task...`;
        } else if (tool === "open_url") {
          endpoint = "/api/browser/open";
          body = { url: args.url };
          initialStatus = `Opening ${args.url}...`;
        } else if (tool === "search_web") {
          endpoint = "/api/browser/search";
          body = { query: args.query };
          initialStatus = `Searching for "${args.query}"...`;
        } else if (tool === "read_page") {
          endpoint = "/api/browser/read";
          initialStatus = "Reading current page...";
        } else {
          throw new Error("Unknown browser tool");
        }

                setLogs([initialStatus]);
        pollInterval = setInterval(pollStatus, 1000);

        const res = await fetch(`http://127.0.0.1:5000${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        
        if (!isMounted) return;

        if (data.success) {
                    setLogs(prev => [...prev, "✓“ Task completed successfully"]);
          setIsActive(false);
          clearInterval(pollInterval);
        } else {
          throw new Error(data.error);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || "Task failed");
                setLogs(prev => [...prev, "âš  Task failed"]);
        setIsActive(false);
        if (pollInterval) clearInterval(pollInterval);
      }
    };

    runTask();

    return () => { 
      isMounted = false; 
      if (pollInterval) clearInterval(pollInterval);
      // fetch("http://127.0.0.1:5000/api/browser/stop", { method: "POST" }).catch(() => {});
    };
  }, [tool, args]);

  const handleStop = async () => {
    try {
      await fetch("http://127.0.0.1:5000/api/browser/stop", { method: "POST" });
            setIsActive(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dia-browser-task-card">
      <div className="dia-browser-task-header">
        <Globe size={16} /> <strong>Browser Task</strong>
      </div>
      
      <div className="dia-browser-task-body">
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
          {logs.map((log, i) => (
            <div key={i} style={{ color: i === logs.length - 1 && isActive ? "var(--dia-accent-purple)" : "var(--dia-text-2)", display: "flex", alignItems: "center", gap: "6px" }}>
              {i === logs.length - 1 && isActive ? <Loader2 size={12} className="spin-icon" /> : <CheckCircle2 size={12} style={{ color: "#10b981" }} />}
              <span>{log}</span>
            </div>
          ))}
          {error && (
            <div style={{ color: "#ef4444", display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
              <AlertCircle size={12} />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {isActive && (
        <button type="button" className="dia-browser-task-stop" onClick={handleStop}>
          <StopCircle size={14} /> Stop Task
        </button>
      )}
    </div>
  );
};
