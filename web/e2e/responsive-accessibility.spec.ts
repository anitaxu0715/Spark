import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test("keeps core pages usable across viewports and traps modal focus", async ({ page }) => {
  await signIn(page, "anita@spark.test", "SparkLocal!2026");

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    for (const path of ["/discover", "/requests", "/notifications", "/profile", "/settings/privacy"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} overflows at ${viewport.width}px`).toBeLessThanOrEqual(1);
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/people/maya-chen");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Send learning request" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("button", { name: "Close dialog" })).toBeFocused();

  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Send learning request" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Close dialog" })).toBeFocused();

  await dialog.getByLabel("Session format").selectOption("in-person");
  await expect(dialog.getByLabel("Safety reminder")).toContainText("Meet in a public place and tell someone you trust.");
  await dialog.getByLabel("Session format").selectOption("online");
  await expect(dialog.getByLabel("Safety reminder")).toHaveCount(0);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Send learning request" })).toBeFocused();
});
