import Link from "next/link";
import { buttonStyles } from "@/components/ui/Button";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: { label: string; href: string };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-[2rem] border border-dashed border-indigo-200 bg-white px-6 py-14 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-cream-100 text-2xl" aria-hidden="true">✦</span>
      <h2 className="mt-5 text-xl font-bold text-indigo-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-500">{description}</p>
      {action && <Link className={buttonStyles("secondary", "mt-6")} href={action.href}>{action.label}</Link>}
    </div>
  );
}
