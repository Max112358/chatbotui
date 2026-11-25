import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const selectAll = (e: React.MouseEvent<HTMLPreElement>) => {
    if (e.detail !== 3) return;

    const pre = preRef.current;
    if (!pre) return;

    const range = document.createRange();
    range.selectNodeContents(pre);

    const selection = window.getSelection();
    if (!selection) return;

    e.preventDefault();
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const handleCopy = async () => {
    const text = preRef.current?.textContent ?? "";
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="group relative my-4 overflow-hidden rounded border border-border-color bg-dark">
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 rounded bg-card p-1.5 text-muted opacity-0 ring-1 ring-transparent transition-opacity hover:text-accent-orange group-hover:opacity-100"
        aria-label="Copy code"
        title="Copy code"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>

      <pre
        ref={preRef}
        onClick={selectAll}
        className="m-0 overflow-x-auto whitespace-pre-wrap break-all p-4 text-sm leading-relaxed"
      >
        {children}
      </pre>
    </div>
  );
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-invert prose-sm max-w-none break-words [&_pre]:m-0 [&_pre]:whitespace-pre-wrap [&_pre]:break-all [&_code]:break-all [&_a]:break-words [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
