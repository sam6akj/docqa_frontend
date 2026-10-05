import { useState } from "react";
import { toast } from "sonner";
import { DocumentRecord, uploadDocument } from "@/lib/document";

export const MAX_UPLOAD_MB = 10;

export type DocumentUploadState = {
  upload: (file: File) => Promise<void>;
  progress: number | null;
  fileName: string | null;
  isUploading: boolean;
};

// Upload state lives in one place so the sidebar button and the big
// drop-zone can share it (and never run two uploads at once).
export function useDocumentUpload(onUploaded: (doc: DocumentRecord) => void): DocumentUploadState {
  const [progress, setProgress] = useState<number | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function upload(file: File) {
    if (progress !== null) return;
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are supported.");
      return;
    }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      toast.error(`File is too large. The limit is ${MAX_UPLOAD_MB} MB.`);
      return;
    }

    setFileName(file.name);
    setProgress(0);
    try {
      const doc = await uploadDocument(file, setProgress);
      toast.success(`${doc.filename} uploaded`);
      onUploaded(doc);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setProgress(null);
      setFileName(null);
    }
  }

  return { upload, progress, fileName, isUploading: progress !== null };
}
