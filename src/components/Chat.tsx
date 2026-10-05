import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FileSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatMessage, type Message } from "@/components/chat/ChatMessage";
import { SuggestedQuestions } from "@/components/chat/SuggestedQuestions";
import { ThreadDropdown } from "@/components/chat/ThreadDropdown";
import { loadThreadMessages, sendMessage, type ThreadSummary } from "@/lib/thread";
import { cn } from "@/lib/utils";
import type { DocumentRecord } from "@/lib/document";

export function Chat({ document }: { document: DocumentRecord }) {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [threadsRefreshKey, setThreadsRefreshKey] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  useEffect(() => {
    setActiveThreadId(null);
    setMessages([]);
    setInput("");
  }, [document.id]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTo({ top: el.scrollHeight });
  }, [messages]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  function patchLastAssistant(fn: (m: Message) => Message) {
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      next[next.length - 1] = fn(next[next.length - 1]);
      return next;
    });
  }

  async function send(raw: string) {
    const question = raw.trim();
    if (!question || isStreaming) return;

    const wasNewThread = activeThreadId === null;

    stickToBottom.current = true;
    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: question },
      { role: "assistant", content: "", isStreaming: true },
    ]);
    setIsStreaming(true);

    await sendMessage(
      { documentId: document.id, threadId: activeThreadId, question },
      {
        onThreadId: (id) => {
          if (wasNewThread) setActiveThreadId(id);
        },
        onToken: (text) => patchLastAssistant((m) => ({ ...m, content: m.content + text })),
        onDone: (sources) => {
          patchLastAssistant((m) => ({ ...m, isStreaming: false, sources }));
          setThreadsRefreshKey((k) => k + 1);
        },
        onError: (message) =>
          patchLastAssistant((m) => ({ ...m, content: message, isStreaming: false, isError: true })),
      }
    );

    patchLastAssistant((m) => ({ ...m, isStreaming: false }));
    setIsStreaming(false);
  }

  function newChat() {
    setActiveThreadId(null);
    setMessages([]);
    setInput("");
  }

  async function selectThread(thread: ThreadSummary) {
    try {
      const loaded = await loadThreadMessages(thread.id);
      setActiveThreadId(thread.id);
      setMessages(loaded.map((m) => ({ role: m.role, content: m.content, sources: m.sources ?? undefined })));
      setInput("");
    } catch {
      toast.error("Failed to load conversation");
    }
  }

  function handleThreadDeleted(threadId: string) {
    if (threadId === activeThreadId) newChat();
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mx-1 h-5" />
        <div className="flex min-w-0 items-center gap-2">
          <FileSearch className="size-4 shrink-0 text-primary" />
          <h1 className="truncate text-sm font-medium">{document.filename}</h1>
          {document.pageCount != null && (
            <Badge variant="secondary" className="hidden shrink-0 rounded-full font-normal sm:inline-flex">
              {document.pageCount} {document.pageCount === 1 ? "page" : "pages"}
            </Badge>
          )}
        </div>
        <ThreadDropdown
          documentId={document.id}
          activeThreadId={activeThreadId}
          refreshKey={threadsRefreshKey}
          onNewChat={newChat}
          onSelectThread={selectThread}
          onThreadDeleted={handleThreadDeleted}
        />
      </header>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={cn(
          "min-h-0 flex-1 overflow-y-auto",
          isEmpty &&
            "bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklch,var(--primary)_9%,transparent),transparent)]"
        )}
      >
        {isEmpty ? (
          <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-center px-4 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary/60 text-primary-foreground shadow-lg shadow-primary/20 animate-in fade-in zoom-in-95 duration-500">
              <FileSearch className="size-7" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl animate-in fade-in slide-in-from-bottom-1 duration-500">
              What would you like to know?
            </h2>
            <p className="mt-2 mb-8 max-w-md text-sm text-muted-foreground animate-in fade-in duration-700">
              Pick a starter below, or ask your own question about{" "}
              <span className="font-medium text-foreground">{document.filename}</span>.
            </p>
            <SuggestedQuestions onPick={send} disabled={isStreaming} />
          </div>
        ) : (
          <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-8">
            {messages.map((m, i) => (
              <ChatMessage key={i} message={m} />
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 px-4 pt-2 pb-4">
        <div className="mx-auto w-full max-w-3xl">
          <ChatComposer value={input} onChange={setInput} onSubmit={() => send(input)} disabled={isStreaming} />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Answers are generated from your document and can contain mistakes.
          </p>
        </div>
      </div>
    </div>
  );
}