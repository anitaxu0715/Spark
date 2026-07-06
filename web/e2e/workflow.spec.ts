import { expect, test } from "@playwright/test";
import { futureLocalDateTime, signIn } from "./helpers";

test("completes the critical workflow across isolated member contexts", async ({ browser }) => {
  const anitaContext = await browser.newContext();
  const mayaContext = await browser.newContext();
  const jordanContext = await browser.newContext();
  const anita = await anitaContext.newPage();
  const maya = await mayaContext.newPage();
  const jordan = await jordanContext.newPage();
  const marker = `Browser acceptance ${Date.now()}`;
  const message = `${marker}: I would like help organizing a focused Lightroom practice session.`;

  await signIn(anita, "anita@spark.test", "SparkLocal!2026");
  await anita.goto("/discover?search=Maya");
  await expect(anita.getByText("Maya Chen", { exact: true })).toBeVisible();
  await anita.getByRole("link", { name: "View Maya's profile" }).click();

  await anita.getByRole("button", { name: "Save profile" }).click();
  await expect(anita.getByText("Profile saved.", { exact: true })).toBeVisible();
  await anita.getByRole("button", { name: "Profile saved" }).click();
  await expect(anita.getByText("Profile removed from saved profiles.")).toBeVisible();

  await anita.getByRole("button", { name: "Send learning request" }).click();
  const requestDialog = anita.getByRole("dialog");
  await expect(requestDialog).toBeVisible();
  await requestDialog.getByLabel("What would you like to learn?").selectOption({ label: "Lightroom" });
  await requestDialog.getByLabel("Message for Maya").fill(message);
  await requestDialog.getByLabel("Preferred date and time").fill(futureLocalDateTime());
  await requestDialog.getByLabel("Session format").selectOption("online");
  await requestDialog.getByRole("button", { name: "Send learning request" }).click();
  await expect(anita.getByRole("heading", { name: "Request sent" })).toBeVisible();
  await anita.getByRole("link", { name: /View sent requests/ }).click();
  await expect(anita.getByText(message)).toBeVisible();

  await signIn(maya, "maya@spark.test", "SparkLocal!2026");
  await maya.goto("/notifications");
  await expect(maya.getByText("Anita", { exact: false }).first()).toBeVisible();
  await maya.goto("/requests");
  await maya.waitForLoadState("networkidle");
  const incoming = maya.getByRole("article").filter({ hasText: marker });
  await expect(incoming).toBeVisible();
  await incoming.getByRole("button", { name: "Accept" }).click();
  await expect(incoming.getByText(/^accepted$/i)).toBeVisible();

  await anita.reload();
  await anita.waitForLoadState("networkidle");
  const sent = anita.getByRole("article").filter({ hasText: marker });
  await expect(sent.getByText(/^accepted$/i)).toBeVisible();
  await sent.getByLabel("New date and time").fill(futureLocalDateTime(8));
  await sent.getByLabel("Meeting format").selectOption("online");
  await sent.getByLabel("Note (optional)").fill("A cross-browser reschedule proposal.");
  await sent.getByRole("button", { name: "Send proposal" }).click();
  await expect(sent.getByText("Pending reschedule proposal")).toBeVisible();

  await maya.reload();
  await maya.waitForLoadState("networkidle");
  const rescheduleIncoming = maya.getByRole("article").filter({ hasText: marker });
  await expect(rescheduleIncoming.getByText("Pending reschedule proposal")).toBeVisible();
  await rescheduleIncoming.getByRole("button", { name: "Accept new schedule" }).click();
  await expect(rescheduleIncoming.getByText("Pending reschedule proposal")).toHaveCount(0);

  await anita.reload();
  await anita.waitForLoadState("networkidle");
  const rescheduled = anita.getByRole("article").filter({ hasText: marker });
  await rescheduled.getByRole("button", { name: "Mark completed" }).click();
  await expect(rescheduled.getByText(/^completed$/i)).toBeVisible();
  await rescheduled.getByRole("button", { name: "Leave private feedback" }).click();
  const feedback = rescheduled.getByText("Private session feedback").locator("..");
  await feedback.getByLabel("Yes").nth(0).check();
  await feedback.getByLabel("Yes").nth(1).check();
  await feedback.getByLabel("Yes").nth(2).check();
  await feedback.getByLabel("Private note (optional)").fill("The browser workflow completed successfully.");
  await feedback.getByRole("button", { name: "Submit private feedback" }).click();
  await expect(rescheduled.getByText("Your feedback is private and has been saved.")).toBeVisible();
  await anita.reload();
  await expect(anita.getByRole("article").filter({ hasText: marker }).getByRole("button", { name: "Leave private feedback" })).toHaveCount(0);

  await signIn(jordan, "jordan@seattleu.edu", "SparkLocal!2026");
  await jordan.goto("/requests");
  await expect(jordan.getByText(marker)).toHaveCount(0);
  await jordan.goto("/people/jordan-bell");
  await expect(jordan.getByRole("heading", { name: "This profile is not available" })).toBeVisible();

  await anita.goto("/people/maya-chen");
  await anita.waitForLoadState("networkidle");
  await anita.getByRole("button", { name: "Block" }).click();
  await anita.getByRole("button", { name: "Confirm block" }).click();
  await expect(anita).toHaveURL(/\/discover$/);
  await anita.goto("/people/maya-chen");
  await expect(anita.getByRole("heading", { name: "This profile is not available" })).toBeVisible();

  await maya.goto("/discover?search=Anita");
  await expect(maya.getByText("0 people found")).toBeVisible();

  await anita.goto("/settings/privacy");
  await anita.waitForLoadState("networkidle");
  await anita.getByRole("button", { name: "Unblock" }).click();
  await expect(anita.getByText("You have not blocked anyone.")).toBeVisible();

  await anitaContext.close();
  await mayaContext.close();
  await jordanContext.close();
});
