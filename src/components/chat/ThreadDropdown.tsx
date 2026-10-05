import { useEffect, useState } from "react";
import { History, SquarePen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteThread, listThreads, type ThreadSummary } from "@/lib/thread";

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function ThreadDropdown({
  documentId,
  activeThreadId,
  refreshKey,
  onNewChat,
  onSelectThread,
  onThreadDeleted,
}: {
  documentId: string;
  activeThreadId: string | null;
  refreshKey: number;
  onNewChat: () => void;
  onSelectThread: (thread: ThreadSummary) => void;
  onThreadDeleted: (threadId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIsLoading(true);
    listThreads(documentId)
      .then(setThreads)
      .catch(() => toast.error("Failed to load conversations"))
      .finally(() => setIsLoading(false));
  }, [open, documentId, refreshKey]);

  async function handleDelete(e: React.MouseEvent, thread: ThreadSummary) {
    e.stopPropagation();
    try {
      await deleteThread(thread.id);
      setThreads((prev) => prev.filter((t) => t.id !== thread.id));
      onThreadDeleted(thread.id);
    } catch {
      toast.error("Failed to delete conversation");
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="ml-auto gap-1.5 text-muted-foreground">
          <History className="size-4" />
          <span className="hidden sm:inline">Chats</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuItem onClick={onNewChat}>
          <SquarePen className="size-4" />
          New chat
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {isLoading && <div className="px-2 py-3 text-xs text-muted-foreground">Loading...</div>}
        {!isLoading && threads.length === 0 && (
          <div className="px-2 py-3 text-xs text-muted-foreground">No past conversations yet.</div>
        )}
        {!isLoading &&
          threads.map((thread) => (
            <DropdownMenuItem
              key={thread.id}
              onClick={() => onSelectThread(thread)}
              className="group/thread flex items-center justify-between gap-2"
              data-active={thread.id === activeThreadId}
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm">{thread.title}</span>
                <span className="text-xs text-muted-foreground">{relativeTime(thread.updatedAt)}</span>
              </div>
              <button
                type="button"
                onClick={(e) => handleDelete(e, thread)}
                className="shrink-0 rounded p-1 opacity-0 hover:bg-destructive/10 group-hover/thread:opacity-100"
                aria-label={`Delete ${thread.title}`}
              >
                <Trash2 className="size-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}