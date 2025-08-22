// captura-sicredi/server.js (Corrigido para ES Modules e com cookies)
import express from 'express';
import cors from 'cors';
import fs from 'fs-extra'; // Usando fs-extra para ler JSON facilmente
import path from 'path';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';

// Helper para obter o __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

const COOKIES_PATH = path.join(__dirname, 'cookies.json');
const CAPTURES_DIR = path.join(__dirname, 'capturas');
fs.ensureDirSync(CAPTURES_DIR); // Garante que o diretório exista

let browserPromise = puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
});

app.get('/capture', async (req, res) => {
const { url, w = '650', h = '1350', full = '1', dpr = '1.5' } = req.query;  if (!url) {
    return res.status(400).json({ error: 'Missing url param' });
  }

  let page;
  try {
    const browser = await browserPromise;
    page = await browser.newPage();
    
    // **A PARTE MAIS IMPORTANTE: Carregar os cookies!**
    if (await fs.pathExists(COOKIES_PATH)) {
      const cookies = await fs.readJson(COOKIES_PATH);
      await page.setCookie(...cookies);
      console.log('✅ Cookies de autenticação carregados com sucesso.');
    } else {
      console.warn('⚠️ Arquivo cookies.json não encontrado. A captura pode falhar se a página exigir login.');
    }

    await page.setViewport({
      width: parseInt(w, 10),
      height: parseInt(h, 10),
      deviceScaleFactor: parseFloat(dpr),
    });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Um tempo de espera extra para garantir que os gráficos complexos do Looker renderizem
    await new Promise(r => setTimeout(r, 5000));

    const buffer = await page.screenshot({
      type: 'png',
      fullPage: full === '1',
    });
    
    res.json({
      ok: true,
      dataUrl: `data:image/png;base64,${buffer.toString('base64')}`,
    });

  } catch (err) {
    console.error('❌ ERRO NA CAPTURA:', err);
    res.status(500).json({ ok: false, error: String(err) });
  } finally {
    if (page) {
      await page.close();
    }
  }
});

// Servir o próprio index.html e outros arquivos estáticos
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Servir outros arquivos estáticos (como CSS ou imagens no futuro)
app.use(express.static(path.join(__dirname))); 

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Servidor de captura rodando em http://localhost:${PORT}`);
  console.log('📄 Frontend servido na mesma porta. Acesse http://localhost:3001/index.html');
});