import { createClient } from "@/lib/supabase/server";
import { getSafeNext } from "@/lib/auth-navigation";
import { formatAuthCallbackError } from "@/lib/auth-errors";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeNext(requestUrl.searchParams.get("next"));

  const providerError = requestUrl.searchParams.get("error");
  if (providerError) {
    return redirectToLogin(requestUrl.origin, formatAuthCallbackError(providerError));
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return redirectToLogin(requestUrl.origin, "Your sign-in link could not be verified. Try again.");
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

function redirectToLogin(origin: string, message = "Authentication failed. Try again.") {
  const url = new URL("/", origin);
  url.searchParams.set("auth_error", message);
  return NextResponse.redirect(url);
}
