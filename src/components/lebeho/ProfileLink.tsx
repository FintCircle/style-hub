import { Link } from "@tanstack/react-router";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function ProfileLink({
  name,
  handle,
  className,
  avatar,
  size = "sm",
}: {
  name: string;
  handle: string;
  className?: string;
  avatar?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-7 w-7 text-[11px]",
    md: "h-9 w-9 text-[13px]",
    lg: "h-11 w-11 text-[15px]",
  };

  const fallbackInitials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Link
      to="/profile/$handle"
      params={{ handle: handle.slice(1) }}
      className={cn(
        "inline-flex items-center gap-2 transition-colors hover:text-primary focus-visible:text-primary",
        className,
      )}
    >
      <Avatar className={cn("flex-shrink-0", sizeClasses[size])}>
        {avatar ? (
          <AvatarImage src={avatar} alt={`${name}'s avatar`} />
        ) : (
          <AvatarFallback>{fallbackInitials}</AvatarFallback>
        )}
      </Avatar>
      <span className="font-editorial">{name}</span>
    </Link>
  );
}
