"use client";

import { ArrowRight, CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { formatAuthError } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/browser";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Your new password must be at least 8 characters.");
      return;
    }

    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    setStatus("saving");
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setStatus("idle");
      setError(formatAuthError(updateError.message));
      return;
    }

    setPassword("");
    setConfirmation("");
    setStatus("saved");
  }

  if (status === "saved") {
    return (
      <section className="auth-card-flow flex min-h-[420px] w-full max-w-[430px] flex-col justify-center rounded-[32px] border border-white/10 bg-[#170B22]/72 p-5 text-[#F7F8F6] shadow-[0_30px_90px_rgba(0,0,0,0.38)] backdrop-blur-md sm:p-6">
        <div className="relative z-10 text-center">
          <CheckCircle2 className="mx-auto mb-5 text-[#BBD8BB]" size={42} strokeWidth={1.5} />
          <h1 className="font-display text-4xl text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
            Password updated
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/66">
            Your CareerOS password has been changed successfully.
          </p>
          <button
            className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-[16px] border border-white/18 bg-white/[0.08] px-6 text-sm font-semibold text-white transition hover:bg-white/[0.14]"
            onClick={() => router.replace("/dashboard")}
            type="button"
          >
            Continue to dashboard <ArrowRight size={18} strokeWidth={1.9} />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-card-flow flex min-h-[470px] w-full max-w-[430px] flex-col justify-center rounded-[32px] border border-white/10 bg-[#170B22]/72 p-4 text-[#F7F8F6] shadow-[0_30px_90px_rgba(0,0,0,0.38)] backdrop-blur-md sm:p-6">
      <div className="relative z-10">
        <div className="text-center">
          <h1 className="font-display text-4xl text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
            Set a new password
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/66">
            Choose a new password for your CareerOS account.
          </p>
        </div>

        <form className="mt-7 space-y-3" onSubmit={handleSubmit}>
          <PasswordField
            label="New password"
            onChange={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            value={password}
          />
          <PasswordField
            label="Confirm new password"
            onChange={setConfirmation}
            showPassword={showConfirmation}
            setShowPassword={setShowConfirmation}
            value={confirmation}
          />

          {error && (
            <p className="rounded-[16px] border border-[#C77D2E]/50 bg-[#C77D2E]/12 px-4 py-3 text-sm leading-5 text-[#FFD8B0]">
              {error}
            </p>
          )}

          <button
            className="auth-reference-primary mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-[16px] bg-white px-6 text-base font-semibold text-black transition hover:-translate-y-0.5 hover:bg-white/92 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={status === "saving"}
            type="submit"
          >
            {status === "saving" ? "Updating..." : "Update password"}
            <ArrowRight size={20} strokeWidth={2} />
          </button>
        </form>
      </div>
    </section>
  );
}

function PasswordField({
  label,
  onChange,
  setShowPassword,
  showPassword,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  setShowPassword: (value: boolean) => void;
  showPassword: boolean;
  value: string;
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <Lock className="absolute left-5 top-1/2 z-10 -translate-y-1/2 text-white/46" size={22} strokeWidth={1.9} />
      <input
        aria-label={label}
        className="auth-reference-input pr-14"
        minLength={8}
        onChange={(event) => onChange(event.target.value)}
        placeholder={label}
        required
        type={showPassword ? "text" : "password"}
        value={value}
      />
      <button
        aria-label={showPassword ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        className="absolute right-5 top-1/2 z-10 -translate-y-1/2 text-white/48 transition hover:text-white"
        onClick={() => setShowPassword(!showPassword)}
        type="button"
      >
        {showPassword ? <EyeOff size={20} strokeWidth={1.9} /> : <Eye size={20} strokeWidth={1.9} />}
      </button>
    </label>
  );
}
