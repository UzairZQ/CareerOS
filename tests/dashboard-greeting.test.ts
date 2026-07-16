import { describe, expect, it } from "vitest";
import { getFirstName, getTimeGreeting } from "@/lib/dashboard-greeting";

describe("dashboard greeting", () => {
  it("uses the user's first name without exposing a long full name in the sidebar", () => {
    expect(getFirstName("CareerOS E2E User")).toBe("CareerOS");
    expect(getFirstName("  Uzair Zia Qureshi ")).toBe("Uzair");
  });

  it("changes the greeting by local time", () => {
    expect(getTimeGreeting(new Date(2026, 6, 16, 9))).toBe("Good morning");
    expect(getTimeGreeting(new Date(2026, 6, 16, 14))).toBe("Good afternoon");
    expect(getTimeGreeting(new Date(2026, 6, 16, 20))).toBe("Good evening");
  });
});
