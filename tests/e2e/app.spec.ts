import { test, expect } from "@playwright/test";

test.describe("Web Media Engine", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should load the application", async ({ page }) => {
    await expect(page).toHaveTitle(/Web Media Engine/);
  });

  test("should show file upload area", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
  });

  test("should show settings panel", async ({ page }) => {
    const settingsButton = page.locator("text=Settings");
    await expect(settingsButton).toBeVisible();
  });
});

test.describe("Cross-Origin Isolation", () => {
  test("should have crossOriginIsolated enabled", async ({ page }) => {
    await page.goto("/");
    const result = await page.evaluate(() => {
      return window.crossOriginIsolated;
    });
    expect(result).toBe(true);
  });
});

test.describe("Accessibility", () => {
  test("should have no critical axe violations", async ({ page }) => {
    // Will be implemented with axe-core
    await page.goto("/");
    // Placeholder for axe-core integration
  });
});
