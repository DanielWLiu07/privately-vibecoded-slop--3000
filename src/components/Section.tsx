import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface SectionProps {
  /** Anchor target, e.g. "events-archive". */
  id?: string;
  title: string;
  /** Optional right-aligned slot in the section header (counts, links). */
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}

export default function Section({ id, title, aside, className, children }: SectionProps) {
  return (
    <section id={id} className={cn("mt-12", className)}>
      <div className="flex items-baseline justify-between gap-4 border-b pb-3">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
