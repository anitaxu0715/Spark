import { expect, type Page } from "@playwright/test";

const mailpitUrl = "http://127.0.0.1:54324";

interface MailpitList {
  messages?: Array<{ ID?: string; Id?: string; id?: string }>;
}

export async function signIn(page: Page, email: string, password: string) {
  await page.goto("/auth/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/(discover|onboarding|account-status)$/);
  await page.waitForLoadState("networkidle");
}

export async function signOut(page: Page) {
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await expect(page).toHaveURL("/");
  await page.waitForLoadState("networkidle");
}

export async function waitForMailLink(
  recipient: string,
  subjectFragment: string,
  timeout = 20_000,
) {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const listResponse = await fetch(`${mailpitUrl}/api/v1/messages`);
    if (listResponse.ok) {
      const list = await listResponse.json() as MailpitList;
      for (const message of list.messages ?? []) {
        if (!JSON.stringify(message).toLowerCase().includes(recipient.toLowerCase())) continue;
        if (!JSON.stringify(message).toLowerCase().includes(subjectFragment.toLowerCase())) continue;
        const id = message.ID ?? message.Id ?? message.id;
        if (!id) continue;
        const detailResponse = await fetch(`${mailpitUrl}/api/v1/message/${id}`);
        if (!detailResponse.ok) continue;
        const detail = await detailResponse.json();
        const serialized = JSON.stringify(detail).replaceAll("&amp;", "&");
        const links = serialized.match(/https?:\/\/[^"'\s<>\\]+/g) ?? [];
        const authLink = links.find((link) => link.includes("/auth/v1/verify"));
        if (authLink) return authLink;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`No ${subjectFragment} email arrived for ${recipient}.`);
}

export function futureLocalDateTime(daysFromNow = 20) {
  const value = new Date(Date.now() + daysFromNow * 86_400_000);
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
