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
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /Поступление становится/ }).waitFor();
  await page.screenshot({ path: `${output}/01-landing-desktop.png`, fullPage: true });

  await page.getByRole("button", { name: "Посмотреть демо" }).click();
  await page.getByRole("heading", { name: /профиль поступления/ }).waitFor();
  const cards = await page.locator(".match-card").count();
  expect(cards >= 3, `Ожидалось минимум 3 рекомендации, получено ${cards}`);
  await page.screenshot({ path: `${output}/02-results-desktop.png`, fullPage: true });

  await page.getByRole("button", { name: "Подробнее о мэтче" }).first().click();
  await page.getByRole("link", { name: /Открыть официальный источник/ }).first().waitFor();

  await page.getByRole("button", { name: /Сравнить варианты/ }).click();
  await page.getByRole("heading", { name: /Два варианта/ }).waitFor();
  await page.screenshot({ path: `${output}/03-compare-desktop.png`, fullPage: true });

  await page.locator(".compare-actions button").first().click();
  await page.getByText("СЛЕДУЮЩЕЕ ДЕЙСТВИЕ").waitFor();
  await page.screenshot({ path: `${output}/04-roadmap-desktop.png`, fullPage: true });
  await page.getByRole("button", { name: /Отметить выполненным/ }).click();
  await page.getByText(/шагов выполнено/).waitFor();

  expect(consoleErrors.length === 0, `Ошибки console: ${consoleErrors.join(" | ")}`);
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(baseUrl, { waitUntil: "networkidle" });
  await mobilePage.getByRole("button", { name: "Посмотреть демо" }).click();
  await mobilePage.getByRole("heading", { name: /профиль поступления/ }).waitFor();
  const overflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow <= 1, `Горизонтальный overflow на mobile: ${overflow}px`);
  await mobilePage.screenshot({ path: `${output}/05-results-mobile.png`, fullPage: false });
  await mobilePage.getByRole("button", { name: /Сравнить варианты/ }).click();
  await mobilePage.screenshot({ path: `${output}/06-compare-mobile.png`, fullPage: false });
  await mobile.close();

  const journey = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  const journeyPage = await journey.newPage();
  await journeyPage.goto(baseUrl, { waitUntil: "networkidle" });
  await journeyPage.getByRole("button", { name: /Построить мой маршрут/ }).click();
  await journeyPage.getByRole("heading", { name: /Кто ты и когда поступаешь/ }).waitFor();
  await journeyPage.screenshot({ path: `${output}/07-onboarding-desktop.png`, fullPage: false });
  await journeyPage.getByRole("button", { name: /Продолжить/ }).click();
  await journeyPage.getByRole("button", { name: /Cybersecurity/ }).click();
  await journeyPage.getByRole("button", { name: /Продолжить/ }).click();
  await journeyPage.getByLabel(/Пробный или итоговый ЕНТ/).fill("96");
  await journeyPage.getByRole("button", { name: /Продолжить/ }).click();
  await journeyPage.getByRole("button", { name: /до 1.5 млн/ }).click();
  await journeyPage.getByRole("button", { name: /Продолжить/ }).click();
  await journeyPage.getByRole("button", { name: /Найти мои программы/ }).click();
  await journeyPage.getByText("Cybersecurity", { exact: true }).first().waitFor();
  const firstProgram = await journeyPage.locator(".match-card .match-info > p").first().innerText();
  expect(firstProgram.includes("Cybersecurity") || firstProgram.includes("Information Security"), `Направление не повлияло на лидера: ${firstProgram}`);
  await journey.close();

  console.log(`Smoke test passed: ${cards} recommendations, manual journey works, no console errors, mobile overflow <= 1px.`);
} finally {
  await browser.close();
}
