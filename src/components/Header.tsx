import Link from "next/link";
import { HeaderControls } from "@/components/HeaderControls";
import { HeaderSearch } from "@/components/HeaderSearch";
import { siteConfig } from "@/config/site";
import { isDirectoryFeatureEnabled } from "@/lib/directory-features";

export function Header() {
  const shortlistEnabled = isDirectoryFeatureEnabled("shortlist");

  return (
    <header className="relative z-[80] border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-5 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3 font-bold text-ink">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-orange-100 text-ink">
            {siteConfig.logoInitials}
          </span>
          <span className="hidden sm:inline">{siteConfig.name}</span>
        </Link>
        <div className="hidden min-w-0 flex-1 lg:block">
          <HeaderSearch className="mx-auto max-w-sm" />
        </div>
        <nav className="hidden shrink-0 items-center gap-7 text-sm font-semibold text-muted lg:flex">
          {siteConfig.navigation.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
        <HeaderControls navigation={siteConfig.navigation} shortlistEnabled={shortlistEnabled} />
      </div>
    </header>
  );
}

