import React, { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";
import "./MarkdownRenderer.css";

interface MarkdownRendererProps {
  content: string;
}

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="dia-code-block">
      <div className="code-block-header">
        <div className="code-lang-tag">
          <Terminal size={13} />
          <span>{language || "code"}</span>
        </div>
        <button
          type="button"
          className="code-copy-btn"
          onClick={handleCopy}
          aria-label="Copy code block"
        >
          {copied ? (
            <>
              <Check size={13} className="copied-icon" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="code-content">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Parse content into blocks (code fences vs text paragraphs)
  const renderFormattedText = (rawText: string) => {
    const lines = rawText.split("\n");
    const elements: React.ReactNode[] = [];
    let listBuffer: string[] = [];
    let isNumberedList = false;
    let tableBuffer: string[] = [];

    const flushList = (keyPrefix: string) => {
      if (listBuffer.length === 0) return;
      if (isNumberedList) {
        elements.push(
          <ol key={`${keyPrefix}-ol`} className="dia-md-ol">
            {listBuffer.map((item, idx) => (
              <li key={idx}>{parseInlineFormatting(item)}</li>
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`${keyPrefix}-ul`} className="dia-md-ul">
            {listBuffer.map((item, idx) => (
              <li key={idx}>{parseInlineFormatting(item)}</li>
            ))}
          </ul>
        );
      }
      listBuffer = [];
      isNumberedList = false;
    };

    const flushTable = (keyPrefix: string) => {
      if (tableBuffer.length === 0) return;
      const rawRows = tableBuffer.map((line) => {
        const parts = line.split("|").map((c) => c.trim());
        // Remove empty first and last elements created by boundary pipes | col |
        return parts.slice(1, parts.length - 1);
      });

      if (rawRows.length > 0) {
        const headerRow = rawRows[0];
        const isDivider = (cell: string) => /^:?-+:?$/.test(cell);
        const hasDivider = rawRows.length > 1 && rawRows[1].every(isDivider);
        const bodyRows = hasDivider ? rawRows.slice(2) : rawRows.slice(1);

        elements.push(
          <div key={`${keyPrefix}-tbl-wrap`} className="dia-md-table-wrapper">
            <table className="dia-md-table">
              <thead>
                <tr>
                  {headerRow.map((cell, cIdx) => (
                    <th key={cIdx}>{parseInlineFormatting(cell)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx}>{parseInlineFormatting(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      tableBuffer = [];
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Check for table row
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        flushList(`line-${idx}`);
        tableBuffer.push(trimmed);
        return;
      }

      flushTable(`line-${idx}`);

      // Check for bullet list item
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        if (isNumberedList) flushList(`line-${idx}`);
        isNumberedList = false;
        listBuffer.push(trimmed.substring(2));
        return;
      }

      // Check for numbered list item
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        if (!isNumberedList && listBuffer.length > 0) flushList(`line-${idx}`);
        isNumberedList = true;
        listBuffer.push(numMatch[2]);
        return;
      }

      // Flush any pending list before normal text
      flushList(`line-${idx}`);

      if (!trimmed) {
        elements.push(<div key={`space-${idx}`} className="dia-md-spacing" />);
        return;
      }

      // Headings
      if (trimmed.startsWith("### ")) {
        elements.push(
          <h4 key={`h4-${idx}`} className="dia-md-h4">
            {parseInlineFormatting(trimmed.substring(4))}
          </h4>
        );
        return;
      }

      if (trimmed.startsWith("## ")) {
        elements.push(
          <h3 key={`h3-${idx}`} className="dia-md-h3">
            {parseInlineFormatting(trimmed.substring(3))}
          </h3>
        );
        return;
      }

      if (trimmed.startsWith("# ")) {
        elements.push(
          <h2 key={`h2-${idx}`} className="dia-md-h2">
            {parseInlineFormatting(trimmed.substring(2))}
          </h2>
        );
        return;
      }

      // Blockquotes
      if (trimmed.startsWith("> ")) {
        elements.push(
          <blockquote key={`bq-${idx}`} className="dia-md-blockquote">
            {parseInlineFormatting(trimmed.substring(2))}
          </blockquote>
        );
        return;
      }

      // Regular paragraph
      elements.push(
        <p key={`p-${idx}`} className="dia-md-p">
          {parseInlineFormatting(line)}
        </p>
      );
    });

    flushList("final-flush-list");
    flushTable("final-flush-table");
    return elements;
  };

  // Helper for inline styles: bold (**text**), italics (*text*), inline code (`code`)
  const parseInlineFormatting = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const raw = match[0];
      if (raw.startsWith("`") && raw.endsWith("`")) {
        parts.push(
          <code key={`inline-code-${match.index}`} className="dia-inline-code">
            {raw.slice(1, -1)}
          </code>
        );
      } else if (raw.startsWith("**") && raw.endsWith("**")) {
        parts.push(
          <strong key={`bold-${match.index}`} className="dia-bold">
            {raw.slice(2, -2)}
          </strong>
        );
      } else if (raw.startsWith("*") && raw.endsWith("*")) {
        parts.push(
          <em key={`italic-${match.index}`} className="dia-italic">
            {raw.slice(1, -1)}
          </em>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  // Split on code fences (```lang ... ```)
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const nodes: React.ReactNode[] = [];
  let lastPos = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastPos) {
      const textSection = content.substring(lastPos, match.index);
      nodes.push(
        <div key={`text-${lastPos}`} className="dia-md-text-chunk">
          {renderFormattedText(textSection)}
        </div>
      );
    }

    const language = match[1] || "plaintext";
    const code = match[2].trimEnd();
    nodes.push(
      <CodeBlock key={`code-${match.index}`} language={language} code={code} />
    );

    lastPos = codeBlockRegex.lastIndex;
  }

  if (lastPos < content.length) {
    const remainingText = content.substring(lastPos);
    nodes.push(
      <div key={`text-${lastPos}`} className="dia-md-text-chunk">
        {renderFormattedText(remainingText)}
      </div>
    );
  }

  return <div className="dia-markdown-root">{nodes}</div>;
};
