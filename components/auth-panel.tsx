"use client";

import { Eye, EyeOff, Lock, Mail, User, BriefcaseBusiness } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type AuthMode = "login" | "signup";

export function AuthPanel() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const isLogin = mode === "login";

  return (
    <section className="flex min-h-[720px] w-full max-w-[470px] flex-col rounded-[38px] border border-[#F7F8F6]/20 bg-[#1C1E1B]/22 p-8 text-[#F7F8F6] backdrop-blur-sm md:p-10">
      <div className="mb-9">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.14em] text-[#F7F8F6]/70">
          CareerOS Germany
        </p>
        <h2 className="font-serif text-[2.37rem] font-normal leading-[1.08] tracking-[-0.01em]">
          {isLogin ? "Welcome back." : "Create your account."}
        </h2>
        <p className="mt-4 max-w-[38ch] text-base leading-7 text-[#F7F8F6]/72">
          {isLogin
            ? "Continue tracking applications, work limits, and proof for your next role."
            : "Start with a clean dashboard for applications, hours, CV checks, and skill evidence."}
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 rounded-[24px] border border-[#F7F8F6]/16 bg-[#F7F8F6]/8 p-1">
        <button
          className={`min-h-12 rounded-[24px] text-sm font-medium transition ${
            isLogin
              ? "bg-[#F7F8F6] text-[#1C1E1B]"
              : "text-[#F7F8F6]/70 hover:text-[#F7F8F6]"
          }`}
          onClick={() => setMode("login")}
          type="button"
        >
          Log in
        </button>
        <button
          className={`min-h-12 rounded-[24px] text-sm font-medium transition ${
            !isLogin
              ? "bg-[#F7F8F6] text-[#1C1E1B]"
              : "text-[#F7F8F6]/70 hover:text-[#F7F8F6]"
          }`}
          onClick={() => setMode("signup")}
          type="button"
        >
          Sign up
        </button>
      </div>

      <form className="flex-1 space-y-5">
        {!isLogin && (
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#F7F8F6]/86">
              Full name
            </span>
            <div className="relative">
              <User
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#F7F8F6]/54"
                size={18}
                strokeWidth={1.8}
              />
              <input
                className="auth-input w-full px-5 pl-12"
                placeholder="Uzair Qureshi"
                type="text"
              />
            </div>
          </label>
        )}

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#F7F8F6]/86">
            Email
          </span>
          <div className="relative">
            <Mail
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#F7F8F6]/54"
              size={18}
              strokeWidth={1.8}
            />
            <input
              className="auth-input w-full px-5 pl-12"
              placeholder="you@example.com"
              type="email"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#F7F8F6]/86">
            Password
          </span>
          <div className="relative">
            <Lock
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#F7F8F6]/54"
              size={18}
              strokeWidth={1.8}
            />
            <input
              className="auth-input w-full px-12"
              placeholder="Minimum 8 characters"
              type={showPassword ? "text" : "password"}
            />
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F7F8F6]/58 transition hover:text-[#F7F8F6]"
              onClick={() => setShowPassword((current) => !current)}
              type="button"
            >
              {showPassword ? (
                <EyeOff size={18} strokeWidth={1.8} />
              ) : (
                <Eye size={18} strokeWidth={1.8} />
              )}
            </button>
          </div>
        </label>

        {!isLogin && (
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#F7F8F6]/86">
              Target role
            </span>
            <div className="relative">
              <BriefcaseBusiness
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#F7F8F6]/54"
                size={18}
                strokeWidth={1.8}
              />
              <input
                className="auth-input w-full px-5 pl-12"
                placeholder="Working Student Frontend Developer"
                type="text"
              />
            </div>
          </label>
        )}

        <div className="flex items-center justify-between gap-4 text-sm text-[#F7F8F6]/68">
          <label className="flex items-center gap-3">
            <input
              className="h-4 w-4 accent-[#F7F8F6]"
              type="checkbox"
            />
            Remember me
          </label>
          {isLogin && (
            <a className="font-medium text-[#F7F8F6]" href="#reset">
              Forgot password?
            </a>
          )}
        </div>

        <Link
          className="block min-h-[52px] rounded-[24px] bg-[#F7F8F6] px-6 py-4 text-center text-base font-medium text-[#1C1E1B] transition hover:-translate-y-0.5 hover:bg-[#E9ECE6]"
          href="/dashboard"
        >
          {isLogin ? "Log in to dashboard" : "Create account"}
        </Link>
      </form>

      <div className="mt-8 border-t border-[#F7F8F6]/14 pt-6">
        <p className="text-sm leading-6 text-[#F7F8F6]/62">
          Supabase Auth will connect here in milestone one. For now this is the
          production login layout prototype.
        </p>
      </div>
    </section>
  );
}
