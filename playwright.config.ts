import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  reporter: "list",
  retries: 0,
  testDir: "./tests/e2e",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    url: "http://localhost:3000",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
