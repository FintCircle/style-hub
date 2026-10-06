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
  const cleanHandle = handle.replace(/^@/, "");
  return (
    <Link
      to="/profile/$handle"
      params={{ handle: cleanHandle }}
      className={className ?? "transition-colors hover:text-primary focus-visible:text-primary"}
    >
      {name}
    </Link>
  );
}
