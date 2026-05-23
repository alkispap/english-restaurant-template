import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getDirectorySidebarBlocks } from "@/lib/directory-ux";

export function DirectorySidebar() {
  const blocks = getDirectorySidebarBlocks();

  return (
    <div className="mt-5 space-y-5">
      {blocks.map((block) => (
        <section key={block.id} className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-ink">{block.title}</h2>
          <div className="mt-4 grid gap-2">
            {block.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-start justify-between gap-3 rounded-md bg-slate-50 px-3 py-3 text-sm font-bold text-ink transition hover:bg-orange-50 hover:text-accent"
              >
                <span>
                  {link.label}
                  {typeof link.count === "number" ? (
                    <span className="ml-1 font-semibold text-muted">({link.count.toLocaleString()})</span>
                  ) : null}
                </span>
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
