import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function loadEnvLocal() {
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const index = trimmed.indexOf("=");
    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();
    process.env[key] ??= rawValue.replace(/^['"]|['"]$/g, "");
  }
}

loadEnvLocal();

const shouldRun = process.env.RUN_SUPABASE_INTEGRATION === "1";
const describeIntegration = shouldRun ? describe : describe.skip;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

describeIntegration("Supabase authenticated dashboard flow", () => {
  let admin: SupabaseClient;
  let userClient: SupabaseClient;
  let otherClient: SupabaseClient;
  let userId: string;
  let otherUserId: string;
  let applicationId: string;
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const password = `CareerOS-${runId}!Aa1`;
  const email = `careeros-it-${runId}@example.com`;
  const otherEmail = `careeros-it-other-${runId}@example.com`;

  beforeAll(async () => {
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error("Missing Supabase environment variables for integration test.");
    }

    admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    userClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    otherClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userData, error: userError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      password,
      user_metadata: { full_name: "CareerOS Integration User" },
    });
    if (userError) throw userError;
    userId = userData.user.id;

    const { data: otherUserData, error: otherUserError } = await admin.auth.admin.createUser({
      email: otherEmail,
      email_confirm: true,
      password,
    });
    if (otherUserError) throw otherUserError;
    otherUserId = otherUserData.user.id;

    const { error: signInError } = await userClient.auth.signInWithPassword({ email, password });
    if (signInError) throw signInError;

    const { error: otherSignInError } = await otherClient.auth.signInWithPassword({
      email: otherEmail,
      password,
    });
    if (otherSignInError) throw otherSignInError;
  }, 30000);

  afterAll(async () => {
    if (applicationId) {
      await admin.from("applications").delete().eq("id", applicationId);
    }
    if (userId) {
      await admin.auth.admin.deleteUser(userId);
    }
    if (otherUserId) {
      await admin.auth.admin.deleteUser(otherUserId);
    }
  }, 30000);

  it("creates, updates, reads, and deletes an application under RLS", async () => {
    const { data: created, error: createError } = await userClient
      .from("applications")
      .insert({
        applied_date: "2026-07-14",
        company: "CareerOS Integration GmbH",
        follow_up_date: "2026-07-16",
        job_description: "Required: React, TypeScript, Supabase.",
        location: "Frankfurt · Hybrid",
        notes: "Created by integration test.",
        role: "Frontend Working Student",
        source: "Company site",
        status: "saved",
        url: "https://example.com/job",
        user_id: userId,
      })
      .select("id, applied_date, source, status, follow_up_date")
      .single();

    expect(createError).toBeNull();
    expect(created?.status).toBe("saved");
    expect(created?.applied_date).toBe("2026-07-14");
    expect(created?.source).toBe("Company site");
    applicationId = created!.id;

    const { data: otherRead, error: otherReadError } = await otherClient
      .from("applications")
      .select("id")
      .eq("id", applicationId);

    expect(otherReadError).toBeNull();
    expect(otherRead).toEqual([]);

    const { data: updated, error: updateError } = await userClient
      .from("applications")
      .update({
        applied_date: "2026-07-15",
        company: "CareerOS Integration Updated GmbH",
        job_description: "Updated requirement: Next.js and TypeScript.",
        location: "Berlin · Remote",
        notes: "Interview scheduled.",
        role: "Frontend Engineer",
        source: "LinkedIn",
        status: "interview",
        url: "https://example.com/updated-job",
      })
      .eq("id", applicationId)
      .select("applied_date, company, job_description, location, notes, role, source, status, url")
      .single();

    expect(updateError).toBeNull();
    expect(updated).toMatchObject({
      applied_date: "2026-07-15",
      company: "CareerOS Integration Updated GmbH",
      job_description: "Updated requirement: Next.js and TypeScript.",
      location: "Berlin · Remote",
      notes: "Interview scheduled.",
      role: "Frontend Engineer",
      source: "LinkedIn",
      status: "interview",
      url: "https://example.com/updated-job",
    });
  });

  it("persists profile, work-hour log, and evidence rows for the signed-in user", async () => {
    expect(applicationId).toBeTruthy();

    const { data: profile, error: profileError } = await userClient.from("user_profiles").upsert({
      cv_text: "CareerOS integration CV React TypeScript proof.",
      current_city: "Frankfurt",
      full_name: "CareerOS Integration User",
      languages: ["English C1", "German B1"],
      profile_note: "Integration-test profile.",
      target_roles: ["Frontend Working Student"],
      user_id: userId,
      work_authorization: "student_visa",
    }).select("cv_text").single();
    expect(profileError).toBeNull();
    expect(profile?.cv_text).toContain("CareerOS integration CV");

    const { data: workLog, error: workLogError } = await userClient
      .from("work_hour_logs")
      .insert({
        day_type: "half",
        employer: "CareerOS Integration GmbH",
        hours: 4,
        notes: "Integration test log.",
        user_id: userId,
        work_date: "2026-07-09",
      })
      .select("id, hours, day_type")
      .single();
    expect(workLogError).toBeNull();
    expect(Number(workLog?.hours)).toBe(4);

    const { data: evidence, error: evidenceError } = await userClient
      .from("evidence_items")
      .upsert(
        {
          application_id: applicationId,
          confidence: "direct",
          evidence_summary: "Built a Supabase-backed dashboard.",
          evidence_type: "project",
          proof_task: "Attach GitHub repository.",
          proof_url: "https://github.com/example/careeros",
          requirement: "required",
          skill: "Supabase",
          skill_category: "backend",
          user_id: userId,
        },
        { onConflict: "user_id,application_id,skill" },
      )
      .select("skill, is_cv_ready")
      .single();

    expect(evidenceError).toBeNull();
    expect(evidence).toEqual({ is_cv_ready: true, skill: "Supabase" });

    const { data: unprovenEvidence, error: unprovenEvidenceError } = await userClient
      .from("evidence_items")
      .update({ proof_url: null })
      .eq("user_id", userId)
      .eq("application_id", applicationId)
      .eq("skill", "Supabase")
      .select("is_cv_ready")
      .single();
    expect(unprovenEvidenceError).toBeNull();
    expect(unprovenEvidence?.is_cv_ready).toBe(false);

    const { error: restoreEvidenceError } = await userClient
      .from("evidence_items")
      .update({ proof_url: "https://github.com/example/careeros" })
      .eq("user_id", userId)
      .eq("application_id", applicationId)
      .eq("skill", "Supabase");
    expect(restoreEvidenceError).toBeNull();

    const { data: sprint, error: sprintError } = await userClient
      .from("learning_sprints")
      .upsert(
        {
          application_id: applicationId,
          duration_days: 3,
          skill: "TypeScript",
          user_id: userId,
          status: "active",
        },
        { onConflict: "user_id,application_id,skill" },
      )
      .select("id, duration_days, status")
      .single();
    expect(sprintError).toBeNull();
    expect(sprint).toMatchObject({ duration_days: 3, status: "active" });

    const { data: sprintTask, error: sprintTaskError } = await userClient
      .from("learning_sprint_tasks")
      .insert({
        sprint_id: sprint!.id,
        task_order: 1,
        title: "Publish a TypeScript proof.",
      })
      .select("id, completed")
      .single();
    expect(sprintTaskError).toBeNull();
    expect(sprintTask?.completed).toBe(false);

    const { error: incompleteTaskError } = await userClient
      .from("learning_sprint_tasks")
      .update({ completed: true })
      .eq("id", sprintTask!.id);
    expect(incompleteTaskError).not.toBeNull();

    const { data: provenTask, error: provenTaskError } = await userClient
      .from("learning_sprint_tasks")
      .update({
        completed: true,
        proof_note: "Built and published the TypeScript proof.",
        proof_url: "https://github.com/example/typescript-proof",
      })
      .eq("id", sprintTask!.id)
      .select("completed, proof_url")
      .single();
    expect(provenTaskError).toBeNull();
    expect(provenTask).toMatchObject({
      completed: true,
      proof_url: "https://github.com/example/typescript-proof",
    });

    const { data: otherSprintRows, error: otherSprintError } = await otherClient
      .from("learning_sprints")
      .select("id")
      .eq("id", sprint!.id);
    expect(otherSprintError).toBeNull();
    expect(otherSprintRows).toEqual([]);
  });

  it("prevents a signed-in user from writing rows for another user id", async () => {
    const { error } = await otherClient.from("applications").insert({
      company: "Should fail",
      role: "Frontend Developer",
      status: "saved",
      user_id: userId,
    });

    expect(error).not.toBeNull();
  });
});
