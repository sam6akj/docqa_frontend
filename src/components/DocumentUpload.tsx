import { useRef, useState, type DragEvent } from "react";
import { FileUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MAX_UPLOAD_MB, type DocumentUploadState } from "@/hooks/use-document-upload";
import { cn } from "@/lib/utils";

function HiddenPdfInput({
  inputRef,
  onFile,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFile: (file: File) => void;
}) {
  return (
    <input
      ref={inputRef}
      type="file"
      accept="application/pdf"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onFile(file);
        e.target.value = ""; // allow re-selecting the same file
      }}
    />
  );
}

/** Compact button used in the sidebar. */
export function UploadButton({ state }: { state: DocumentUploadState }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <HiddenPdfInput inputRef={inputRef} onFile={state.upload} />
      <Button
        type="button"
        className="w-full justify-start gap-2 rounded-xl shadow-sm"
        disabled={state.isUploading}
        onClick={() => inputRef.current?.click()}
      >
        <Plus />
        Upload PDF
      </Button>
    </>
  );
}

/** Large drag-and-drop area used on the empty workspace. */
export function UploadDropzone({ state, className }: { state: DocumentUploadState; className?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) state.upload(file);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload a PDF"
      onClick={() => !state.isUploading && inputRef.current?.click()}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !state.isUploading) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "group cursor-pointer rounded-3xl border-2 border-dashed bg-card/60 p-8 text-center outline-none transition-all",
        "hover:border-primary/50 hover:bg-card focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/40",
        isDragging && "scale-[1.01] border-primary bg-primary/5",
        state.isUploading && "cursor-default",
        className
      )}
    >
      <HiddenPdfInput inputRef={inputRef} onFile={state.upload} />

      {state.progress === null ? (
        <>
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:-translate-y-0.5">
            <FileUp className="size-6" />
          </div>
          <p className="mt-4 text-sm font-medium">Drop a PDF here, or click to browse</p>
          <p className="mt-1 text-xs text-muted-foreground">
            PDF only · up to 20 pages · {MAX_UPLOAD_MB} MB
          </p>
        </>
      ) : (
        <div className="mx-auto max-w-sm space-y-3 text-left">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium">{state.fileName}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">{state.progress}%</span>
          </div>
          <Progress value={state.progress} />
          <p className="text-xs text-muted-foreground">Uploading…</p>
        </div>
      )}
    </div>
  );
}
