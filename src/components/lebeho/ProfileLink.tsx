import { Link } from "@tanstack/react-router";

export function ProfileLink({
  name,
  handle,
  className,
}: {
  name: string;
  handle: string;
  className?: string;
}) {
  return (
    <Link
      to="/profile/$handle"
      params={{ handle: handle.slice(1) }}
      className={className ?? "transition-colors hover:text-primary focus-visible:text-primary"}
    >
      {name}
    </Link>
  );
}
