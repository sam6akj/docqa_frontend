import { getAccessToken } from "@/lib/api";

export type DocumentStatus = "processing" | "ready" | "failed";

export type DocumentRecord = {
  id: string;
  filename: string;
  sizeBytes: number;
  pageCount: number | null;
  status: DocumentStatus;
  errorMessage: string | null;
  createdAt: string;
};

export async function listDocuments(): Promise<DocumentRecord[]> {
  const res = await fetch("/api/documents", {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load documents");
  const data = await res.json();
  return data.documents;
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`/api/documents/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    credentials: "include",
  });
  if (!res.ok && res.status !== 204) throw new Error("Failed to delete document");
}

export function uploadDocument(
  file: File,
  onProgress: (percent: number) => void
): Promise<DocumentRecord> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    xhr.open("POST", "/api/documents");
    xhr.setRequestHeader("Authorization", `Bearer ${getAccessToken()}`);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let body: any = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body.document as DocumentRecord);
      } else {
        reject(new Error(body?.error ?? "Upload failed"));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(formData);
  });
}