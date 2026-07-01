import { CheckCircle2 } from "lucide-react";
import { SEO_POLICY } from "@/lib/seo-policy";

type DirectoryFreshnessLabelProps = {
  className?: string;
};

export function DirectoryFreshnessLabel({ className = "" }: DirectoryFreshnessLabelProps) {
  return (
    <div className={`inline-flex items-center gap-2 text-sm font-semibold text-emerald-900 ${className}`.trim()}>
      <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
      <span>{SEO_POLICY.lastCheckedLabel}</span>
    </div>
  );
}
