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
    await expect(page.getByRole("heading", { name: "CareerOS E2E GmbH" })).toBeVisible();

    const addJobButton = page.getByRole("button", { exact: true, name: "Add job" });
    expect(await addJobButton.count()).toBe(1);
    await addJobButton.click();
    await page.getByLabel("Company", { exact: true }).fill("CareerOS E2E Added GmbH");
    await page.getByLabel("Role", { exact: true }).fill("Junior Web Developer");
    await page.getByLabel("Location", { exact: true }).fill("Frankfurt · Hybrid");
    await page.getByLabel("Job description", { exact: true }).fill("Required: React and TypeScript.");
    await page.getByRole("button", { exact: true, name: "Save application" }).click();
    await expect(page.getByRole("heading", { exact: true, name: "CareerOS E2E Added GmbH" })).toBeVisible();

    const { data: createdApplication, error: createdApplicationError } = await admin
      .from("applications")
      .select("id")
      .eq("user_id", userId)
      .eq("company", "CareerOS E2E Added GmbH")
      .single();
    expect(createdApplicationError).toBeNull();
    createdApplicationId = createdApplication!.id;

    await page.getByRole("link", { exact: true, name: "Applications" }).click();
    await expect(page.locator(`#applications`)).toBeInViewport();

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

    await page.goto("/dashboard#work-hours");
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

    await page.goto("/dashboard#profile");
    await page.getByTestId("profile-current-city").fill("Frankfurt");
    await page.getByTestId("profile-work-authorization").selectOption("student_visa");
    await page.getByTestId("profile-languages").fill("English C1, German B1");
    await page.getByTestId("profile-target-roles").fill("Frontend Working Student");
    await page.getByTestId("profile-save").click();
    await expect(page.getByText("Profile saved.", { exact: true })).toBeVisible();

    await page.getByRole("link", { exact: true, name: "Skill Gap" }).click();
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
    await page.getByRole("link", { exact: true, name: "Overview" }).click();
    await expect(page.getByTestId("analytics-evidence-ready")).toHaveText("1");

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

    await page.getByRole("link", { exact: true, name: "CV Check" }).click();
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

    await page.getByRole("link", { exact: true, name: "AI Insights" }).click();
    await page.getByPlaceholder("Paste your own provider key").fill("short");
    await page.getByRole("button", { exact: true, name: "Save encrypted key" }).click();
    await expect(page.getByText("Paste a valid API key before saving.", { exact: true })).toBeVisible();

    await page.getByPlaceholder("Paste your own provider key").fill("test-key-12345678");
    await page.getByRole("button", { exact: true, name: "Save encrypted key" }).click();
    await expect(page.getByText("Key saved encrypted. It will only be used from server routes.", { exact: true })).toBeVisible();
    await page.getByRole("link", { exact: true, name: "Skill Gap" }).click();
    await expect(page.locator("#skill-gap").getByRole("button", { exact: true, name: "Get AI insight" })).toBeVisible();

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

    await page.goto(`/dashboard?empty-check=${Date.now()}#overview`);
    await expect(page.getByRole("heading", { exact: true, name: "CareerOS Control" })).toBeVisible();
    await expect(page.getByText("No applications yet", { exact: true })).toBeVisible();

    await page.goto(`/dashboard?empty-check=${Date.now()}#cv-check`);
    await expect(page.getByRole("heading", { exact: true, name: "Readability before tailoring" })).toBeVisible();
    await expect(page.getByPlaceholder("Paste plain CV text here, or upload a text-based PDF above.")).toHaveValue("");
    await page.getByRole("link", { exact: true, name: "Skill Gap" }).click();
    await expect(page.getByText("Paste a detailed job description to build an evidence map.", { exact: true })).toBeVisible();
    await page.getByRole("link", { exact: true, name: "Assistant" }).click();
    await expect(
      page.getByText("Add an application with a job description to generate evidence-backed suggestions.", { exact: true }),
    ).toBeVisible();

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
});
