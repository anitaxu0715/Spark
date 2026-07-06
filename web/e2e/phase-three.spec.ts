import { expect, test } from "@playwright/test";
import { signIn, signOut } from "./helpers";

test("enforces operational routes and exposes role-scoped tools", async ({ page }) => {
  await signIn(page, "anita@spark.test", "SparkLocal!2026");
  await page.goto("/moderation");
  await expect(page).toHaveURL(/\/discover$/);
  await page.goto("/admin/institutions");
  await expect(page).toHaveURL(/\/discover$/);
  await signOut(page);

  await signIn(page, "moderator@spark.test", "SparkLocal!2026");
  await page.goto("/moderation");
  await expect(page.getByRole("heading", { name: "Moderation queue" })).toBeVisible();
  await page.goto("/admin/institutions");
  await expect(page).toHaveURL(/\/discover$/);
  await signOut(page);

  await signIn(page, "institution-admin@spark.test", "SparkLocal!2026");
  await page.goto("/admin/institutions");
  await expect(page.getByRole("heading", { name: "Institutions" })).toBeVisible();
  await expect(page.getByText("University of Washington")).toBeVisible();
  await expect(page.getByText("Seattle University")).toHaveCount(0);
});

test("supports preferences, export, and deletion grace-period cancellation", async ({ page }) => {
  await signIn(page, "jordan@seattleu.edu", "SparkLocal!2026");
  await page.goto("/settings/notifications");
  await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
  await page.getByLabel("Reschedule activity").uncheck();
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByRole("status")).toContainText("saved");

  await page.goto("/settings/account");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download JSON export" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^spark-data-\d{4}-\d{2}-\d{2}\.json$/);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Your account" })).toBeVisible();

  await page.getByLabel("Current password").fill("SparkLocal!2026");
  await page.getByLabel("Type DELETE to confirm").fill("DELETE");
  await page.getByRole("button", { name: "Schedule deletion" }).click();
  await expect(page).toHaveURL(/\/auth\/sign-in\?message=deletion-requested/, { timeout: 30_000 });

  await page.getByLabel("Email").fill("jordan@seattleu.edu");
  await page.getByLabel("Password").fill("SparkLocal!2026");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/account-status$/);
  await expect(page.getByText("Deletion scheduled")).toBeVisible();
  await page.getByRole("button", { name: "Cancel deletion" }).click();
  await expect(page).toHaveURL(/\/profile$/);
});
