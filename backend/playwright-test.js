const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({
    headless: true,
  });

  const page = await browser.newPage({
    viewport: {
      width: 1440,
      height: 900,
    },
  });

  console.log("Opening website...");

  await page.goto("https://www.nike.com", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  console.log("Page loaded!");

  console.log("Title:", await page.title());

  console.log(
    "H1:",
    await page.locator("h1").first().textContent().catch(() => "No H1")
  );

  await page.screenshot({
    path: "nike-test.png",
    fullPage: true,
  });

  console.log("Screenshot saved as nike-test.png");

  await browser.close();

  console.log("Browser closed.");
})();