import type { EavBlock } from "@/lib/listing-eav-summary";

export function FactAnswer({ block }: { block: EavBlock }) {
  if (!block.available) {
    // Render muted/grayed out for unavailable facts so we don't draw too much attention to missing data, 
    // but still maintain factual certainty.
    return (
      <div className="py-4 border-b border-line last:border-0 opacity-60">
        <h4 className="text-sm font-medium text-ink mb-1">{block.question}</h4>
        <p className="text-sm text-muted">{block.answer}</p>
      </div>
    );
  }

  // Render normally for available facts
  return (
    <div className="py-4 border-b border-line last:border-0">
      <h4 className="text-sm font-semibold text-ink mb-1">{block.question}</h4>
      <p className="text-sm text-ink/90 leading-relaxed">{block.answer}</p>
    </div>
  );
}
