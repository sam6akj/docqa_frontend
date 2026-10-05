import { CalendarCheck, Lightbulb, ScrollText, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Suggestion = { icon: LucideIcon; title: string; question: string };

// Three general-purpose starters that work for almost any PDF.
// Edit these freely: clicking a card sends `question` as-is.
export const SUGGESTED_QUESTIONS: Suggestion[] = [
  {
    icon: ScrollText,
    title: "Summarize",
    question: "Give me a concise summary of this document.",
  },
  {
    icon: Lightbulb,
    title: "Key takeaways",
    question: "What are the key takeaways and most important points?",
  },
  {
    icon: CalendarCheck,
    title: "Dates & numbers",
    question: "List any important dates, figures, deadlines, or action items mentioned.",
  },
];

export function SuggestedQuestions({
  onPick,
  disabled,
}: {
  onPick: (question: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid w-full gap-3 sm:grid-cols-3">
      {SUGGESTED_QUESTIONS.map(({ icon: Icon, title, question }, i) => (
        <button
          key={title}
          type="button"
          disabled={disabled}
          onClick={() => onPick(question)}
          style={{ animationDelay: `${150 + i * 80}ms` }}
          className={cn(
            "group flex flex-col gap-3 rounded-2xl border bg-card p-4 text-left shadow-xs outline-none transition-all",
            "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500",
            "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
            "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40",
            "disabled:pointer-events-none disabled:opacity-50"
          )}
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon className="size-4.5" />
          </span>
          <span>
            <span className="block text-sm font-medium">{title}</span>
            <span className="mt-1 line-clamp-3 block text-sm leading-snug text-muted-foreground">{question}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
