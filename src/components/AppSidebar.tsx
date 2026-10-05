import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { toast } from "sonner";
import {
  ChevronsUpDown,
  Ellipsis,
  FileSearch,
  FileText,
  LoaderCircle,
  LogOut,
  Monitor,
  Moon,
  Sun,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { deleteDocument, type DocumentRecord } from "@/lib/document";
import type { DocumentUploadState } from "@/hooks/use-document-upload";
import { UploadButton } from "@/components/DocumentUpload";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  useSidebar,
} from "@/components/ui/sidebar";

type Props = {
  documents: DocumentRecord[];
  isLoading: boolean;
  selectedId: string | null;
  upload: DocumentUploadState;
  onSelect: (id: string) => void;
  onDeleted: (id: string) => void;
};

export function AppSidebar({ documents, isLoading, selectedId, upload, onSelect, onDeleted }: Props) {
  const { isMobile, setOpenMobile } = useSidebar();
  const [toDelete, setToDelete] = useState<DocumentRecord | null>(null);

  function handleSelect(id: string) {
    onSelect(id);
    if (isMobile) setOpenMobile(false);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    const doc = toDelete;
    setToDelete(null);
    try {
      await deleteDocument(doc.id);
      toast.success(`${doc.filename} deleted`);
      onDeleted(doc.id);
    } catch {
      toast.error("Failed to delete document");
    }
  }

  return (
    <>
      <Sidebar>
        <SidebarHeader className="gap-4 p-3">
          <div className="flex items-center gap-2.5 px-1 pt-1">
            <div className="flex size-8 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary/60 text-primary-foreground shadow-sm">
              <FileSearch className="size-4" />
            </div>
            <span className="text-base font-semibold tracking-tight">DocQA</span>
          </div>

          <UploadButton state={upload} />

          {upload.isUploading && (
            <div className="space-y-1.5 rounded-xl border bg-card p-3 animate-in fade-in slide-in-from-top-1">
              <p className="truncate text-xs font-medium">{upload.fileName}</p>
              <Progress value={upload.progress ?? 0} className="h-1.5" />
            </div>
          )}
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Your documents</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {isLoading ? (
                  <>
                    <SidebarMenuSkeleton showIcon />
                    <SidebarMenuSkeleton showIcon />
                    <SidebarMenuSkeleton showIcon />
                  </>
                ) : documents.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-muted-foreground">
                    No documents yet. Upload a PDF to get started.
                  </p>
                ) : (
                  documents.map((doc) => (
                    <DocumentRow
                      key={doc.id}
                      doc={doc}
                      active={doc.id === selectedId}
                      onSelect={() => handleSelect(doc.id)}
                      onDelete={() => setToDelete(doc)}
                    />
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-2">
          <UserMenu />
        </SidebarFooter>
      </Sidebar>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{toDelete?.filename}</span> and its chat history will be
              removed. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function DocumentRow({
  doc,
  active,
  onSelect,
  onDelete,
}: {
  doc: DocumentRecord;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const isReady = doc.status === "ready";
  const subtitle =
    doc.status === "processing" ? "Processing…" : doc.status === "failed" ? "Failed to process" : null;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        onClick={isReady ? onSelect : undefined}
        aria-disabled={!isReady}
        className={!isReady ? "cursor-default opacity-80 hover:bg-transparent" : undefined}
        tooltip={doc.filename}
      >
        {doc.status === "processing" ? (
          <LoaderCircle className="animate-spin text-muted-foreground" />
        ) : doc.status === "failed" ? (
          <TriangleAlert className="text-destructive" />
        ) : (
          <FileText />
        )}
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate">{doc.filename}</span>
          {subtitle && (
            <span className={doc.status === "failed" ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
              {subtitle}
            </span>
          )}
        </div>
      </SidebarMenuButton>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction showOnHover aria-label={`Options for ${doc.filename}`}>
            <Ellipsis />
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-40">
          <DropdownMenuItem variant="destructive" onSelect={onDelete}>
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const { isMobile } = useSidebar();
  const { theme, setTheme } = useTheme();
  const email = user?.email ?? "";

  async function handleLogout() {
    await logout();
    toast.success("Logged out");
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-primary/10 font-medium text-primary">
                  {email.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{email}</span>
                <span className="truncate text-xs text-muted-foreground">Account</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={isMobile ? "bottom" : "top"}
            align="end"
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
          >
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Appearance</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}>
              <DropdownMenuRadioItem value="light">
                <Sun className="size-4" /> Light
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <Moon className="size-4" /> Dark
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <Monitor className="size-4" /> System
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
