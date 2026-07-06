import { expect, test } from "@playwright/test";
import { waitForMailLink } from "./helpers";

test.describe("authentication acceptance", () => {
  test("protects member routes and rejects unsafe redirect destinations", async ({ page }) => {
    await page.goto("/requests");
    await expect(page).toHaveURL(/\/auth\/sign-in\?next=%2Frequests/);

    await page.goto("/auth/sign-in?next=https://example.com");
    await page.getByLabel("Email").fill("anita@spark.test");
    await page.getByLabel("Password").fill("SparkLocal!2026");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/discover$/);

    await page.goto("/auth/sign-in");
    await expect(page).toHaveURL(/\/discover$/);
    await page.getByRole("button", { name: "Sign out" }).first().click();
    await expect(page).toHaveURL("/");

    await page.goto("/auth/confirm?token_hash=invalid&type=signup");
    await expect(page).toHaveURL(/\/auth\/sign-in\?error=expired-link/);
    await expect(page.getByText("This sign-in or recovery link is invalid or expired.")).toBeVisible();

    await page.goto("/auth/update-password");
    await page.getByLabel("New password", { exact: true }).fill("NoRecovery!2026");
    await page.getByLabel("Confirm new password").fill("NoRecovery!2026");
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByText("This reset link has expired. Request a new password reset email.")).toBeVisible();
  });

  test("confirms a new academic account and completes password recovery through Mailpit", async ({ page }) => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
    const email = `browser-${suffix}@spark.test`;
    const originalPassword = "BrowserFlow!2026";
    const updatedPassword = "UpdatedFlow!2026";

    await page.goto("/auth/sign-up");
    await page.getByLabel("Academic email").fill(`browser-${suffix}@example.com`);
    await page.getByLabel("Password", { exact: true }).fill(originalPassword);
    await page.getByLabel("Confirm password").fill(originalPassword);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Use an eligible academic email address to join Spark.")).toBeVisible();

    await page.getByLabel("Academic email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(originalPassword);
    await page.getByLabel("Confirm password").fill(originalPassword);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/verify-email/);

    await page.goto("/requests");
    await expect(page).toHaveURL(/\/auth\/sign-in/);

    const confirmationLink = await waitForMailLink(email, "confirm");
    await page.goto(confirmationLink);
    await expect(page).toHaveURL(/\/onboarding$/);
    await expect(page.getByRole("heading", { name: /Make room for what you know/ })).toBeVisible();

    await page.getByRole("button", { name: "Sign out" }).first().click();
    await page.goto("/auth/forgot-password");
    await page.getByLabel("Account email").fill(email);
    await page.getByRole("button", { name: "Send reset instructions" }).click();
    await expect(page.getByText("If an account exists for that address")).toBeVisible();

    const recoveryLink = await waitForMailLink(email, "reset");
    await page.goto(recoveryLink);
    await expect(page).toHaveURL(/\/auth\/update-password$/);
    await page.getByLabel("New password", { exact: true }).fill(updatedPassword);
    await page.getByLabel("Confirm new password").fill(updatedPassword);
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByText("Your password has been updated.")).toBeVisible();

    await page.getByRole("button", { name: "Sign out" }).first().click();
    await expect(page).toHaveURL("/");
    await page.goto("/auth/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(originalPassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("The email or password is incorrect, or the email has not been confirmed.")).toBeVisible();

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(updatedPassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/onboarding$/);
  });
});
