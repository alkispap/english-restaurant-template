import Link from "next/link";
import { directoryIndexPath } from "@/lib/routes";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-4xl font-bold text-ink">Page not found</h1>
      <p className="mt-4 text-muted">This directory page does not exist yet.</p>
      <Link href={directoryIndexPath()} className="mt-8 inline-flex rounded-md bg-primary px-5 py-3 text-sm font-bold text-white">
        Browse restaurants
      </Link>
    </main>
  );
}
