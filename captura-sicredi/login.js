import puppeteer from "puppeteer";
import fs from "fs-extra";

const COOKIES_PATH = "./cookies.json";
const FIRST_URL = JSON.parse(await fs.readFile("./pages-config.json", "utf8"))[0].src;

const browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 1366, height: 900 } });
const page = await browser.newPage();

await page.goto(FIRST_URL, { waitUntil: "networkidle2", timeout: 0 });
console.log("\n👉 Faça login na CONTA VIEWER do Google. Quando o relatório carregar, volte aqui e pressione ENTER.");
await new Promise((r) => process.stdin.once("data", r));

const cookies = await page.cookies();
await fs.writeJson(COOKIES_PATH, cookies, { spaces: 2 });
console.log("✅ Cookies salvos em cookies.json");

await browser.close();
