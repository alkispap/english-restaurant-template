import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { getDirectoryHomeSections } from "@/lib/directory-ux";

export function DirectoryHomeSections() {
  const sections = getDirectoryHomeSections();

  return (
    <>
      {sections.map((section, index) => (
        <section key={section.id} className={index % 2 === 0 ? "mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8" : "bg-white py-14"}>
          <div className={index % 2 === 0 ? "" : "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"}>
            <SectionHeading title={section.title} copy={section.copy} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex min-h-28 flex-col justify-between rounded-lg border border-line bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-primary"
                >
                  <span>
                    <span className="flex items-start justify-between gap-3">
                      <span className="font-bold text-ink group-hover:text-accent">{link.label}</span>
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    </span>
                    {link.description ? <span className="mt-2 block text-sm leading-6 text-muted">{link.description}</span> : null}
                  </span>
                  {typeof link.count === "number" ? (
                    <span className="mt-4 text-xs font-bold uppercase text-muted">{link.count.toLocaleString()} listings</span>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
