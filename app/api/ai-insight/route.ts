import { NextResponse, type NextRequest } from "next/server";
import {
  requestAiInsight,
  type AiInsightKind,
  type AiProvider,
} from "@/lib/ai-providers";
import { aiInsightRequestSchema, formatValidationError } from "@/lib/dashboard-validation";
import { decryptSecret } from "@/lib/server/secret-crypto";
import { createClient } from "@/lib/supabase/server";

type StoredAiProviderSetting = {
  provider: AiProvider;
  encrypted_api_key: string;
  enabled: boolean;
};

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

  const parsedBody = aiInsightRequestSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: formatValidationError(parsedBody.error) },
      { status: 400 },
    );
  }

  const { input, kind, provider } = parsedBody.data;
  const serializedInput = JSON.stringify(input);
  if (serializedInput.length > 30_000) {
    return NextResponse.json(
      { error: "The insight input is too large. Use the extracted summary instead." },
      { status: 413 },
    );
  }

  const { data: setting, error } = await supabase
    .from("ai_provider_settings")
    .select("provider, encrypted_api_key, enabled")
    .eq("user_id", user.id)
    .eq("provider", provider)
    .eq("enabled", true)
    .maybeSingle<StoredAiProviderSetting>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!setting) {
    return NextResponse.json(
      { error: "Add your own API key in AI Settings before requesting an insight." },
      { status: 400 },
    );
  }

  try {
    const insight = await requestAiInsight({
      apiKey: decryptSecret(setting.encrypted_api_key),
      input,
      kind: kind as AiInsightKind,
      provider,
    });

    return NextResponse.json({ insight });
  } catch (insightError) {
    return NextResponse.json(
      {
        error:
          insightError instanceof Error
            ? insightError.message
            : "AI provider request failed.",
      },
      { status: 502 },
    );
  }
}
