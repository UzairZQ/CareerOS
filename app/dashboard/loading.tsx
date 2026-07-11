export default function DashboardLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading CareerOS dashboard"
      className="min-h-[100dvh] bg-[#171A1F] px-4 py-5 text-[#F7F8F6] sm:px-6 lg:px-8"
      role="status"
    >
      <div className="mx-auto grid min-h-[calc(100dvh-40px)] max-w-[1440px] gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden rounded-[22px] bg-[#262B34] p-6 lg:block">
          <div className="mb-8 h-7 w-20 animate-pulse rounded-lg bg-white/10" />
          <div className="mb-8 h-28 animate-pulse rounded-[20px] bg-white/[0.06]" />
          <div className="space-y-3">
            {Array.from({ length: 7 }).map((_, index) => (
              <div className="h-12 animate-pulse rounded-2xl bg-white/[0.06]" key={index} />
            ))}
          </div>
        </aside>

        <section className="min-w-0 space-y-5">
          <div className="h-12 w-full max-w-[430px] animate-pulse rounded-xl bg-[#222833]" />
          <div className="rounded-[20px] bg-[#252B36] p-5">
            <div className="mb-5 h-10 w-64 animate-pulse rounded-lg bg-white/10" />
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_0.56fr_0.56fr]">
              <div className="h-64 animate-pulse rounded-[22px] bg-[#2C7BE5]/45" />
              <div className="h-64 animate-pulse rounded-[22px] bg-[#303849]" />
              <div className="h-64 animate-pulse rounded-[22px] bg-[#303849]" />
            </div>
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            <div className="h-80 animate-pulse rounded-[22px] bg-[#252B36]" />
            <div className="h-80 animate-pulse rounded-[22px] bg-[#252B36]" />
          </div>
        </section>
      </div>
    </main>
  );
}
