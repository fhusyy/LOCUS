import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:4173";
const output = "test-results";

function expect(value, message) {
  if (!value) throw new Error(message);
}

await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });

try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const page = await desktop.newPage();
  const consoleErrors = [];
  const failedResources = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400) failedResources.push(`${response.status()} ${response.url()}`);
  });

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /Твой путь к университету/ }).waitFor();

  const landingHeader = page.locator(".nav-parent nav");
  expect(await landingHeader.getByRole("button", { name: "Войти", exact: true }).count() === 1, "Landing header must contain Login");
  expect(await landingHeader.getByRole("link", { name: /Построить мой маршрут/ }).count() === 1, "Landing header must contain the route CTA");
  expect(await landingHeader.locator(".navlinks").count() === 0, "Landing header must not expose product navigation");

  await landingHeader.getByRole("link", { name: /Построить мой маршрут/ }).click();
  await page.getByText("Твой персональный навигатор поступления", { exact: true }).waitFor();
  expect(await page.getByText(/Быстрый тестовый вход/).count() === 0, "Demo login must not bypass Supabase authentication");
  await page.getByRole("button", { name: "Закрыть" }).click();

  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.getByRole("heading", { name: /Your path to university/ }).waitFor();
  expect(await page.locator("html").getAttribute("lang") === "en", "HTML lang did not switch to English");
  await page.getByRole("button", { name: "ҚАЗ", exact: true }).click();
  await page.getByRole("heading", { name: /Университетке апарар жолың/ }).waitFor();
  expect(await page.locator("html").getAttribute("lang") === "kk", "HTML lang did not switch to Kazakh");
  await page.getByRole("button", { name: "RU", exact: true }).click();

  await page.locator(".project-card-wrapper").click();
  await page.getByText("Твой персональный навигатор поступления", { exact: true }).waitFor();
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${output}/01-auth-required.png`, fullPage: false });
  await page.getByRole("button", { name: "Закрыть" }).click();

  expect(failedResources.length === 0, `Failed browser resources: ${failedResources.join(" | ")}`);
  expect(consoleErrors.length === 0, `Browser console errors: ${consoleErrors.join(" | ")}`);
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await mobile.addInitScript(() => window.localStorage.setItem("uniflow-locale", "en"));
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(baseUrl, { waitUntil: "networkidle" });
  await mobilePage.getByRole("heading", { name: /all in one place/i }).waitFor();
  const overflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow <= 1, `Mobile horizontal overflow: ${overflow}px`);
  await mobilePage.screenshot({ path: `${output}/02-landing-mobile-en.png`, fullPage: false });
  await mobile.close();

  console.log("Smoke test passed: auth-gated landing, simplified header, locales, protected showcase, and mobile overflow.");
} finally {
  await browser.close();
}
