import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  use: {
    baseURL: "http://localhost:8080",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:8080",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://trade_user:trade_pass@localhost:5432/trade_terminal?schema=public",
      JWT_SECRET: process.env.JWT_SECRET ?? "dev-secret",
      FRONTEND_URL: process.env.FRONTEND_URL ?? "http://localhost:8080",
    },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
