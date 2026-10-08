// Verifies the "+ Cruise Missile" entity: placement, settings form, range
// validation, Delete key, save/load, and that ballistic missiles still work.
//
//   node .claude/skills/run-app/verify_cruise_missile.mjs [url] [outDir]
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
const field = (form, label) => form.locator(`label:has-text("${label}") + input`);
const listItem = (text) => page.locator(".SensorListItem").filter({ hasText: text });

async function save() {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Save" }).click(),
  ]);
  return JSON.parse(fs.readFileSync(await download.path(), "utf8"));
}

async function load(data, name) {
  const path = `${outDir}/${name}`;
  fs.writeFileSync(path, JSON.stringify(data));
  await page.locator('input[type="file"]').setInputFiles(path);
  await page.waitForTimeout(1000);
}

// Selection is a toggle and survives loading a file, so only click the list
// item if its settings form isn't already open.
async function select(itemText, form) {
  if (!(await form.isVisible())) {
    await listItem(itemText).click();
  }
  await form.waitFor({ state: "visible", timeout: 5000 });
}

async function placeTwoClick(button, start, stop) {
  await page.getByRole("button", { name: button }).click();
  await at(...start);
  // The target listener is only armed once the start elevation lookup returns.
  await page.waitForTimeout(2000);
  await at(...stop);
}

const result = {};

// 1. Place a cruise missile; its settings open automatically.
await placeTwoClick("+ Cruise Missile", [0.3, 0.6], [0.7, 0.6]);
const form = settings("Cruise Missile Settings");
await form.waitFor({ state: "visible", timeout: 5000 });
result.listItemVisible = await listItem("Cruise missile #").isVisible();
result.markersOnMap = await page.locator(".leaflet-marker-pane .leaflet-marker-icon").count();
result.defaults = {};
for (const label of [
  "Speed",
  "Cruise altitude",
  "Min. flight-path angle",
  "Max. flight-path angle",
  "Terminal dive angle",
  "Sample spacing",
  "RCS",
]) {
  result.defaults[label] = await field(form, label).inputValue();
}
result.minClearancePlaceholder = await field(form, "Min. clearance").getAttribute("placeholder");

// 2. Edit fields.
await field(form, "Speed").fill("280");
await field(form, "Cruise altitude").fill("60");
await field(form, "Min. flight-path angle").fill("-5");
await field(form, "Max. flight-path angle").fill("20");
await field(form, "Min. clearance").fill("30");

// 3. An out-of-range value is flagged and not applied.
await field(form, "Max. flight-path angle").fill("95");
result.errorShownForInvalid = await form.getByRole("alert").isVisible();
result.errorText = await form.getByRole("alert").textContent();
const savedWhileInvalid = await save();
result.storedMaxAngleWhileInvalid = savedWhileInvalid.cruise_missiles[0].max_flight_path_angle;
await page.screenshot({ path: `${outDir}/cruise_missile_invalid.png`, fullPage: true });
await field(form, "Max. flight-path angle").fill("20");
result.errorGoneAfterFix = (await form.getByRole("alert").count()) === 0;
await page.screenshot({ path: `${outDir}/cruise_missile.png`, fullPage: true });

// 4. A ballistic missile still works next to it.
await placeTwoClick("+ Ballistic Missile", [0.3, 0.3], [0.7, 0.3]);
const ballisticForm = settings("Ballistic Missile Settings");
await ballisticForm.waitFor({ state: "visible", timeout: 5000 });
result.cruiseFormHiddenWhenBallisticSelected = !(await form.isVisible());
result.ballisticCategoryOptions = await ballisticForm
  .locator('label:has-text("Category") + select option')
  .evaluateAll((options) => options.map((o) => o.value));

const saved = await save();
fs.writeFileSync(`${outDir}/scenario_cruise_saved.json`, JSON.stringify(saved, null, 2));
result.savedCruiseMissiles = saved.cruise_missiles;
result.savedBallisticCount = saved.ballistic_missiles.length;
result.idsUnique =
  new Set([...saved.cruise_missiles, ...saved.ballistic_missiles].map((m) => m.target_id)).size ===
    saved.cruise_missiles.length + saved.ballistic_missiles.length &&
  new Set([...saved.cruise_missiles, ...saved.ballistic_missiles].map((m) => m.effector_id))
    .size ===
    saved.cruise_missiles.length + saved.ballistic_missiles.length;

// 5. Legacy file: no cruise_missiles key, ballistic missile with CRUISE_MISSILE category.
const legacy = structuredClone(saved);
delete legacy.cruise_missiles;
legacy.ballistic_missiles[0].category = "CRUISE_MISSILE";
await load(legacy, "scenario_cruise_legacy.json");
result.legacyCruiseListCount = await listItem("Cruise missile #").count();
await select("Ballistic missile #", ballisticForm);
const legacySelect = ballisticForm.locator('label:has-text("Category") + select');
result.legacyBallisticCategory = await legacySelect.inputValue();
result.legacyBallisticCategoryLabel = await legacySelect
  .locator("option:checked")
  .textContent();
result.legacyRoundTrip = (await save()).ballistic_missiles[0].category;

// 6. Reload the saved file, select the cruise missile, delete it with Delete.
await load(saved, "scenario_cruise_reload.json");
await select("Cruise missile #", form);
result.reloadedSpeed = await field(form, "Speed").inputValue();
await page.keyboard.press("Delete");
await page.waitForTimeout(500);
const afterDelete = await save();
result.cruiseMissilesAfterDelete = afterDelete.cruise_missiles.length;
result.ballisticAfterDelete = afterDelete.ballistic_missiles.length;

result.consoleErrors = consoleErrors.filter((e) => !e.includes("ERR_CONNECTION_REFUSED"));
console.log(JSON.stringify(result, null, 2));
await browser.close();
