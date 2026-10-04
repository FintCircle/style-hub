import { Flag } from "lucide-react";
import { toast } from "sonner";
import { useRequireAccount } from "@/hooks/use-viewer";
import { reportContent } from "@/lib/lebeho.functions";

/** Sends a report on a post or reel to the LeBeHo admin. */
export function ReportButton({
  targetType,
  targetId,
  className = "",
}: {
  targetType: "post" | "reel";
  targetId: string;
  className?: string;
}) {
  const requireAccount = useRequireAccount();
  async function report() {
    if (!requireAccount()) return;
    const reason = window.prompt("What's wrong with this? (optional)");
    if (reason === null) return;
    try {
      await reportContent({ data: { targetType, targetId, reason } });
      toast.success("Thanks — LeBeHo will take a look.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Report failed.");
    }
  }
  return (
    <button type="button" onClick={report} aria-label="Report" title="Report" className={className}>
      <Flag className="size-4" strokeWidth={1.5} />
    </button>
  );
}
