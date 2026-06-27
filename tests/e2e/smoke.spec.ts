import { expect, test } from "@playwright/test";

test("auth page and api health load", async ({ page, request }) => {
  const health = await request.get("/api/health");
  expect(health.ok()).toBeTruthy();
  await page.goto("/auth");
  await expect(page.getByRole("heading", { name: "SIGN IN" })).toBeVisible();
});

test("authenticated launchpad deep link renders terminal shell", async ({ page, request }) => {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@trade-terminal.local`;
  const res = await request.post("/api/auth/register", {
    data: { email, password: "password", displayName: "E2E" },
  });

  test.skip(res.status() >= 500, "local database is unavailable");
  expect(res.ok()).toBeTruthy();

  const body = await res.json() as { token: string };
  await page.addInitScript((token) => {
    localStorage.setItem("tt_jwt", token);
  }, body.token);

  await page.goto("/?view=launchpad");
  await expect(page.getByText("Launchpad Workspace")).toBeVisible();
  await expect(page).toHaveURL(/view=launchpad/);
});
