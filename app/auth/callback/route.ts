import { createClient } from "@/lib/supabase/server";
import { getSafeNext } from "@/lib/auth-navigation";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeNext(requestUrl.searchParams.get("next"));

  if (requestUrl.searchParams.get("error")) {
    return redirectToLogin(requestUrl.origin);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return redirectToLogin(requestUrl.origin);
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

function redirectToLogin(origin: string) {
  const url = new URL("/", origin);
  url.searchParams.set("auth_error", "Authentication failed. Try again.");
  return NextResponse.redirect(url);
}
