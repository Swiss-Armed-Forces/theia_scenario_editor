import { chromium } from "playwright";

const url = process.argv[2] ?? "http://localhost:5173";
const outDir = process.argv[3] ?? "/tmp";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});

await page.goto(url);
await page.waitForSelector(".leaflet-container");
await page.waitForTimeout(1000);

// Click the "+ Critical Infrastructure" button, then click a point on the map.
await page.getByRole("button", { name: "+ Critical Infrastructure" }).click();
const map = page.locator(".leaflet-container");
const box = await map.boundingBox();
await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

// Should auto-select: settings panel appears.
const settingsFieldset = page.locator("fieldset", {
  has: page.locator("legend", { hasText: "Critical Infrastructure Settings" }),
});
await settingsFieldset.waitFor({ state: "visible", timeout: 5000 });

// Rename it.
const nameInput = settingsFieldset.locator("input[type=text]").first();
await nameInput.fill("");
await nameInput.fill("Test Power Plant");
await page.waitForTimeout(300);

await page.screenshot({
  path: `${outDir}/critical_infra_settings.png`,
  fullPage: true,
});

// Sidebar list should show the renamed item.
const listItem = page.locator(".SensorListItem", { hasText: "Test Power Plant" });
await listItem.waitFor({ state: "visible", timeout: 5000 });

// Hover the marker and check tooltip text.
const marker = page.locator(".leaflet-marker-pane .leaflet-marker-icon").last();
await marker.hover();
await page.waitForTimeout(300);
const tooltip = page.locator(".leaflet-tooltip");
await tooltip.waitFor({ state: "visible", timeout: 5000 });
const tooltipText = await tooltip.textContent();

await page.screenshot({
  path: `${outDir}/critical_infra_hover_tooltip.png`,
  fullPage: true,
});

console.log(
  JSON.stringify(
    {
      settingsPanelFound: true,
      sidebarListItemFound: true,
      tooltipText,
      consoleErrors: consoleErrors.filter(
        (e) => !e.includes("ERR_CONNECTION_REFUSED"),
      ),
    },
    null,
    2,
  ),
);

await browser.close();
