import {
  Bell,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  FileCheck2,
  HelpCircle,
  LogOut,
  KeyRound,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Timer,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: SlidersHorizontal, active: true },
  { label: "Applications", icon: BriefcaseBusiness },
  { label: "Work Hours", icon: Timer },
  { label: "CV Check", icon: FileCheck2 },
  { label: "Skill Gap", icon: ChartNoAxesCombined },
  { label: "AI Insights", icon: KeyRound },
];

const applications = [
  {
    company: "Zalando SE",
    role: "Frontend Working Student",
    location: "Berlin · Hybrid",
    meta: "Applied 2d ago",
    status: "In review",
    dot: "bg-[#C77D2E]",
    image:
      "linear-gradient(135deg, rgba(44,123,229,0.22), rgba(18,23,32,0.95)), radial-gradient(circle at 22% 30%, rgba(255,255,255,0.18), transparent 22%), linear-gradient(45deg, #1d2531 0 25%, #273244 25% 50%, #1d2531 50% 75%, #273244 75%)",
  },
  {
    company: "N26",
    role: "Junior Web Developer",
    location: "Berlin · Remote",
    meta: "Interview 5d",
    status: "Invited",
    dot: "bg-[#9bb99b]",
    image:
      "linear-gradient(135deg, rgba(91,69,255,0.25), rgba(18,23,32,0.95)), radial-gradient(circle at 60% 45%, rgba(44,123,229,0.42), transparent 20%), linear-gradient(135deg, #202735, #303849)",
  },
  {
    company: "SAP",
    role: "UI/UX Working Student",
    location: "Walldorf · On-site",
    meta: "Draft",
    status: "Saved",
    dot: "bg-white/20",
    image:
      "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(18,23,32,0.95)), radial-gradient(circle at 70% 30%, rgba(255,255,255,0.16), transparent 24%), linear-gradient(155deg, #222a36, #11161f)",
  },
];

const proofCards = [
  { mark: "B2", title: "German B2", issuer: "Goethe-Institut" },
  { mark: "R", title: "React Project", issuer: "GitHub proof" },
];

export default function DashboardPage() {
  return (
    <main className="h-[100dvh] overflow-hidden bg-[#171A1F] text-[#F7F8F6]">
      <section className="dashboard-frame grid h-full overflow-hidden lg:grid-cols-[236px_minmax(0,1fr)_392px]">
        <aside className="hidden min-h-0 flex-col bg-[#262B34] px-5 py-8 lg:flex">
          <div className="mb-12 px-3 font-serif text-xl font-medium tracking-[-0.01em]">
            <span className="text-[#2C7BE5]">C</span>
            <span className="text-white">.os</span>
          </div>

          <nav className="flex flex-1 flex-col gap-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  aria-label={item.label}
                  className={`flex h-12 items-center gap-3 rounded-2xl px-3 text-sm font-medium transition ${
                    item.active
                      ? "bg-white/10 text-white shadow-inner"
                      : "text-white/64 hover:bg-white/5 hover:text-white"
                  }`}
                  key={item.label}
                  type="button"
                >
                  <Icon size={22} strokeWidth={1.8} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <button
            aria-label="Logout"
            className="flex h-12 items-center gap-3 rounded-2xl px-3 text-sm font-medium text-white/64 transition hover:bg-white/5 hover:text-white"
            type="button"
          >
            <LogOut size={22} strokeWidth={1.8} />
            <span>Logout</span>
          </button>
        </aside>

        <section className="min-h-0 min-w-0 overflow-hidden bg-[#171A1F] px-6 py-5 md:px-9 lg:px-10 lg:py-6">
          <header className="mb-5 flex items-center justify-between gap-6">
            <label className="flex h-12 w-full max-w-[430px] items-center gap-3 rounded-xl border border-white/10 bg-[#222833] px-5 text-[#AEB6C2]">
              <Search size={21} strokeWidth={1.7} />
              <input
                className="w-full bg-transparent text-base outline-none placeholder:text-[#AEB6C2]"
                placeholder="Search"
                type="text"
              />
            </label>

            <div className="hidden items-center gap-5 text-white/82 md:flex">
              <Bell size={23} strokeWidth={1.7} />
              <HelpCircle size={25} strokeWidth={1.7} />
            </div>
          </header>

          <section className="mb-6 rounded-[20px] bg-[#252B36] p-5 shadow-dashboard-card md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="font-serif text-[clamp(2rem,4vw,3.2rem)] font-normal leading-none tracking-[-0.01em]">
                CareerOS Control
              </h1>
              <button
                className="hidden items-center gap-2 rounded-xl px-4 py-3 text-lg font-medium text-white/85 transition hover:bg-white/5 md:flex"
                type="button"
              >
                Details <span className="text-2xl leading-none">›</span>
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_0.56fr_0.56fr]">
              <article className="relative min-h-[190px] overflow-hidden rounded-[22px] bg-[#2C7BE5] p-6 shadow-soft-blue">
                <div className="mb-5 flex items-center gap-5 text-sm uppercase tracking-wide text-white/80">
                  <span>Work hour permit</span>
                  <span className="h-px w-16 bg-white/55" />
                  <span>Week 42</span>
                </div>

                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="mb-2 font-serif text-[clamp(2rem,3.2vw,3.4rem)] font-normal leading-[0.95] tracking-[-0.01em]">
                      12 / 20 hrs
                    </h2>
                    <p className="text-lg text-white/78">Student work allowance</p>
                  </div>
                  <span className="stamp rounded-full px-4 py-2 text-xs font-semibold uppercase text-white/90">
                    Compliant
                  </span>
                </div>

                <div className="flex items-end justify-between gap-5">
                  <div className="flex -space-x-3">
                    {["32", "64", "B2"].map((value) => (
                      <span
                        className="grid h-11 w-11 place-items-center rounded-full border-2 border-[#2C7BE5] bg-white text-sm font-semibold text-[#171A1F]"
                        key={value}
                      >
                        {value}
                      </span>
                    ))}
                    <span className="grid h-11 w-11 place-items-center rounded-full border-2 border-[#2C7BE5] bg-[#171A1F] text-xs text-white">
                      +4
                    </span>
                  </div>

                  <button
                    className="rounded-xl px-3 py-2 text-xl font-medium text-white transition hover:bg-white/10"
                    type="button"
                  >
                    Log hours ›
                  </button>
                </div>
              </article>

              <MiniStatusCard
                label="Next follow-up"
                title="2 days"
                value="Zalando"
              />
              <MiniStatusCard
                label="CV readability"
                title="84%"
                value="Inspection passed"
              />
            </div>
          </section>

          <section>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-[clamp(1.7rem,3vw,2.55rem)] font-normal leading-none tracking-[-0.01em]">
                Applications in motion
              </h2>
              <button
                aria-label="Filter applications"
                className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-[#252B36] text-white/85 transition hover:bg-[#303849]"
                type="button"
              >
                <SlidersHorizontal size={22} strokeWidth={1.8} />
              </button>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_1fr_1.38fr]">
              {applications.slice(0, 2).map((application) => (
                <ApplicationCard application={application} key={application.company} />
              ))}

              <article className="card-sheen min-h-[240px] rounded-[22px] p-5">
                <p className="mb-3 text-center text-lg font-medium text-white/90">
                  Skill gap trend
                </p>
                <div className="mb-3 text-center text-5xl font-light tracking-[-0.05em] text-[#2C7BE5]">
                  B+
                </div>

                <div className="relative mx-auto mb-4 h-20 max-w-[280px]">
                  <svg
                    aria-hidden="true"
                    className="h-full w-full overflow-visible"
                    viewBox="0 0 320 120"
                  >
                    <path
                      d="M8 102 C46 8 62 105 99 61 S153 24 179 56 220 80 244 47 280 10 310 36"
                      fill="none"
                      stroke="rgba(255,255,255,0.15)"
                      strokeLinecap="round"
                      strokeWidth="5"
                    />
                    <path
                      d="M8 102 C51 44 72 91 102 70 S148 41 176 53 209 80 238 63 276 18 310 36"
                      fill="none"
                      stroke="url(#gapGradient)"
                      strokeLinecap="round"
                      strokeWidth="4"
                    />
                    <defs>
                      <linearGradient id="gapGradient" x1="0" x2="1" y1="0" y2="0">
                        <stop stopColor="#545BFF" />
                        <stop offset="0.55" stopColor="#EC43A3" />
                        <stop offset="1" stopColor="#FF6858" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                <div className="flex justify-center gap-7 text-sm text-[#AEB6C2]">
                  <span>
                    <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#EC43A3]" />
                    React
                  </span>
                  <span>
                    <span className="mr-2 inline-block h-2 w-2 rounded-full bg-white/80" />
                    German B2
                  </span>
                </div>
              </article>
            </div>
          </section>
        </section>

        <aside className="right-panel-glow hidden min-h-0 flex-col px-10 py-6 lg:flex">
          <div className="mb-7 flex justify-end">
            <Bell size={25} strokeWidth={1.7} />
          </div>

          <div className="mb-6 flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="grid h-24 w-24 place-items-center rounded-full border-[5px] border-white bg-[#D9DEE8] text-4xl font-semibold text-[#171A1F] shadow-dashboard-card">
                UQ
              </div>
              <span className="absolute bottom-2 right-0 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-[#2C7BE5] text-sm font-semibold">
                5
              </span>
            </div>
            <h2 className="mb-2 font-serif text-2xl font-normal tracking-[-0.01em]">
              Uzair Qureshi
            </h2>
            <p className="text-lg text-white/66">International Student · Web Track</p>
          </div>

          <div className="h-px bg-white/20" />

          <section className="py-6 text-center">
            <p className="mb-5 text-lg text-white/86">Profile readiness</p>
            <div className="mb-6 flex items-end justify-center gap-2">
              <span className="pb-5 text-3xl text-[#C8D6FF]">%</span>
              <span className="text-[5.8rem] font-light leading-[0.75] tracking-[-0.08em]">
                85
              </span>
            </div>
            <button
              className="rounded-2xl bg-[#303849] px-9 py-4 text-base font-medium text-white shadow-dashboard-card transition hover:bg-[#3a4354]"
              type="button"
            >
              Update profile ›
            </button>
          </section>

          <div className="h-px bg-white/20" />

          <section className="min-w-0 flex-1 py-6">
            <h3 className="mb-5 font-serif text-xl font-normal">Proof certificates</h3>
            <div className="grid grid-cols-2 gap-4 overflow-hidden">
              {proofCards.map((card) => (
                <article
                  className="min-w-0 rounded-2xl bg-[#F7F8F6] p-4 text-[#171A1F]"
                  key={card.title}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <span className="text-3xl font-semibold text-[#2C7BE5]">
                      {card.mark}
                    </span>
                    <span className="text-2xl text-[#AEB6C2]">⋮</span>
                  </div>
                  <p className="mb-1 truncate text-base font-semibold">{card.title}</p>
                  <p className="text-sm text-[#6D737D]">{card.issuer}</p>
                </article>
              ))}
            </div>
          </section>

          <div className="flex justify-center">
            <button
              aria-label="Settings"
              className="grid h-14 w-14 place-items-center rounded-2xl bg-[#303849] shadow-dashboard-card transition hover:bg-[#3a4354]"
              type="button"
            >
              <Settings size={22} strokeWidth={1.8} />
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}

function MiniStatusCard({
  label,
  title,
  value,
}: {
  label: string;
  title: string;
  value: string;
}) {
  return (
    <article className="rounded-[22px] border border-white/10 bg-[#303849] p-6">
      <div className="mb-7 grid h-11 w-11 place-items-center rounded-full bg-white/5 text-white/75">
        <ShieldCheck size={21} strokeWidth={1.8} />
      </div>
      <p className="mb-3 text-xl font-medium tracking-[-0.02em]">{title}</p>
      <p className="text-base leading-5 text-[#AEB6C2]">{label}</p>
      <p className="text-base leading-5 text-[#AEB6C2]">{value}</p>
    </article>
  );
}

function ApplicationCard({
  application,
}: {
  application: (typeof applications)[number];
}) {
  return (
    <article className="overflow-hidden rounded-[22px] bg-[#303849] shadow-dashboard-card">
      <div
        className="h-24 p-5"
        style={{ background: application.image }}
      >
        <span className="rounded-lg border border-white/15 bg-[#202733]/90 px-4 py-2 text-sm font-medium text-white">
          {application.company}
        </span>
      </div>
      <div className="p-5">
        <p className="mb-2 text-base text-[#C9D4E2]">{application.role}</p>
        <h3 className="mb-4 font-serif text-xl font-normal tracking-[-0.01em]">
          {application.location}
        </h3>
        <div className="mb-3 h-px bg-white/12" />
        <div className="flex items-center justify-between text-base text-[#AEB6C2]">
          <span>{application.meta}</span>
          <span className={`h-3 w-3 rounded-full ${application.dot}`} />
        </div>
      </div>
    </article>
  );
}
