import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { SlowBackgroundVideo } from "@/components/slow-background-video";
import { createClient } from "@/lib/supabase/server";

const videoUrl =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[hsl(201_100%_13%)] text-white">
      <SlowBackgroundVideo src={videoUrl} />
      <div className="relative z-10 flex min-h-[100dvh] items-center justify-center px-4 py-6 sm:px-8">
        <ResetPasswordForm />
      </div>
    </main>
  );
}
