import { SlowBackgroundVideo } from "@/components/slow-background-video";
import Link from "next/link";

const videoUrl =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4";

export default function LoginPage() {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[hsl(201_100%_13%)] text-white">
      <SlowBackgroundVideo src={videoUrl} />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-7xl flex-col px-8 py-6">
        <nav className="flex items-center justify-between">
          <Link
            className="font-display text-3xl tracking-tight text-white"
            href="/"
          >
            CareerOS<sup className="text-xs">®</sup>
          </Link>

          <div className="hidden items-center gap-9 md:flex">
            {["Home", "Applications", "Hours", "CV Check", "Skill Gap"].map(
              (item, index) => (
                <a
                  className={`text-sm transition-colors ${
                    index === 0
                      ? "text-white"
                      : "text-white/60 hover:text-white"
                  }`}
                  href="#"
                  key={item}
                >
                  {item}
                </a>
              ),
            )}
          </div>

          <Link
            className="liquid-glass rounded-full px-6 py-2.5 text-sm text-white transition-transform hover:scale-[1.03]"
            href="/dashboard"
          >
            Open Dashboard
          </Link>
        </nav>

        <section className="flex flex-1 flex-col items-center justify-start px-6 pb-40 pt-24 text-center md:pt-28 lg:pt-32">
          <h1
            className="animate-fade-rise max-w-7xl font-display text-5xl font-normal leading-[0.95] tracking-[-2.46px] text-white sm:text-7xl md:text-8xl"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Build your <em className="not-italic text-white/62">German</em>{" "}
            dream with{" "}
            <em className="not-italic text-white/62">proof.</em>
          </h1>

          <p className="animate-fade-rise-delay mt-8 max-w-2xl text-base leading-relaxed text-white/62 sm:text-lg">
            Track applications, work limits, CV checks, and skill evidence from
            one calm dashboard built for international students in Germany.
          </p>

          <div className="animate-fade-rise-delay-2 mt-12 flex flex-wrap justify-center gap-4">
            <Link
              className="liquid-glass rounded-full px-14 py-5 text-base text-white transition-transform hover:scale-[1.03]"
              href="/dashboard"
            >
              Begin Journey
            </Link>
            <Link
              className="rounded-full bg-white px-14 py-5 text-base font-medium text-black transition-transform hover:scale-[1.03]"
              href="/dashboard"
            >
              Sign in
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
