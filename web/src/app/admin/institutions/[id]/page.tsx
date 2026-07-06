import { notFound } from "next/navigation";
import { setInstitutionActiveAction, setInstitutionDomainActiveAction } from "@/actions/institutions";
import { DomainForm } from "@/components/admin/DomainForm";
import { SetupState } from "@/components/SetupState";
import { Button } from "@/components/ui/Button";
import { requireOperationalRole } from "@/lib/auth/viewer";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function InstitutionPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireOperationalRole(["institution_admin", "platform_admin"], "/admin/institutions");
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return <SetupState />;
  const [{ data: institution }, { data: domains }] = await Promise.all([
    supabase.from("universities").select("id, name, active").eq("id", id).maybeSingle(),
    supabase.from("university_domains").select("id, domain, active, is_development, created_at").eq("university_id", id).order("domain"),
  ]);
  if (!institution) notFound();
  const platformAdmin = viewer.roles.includes("platform_admin");
  return (
    <main className="page-shell py-12 sm:py-16">
      <p className="eyebrow text-coral-600">Institution</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-bold text-indigo-950 sm:text-5xl">{institution.name}</h1>
        <form action={setInstitutionActiveAction.bind(null, institution.id, !institution.active)}>
          <Button type="submit" variant={institution.active ? "danger" : "secondary"}>{institution.active ? "Pause new signups" : "Reactivate institution"}</Button>
        </form>
      </div>
      <section className="mt-9 rounded-2xl border border-cream-200 bg-white p-6 shadow-card">
        <h2 className="text-2xl font-bold text-indigo-950">Signup domains</h2>
        <ul className="mt-5 divide-y divide-cream-200">
          {domains?.map((domain) => (
            <li className="flex flex-wrap items-center justify-between gap-4 py-4" key={domain.id}>
              <div><p className="font-semibold text-indigo-950">{domain.domain}</p><p className="mt-1 text-xs text-ink-500">{domain.is_development ? "Development" : "Academic"} · {domain.active ? "Active" : "Inactive"}</p></div>
              {(!domain.is_development || platformAdmin) && <form action={setInstitutionDomainActiveAction.bind(null, domain.id, !domain.active)}><Button type="submit" variant="secondary">{domain.active ? "Disable" : "Enable"}</Button></form>}
            </li>
          ))}
        </ul>
      </section>
      <DomainForm canAddDevelopment={platformAdmin} universityId={institution.id} />
    </main>
  );
}
