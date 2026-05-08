import { mkdirSync } from "node:fs";
import { chromium, type Page } from "playwright";

const APP_URL =
  process.env.SCREENSHOT_URL ?? "https://close-frontend-assessment.vercel.app/";
const OUT_DIR = "./assets";

mkdirSync(OUT_DIR, { recursive: true });

async function shot(
  name: string,
  fn?: (page: Page) => Promise<void>,
  viewport = { width: 1280, height: 800 },
): Promise<void> {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport });

  try {
    const page = await context.newPage();
    await page.goto(APP_URL, { waitUntil: "networkidle" });
    if (fn) await fn(page);
    await page.screenshot({ path: `${OUT_DIR}/${name}.png`, fullPage: false });
    console.log(`✓ ${name}.png`);
  } finally {
    await context.close();
    await browser.close();
  }
}

// 1. Desktop — default state
await shot("desktop-default");

// 2. Desktop — five items selected (side rail populated)
await shot("desktop-selected", async (page) => {
  const items = page.locator('[role="option"]');
  for (const i of [0, 1, 2, 3, 4]) await items.nth(i).click();
});

// 3. Desktop — search active
await shot("desktop-search", async (page) => {
  await page.fill('[aria-label="Search items"]', "mango");
  await page.waitForTimeout(300);
});

// 4. Desktop — color filter active
await shot("desktop-filter", async (page) => {
  await page.click('button.ColorBadge:has-text("Red")');
  await page.click('button.ColorBadge:has-text("Orange")');
});

// 5. Desktop — no results empty state
await shot("desktop-no-results", async (page) => {
  await page.fill('[aria-label="Search items"]', "zzznomatch");
  await page.waitForTimeout(300);
});

// 6. Mobile — default state (side rail collapses when empty)
await shot("mobile-default", undefined, { width: 390, height: 844 });

// 7. Mobile — with selection (side rail expands)
await shot("mobile-selected", async (page) => {
  const items = page.locator('[role="option"]');
  for (const i of [0, 1, 2]) await items.nth(i).click();
}, { width: 390, height: 844 });

console.log("Done.");
