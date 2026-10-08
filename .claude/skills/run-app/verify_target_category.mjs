import { chromium } from "playwright";
import fs from "node:fs";

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
const box = await page.locator(".leaflet-container").boundingBox();
const at = (fx, fy) => page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);

const settings = (legend) =>
  page.locator("fieldset", { has: page.locator("legend", { hasText: legend }) });

async function save() {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Save" }).click(),
  ]);
  return JSON.parse(fs.readFileSync(await download.path(), "utf8"));
}

// Ballistic missile: start + stop click, then pick a category.
await page.getByRole("button", { name: "+ Ballistic Missile" }).click();
await at(0.4, 0.5);
// The stop-point listener is only armed once the start elevation lookup returns.
await page.waitForTimeout(2000);
await at(0.6, 0.5);
const missile = settings("Ballistic Missile Settings");
await missile.waitFor({ state: "visible", timeout: 5000 });
const missileSelect = missile.locator('label:has-text("Category") + select');
const missileDefault = await missileSelect.inputValue();
await missileSelect.selectOption("MEDIUM_RANGE_BALLISTIC_MISSILE");
await page.screenshot({ path: `${outDir}/missile_category.png`, fullPage: true });

// Drone swarm: one click, then pick a drone class.
await page.getByRole("button", { name: "+ Drone Swarm" }).click();
await at(0.5, 0.3);
const swarm = settings("Drone Swarm Settings");
await swarm.waitFor({ state: "visible", timeout: 5000 });
const swarmSelect = swarm.locator('label:has-text("Drone class") + select');
const swarmDefault = await swarmSelect.inputValue();
await swarmSelect.selectOption("DRONE_CLASS_III");
await page.screenshot({ path: `${outDir}/drone_class.png`, fullPage: true });

const saved = await save();
fs.writeFileSync(`${outDir}/scenario_saved.json`, JSON.stringify(saved, null, 2));

// Legacy file: no missile category, swarm trajectory with target_sidc only.
const legacy = structuredClone(saved);
delete legacy.ballistic_missiles[0].category;
delete legacy.drone_swarms[0].swarm_trajectory.target_info;
legacy.drone_swarms[0].swarm_trajectory.target_sidc = "10260100001101000000";
const legacyPath = `${outDir}/scenario_legacy.json`;
fs.writeFileSync(legacyPath, JSON.stringify(legacy));
await page.locator('input[type="file"]').setInputFiles(legacyPath);
await page.waitForTimeout(1000);
const reloaded = await save();

console.log(
  JSON.stringify(
    {
      missileDefault,
      swarmDefault,
      savedMissileCategory: saved.ballistic_missiles[0].category,
      savedSwarmTargetInfo: saved.drone_swarms[0].swarm_trajectory.target_info,
      legacyMissileCategory: reloaded.ballistic_missiles[0].category,
      legacySwarmTargetInfo: reloaded.drone_swarms[0].swarm_trajectory.target_info,
      legacySwarmHasTargetSidc: "target_sidc" in reloaded.drone_swarms[0].swarm_trajectory,
      consoleErrors: consoleErrors.filter((e) => !e.includes("ERR_CONNECTION_REFUSED")),
    },
    null,
    2,
  ),
);
await browser.close();
