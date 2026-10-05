import { ChevronRight, FileSearch, FileText } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UploadDropzone } from "@/components/DocumentUpload";
import type { DocumentUploadState } from "@/hooks/use-document-upload";
import type { DocumentRecord } from "@/lib/document";

export function EmptyWorkspace({
  documents,
  upload,
  onSelect,
}: {
  documents: DocumentRecord[];
  upload: DocumentUploadState;
  onSelect: (id: string) => void;
}) {
  const recent = documents.filter((d) => d.status === "ready").slice(0, 4);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-14 shrink-0 items-center px-3">
        <SidebarTrigger />
      </header>

      <div className="flex min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklch,var(--primary)_9%,transparent),transparent)]">
        <div className="m-auto w-full max-w-xl px-4 py-10 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary/60 text-primary-foreground shadow-lg shadow-primary/20 animate-in fade-in zoom-in-95 duration-500">
            <FileSearch className="size-7" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight animate-in fade-in slide-in-from-bottom-1 duration-500">
            Chat with your documents
          </h1>
          <p className="mt-2 mb-8 text-sm text-muted-foreground animate-in fade-in duration-700">
            Upload a PDF and ask questions in plain English. Answers come straight from the document.
          </p>

          <UploadDropzone state={upload} />

          {recent.length > 0 && (
            <div className="mt-8 text-left animate-in fade-in slide-in-from-bottom-2 duration-500">
              <p className="mb-2 px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Or continue with
              </p>
              <ul className="space-y-2">
                {recent.map((doc) => (
                  <li key={doc.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(doc.id)}
                      className="group flex w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left shadow-xs outline-none transition-all hover:border-primary/40 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/40"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <FileText className="size-4.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{doc.filename}</span>
                        <span className="block text-xs text-muted-foreground">
                          {doc.pageCount ?? "?"} pages · {(doc.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      </span>
                      <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
