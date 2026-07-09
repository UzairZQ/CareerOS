"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export function SignOutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <button
      aria-label="Logout"
      className="flex h-12 items-center gap-3 rounded-2xl px-3 text-sm font-medium text-white/64 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      disabled={isSigningOut}
      onClick={handleSignOut}
      type="button"
    >
      <LogOut size={22} strokeWidth={1.8} />
      <span>{isSigningOut ? "Signing out..." : "Logout"}</span>
    </button>
  );
}
