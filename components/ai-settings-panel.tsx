"use client";

import { KeyRound, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import type { AiProvider } from "@/lib/ai-providers";
import type { AiProviderSettingSummary } from "@/components/ai-insight-button";
import { aiSettingsSchema, formatValidationError } from "@/lib/dashboard-validation";

const providers: Array<{ label: string; value: AiProvider }> = [
  { label: "Gemini", value: "gemini" },
  { label: "Groq", value: "groq" },
  { label: "OpenRouter", value: "openrouter" },
];

export function AiSettingsPanel({
  initialSettings,
  tableReady = true,
}: {
  initialSettings: AiProviderSettingSummary[];
  tableReady?: boolean;
}) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [provider, setProvider] = useState<AiProvider>("gemini");
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error" | "saved">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function saveKey(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage(null);
    const parsedSettings = aiSettingsSchema.safeParse({ apiKey, provider });

    if (!parsedSettings.success) {
      setStatus("error");
      setMessage(formatValidationError(parsedSettings.error));
      return;
    }

    try {
      const response = await fetch("/api/ai-settings", {
        body: JSON.stringify(parsedSettings.data),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(data.error ?? "Could not save provider key.");
        return;
      }

      setSettings((current) => [
        ...current.filter((setting) => setting.provider !== data.setting.provider),
        data.setting,
      ]);
      setApiKey("");
      setStatus("saved");
      setMessage("Key saved encrypted. It will only be used from server routes.");
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("The settings route could not be reached. Try again.");
    }
  }

  async function removeKey(providerToRemove: AiProvider) {
    setStatus("saving");
    setMessage(null);
    try {
      const response = await fetch(`/api/ai-settings?provider=${providerToRemove}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(data.error ?? "Could not remove provider key.");
        return;
      }

      setSettings((current) => current.filter((setting) => setting.provider !== providerToRemove));
      setStatus("saved");
      setMessage("Provider key removed.");
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("The settings route could not be reached. Try again.");
    }
  }

  return (
    <section className="mt-5 rounded-[22px] border border-white/10 bg-[#252B36] p-4 shadow-dashboard-card md:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 flex items-center gap-2 text-sm font-medium uppercase tracking-[0.14em] text-[#AEB6C2]">
            <KeyRound size={17} strokeWidth={1.8} />
            AI Insights
          </p>
          <h2 className="font-serif text-[clamp(1.75rem,3vw,2.55rem)] font-normal leading-none tracking-[-0.01em]">
            Bring your own key
          </h2>
        </div>
        <span className="stamp rounded-full px-3 py-2 text-[0.67rem] font-semibold uppercase text-[#FFD8B0]">
          Optional
        </span>
      </div>

      {!tableReady && (
        <div className="mb-4 rounded-[18px] border border-[#C77D2E]/40 bg-[#C77D2E]/12 px-4 py-3 text-sm leading-6 text-[#FFD8B0]">
          AI settings are waiting for the latest Supabase schema. Run the updated{" "}
          <code className="rounded bg-black/20 px-1.5 py-1">supabase/schema.sql</code>.
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
        <form className="rounded-[20px] border border-white/10 bg-[#171A1F]/54 p-4" onSubmit={saveKey}>
          <p className="mb-3 text-sm leading-6 text-white/72">
            CareerOS works without AI. Add a key only when you want optional model insight on already-extracted JD/CV/evidence data.
          </p>
          <label className="mb-3 block">
            <span className="mb-2 block text-sm font-medium text-white/74">Provider</span>
            <select
              className="dashboard-input w-full"
              disabled={!tableReady}
              onChange={(event) => setProvider(event.target.value as AiProvider)}
              value={provider}
            >
              {providers.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="mb-4 block">
            <span className="mb-2 block text-sm font-medium text-white/74">API key</span>
            <input
              className="dashboard-input w-full"
              disabled={!tableReady}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="Paste your own provider key"
              type="password"
              value={apiKey}
            />
          </label>
          <button
            className="min-h-11 rounded-xl bg-[#2C7BE5] px-5 text-sm font-semibold text-white transition hover:bg-[#3B88F1] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!tableReady || status === "saving"}
            type="submit"
          >
            {status === "saving" ? "Saving..." : "Save encrypted key"}
          </button>
          {message && (
            <p
              className={`mt-3 rounded-[14px] border px-3 py-2 text-sm leading-6 ${
                status === "error"
                  ? "border-[#C77D2E]/45 bg-[#C77D2E]/12 text-[#FFD8B0]"
                  : "border-[#5C7A5C]/40 bg-[#5C7A5C]/12 text-[#DDF0DD]"
              }`}
            >
              {message}
            </p>
          )}
        </form>

        <div className="rounded-[20px] border border-white/10 bg-[#171A1F]/54 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.13em] text-[#AEB6C2]">
            Connected providers
          </p>
          {settings.length > 0 ? (
            <div className="space-y-3">
              {settings.map((setting) => (
                <div
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-white/10 bg-[#303849]/70 px-4 py-3"
                  key={setting.provider}
                >
                  <div>
                    <p className="font-semibold capitalize text-white">{setting.provider}</p>
                    <p className="text-sm text-[#AEB6C2]">{setting.key_hint ?? "Encrypted key saved"}</p>
                  </div>
                  <button
                    aria-label={`Remove ${setting.provider} key`}
                    className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-white/72 transition hover:bg-white/[0.06] hover:text-white"
                    onClick={() => removeKey(setting.provider)}
                    type="button"
                  >
                    <Trash2 size={16} strokeWidth={1.9} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-6 text-[#AEB6C2]">
              No provider key is connected. AI buttons stay disabled gracefully.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
