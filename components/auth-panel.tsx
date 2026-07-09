"use client";

import { ArrowRight, BriefcaseBusiness, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/browser";
import { formatAuthError } from "@/lib/auth-errors";

type AuthMode = "login" | "signup";

const emptySubscribe = () => () => {};
const getClientHydration = () => true;
const getServerHydration = () => false;

export function AuthPanel({ initialError = null }: { initialError?: string | null }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(initialError);
  const router = useRouter();
  const isLogin = mode === "login";
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    getClientHydration,
    getServerHydration,
  );

  useEffect(() => {
    try {
      const savedEmail = window.localStorage.getItem("careeros.remembered_email");
      if (savedEmail) {
        // Browser storage is an external source; sync it into the controlled form once.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEmail(savedEmail);
        setRememberEmail(true);
      }
    } catch {
      // Private browsing modes may deny local storage; auth still works normally.
    }
  }, []);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
    setMessage(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError(null);
    setMessage(null);

    const supabase = createClient();

    if (isLogin) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(formatAuthError(signInError.message));
        setStatus("idle");
        return;
      }

      try {
        if (rememberEmail) {
          window.localStorage.setItem("careeros.remembered_email", email);
        } else {
          window.localStorage.removeItem("careeros.remembered_email");
        }
      } catch {
        // Remembering the email is optional and must never block sign-in.
      }

      router.replace("/dashboard");
      router.refresh();
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
          target_role: targetRole,
        },
      },
    });

    if (signUpError) {
      setError(formatAuthError(signUpError.message));
      setStatus("idle");
      return;
    }

    if (data.session) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    setMessage("Check your email to confirm your account, then log in.");
    setStatus("idle");
  }

  async function handlePasswordReset() {
    setError(null);
    setMessage(null);

    if (!email) {
      setError("Enter your email first, then request a reset link.");
      return;
    }

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
    });

    if (resetError) {
      setError(formatAuthError(resetError.message));
      return;
    }

    setMessage("Password reset email sent.");
  }

  async function handleGoogleAuth() {
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (googleError) {
      setError(formatAuthError(googleError.message));
    }
  }

  return (
    <section className="auth-card-flow flex w-full max-w-[430px] flex-col rounded-[32px] border border-white/10 bg-[#170B22]/72 p-5 text-[#F7F8F6] shadow-[0_30px_90px_rgba(0,0,0,0.38)] backdrop-blur-md sm:p-6 lg:h-[min(720px,calc(100dvh-40px))]">
      <div className="relative z-10 text-center">
        <div className="auth-mode-content" key={`heading-${mode}`}>
          <h2 className="text-3xl font-bold tracking-[-0.02em] text-white">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="mt-3 text-base font-medium text-white/58">
            {isLogin ? "Sign in to continue to CareerOS" : "Start your CareerOS workspace"}
          </p>
        </div>
      </div>

      <form className="relative z-10 mt-5 flex min-h-0 flex-1 flex-col sm:mt-6" onSubmit={handleSubmit}>
        <div className="auth-mode-content space-y-3" key={`fields-${mode}`}>
          {!isLogin && (
            <AuthInput
              icon={<User size={22} strokeWidth={1.9} />}
              onChange={setFullName}
              placeholder="Full name"
              required
              value={fullName}
            />
          )}

          <AuthInput
            icon={<Mail size={22} strokeWidth={1.9} />}
            onChange={setEmail}
            placeholder="Email address"
            required
            type="email"
            value={email}
          />

          <label className="relative block">
            <Lock
              className="absolute left-5 top-1/2 z-10 -translate-y-1/2 text-white/46"
              size={22}
              strokeWidth={1.9}
            />
            <input
              className="auth-reference-input pr-14"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              required
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-5 top-1/2 z-10 -translate-y-1/2 text-white/48 transition hover:text-white"
              onClick={() => setShowPassword((current) => !current)}
              type="button"
            >
              {showPassword ? (
                <EyeOff size={20} strokeWidth={1.9} />
              ) : (
                <Eye size={20} strokeWidth={1.9} />
              )}
            </button>
          </label>

          {!isLogin && (
            <AuthInput
              icon={<BriefcaseBusiness size={22} strokeWidth={1.9} />}
              onChange={setTargetRole}
              placeholder="Target role"
              value={targetRole}
            />
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-4 text-sm font-medium text-white/70 sm:mt-4">
          {isLogin ? (
            <label className="flex items-center gap-3">
              <input
                checked={rememberEmail}
                className="h-5 w-5 appearance-none rounded-md border border-white/22 bg-white/6 checked:border-white checked:bg-white"
                onChange={() => setRememberEmail((current) => !current)}
                type="checkbox"
              />
              Remember email
            </label>
          ) : (
            <span className="text-white/52">You&apos;ll confirm your email after signup.</span>
          )}
          {isLogin && (
            <button
              className="text-white/72 transition hover:text-white"
              onClick={handlePasswordReset}
              type="button"
            >
              Forgot password?
            </button>
          )}
        </div>

        {(error || message) && (
          <div
            className={`mt-4 rounded-[18px] border px-4 py-2 text-sm leading-5 ${
              error
                ? "border-[#C77D2E]/50 bg-[#C77D2E]/12 text-[#FFD8B0]"
                : "border-[#5C7A5C]/50 bg-[#5C7A5C]/16 text-[#DDF0DD]"
            }`}
          >
            {error ?? message}
          </div>
        )}

        <button
          className="auth-reference-primary mt-5 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-[16px] bg-white px-6 text-base font-semibold text-black transition hover:-translate-y-0.5 hover:bg-white/92 disabled:cursor-not-allowed disabled:opacity-70 sm:mt-6 sm:min-h-[52px] sm:text-lg"
          disabled={!isHydrated || status === "loading"}
          type="submit"
        >
          {status === "loading" ? "Working..." : isLogin ? "Sign In" : "Create Account"}
          <ArrowRight size={20} strokeWidth={2} />
        </button>

        <div className="my-3 flex items-center gap-5 sm:my-4">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-sm font-semibold text-white/42">or</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <button
          className="auth-google-button flex min-h-[46px] shrink-0 items-center justify-center gap-3 rounded-[16px] border border-white/16 bg-white/5 px-4 text-base font-semibold text-white/78 transition hover:border-white/28 hover:bg-white/8 hover:text-white sm:min-h-[48px]"
          onClick={handleGoogleAuth}
          type="button"
        >
          <span className="text-xl font-bold">G</span>
          {isLogin ? "Sign in with Google" : "Sign up with Google"}
        </button>

        <p className="mt-4 shrink-0 text-center text-sm font-medium text-white/58 sm:mt-5">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            className="font-bold text-white transition hover:text-white/76"
            onClick={() => switchMode(isLogin ? "signup" : "login")}
            type="button"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </form>
    </section>
  );
}

function AuthInput({
  icon,
  onChange,
  placeholder,
  required = false,
  type = "text",
  value,
}: {
  icon: React.ReactNode;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="relative block">
      <span className="absolute left-5 top-1/2 z-10 -translate-y-1/2 text-white/46">
        {icon}
      </span>
      <input
        className="auth-reference-input"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
    </label>
  );
}
