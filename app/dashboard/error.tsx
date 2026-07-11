"use client";

import { RefreshCcw, ShieldAlert } from "lucide-react";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("CareerOS dashboard failed to render", error);
  }, [error]);

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-[#171A1F] px-5 py-8 text-[#F7F8F6]">
      <section className="w-full max-w-xl rounded-[24px] border border-[#C77D2E]/35 bg-[#252B36] p-6 text-center shadow-dashboard-card sm:p-8">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full border border-[#C77D2E]/45 bg-[#C77D2E]/12 text-[#FFD8B0]">
          <ShieldAlert size={25} strokeWidth={1.8} />
        </div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#FFD8B0]">
          Dashboard recovery
        </p>
        <h1 className="font-serif text-3xl font-normal leading-tight sm:text-4xl">
          The workspace could not be loaded.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#AEB6C2]">
          Your saved data is still protected. Try rendering the dashboard again, and check the Supabase connection if the problem continues.
        </p>
        <button
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/14 bg-white/[0.06] px-5 text-sm font-semibold text-white/84 transition hover:border-white/24 hover:bg-white/[0.1]"
          onClick={() => reset()}
          type="button"
        >
          <RefreshCcw size={16} strokeWidth={1.9} />
          Try again
        </button>
      </section>
    </main>
  );
}
