"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import type { AiInsightKind, AiProvider } from "@/lib/ai-providers";

export type AiProviderSettingSummary = {
  provider: AiProvider;
  key_hint: string | null;
  enabled: boolean;
};

export function AiInsightButton({
  input,
  kind,
  settings,
}: {
  input: unknown;
  kind: AiInsightKind;
  settings: AiProviderSettingSummary[];
}) {
  const enabledSettings = settings.filter((setting) => setting.enabled);
  const [provider, setProvider] = useState<AiProvider>(enabledSettings[0]?.provider ?? "gemini");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function requestInsight() {
    setStatus("loading");
    setMessage(null);

    try {
      const response = await fetch("/api/ai-insight", {
        body: JSON.stringify({ input, kind, provider }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(data.error ?? "AI insight failed.");
        return;
      }

      setStatus("done");
      setMessage(data.insight ?? "No insight returned.");
    } catch {
      setStatus("error");
      setMessage("The AI provider could not be reached. Check the key and try again.");
    }
  }

  if (enabledSettings.length === 0) {
    return (
      <div className="rounded-[16px] border border-white/10 bg-[#171A1F]/48 px-4 py-3 text-sm leading-6 text-[#AEB6C2]">
        AI insight is off. Add your own API key in AI Settings to enable this bonus layer.
      </div>
    );
  }

  return (
    <div className="rounded-[18px] border border-white/10 bg-[#171A1F]/54 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="dashboard-input min-h-0 flex-1 py-2 text-sm"
          onChange={(event) => setProvider(event.target.value as AiProvider)}
          value={provider}
        >
          {enabledSettings.map((setting) => (
            <option key={setting.provider} value={setting.provider}>
              {setting.provider} {setting.key_hint ? `(${setting.key_hint})` : ""}
            </option>
          ))}
        </select>
        <button
          className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] px-4 text-sm font-semibold text-white/82 transition hover:border-white/24 hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={status === "loading"}
          onClick={requestInsight}
          type="button"
        >
          <Sparkles size={16} strokeWidth={1.9} />
          {status === "loading" ? "Thinking..." : "Get AI insight"}
        </button>
      </div>
      {message && (
        <div
          className={`mt-3 rounded-[14px] border px-3 py-2 text-sm leading-6 ${
            status === "error"
              ? "border-[#C77D2E]/45 bg-[#C77D2E]/12 text-[#FFD8B0]"
              : "border-[#5C7A5C]/40 bg-[#5C7A5C]/12 text-[#DDF0DD]"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
