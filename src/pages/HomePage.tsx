import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppSidebar } from "@/components/AppSidebar";
import { Chat } from "@/components/Chat";
import { EmptyWorkspace } from "@/components/EmptyWorkspace";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useDocumentUpload } from "@/hooks/use-document-upload";
import { DocumentRecord, listDocuments } from "@/lib/document";

const POLL_MS = 3000;

export default function HomePage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upload = useDocumentUpload((doc) => setDocuments((prev) => [doc, ...prev]));

  useEffect(() => {
    listDocuments()
      .then(setDocuments)
      .catch(() => toast.error("Failed to load documents"))
      .finally(() => setIsLoading(false));
  }, []);

  // While any document is still being processed, poll so it flips to "ready"
  // without the user having to refresh the page.
  const hasProcessing = documents.some((d) => d.status === "processing");
  useEffect(() => {
    if (!hasProcessing) return;
    const timer = setInterval(() => {
      listDocuments()
        .then(setDocuments)
        .catch(() => {});
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [hasProcessing]);

  function handleDeleted(id: string) {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  const selected = documents.find((d) => d.id === selectedId && d.status === "ready") ?? null;

  return (
    <SidebarProvider>
      <AppSidebar
        documents={documents}
        isLoading={isLoading}
        selectedId={selected?.id ?? null}
        upload={upload}
        onSelect={setSelectedId}
        onDeleted={handleDeleted}
      />
      <SidebarInset className="h-svh overflow-hidden">
        {selected ? (
          // key resets the conversation when switching documents
          <Chat key={selected.id} document={selected} />
        ) : (
          <EmptyWorkspace documents={documents} upload={upload} onSelect={setSelectedId} />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
