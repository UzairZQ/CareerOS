import { NextResponse, type NextRequest } from "next/server";
import type { AiProvider } from "@/lib/ai-providers";
import {
  aiSettingsDeleteSchema,
  aiSettingsSchema,
  formatValidationError,
} from "@/lib/dashboard-validation";
import { encryptSecret, maskSecret } from "@/lib/server/secret-crypto";
import { createClient } from "@/lib/supabase/server";

type AiProviderSetting = {
  provider: AiProvider;
  key_hint: string | null;
  enabled: boolean;
  updated_at: string;
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("ai_provider_settings")
    .select("provider, key_hint, enabled, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .returns<AiProviderSetting[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ settings: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid JSON body." }, { status: 400 });
  }

  const parsedSettings = aiSettingsSchema.safeParse(body);

  if (!parsedSettings.success) {
    return NextResponse.json(
      { error: formatValidationError(parsedSettings.error) },
      { status: 400 },
    );
  }

  const { apiKey, provider } = parsedSettings.data;
  const { error } = await supabase.from("ai_provider_settings").upsert(
    {
      user_id: user.id,
      provider,
      encrypted_api_key: encryptSecret(apiKey),
      key_hint: maskSecret(apiKey),
      enabled: true,
    },
    { onConflict: "user_id,provider" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    setting: {
      provider,
      key_hint: maskSecret(apiKey),
      enabled: true,
    },
  });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const provider = request.nextUrl.searchParams.get("provider") ?? "";
  const parsedDelete = aiSettingsDeleteSchema.safeParse({ provider });

  if (!parsedDelete.success) {
    return NextResponse.json(
      { error: formatValidationError(parsedDelete.error) },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("ai_provider_settings")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", parsedDelete.data.provider);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
