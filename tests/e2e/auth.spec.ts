import { expect, test } from "@playwright/test";

test.describe("public auth flow", () => {
  test("switches between login and signup without sending auth emails", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.goto("/");
    await expect(page.getByRole("heading", { exact: true, name: "Welcome Back" })).toBeVisible();

    await page.getByRole("button", { exact: true, name: "Sign up" }).click();
    await expect(page.getByRole("heading", { exact: true, name: "Create Account" })).toBeVisible();
    await expect(page.getByRole("button", { exact: true, name: "Create Account" })).toBeVisible();

    await page.getByPlaceholder("Full name").fill("CareerOS Auth UI User");
    await page.getByPlaceholder("Email address").fill("auth-ui@example.com");
    await page.getByPlaceholder("Password").fill("CareerOS-Auth-Ui!Aa1");
    await page.getByPlaceholder("Target role").fill("Junior Web Developer");

    await page.getByRole("button", { exact: true, name: "Sign in" }).click();
    await expect(page.getByRole("heading", { exact: true, name: "Welcome Back" })).toBeVisible();
    await expect(page.getByRole("button", { exact: true, name: "Sign In" })).toBeVisible();

    await page.getByRole("button", { exact: true, name: "Sign up" }).click();
    await expect(page.getByRole("heading", { exact: true, name: "Create Account" })).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
});
