import { apiFetch, apiJson, getAccessToken, tryRefresh } from "@/lib/api";

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
  const data = await apiJson<{ documents: DocumentRecord[] }>("/documents");
  return data.documents;
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await apiFetch(`/documents/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error("Failed to delete document");
}

type UploadResult = { status: number; body: any };

function sendUpload(
  file: File,
  token: string | null,
  onProgress: (percent: number) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    xhr.open("POST", "/api/documents");
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
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
      resolve({ status: xhr.status, body });
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(formData);
  });
}

export async function uploadDocument(
  file: File,
  onProgress: (percent: number) => void
): Promise<DocumentRecord> {
  const tokenUsed = getAccessToken();
  let result = await sendUpload(file, tokenUsed, onProgress);

  if (result.status === 401) {
    const current = getAccessToken();
    const alreadyRefreshed = current !== null && current !== tokenUsed;
    if (alreadyRefreshed || (await tryRefresh())) {
      onProgress(0);
      result = await sendUpload(file, getAccessToken(), onProgress);
    }
  }

  if (result.status >= 200 && result.status < 300) {
    return result.body.document as DocumentRecord;
  }
  throw new Error(result.body?.error ?? "Upload failed");
}