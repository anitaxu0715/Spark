import type { RequestStatus } from "@/types";

const styles: Record<RequestStatus, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  accepted: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  completed: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  declined: "bg-slate-100 text-slate-700 ring-slate-200",
  cancelled: "bg-rose-50 text-rose-800 ring-rose-200",
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold capitalize ring-1 ring-inset ${styles[status]}`}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </span>
  );
}
