import Link from "next/link";
import { SetupState } from "@/components/SetupState";
import { requireOperationalRole } from "@/lib/auth/viewer";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function InstitutionsPage() {
  const viewer = await requireOperationalRole(["institution_admin", "platform_admin"], "/admin/institutions");
  if (!viewer.configured) return <SetupState />;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return <SetupState />;
  const [{ data: institutionRows }, { data: counts }, { data: assignments }] = await Promise.all([
    supabase.from("universities").select("id, name, active").order("name"),
    supabase.rpc("get_institution_member_counts"),
    supabase.from("institution_admin_assignments").select("university_id"),
  ]);
  const assignedIds = new Set((assignments ?? []).map((assignment) => assignment.university_id));
  const institutions = viewer.roles.includes("platform_admin")
    ? institutionRows
    : institutionRows?.filter((institution) => assignedIds.has(institution.id));
  const countMap = new Map((counts ?? []).map((item) => [item.university_id, Number(item.member_count)]));
  return (
    <main className="page-shell py-12 sm:py-16">
      <p className="eyebrow text-coral-600">Operations</p>
      <h1 className="mt-4 text-4xl font-bold text-indigo-950 sm:text-5xl">Institutions</h1>
      <p className="mt-4 max-w-2xl leading-7 text-ink-500">Manage signup domains and institution availability within your assigned scope.</p>
      <div className="mt-9 grid gap-5 md:grid-cols-2">
        {institutions?.map((institution) => (
          <Link className="rounded-2xl border border-cream-200 bg-white p-6 shadow-card hover:border-coral-300" href={`/admin/institutions/${institution.id}`} key={institution.id}>
            <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold text-indigo-950">{institution.name}</h2><span className={`rounded-full px-3 py-1 text-xs font-bold ${institution.active ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>{institution.active ? "Active" : "Inactive"}</span></div>
            <p className="mt-3 text-sm text-ink-500">{countMap.get(institution.id) ?? 0} verified members</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
