"use server";

import { revalidatePath } from "next/cache";
import { actionError } from "@/lib/action-errors";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { domainSchema, type ActionState } from "@/lib/validation";

export async function addInstitutionDomainAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = domainSchema.safeParse({
    universityId: formData.get("universityId"),
    domain: formData.get("domain"),
    development: formData.get("development") === "on",
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: "Spark is not connected to Supabase." };
  const { error } = await supabase.rpc("admin_add_domain", {
    target_university_id: parsed.data.universityId,
    new_domain: parsed.data.domain,
    development_domain: parsed.data.development,
  });
  if (error) return { error: actionError(error, "The domain could not be added.", { "23505": "That domain already exists." }) };
  revalidatePath(`/admin/institutions/${parsed.data.universityId}`);
  return { success: "Domain added." };
}

export async function setInstitutionDomainActiveAction(domainId: string, active: boolean) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return;
  await supabase.rpc("admin_set_domain_active", { target_domain_id: domainId, domain_active: active });
  revalidatePath("/admin/institutions");
}

export async function setInstitutionActiveAction(universityId: string, active: boolean) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return;
  await supabase.rpc("admin_set_university_active", { target_university_id: universityId, university_active: active });
  revalidatePath("/admin/institutions");
}
