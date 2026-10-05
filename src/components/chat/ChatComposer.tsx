import { useEffect, useRef, type KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder = "Ask anything about this document…",
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Grow with content up to the max-height set in the className below.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onSubmit();
    }
  }

  const canSend = !disabled && value.trim().length > 0;

  return (
    <div className="flex items-end gap-2 rounded-3xl border bg-card p-2 pl-4 shadow-sm transition-shadow focus-within:border-ring/60 focus-within:shadow-md focus-within:ring-[3px] focus-within:ring-ring/20">
      <Textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="Message"
        className="field-sizing-fixed max-h-48 min-h-0 resize-none border-0 bg-transparent px-0 py-2 text-[15px] shadow-none focus-visible:ring-0 dark:bg-transparent"
      />
      <Button
        type="button"
        size="icon"
        onClick={onSubmit}
        disabled={!canSend}
        aria-label="Send message"
        className="size-9 shrink-0 rounded-full"
      >
        <ArrowUp className="size-4.5" />
      </Button>
    </div>
  );
}
