import { expect, test } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe("public auth flow", () => {
  test.skip(
    !supabaseUrl || !serviceRoleKey,
    "Supabase env vars are required for the signup E2E test.",
  );

  let admin: SupabaseClient;
  let createdUserId: string | undefined;
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const email = `careeros.signup.${runId}@gmail.com`;
  const password = `CareerOS-${runId}!Aa1`;

  test.beforeAll(() => {
    admin = createClient(supabaseUrl!, serviceRoleKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  });

  test.afterAll(async () => {
    if (createdUserId) {
      await admin.auth.admin.deleteUser(createdUserId);
    }
  });

  test("switches auth modes and creates a user with profile metadata", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.goto("/");
    await expect(page.getByRole("heading", { exact: true, name: "Welcome Back" })).toBeVisible();

    const signUpButton = page.getByRole("button", { exact: true, name: "Sign up" });
    expect(await signUpButton.count()).toBe(1);
    await signUpButton.click();
    await expect(page.getByRole("heading", { exact: true, name: "Create Account" })).toBeVisible();

    await page.getByPlaceholder("Full name").fill("CareerOS Signup User");
    await page.getByPlaceholder("Email address").fill(email);
    await page.getByPlaceholder("Password").fill(password);
    await page.getByPlaceholder("Target role").fill("Junior Web Developer");

    const signInButton = page.getByRole("button", { exact: true, name: "Sign in" });
    expect(await signInButton.count()).toBe(1);
    await signInButton.click();
    await expect(page.getByRole("heading", { exact: true, name: "Welcome Back" })).toBeVisible();
    await page.getByRole("button", { exact: true, name: "Sign up" }).click();
    await expect(page.getByRole("heading", { exact: true, name: "Create Account" })).toBeVisible();

    await page.getByRole("button", { exact: true, name: "Create Account" }).click();

    const confirmationMessage = page.getByText(
      "Check your email to confirm your account, then log in.",
      { exact: true },
    );
    const rateLimitMessage = page.getByText(
      "Too many confirmation emails were requested. Please wait a few minutes and try again.",
      { exact: true },
    );
    const dashboardHeading = page.getByRole("heading", { exact: true, name: "CareerOS Control" });
    const outcome = await Promise.race([
      confirmationMessage
        .waitFor({ state: "visible", timeout: 10_000 })
        .then(() => "confirmation")
        .catch(() => null),
      dashboardHeading
        .waitFor({ state: "visible", timeout: 10_000 })
        .then(() => "dashboard")
        .catch(() => null),
      rateLimitMessage
        .waitFor({ state: "visible", timeout: 10_000 })
        .then(() => "rate-limited")
        .catch(() => null),
    ]);
    if (outcome === "rate-limited") {
      test.skip(true, "Supabase email-send rate limit reached; rerun signup E2E after the provider window resets.");
    }
    expect(["confirmation", "dashboard"]).toContain(outcome);

    await expect
      .poll(async () => {
        const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (error) throw error;
        const user = data.users.find((candidate) => candidate.email === email);
        if (user) {
          createdUserId = user.id;
          return user.user_metadata;
        }
        return null;
      })
      .toMatchObject({
        full_name: "CareerOS Signup User",
        target_role: "Junior Web Developer",
      });

    expect(pageErrors).toEqual([]);
  });
});
