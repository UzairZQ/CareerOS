import { AuthPanel } from "@/components/auth-panel";
import { SlowBackgroundVideo } from "@/components/slow-background-video";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const videoUrl =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ auth_error?: string | string[] }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const authError = Array.isArray(params?.auth_error)
    ? params.auth_error[0]
    : params?.auth_error;

  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden bg-[hsl(201_100%_13%)] text-white lg:h-[100dvh] lg:overflow-hidden">
      <SlowBackgroundVideo src={videoUrl} />

      <div className="relative z-10 mx-auto grid min-h-[100dvh] max-w-7xl items-start gap-4 px-4 py-5 sm:gap-7 sm:px-8 sm:py-8 md:py-10 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_430px] lg:gap-6 lg:px-8 lg:py-5">
        <section className="mx-auto max-w-4xl pt-7 text-center sm:pt-20 lg:mx-0 lg:pt-[12vh] lg:text-left xl:pt-[15vh]">
          <p className="animate-fade-rise mb-4 text-xs font-medium uppercase tracking-[0.24em] text-white/62 sm:text-sm">
            CareerOS
          </p>
          <div className="animate-fade-rise max-w-4xl">
            <h1
              className="font-display text-[2.55rem] font-normal leading-[0.95] tracking-[-1.1px] text-white sm:text-6xl md:text-7xl lg:tracking-[-2.46px] xl:text-[5.8rem]"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Build your <em className="not-italic text-white/62">German</em>{" "}
              dream with{" "}
              <em className="not-italic text-white/62">proof.</em>
            </h1>
          </div>

          <p className="animate-fade-rise-delay mx-auto mt-3 max-w-2xl text-sm leading-[1.4] text-white/72 sm:mt-5 sm:text-lg sm:leading-relaxed lg:mx-0 lg:text-white/66">
            Track applications, work limits, CV checks, and skill evidence from
            one calm dashboard built for international students in Germany.
          </p>
        </section>

        <div className="animate-fade-rise-delay-2 flex justify-center pb-2 lg:justify-end lg:pb-0">
          <AuthPanel initialError={authError ?? null} />
        </div>
      </div>
    </main>
  );
}
