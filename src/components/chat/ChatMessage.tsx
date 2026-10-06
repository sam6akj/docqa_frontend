import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Check, Copy, FileText, Sparkles, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import type { ChatSource } from "@/lib/thread";

export type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  isStreaming?: boolean;
  isError?: boolean;
};

const markdownComponents = {
  p: ({ ...props }) => <p className="mb-3 last:mb-0" {...props} />,
  h1: ({ ...props }) => <h3 className="mt-5 mb-2 text-lg font-semibold first:mt-0" {...props} />,
  h2: ({ ...props }) => <h3 className="mt-5 mb-2 text-base font-semibold first:mt-0" {...props} />,
  h3: ({ ...props }) => <h4 className="mt-4 mb-1.5 font-semibold first:mt-0" {...props} />,
  ul: ({ ...props }) => <ul className="mb-3 list-disc space-y-1.5 pl-5 marker:text-muted-foreground last:mb-0" {...props} />,
  ol: ({ ...props }) => <ol className="mb-3 list-decimal space-y-1.5 pl-5 marker:text-muted-foreground last:mb-0" {...props} />,
  li: ({ ...props }) => <li className="pl-1" {...props} />,
  strong: ({ ...props }) => <strong className="font-semibold" {...props} />,
  blockquote: ({ ...props }) => (
    <blockquote className="mb-3 border-l-2 border-primary/40 pl-4 text-muted-foreground italic last:mb-0" {...props} />
  ),
  a: ({ ...props }) => (
    <a className="font-medium text-primary underline underline-offset-4" target="_blank" rel="noreferrer" {...props} />
  ),
  pre: ({ ...props }) => (
    <pre className="mb-3 overflow-x-auto rounded-xl border bg-muted p-3 text-[13px] leading-6 last:mb-0" {...props} />
  ),
  code: ({ ...props }) => <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.85em]" {...props} />,
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable (e.g. insecure context) */
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      onClick={copy}
      aria-label={copied ? "Copied" : "Copy answer"}
      className="text-muted-foreground"
    >
      {copied ? <Check /> : <Copy />}
    </Button>
  );
}

function ThinkingDots() {
  return (
    <div className="flex h-7 items-center gap-1" aria-label="Thinking">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          style={{ animationDelay: `${delay}ms` }}
          className="size-2 animate-bounce rounded-full bg-primary/50"
        />
      ))}
    </div>
  );
}

export function ChatMessage({ message }: { message: Message }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="max-w-[85%] rounded-3xl rounded-br-lg bg-primary px-4 py-2.5 text-[15px] leading-6 whitespace-pre-wrap text-primary-foreground shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  const showDots = message.isStreaming && message.content.length === 0;
  const hasSources = !message.isStreaming && !message.isError && !!message.sources?.length;
  const canCopy = !message.isStreaming && !message.isError && message.content.length > 0;

  return (
    <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ring-1",
          message.isError
            ? "bg-destructive/10 text-destructive ring-destructive/20"
            : "bg-primary/10 text-primary ring-primary/20"
        )}
      >
        {message.isError ? <TriangleAlert className="size-4" /> : <Sparkles className="size-4" />}
      </div>

      <div className="min-w-0 flex-1 pt-1">
        {showDots ? (
          <ThinkingDots />
        ) : (
          <div className={cn("text-[15px] leading-7", message.isError && "text-destructive")}>
            <ReactMarkdown components={markdownComponents}>{message.content}</ReactMarkdown>
            {message.isStreaming && (
              <span className="ml-0.5 inline-block size-2 animate-pulse rounded-full bg-primary align-middle" />
            )}
          </div>
        )}

        {(hasSources || canCopy) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {hasSources && (
              <>
                <span className="text-xs text-muted-foreground">Sources</span>
                {message.sources!.map((s) => (
                  <HoverCard key={s.index} openDelay={150} closeDelay={100}>
                    <HoverCardTrigger asChild>
                      <Badge variant="secondary" className="cursor-default gap-1 rounded-full font-normal">
                        <FileText className="size-3" />
                        {s.index}
                      </Badge>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80 text-sm" side="top">
                      <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                        Source {s.index} — excerpt sent to the model
                      </p>
                      <p className="max-h-48 overflow-y-auto whitespace-pre-wrap text-foreground">
                        {s.content}
                      </p>
                    </HoverCardContent>
                  </HoverCard>
                ))}
              </>
            )}
            {canCopy && (
              <div className="ml-auto">
                <CopyButton text={message.content} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}