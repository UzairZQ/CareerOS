import { expect, test } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

function loadEnvLocal() {
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const index = trimmed.indexOf("=");
    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");
    process.env[key] ??= value;
  }
}

function createTextPdf(text: string) {
  const stream = `BT\n/F1 14 Tf\n72 720 Td\n(${text}) Tj\nET`;
  const objects = [
    `<< /Type /Catalog /Pages 2 0 R >>`,
    `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>`,
    `<< /Length ${Buffer.byteLength(stream, "binary")} >>\nstream\n${stream}\nendstream`,
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "binary"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "binary");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .slice(1)
    .map((offset) => `${offset.toString().padStart(10, "0")} 00000 n \n`)
    .join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "binary");
}

loadEnvLocal();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe("authenticated dashboard UI", () => {
  test.skip(
    !supabaseUrl || !anonKey || !serviceRoleKey,
    "Supabase env vars are required for authenticated E2E tests.",
  );

  let admin: SupabaseClient;
  let userId: string;
  let applicationId: string;
  let createdApplicationId: string;
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const email = `careeros-e2e-${runId}@example.com`;
  const password = `CareerOS-${runId}!Aa1`;

  test.beforeAll(async () => {
    admin = createClient(supabaseUrl!, serviceRoleKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userData, error: userError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      password,
      user_metadata: {
        full_name: "CareerOS E2E User",
        target_role: "Frontend Working Student",
      },
    });
    if (userError) throw userError;
    userId = userData.user.id;

    const { data: appData, error: appError } = await admin
      .from("applications")
      .insert({
        company: "CareerOS E2E GmbH",
        follow_up_date: null,
        job_description: "Required: React, TypeScript, Supabase. Nice to have: PostgreSQL.",
        location: "Frankfurt · Hybrid",
        notes: "Seeded by Playwright.",
        role: "Frontend Working Student",
        status: "saved",
        url: "https://example.com/e2e-job",
        user_id: userId,
      })
      .select("id")
      .single();
    if (appError) throw appError;
    applicationId = appData.id;
  });

  test.afterAll(async () => {
    if (applicationId) {
      await admin.from("applications").delete().eq("id", applicationId);
    }
    if (createdApplicationId) {
      await admin.from("applications").delete().eq("id", createdApplicationId);
    }
    if (userId) {
      await admin.auth.admin.deleteUser(userId);
    }
  });

  test("logs in, navigates modules, and updates an application", async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.goto("/");

    await page.getByPlaceholder("Email address").fill(email);
    await page.getByPlaceholder("Password").fill(password);
    await page.getByRole("button", { exact: true, name: "Sign In" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: "CareerOS Control" })).toBeVisible();
    await expect(page.getByTestId("dashboard-nav-desktop-overview")).toHaveAttribute(
      "aria-current",
      "location",
    );
    await expect(page.getByText("CareerOS E2E GmbH", { exact: true })).toBeVisible();

    await page.getByTestId("dashboard-nav-desktop-applications").click();
    await expect(page.getByRole("heading", { exact: true, name: "Applications" })).toBeVisible();
    const addJobButton = page.getByRole("button", { exact: true, name: "Add job" });
    expect(await addJobButton.count()).toBe(1);
    await addJobButton.click();
    await page.getByLabel("Company", { exact: true }).fill("CareerOS E2E Added GmbH");
    await page.getByLabel("Role", { exact: true }).fill("Junior Web Developer");
    await page.getByLabel("Location", { exact: true }).fill("Frankfurt · Hybrid");
    await page.getByLabel("Source", { exact: true }).fill("Company site");
    await page.getByLabel("Applied date", { exact: true }).fill("2026-07-11");
    await page.getByLabel("Job description", { exact: true }).fill("Required: React and TypeScript.");
    await page.getByRole("button", { exact: true, name: "Save application" }).click();
    await expect(page.getByText("CareerOS E2E Added GmbH", { exact: true })).toBeVisible();

    const { data: createdApplication, error: createdApplicationError } = await admin
      .from("applications")
      .select("id, applied_date, source")
      .eq("user_id", userId)
      .eq("company", "CareerOS E2E Added GmbH")
      .single();
    expect(createdApplicationError).toBeNull();
    expect(createdApplication).toMatchObject({ applied_date: "2026-07-11", source: "Company site" });
    createdApplicationId = createdApplication!.id;

    await page.getByTestId("dashboard-nav-desktop-applications").click();
    await expect(page.getByRole("heading", { exact: true, name: "Applications" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "CareerOS Control" })).toHaveCount(0);
    await expect(page.getByTestId("dashboard-nav-desktop-applications")).toHaveAttribute(
      "aria-current",
      "location",
    );

    await page.getByTestId(`application-details-toggle-${applicationId}`).click();
    await page.getByTestId(`application-company-${applicationId}`).fill("CareerOS E2E Updated GmbH");
    await page.getByTestId(`application-role-${applicationId}`).fill("Frontend Engineer");
    await page.getByTestId(`application-location-${applicationId}`).fill("Berlin · Remote");
    await page.getByTestId(`application-url-${applicationId}`).fill("https://example.com/updated-job");
    await page.getByTestId(`application-source-${applicationId}`).fill("LinkedIn");
    await page.getByTestId(`application-applied-date-${applicationId}`).fill("2026-07-12");
    await page
      .getByTestId(`application-job-description-${applicationId}`)
      .fill("Required: React, Next.js and TypeScript.");
    await page.getByTestId(`application-details-save-${applicationId}`).click();
    await expect(page.getByText("Application record updated.", { exact: true })).toBeVisible();

    const { data: updatedRecord, error: updatedRecordError } = await admin
      .from("applications")
      .select("applied_date, company, job_description, location, role, source, url")
      .eq("id", applicationId)
      .single();
    expect(updatedRecordError).toBeNull();
    expect(updatedRecord).toMatchObject({
      applied_date: "2026-07-12",
      company: "CareerOS E2E Updated GmbH",
      job_description: "Required: React, Next.js and TypeScript.",
      location: "Berlin · Remote",
      role: "Frontend Engineer",
      source: "LinkedIn",
      url: "https://example.com/updated-job",
    });

    await page.getByTestId(`application-status-${applicationId}`).selectOption("interview");
    await page.getByTestId(`application-follow-up-${applicationId}`).fill("2026-07-20");
    await page
      .getByTestId(`application-notes-${applicationId}`)
      .fill("Updated from Playwright authenticated dashboard test.");
    await page.getByTestId(`application-save-${applicationId}`).click();

    await expect(page.getByText("Application updated.")).toBeVisible();

    const { data, error } = await admin
      .from("applications")
      .select("follow_up_date, notes, status")
      .eq("id", applicationId)
      .single();

    expect(error).toBeNull();
    expect(data).toMatchObject({
      follow_up_date: "2026-07-20",
      notes: "Updated from Playwright authenticated dashboard test.",
      status: "interview",
    });

    await page.getByTestId("dashboard-nav-desktop-work-hours").click();
    await expect(page.getByRole("heading", { exact: true, name: "Work Hours" })).toBeVisible();
    await expect(page.getByText("Work hour permit", { exact: true })).toBeVisible();
    await page.getByRole("button", { exact: true, name: "Log hours" }).click();
    await page.locator('input[name="work_date"]').fill("2026-07-10");
    await page.locator('input[name="employer"]').fill("CareerOS E2E GmbH");
    await page.locator('input[name="hours"]').fill("4");
    await page.getByRole("button", { exact: true, name: "Save log" }).click();
    await expect(page.getByText("CareerOS E2E GmbH · full", { exact: true })).toBeVisible();

    const { data: workLog, error: workLogError } = await admin
      .from("work_hour_logs")
      .select("id")
      .eq("user_id", userId)
      .eq("work_date", "2026-07-10")
      .eq("employer", "CareerOS E2E GmbH")
      .single();
    expect(workLogError).toBeNull();
    expect(workLog?.id).toBeTruthy();

    await page.getByTestId("dashboard-nav-desktop-profile").click();
    await expect(page.getByRole("heading", { exact: true, name: "Profile" })).toBeVisible();
    await page.getByTestId("profile-current-city").fill("Frankfurt");
    await page.getByTestId("profile-work-authorization").selectOption("student_visa");
    await page.getByTestId("profile-languages").fill("English C1, German B1");
    await page.getByTestId("profile-target-roles").fill("Frontend Working Student");
    await page.getByTestId("profile-save").click();
    await expect(page.getByText("Profile saved.", { exact: true })).toBeVisible();

    await page.getByTestId("dashboard-nav-desktop-skill-gap").click();
    await expect(page.getByRole("heading", { exact: true, name: "Extract the real ask" })).toBeVisible();
    await page.getByRole("combobox", { exact: true, name: "Application source" }).selectOption(applicationId);
    await page.getByTestId("evidence-confidence-react").selectOption("direct");
    await page
      .getByTestId("evidence-summary-react")
      .fill("Built and tested the React dashboard interface.");
    await page
      .getByTestId("evidence-proof-react")
      .fill("https://github.com/example/careeros-e2e");
    await page.getByTestId("evidence-save-react").click();
    await expect(page.getByTestId("evidence-save-react")).toHaveText("Saved");
    await page.reload();
    await page.getByTestId("dashboard-nav-desktop-overview").click();
    await expect(page.getByTestId("analytics-evidence-ready")).toHaveText("1");

    await page.getByTestId("dashboard-nav-desktop-skill-gap").click();
    await expect(page.getByTestId("sprint-create")).toBeVisible();
    await page.getByRole("button", { exact: true, name: "3d" }).click();
    await page.getByTestId("sprint-create").click();
    await expect(page.getByText("Sprint created. Add proof as you complete each task.", { exact: true })).toBeVisible();
    for (const taskOrder of [1, 2, 3]) {
      await page
        .getByTestId(`sprint-proof-url-${taskOrder}`)
        .fill(`https://github.com/example/careeros-sprint-${taskOrder}`);
      await page.getByTestId(`sprint-save-task-${taskOrder}`).click();
      await expect(page.getByText("Proof saved for this task.", { exact: true })).toBeVisible();
    }
    await page.getByTestId("sprint-improve-skill").click();
    await expect(page.getByRole("button", { exact: true, name: "Skill improved" })).toBeVisible();

    const { data: evidence, error: evidenceError } = await admin
      .from("evidence_items")
      .select("confidence, proof_url")
      .eq("user_id", userId)
      .eq("application_id", applicationId)
      .eq("skill", "React")
      .single();
    expect(evidenceError).toBeNull();
    expect(evidence).toMatchObject({
      confidence: "direct",
      proof_url: "https://github.com/example/careeros-e2e",
    });

    const { data: sprintRows, error: sprintRowsError } = await admin
      .from("learning_sprints")
      .select("id, status, duration_days, skill")
      .eq("user_id", userId);
    expect(sprintRowsError).toBeNull();
    expect(sprintRows).toEqual([
      expect.objectContaining({ duration_days: 3, skill: expect.any(String), status: "completed" }),
    ]);

    const { data: sprintTasks, error: sprintTasksError } = await admin
      .from("learning_sprint_tasks")
      .select("completed, proof_url")
      .eq("sprint_id", sprintRows![0].id);
    expect(sprintTasksError).toBeNull();
    expect(sprintTasks).toHaveLength(3);
    expect(sprintTasks?.every((task) => task.completed && task.proof_url)).toBe(true);

    await page.getByTestId("dashboard-nav-desktop-cv-check").click();
    await expect(page.getByRole("heading", { exact: true, name: "Readability before tailoring" })).toBeVisible();
    await page.locator('input[type="file"][accept="application/pdf,.pdf"]').setInputFiles({
      name: "careeros-cv.pdf",
      mimeType: "application/pdf",
      buffer: createTextPdf("CareerOS PDF CV React TypeScript Next.js Evidence Portfolio"),
    });
    await expect(page.getByText("Read 1 page from careeros-cv.pdf.", { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder("Paste plain CV text here, or upload a text-based PDF above.")).toHaveValue(
      /CareerOS PDF CV React TypeScript Next.js Evidence Portfolio/,
    );
    await page.getByTestId("cv-save").click();
    await expect(page.getByText("CV saved.", { exact: true })).toBeVisible();
    await page.reload();
    await page.getByTestId("dashboard-nav-desktop-cv-check").click();
    await expect(page.getByPlaceholder("Paste plain CV text here, or upload a text-based PDF above.")).toHaveValue(
      /CareerOS PDF CV React TypeScript Next.js Evidence Portfolio/,
    );

    await page.getByTestId("dashboard-nav-desktop-ai-insights").click();
    await page.getByPlaceholder("Paste your own provider key").fill("short");
    await page.getByRole("button", { exact: true, name: "Save encrypted key" }).click();
    await expect(page.getByText("Paste a valid API key before saving.", { exact: true })).toBeVisible();

    await page.getByPlaceholder("Paste your own provider key").fill("test-key-12345678");
    await page.getByRole("button", { exact: true, name: "Save encrypted key" }).click();
    await expect(page.getByText("Key saved encrypted. It will only be used from server routes.", { exact: true })).toBeVisible();
    await page.getByTestId("dashboard-nav-desktop-skill-gap").click();
    await expect(page.getByRole("button", { exact: true, name: "Get AI insight" })).toBeVisible();

    const { error: clearApplicationsError } = await admin
      .from("applications")
      .delete()
      .eq("user_id", userId);
    expect(clearApplicationsError).toBeNull();
    const { data: remainingApplications, error: remainingApplicationsError } = await admin
      .from("applications")
      .select("id")
      .eq("user_id", userId);
    expect(remainingApplicationsError).toBeNull();
    expect(remainingApplications).toEqual([]);

    const { error: clearCvError } = await admin
      .from("user_profiles")
      .update({ cv_text: null })
      .eq("user_id", userId);
    expect(clearCvError).toBeNull();

    await page.reload();
    await page.getByTestId("dashboard-nav-desktop-overview").click();
    await expect(page.getByRole("heading", { exact: true, name: "CareerOS Control" })).toBeVisible();
    await expect(page.getByText("No applications yet", { exact: true })).toBeVisible();

    await page.getByTestId("dashboard-nav-desktop-cv-check").click();
    await expect(page.getByRole("heading", { exact: true, name: "Readability before tailoring" })).toBeVisible();
    await expect(page.getByPlaceholder("Paste plain CV text here, or upload a text-based PDF above.")).toHaveValue("");
    await page.getByTestId("dashboard-nav-desktop-skill-gap").click();
    await expect(page.getByText("Paste a detailed job description to build an evidence map.", { exact: true })).toBeVisible();
    await page.getByTestId("dashboard-nav-desktop-assistant").click();
    await expect(
      page.getByText("Add an application with a job description to generate evidence-backed suggestions.", { exact: true }),
    ).toBeVisible();

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test("keeps the dashboard inside a narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByPlaceholder("Email address").fill(email);
    await page.getByPlaceholder("Password").fill(password);
    await page.getByRole("button", { exact: true, name: "Sign In" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("navigation", { name: "Dashboard modules" })).toBeVisible();
    await expect(page.getByTestId("dashboard-nav-mobile-overview")).toHaveAttribute(
      "aria-current",
      "location",
    );

    const documentOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth || document.body.scrollWidth > window.innerWidth,
    );
    expect(documentOverflow).toBe(false);

    const documentHeightOverflow = await page.evaluate(
      () => document.documentElement.scrollHeight > window.innerHeight + 1 || document.body.scrollHeight > window.innerHeight + 1,
    );
    expect(documentHeightOverflow).toBe(false);
  });
});
