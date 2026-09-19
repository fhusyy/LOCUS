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

  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.getByRole("heading", { name: /Your path to university/ }).waitFor();
  expect(await page.locator("html").getAttribute("lang") === "en", "HTML lang did not switch to English");

  await page.getByRole("button", { name: "ҚАЗ", exact: true }).click();
  await page.getByRole("heading", { name: /Университетке апарар жолың/ }).waitFor();
  expect(await page.locator("html").getAttribute("lang") === "kk", "HTML lang did not switch to Kazakh");

  await page.getByRole("button", { name: "RU", exact: true }).click();
  await page.getByRole("heading", { name: /Твой путь к университету/ }).waitFor();
  await page.screenshot({ path: `${output}/01-landing-locales.png`, fullPage: false });

  // The demo profile is intentionally preloaded on first launch. Sign out so
  // the smoke test covers the complete questionnaire from an empty profile.
  await page.getByRole("button", { name: /Алия/ }).click();
  await page.getByRole("button", { name: /Выйти из аккаунта/ }).click();
  await page.locator("header.hero").getByRole("link", { name: /Построить мой маршрут/ }).click();
  await page.getByRole("heading", { name: /Кто ты и когда планируешь поступать/ }).waitFor();

  expect(await page.getByRole("button", { name: /Что если\?/ }).count() === 0, "What-if must be hidden until onboarding is complete");
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.getByText("to personalize your route", { exact: true }).waitFor();
  expect(await page.getByPlaceholder("For example, Aliya").isVisible(), "English onboarding hint was not translated");
  expect(await page.getByRole("button", { name: "Grade 11", exact: true }).isVisible(), "Grade option was not translated");

  // Native/browser Back must return to the previous UniFlow screen instead of
  // closing the app or leaving the site.
  await page.goBack();
  await page.getByRole("heading", { name: /Your path to university/ }).waitFor();
  await page.locator("header.hero").getByRole("link", { name: /Build my route/ }).click();
  await page.getByRole("button", { name: "RU", exact: true }).click();
  await page.getByRole("heading", { name: /Кто ты и когда планируешь поступать/ }).waitFor();
  await page.getByLabel(/Как тебя зовут/).fill("Алия");
  await page.getByRole("button", { name: /Продолжить/ }).click();

  await page.getByRole("button", { name: /Cybersecurity/ }).first().click();
  await page.getByRole("button", { name: /Продолжить/ }).click();
  await page.getByLabel(/Балл ЕНТ/).fill("108");
  await page.getByLabel(/Сертификат IELTS/).fill("6.5");
  await page.getByRole("button", { name: /Продолжить/ }).click();
  await page.getByRole("button", { name: /до 2.5 млн/ }).click();
  await page.getByRole("button", { name: /Продолжить/ }).click();
  await page.getByRole("button", { name: /Построить персональный маршрут/ }).click();

  await page.getByRole("heading", { name: /Привет, Алия/ }).waitFor();
  const overviewActionVisuals = await page.locator(".dash-next-action-card").evaluate((element) => {
    const style = getComputedStyle(element);
    return { backgroundColor: style.backgroundColor, color: style.color };
  });
  expect(
    overviewActionVisuals.backgroundColor === "rgb(4, 9, 21)",
    `Overview action card lost the original palette: ${overviewActionVisuals.backgroundColor}`,
  );
  expect(
    overviewActionVisuals.color === "rgb(255, 255, 255)",
    `Overview action text is not readable: ${overviewActionVisuals.color}`,
  );
  await page.getByRole("button", { name: "Рекомендации", exact: true }).click();
  await page.getByRole("heading", { name: /персональный вектор поступления/ }).waitFor();
  await page.getByRole("button", { name: /AI-подбор по 106 вузам/ }).waitFor();

  const cards = await page.locator(".match-card").count();
  expect(cards >= 3, `Expected at least 3 recommendation cards, received ${cards}`);
  await page.screenshot({ path: `${output}/02-results-ai-entry.png`, fullPage: false });

  await page.getByRole("button", { name: /Карточка вуза/ }).first().click();
  await page.getByRole("button", { name: /Спросить Gemini AI/ }).waitFor();
  await page.getByRole("button", { name: "Закрыть" }).click();

  await page.getByRole("button", { name: "Маршрут", exact: true }).click();
  await page.getByRole("heading", { name: /Твой путь поступления/ }).waitFor();
  const roadmapVisuals = await page.locator(".next-action").evaluate((element) => {
    const style = getComputedStyle(element);
    return { backgroundColor: style.backgroundColor, color: style.color };
  });
  expect(roadmapVisuals.backgroundColor === "rgb(11, 26, 48)", `Roadmap action card lost the original palette: ${roadmapVisuals.backgroundColor}`);
  expect(roadmapVisuals.color === "rgb(255, 255, 255)", `Roadmap action text is not readable: ${roadmapVisuals.color}`);
  const progressOverflow = await page.locator(".route-progress").evaluate((element) => element.scrollWidth - element.clientWidth);
  expect(progressOverflow <= 1, `Roadmap progress text overflows its card by ${progressOverflow}px`);
  await page.screenshot({ path: `${output}/03-roadmap-contrast.png`, fullPage: false });

  await page.goBack();
  await page.getByRole("heading", { name: /персональный вектор поступления/ }).waitFor();

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
  await mobilePage.screenshot({ path: `${output}/04-landing-mobile-en.png`, fullPage: false });
  await mobile.close();

  console.log(`Smoke test passed: ${cards} recommendations, history Back, translated hints, roadmap contrast/progress, modal, and mobile overflow.`);
} finally {
  await browser.close();
}
