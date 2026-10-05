import { getAccessToken } from "@/lib/api";

export type ChatSource = number;

export type ThreadSummary = { id: string; title: string; updatedAt: string };

export type ThreadMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources: number[] | null;
};

type ChatCallbacks = {
  onThreadId: (threadId: string) => void;
  onToken: (text: string) => void;
  onDone: (sources: ChatSource[]) => void;
  onError: (message: string) => void;
};

export async function listThreads(documentId: string): Promise<ThreadSummary[]> {
  const res = await fetch(`/api/documents/${documentId}/threads`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load conversations");
  const data = await res.json();
  return data.threads;
}

export async function loadThreadMessages(threadId: string): Promise<ThreadMessage[]> {
  const res = await fetch(`/api/threads/${threadId}/messages`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load messages");
  const data = await res.json();
  return data.messages;
}

export async function deleteThread(threadId: string): Promise<void> {
  const res = await fetch(`/api/threads/${threadId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    credentials: "include",
  });
  if (!res.ok && res.status !== 204) throw new Error("Failed to delete conversation");
}

export async function sendMessage(
  { documentId, threadId, question }: { documentId: string; threadId: string | null; question: string },
  { onThreadId, onToken, onDone, onError }: ChatCallbacks
): Promise<void> {
  const url = threadId ? `/api/threads/${threadId}/chat` : `/api/documents/${documentId}/threads`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
      },
      credentials: "include",
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