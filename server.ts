import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const CARDS_DIR = path.resolve(__dirname, '.data/cards');
const SAFE_ID_REGEX = /^[A-Za-z0-9_-]{4,24}$/;

interface PhotoPayload {
  id: string;
  src: string;
  caption: string;
}

interface CardPayload {
  kicker: string;
  headline: string;
  galleryHeading: string;
  galleryLayout: 'polaroid' | 'slide';
  ambianceMode: 'both' | 'petals' | 'stars';
  musicTrack: 'senja' | 'bintang' | 'abadi';
  photos: PhotoPayload[];
  paragraph1: string;
  paragraph2: string;
  paragraph3: string;
  closingLabel: string;
  senderName: string;
}

async function ensureCardsDir() {
  await fs.mkdir(CARDS_DIR, { recursive: true });
}

function sanitizeCardPayload(body: unknown): CardPayload | null {
  if (!body || typeof body !== 'object') return null;
  const raw = body as Record<string, unknown>;

  const asText = (value: unknown, fallback = '', maxLen = 4000): string => {
    if (typeof value !== 'string') return fallback;
    return value.trim().slice(0, maxLen);
  };

  const galleryLayout =
    raw.galleryLayout === 'slide' ? 'slide' : 'polaroid';
  const ambianceMode =
    raw.ambianceMode === 'petals' || raw.ambianceMode === 'stars'
      ? raw.ambianceMode
      : 'both';

  const rawPhotos = Array.isArray(raw.photos) ? raw.photos.slice(0, 15) : [];
  const photos: PhotoPayload[] = [];
  for (let i = 0; i < rawPhotos.length; i++) {
    const item = rawPhotos[i];
    if (!item || typeof item !== 'object') continue;
    const p = item as Record<string, unknown>;
    if (typeof p.src !== 'string' || !p.src.trim()) continue;
    photos.push({
      id: asText(p.id, `photo-${i}`, 64),
      src: p.src,
      caption: asText(p.caption, 'Momen manis bersamamu', 300),
    });
  }

  return {
    kicker: asText(raw.kicker, 'Untukmu, di Hari Istimewamu', 200),
    headline: asText(raw.headline, 'Selamat Ulang Tahun', 200),
    galleryHeading: asText(raw.galleryHeading, 'Jejak Kenangan Kita', 200),
    galleryLayout,
    ambianceMode,
    musicTrack:
      raw.musicTrack === 'bintang' || raw.musicTrack === 'abadi'
        ? raw.musicTrack
        : 'senja',
    photos,
    paragraph1: asText(raw.paragraph1, '', 3000),
    paragraph2: asText(raw.paragraph2, '', 3000),
    paragraph3: asText(raw.paragraph3, '', 3000),
    closingLabel: asText(raw.closingLabel, 'Dengan segenap cinta,', 200),
    senderName: asText(raw.senderName, '', 200),
  };
}

async function startServer() {
  await ensureCardsDir();

  const app = express();
  app.use(express.json({ limit: '25mb' }));

  // Simpan kartu ucapan dan kembalikan ID singkat untuk link & QR Code
  app.post('/api/cards', async (req, res) => {
    try {
      const payload = sanitizeCardPayload(req.body);
      if (!payload || !payload.headline) {
        res.status(400).json({ error: 'Data ucapan tidak valid.' });
        return;
      }

      const id = crypto.randomBytes(6).toString('base64url').slice(0, 8);
      const record = {
        ...payload,
        id,
        createdAt: new Date().toISOString(),
      };

      await fs.writeFile(
        path.join(CARDS_DIR, `${id}.json`),
        JSON.stringify(record),
        'utf-8'
      );

      res.status(201).json({
        id,
        sharePath: `/u/${id}`,
      });
    } catch (err) {
      console.error('Gagal menyimpan kartu:', err);
      res.status(500).json({ error: 'Gagal menyimpan kartu ucapan.' });
    }
  });

  // Ambil kartu ucapan berdasarkan ID untuk ditampilkan lewat link / QR Code
  app.get('/api/cards/:id', async (req, res) => {
    const id = req.params.id;
    if (!SAFE_ID_REGEX.test(id)) {
      res.status(400).json({ error: 'ID ucapan tidak valid.' });
      return;
    }

    try {
      const filePath = path.join(CARDS_DIR, `${id}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      res.status(200).type('application/json').send(content);
    } catch {
      res.status(404).json({ error: 'Kartu ucapan tidak ditemukan.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server berjalan di http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Gagal menjalankan server:', err);
  process.exit(1);
});
