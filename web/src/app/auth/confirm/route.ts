import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const next = safeRedirectPath(request.nextUrl.searchParams.get("next"), "/onboarding");
  if (!supabase) return NextResponse.redirect(new URL("/auth/sign-in?error=configuration", request.url));

  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;

  const result = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("Missing confirmation token.") };

  if (result.error) {
    return NextResponse.redirect(new URL("/auth/sign-in?error=expired-link", request.url));
  }
  return NextResponse.redirect(new URL(next, request.url));
}
