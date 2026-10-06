import { apiFetch, apiJson } from "@/lib/api";

export type ChatSource = { index: number; content: string };

export type ThreadSummary = { id: string; title: string; updatedAt: string };

export type ThreadMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources: ChatSource[] | null;
};

type ChatCallbacks = {
  onThreadId: (threadId: string) => void;
  onToken: (text: string) => void;
  onDone: (sources: ChatSource[]) => void;
  onError: (message: string) => void;
};

export async function listThreads(documentId: string): Promise<ThreadSummary[]> {
  const data = await apiJson<{ threads: ThreadSummary[] }>(`/documents/${documentId}/threads`);
  return data.threads;
}

export async function loadThreadMessages(threadId: string): Promise<ThreadMessage[]> {
  const data = await apiJson<{ messages: ThreadMessage[] }>(`/threads/${threadId}/messages`);
  return data.messages;
}

export async function deleteThread(threadId: string): Promise<void> {
  const res = await apiFetch(`/threads/${threadId}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error("Failed to delete conversation");
}

export async function sendMessage(
  { documentId, threadId, question }: { documentId: string; threadId: string | null; question: string },
  { onThreadId, onToken, onDone, onError }: ChatCallbacks
): Promise<void> {
  const path = threadId ? `/threads/${threadId}/chat` : `/documents/${documentId}/threads`;

  try {
    const res = await apiFetch(path, {
      method: "POST",
      body: JSON.stringify({ question }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      onError(body?.error ?? "Something went wrong");
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      onError("Streaming isn't supported in this browser");
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const jsonStr = trimmed.slice(5).trim();
        if (!jsonStr) continue;

        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.threadId) {
            onThreadId(parsed.threadId);
          } else if (parsed.error) {
            onError(parsed.error);
          } else if (parsed.done) {
            onDone(parsed.sources ?? []);
          } else if (parsed.text) {
            onToken(parsed.text);
          }
        } catch {
          // Split mid-object across reads; wait for the rest.
        }
      }
    }
  } catch {
    onError("Network error. Please try again.");
  }
}