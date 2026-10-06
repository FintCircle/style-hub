import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { reportContent } from "@/lib/admin.functions";
import { useRequireAccount } from "@/hooks/use-viewer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const reasons = ["Not fashion", "Harassment or hate", "Spam or scam", "Nudity", "Something else"];

/** Lets a member report a post, reel or profile to LeBeHo admins. */
export function ReportButton({
  targetType,
  targetId,
}: {
  targetType: "post" | "reel" | "profile";
  targetId: string;
}) {
  const requireAccount = useRequireAccount();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);

  async function send(reason: string) {
    setSending(true);
    try {
      await reportContent({ data: { targetType, targetId, reason } });
      toast.success("Thanks — LeBeHo will review this.");
      setOpen(false);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={(next) => (next ? requireAccount() && setOpen(true) : setOpen(false))}>
      <PopoverTrigger asChild>
        <button type="button" aria-label={`Report this ${targetType}`} className="p-1 text-muted-foreground hover:text-foreground">
          <Flag className="size-3.5" strokeWidth={1.5} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-2">
        <p className="px-2 pb-2 pt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Report to LeBeHo</p>
        {reasons.map((reason) => (
          <button
            key={reason}
            type="button"
            disabled={sending}
            onClick={() => send(reason)}
            className="block w-full rounded px-2 py-2 text-left text-sm hover:bg-muted disabled:opacity-50"
          >
            {reason}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
