import { expect, test } from "@playwright/test";

test("auth page and api health load", async ({ page, request }) => {
  const health = await request.get("/api/health");
  expect(health.ok()).toBeTruthy();
  await page.goto("/auth");
  await expect(page.getByRole("heading", { name: "SIGN IN" })).toBeVisible();
});
