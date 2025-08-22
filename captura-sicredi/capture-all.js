import puppeteer from "puppeteer";
import fs from "fs-extra";
import { formatISO } from "date-fns";

const PAGES = JSON.parse(await fs.readFile("./pages-config.json", "utf8"));
const COOKIES_PATH = "./cookies.json";
const OUT_DIR = "./public/capturas";
await fs.ensureDir(OUT_DIR);

const browser = await puppeteer.launch({
  headless: "new",
  defaultViewport: { width: 1600, height: 1500 }
});
const page = await browser.newPage();

// cookies (login que você salvou)
if (await fs.pathExists(COOKIES_PATH)) {
  const cookies = await fs.readJson(COOKIES_PATH);
  await page.setCookie(...cookies);
}

const items = [];
for (const p of PAGES) {
  const url = p.src;
  const pageId = (url.match(/\/page\/([^/?#]+)/) || [,"default"])[1];

  console.log("⏳ Abrindo:", p.title);
  await page.goto(url, { waitUntil: "networkidle2", timeout: 0 });
  await page.waitForTimeout(5000); // dá tempo de renderizar

  const stamp = formatISO(new Date()).replace(/[:]/g, "-");
  const latestName = `${pageId}-latest.png`;
  const fileName = `${pageId}-${stamp}.png`;

  await page.screenshot({ path: `${OUT_DIR}/${fileName}`, fullPage: true });
  await fs.copyFile(`${OUT_DIR}/${fileName}`, `${OUT_DIR}/${latestName}`);

  items.push({
    title: p.title,
    src: url,
    pageId,
    image: `/capturas/${latestName}`,
    updatedAt: stamp
  });

  console.log("🖼️  Gerado:", latestName);
}

await fs.writeJson(`${OUT_DIR}/manifest.json`, { generatedAt: formatISO(new Date()), items }, { spaces: 2 });
console.log("📄 manifest.json atualizado.");

await browser.close();
