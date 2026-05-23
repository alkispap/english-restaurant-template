import Link from "next/link";
import { siteConfig } from "@/config/site";
import { getFooterGroups } from "@/lib/directory-growth";

export function Footer() {
  const groups = getFooterGroups();

  return (
    <footer className="border-t border-line bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)] lg:px-8">
        <div>
          <div className="mb-3 text-lg font-bold">{siteConfig.name}</div>
          <p className="max-w-md text-sm leading-6 text-slate-300">{siteConfig.description}</p>
        </div>
        {groups.map((group) => (
          <div key={group.title}>
            <h3 className="mb-3 text-sm font-bold">{group.title}</h3>
            <div className="grid gap-2 text-sm text-slate-300">
              {group.links.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-white">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
}
