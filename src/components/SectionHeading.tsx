type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  copy?: string;
  action?: React.ReactNode;
};

export function SectionHeading({ eyebrow, title, copy, action }: SectionHeadingProps) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">{eyebrow}</p> : null}
        <h2 className="text-2xl font-bold text-ink sm:text-3xl">{title}</h2>
        {copy ? <p className="mt-2 text-base leading-7 text-muted">{copy}</p> : null}
      </div>
      {action}
    </div>
  );
}

