import { UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type ProfileAvatarProps = {
  name: string;
  src?: string;
  borderColor?: string;
  size?: "sm" | "md";
  className?: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function ProfileAvatar({ name, src, borderColor, size = "md", className }: ProfileAvatarProps) {
  return (
    <Avatar
      className={cn(
        "shrink-0 border-2 bg-card p-0.5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
        size === "sm" ? "size-8" : "size-11",
        className,
      )}
      style={{ borderColor: borderColor ?? "#c7a36a" }}
    >
      <AvatarImage src={src} alt={`${name}'s profile picture`} className="rounded-full object-cover" />
      <AvatarFallback className="rounded-full bg-muted font-body text-[10px] font-medium text-muted-foreground">
        {src ? <UserRound className="size-3.5" aria-hidden="true" /> : initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
