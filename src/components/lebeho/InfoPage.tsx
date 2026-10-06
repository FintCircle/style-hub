import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InfoPage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border px-5 py-3">
        <div className="mx-auto grid max-w-3xl grid-cols-[2.5rem_1fr_2.5rem] items-center">
          <Button asChild variant="ghost" size="icon" className="rounded-full" title="Back to Feed">
            <Link to="/" aria-label="Back to Feed">
              <ArrowLeft className="size-5" strokeWidth={1.5} />
            </Link>
          </Button>
          <Link to="/" className="justify-self-center font-editorial text-2xl">
            LeBeHo
          </Link>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-5 py-12 sm:py-20">
        <p className="text-[11px] uppercase text-muted-foreground">{eyebrow}</p>
        <h1 className="mt-5 max-w-2xl font-editorial text-5xl leading-tight sm:text-7xl">
          {title}
        </h1>
        <div className="mt-12 max-w-2xl space-y-10 text-[17px] leading-8 sm:text-lg">
          {children}
        </div>
      </article>
    </main>
  );
}

export function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-border pt-8">
      <h2 className="font-editorial text-3xl leading-tight">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}
