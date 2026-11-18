import type { RomanticTrackId } from './romanticAudio';

export type GalleryLayout = 'polaroid' | 'slide';
export type ExportAmbianceMode = 'both' | 'petals' | 'stars';

export interface PhotoMemory {
  id: string;
  src: string;
  caption: string;
}

export interface GreetingCardContent {
  kicker: string;
  headline: string;
  galleryHeading: string;
  galleryLayout: GalleryLayout;
  ambianceMode: ExportAmbianceMode;
  musicTrack?: RomanticTrackId;
  photos: PhotoMemory[];
  paragraph1: string;
  paragraph2: string;
  paragraph3: string;
  closingLabel: string;
  senderName: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildStandaloneHtml(content: GreetingCardContent): string {
  const isSlide = content.galleryLayout === 'slide';
  const petalCount =
    content.ambianceMode === 'stars'
      ? 0
      : content.ambianceMode === 'petals'
        ? 30
        : 20;
  const starCount =
    content.ambianceMode === 'petals'
      ? 0
      : content.ambianceMode === 'stars'
        ? 42
        : 26;

  const photosHtml = content.photos
    .map(
      (photo, index) => `
        <figure class="kartu-foto${index === 0 ? ' aktif' : ''}" onclick="bukaLightbox(${index})">
          <div class="area-gambar">
            <img src="${escapeHtml(photo.src)}" alt="${escapeHtml(photo.caption)}" />
          </div>
          <figcaption class="caption-foto">${escapeHtml(photo.caption)}</figcaption>
        </figure>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(content.headline)}</title>

  <!-- Memuat font kaligrafi 'Great Vibes' dan font teks elegan dari Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Great+Vibes&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet" />

  <style>
    /* Reset dasar dan pengaturan tata letak halaman penuh */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2.5rem 1.25rem;
      color: #ffffff;
      font-family: 'Cormorant Garamond', Georgia, serif;
      /* Latar belakang gradien romantis merah jambu ke ungu */
      background:
        radial-gradient(circle at 18% 20%, rgba(251, 113, 133, 0.34) 0%, transparent 48%),
        radial-gradient(circle at 82% 80%, rgba(168, 85, 247, 0.32) 0%, transparent 52%),
        linear-gradient(145deg, #be185d 0%, #9d174d 28%, #701a75 64%, #3b0764 100%);
      background-attachment: fixed;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }

    /* Kanvas untuk efek jatuh kelopak mawar dan bintang kecil */
    #efek-jatuh {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
    }

    /* Wadah utama kartu ucapan di tengah halaman */
    .kartu-ucapan {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 780px;
      padding: clamp(2.25rem, 5vw, 4rem);
      border-radius: 1.5rem;
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      border: 1px solid rgba(255, 255, 255, 0.24);
      box-shadow: 0 24px 60px rgba(38, 6, 48, 0.36);
      text-align: center;
    }

    .pembuka {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.8125rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(255, 232, 242, 0.86);
      margin-bottom: 0.75rem;
    }

    /* Judul utama dengan font kaligrafi Great Vibes */
    .judul-kaligrafi {
      font-family: 'Great Vibes', cursive;
      font-size: clamp(2.6rem, 6vw, 4.1rem);
      font-weight: 400;
      line-height: 1.2;
      color: #ffffff;
      text-shadow: 0 2px 18px rgba(45, 10, 49, 0.35);
      margin-bottom: 1.25rem;
    }

    /* Garis pemisah ornamen halus */
    .pemisah {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.85rem;
      margin: 0 auto 2rem;
      max-width: 240px;
      opacity: 0.78;
    }

    .pemisah::before,
    .pemisah::after {
      content: "";
      height: 1px;
      flex: 1;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
    }

    /* Bagian galeri foto kenangan */
    .bagian-galeri {
      margin: 0 auto 2.5rem;
    }

    .judul-galeri {
      font-family: 'Great Vibes', cursive;
      font-size: clamp(1.75rem, 3.5vw, 2.25rem);
      color: rgba(255, 240, 246, 0.96);
      margin-bottom: 1.35rem;
    }

    /* Mode Polaroid Kenangan */
    .galeri-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(185px, 1fr));
      gap: 1.35rem;
      align-items: start;
      justify-items: center;
    }

    .kartu-foto {
      width: 100%;
      max-width: 260px;
      background: #fff9fb;
      color: #4a1936;
      padding: 0.65rem 0.65rem 1.05rem;
      border-radius: 0.75rem;
      box-shadow: 0 16px 34px rgba(34, 6, 44, 0.34);
      cursor: zoom-in;
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .galeri-grid .kartu-foto:nth-child(odd) {
      transform: rotate(-1.6deg);
    }

    .galeri-grid .kartu-foto:nth-child(even) {
      transform: rotate(1.5deg);
    }

    .galeri-grid .kartu-foto:hover {
      transform: rotate(0deg) translateY(-4px);
    }

    .area-gambar {
      width: 100%;
      aspect-ratio: 4 / 3;
      border-radius: 0.45rem;
      overflow: hidden;
      background: #f5e1ea;
    }

    .area-gambar img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .caption-foto {
      margin-top: 0.7rem;
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 1rem;
      font-style: italic;
      font-weight: 500;
      line-height: 1.35;
      color: #5a1c40;
    }

    /* Mode Tayangan Slide Romantis */
    .galeri-grid.mode-slide {
      display: block;
      max-width: 460px;
      margin: 0 auto;
    }

    .galeri-grid.mode-slide .kartu-foto {
      display: none;
      max-width: 100%;
      transform: none;
      padding: 0.85rem 0.85rem 1.2rem;
    }

    .galeri-grid.mode-slide .kartu-foto.aktif {
      display: block;
    }

    .kontrol-slide {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-top: 1rem;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.8125rem;
      color: rgba(255, 232, 242, 0.9);
    }

    .btn-slide {
      background: rgba(255, 255, 255, 0.14);
      border: 1px solid rgba(255, 255, 255, 0.28);
      color: #ffffff;
      padding: 0.4rem 0.85rem;
      border-radius: 0.55rem;
      font-size: 0.8rem;
      cursor: pointer;
    }

    .btn-slide:hover {
      background: rgba(255, 255, 255, 0.24);
    }

    /* Kolom teks pesan romantis */
    .isi-pesan {
      max-width: 600px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
      font-size: clamp(1.125rem, 2.2vw, 1.25rem);
      line-height: 1.82;
      color: rgba(255, 255, 255, 0.94);
      text-shadow: 0 1px 10px rgba(38, 6, 48, 0.25);
    }

    .penutup {
      max-width: 600px;
      margin: 2.25rem auto 0;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.16);
    }

    .salam-penutup {
      font-size: 1.0625rem;
      font-style: italic;
      color: rgba(255, 235, 245, 0.88);
    }

    .nama-pengirim {
      font-family: 'Great Vibes', cursive;
      font-size: clamp(2rem, 4.5vw, 2.65rem);
      color: #ffffff;
      margin-top: 0.25rem;
    }

    /* Pratinjau foto layar penuh saat foto diklik */
    .lightbox {
      position: fixed;
      inset: 0;
      z-index: 50;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 1.25rem;
      background: rgba(45, 10, 49, 0.86);
      backdrop-filter: blur(10px);
    }

    .lightbox.terbuka {
      display: flex;
    }

    .lightbox-isi {
      position: relative;
      max-width: 680px;
      background: #fff9fb;
      color: #4a1936;
      padding: 0.75rem 0.75rem 1.25rem;
      border-radius: 1rem;
      text-align: center;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
    }

    .lightbox-isi img {
      display: block;
      max-width: 100%;
      max-height: 70vh;
      border-radius: 0.65rem;
      margin: 0 auto;
    }

    .lightbox-caption {
      margin-top: 0.85rem;
      font-size: 1.15rem;
      font-style: italic;
    }

    .lightbox-tutup {
      position: absolute;
      top: -0.75rem;
      right: -0.75rem;
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 999px;
      border: none;
      background: #ffffff;
      color: #831843;
      font-size: 1.2rem;
      cursor: pointer;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
    }

    /* Pengaturan khusus jika dicetak */
    @media print {
      body {
        background: #ffffff !important;
        color: #2b1328 !important;
      }
      #efek-jatuh,
      .kontrol-slide,
      .lightbox {
        display: none !important;
      }
      .kartu-ucapan {
        background: #ffffff !important;
        border: 1px solid #d6b4c7 !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
      }
      .galeri-grid {
        display: grid !important;
        grid-template-columns: repeat(3, 1fr) !important;
        max-width: 100% !important;
      }
      .galeri-grid .kartu-foto {
        display: block !important;
        transform: none !important;
        border: 1px solid #e6ceda !important;
        box-shadow: none !important;
      }
      .kartu-ucapan *,
      .kartu-foto * {
        color: #2b1328 !important;
        text-shadow: none !important;
      }
    }
  </style>
</head>
<body>
  <!-- Kanvas animasi kelopak mawar & bintang kecil -->
  <canvas id="efek-jatuh" aria-hidden="true"></canvas>

  <!-- Kartu Ucapan Khusus tanpa tombol opsi di bawahnya -->
  <main class="kartu-ucapan">
    <div class="pembuka">${escapeHtml(content.kicker)}</div>

    <h1 style="font-weight: 400;">
      <div class="judul-kaligrafi">${escapeHtml(content.headline)}</div>
    </h1>

    <div class="pemisah" aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="1.5">
        <path d="M12 21s-6.5-4.35-9-8.5C1.1 9.35 2.7 5.5 6.5 5.1c2.1-.22 4.1.86 5.5 2.65 1.4-1.79 3.4-2.87 5.5-2.65 3.8.4 5.4 4.25 3.5 7.4C18.5 16.65 12 21 12 21z" />
      </svg>
    </div>

    ${
      content.photos.length > 0
        ? `<!-- Galeri Foto Kenangan -->
    <section class="bagian-galeri">
      <div class="judul-galeri">${escapeHtml(content.galleryHeading)}</div>

      <div id="galeri-grid" class="galeri-grid${isSlide ? ' mode-slide' : ''}">
        ${photosHtml}
      </div>

      ${
        isSlide && content.photos.length > 1
          ? `<div class="kontrol-slide">
        <button type="button" class="btn-slide" onclick="geserSlide(-1)">Sebelumnya</button>
        <span id="indikator-slide">1 / ${content.photos.length}</span>
        <button type="button" class="btn-slide" onclick="geserSlide(1)">Berikutnya</button>
      </div>`
          : ''
      }
    </section>`
        : ''
    }

    <div class="isi-pesan">
      <div>${escapeHtml(content.paragraph1)}</div>
      <div>${escapeHtml(content.paragraph2)}</div>
      <div>${escapeHtml(content.paragraph3)}</div>
    </div>

    <div class="penutup">
      <div class="salam-penutup">${escapeHtml(content.closingLabel)}</div>
      <div class="nama-pengirim">${escapeHtml(content.senderName)}</div>
    </div>
  </main>

  <!-- Pratinjau foto saat diklik -->
  <div id="lightbox" class="lightbox" onclick="tutupLightbox()">
    <div class="lightbox-isi" onclick="event.stopPropagation()">
      <button type="button" class="lightbox-tutup" aria-label="Tutup" onclick="tutupLightbox()">&times;</button>
      <img id="lightbox-img" src="" alt="Foto kenangan" />
      <p id="lightbox-caption" class="lightbox-caption"></p>
    </div>
  </div>

  <script>
    // 1. Navigasi slide & pratinjau foto layar penuh
    let indeksSlide = 0;
    const daftarFotoEl = document.querySelectorAll("#galeri-grid .kartu-foto");

    function geserSlide(arah) {
      if (daftarFotoEl.length === 0) return;
      daftarFotoEl[indeksSlide].classList.remove("aktif");
      indeksSlide = (indeksSlide + arah + daftarFotoEl.length) % daftarFotoEl.length;
      daftarFotoEl[indeksSlide].classList.add("aktif");
      const indikator = document.getElementById("indikator-slide");
      if (indikator) indikator.textContent = (indeksSlide + 1) + " / " + daftarFotoEl.length;
    }

    function bukaLightbox(idx) {
      const kartu = daftarFotoEl[idx];
      if (!kartu) return;
      const img = kartu.querySelector("img");
      const cap = kartu.querySelector(".caption-foto");
      document.getElementById("lightbox-img").src = img ? img.src : "";
      document.getElementById("lightbox-caption").textContent = cap ? cap.textContent : "";
      document.getElementById("lightbox").classList.add("terbuka");
    }

    function tutupLightbox() {
      document.getElementById("lightbox").classList.remove("terbuka");
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") tutupLightbox();
    });

    // 2. Animasi jatuh kelopak mawar & bintang kecil pada elemen canvas
    (function () {
      const canvas = document.getElementById("efek-jatuh");
      const ctx = canvas.getContext("2d");
      const kurangiGerak = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let lebar = window.innerWidth;
      let tinggi = window.innerHeight;

      function aturUkuran() {
        lebar = window.innerWidth;
        tinggi = window.innerHeight;
        canvas.width = lebar;
        canvas.height = tinggi;
      }
      aturUkuran();
      window.addEventListener("resize", aturUkuran);

      const warnaKelopak = [
        "rgba(255, 205, 222, 0.72)",
        "rgba(251, 164, 198, 0.68)",
        "rgba(244, 114, 182, 0.56)",
        "rgba(255, 232, 240, 0.68)"
      ];

      function buatKelopak(dariAtas) {
        return {
          x: Math.random() * lebar,
          y: dariAtas ? -20 - Math.random() * 60 : Math.random() * tinggi,
          ukuran: 7 + Math.random() * 8,
          kecepatanY: 0.55 + Math.random() * 0.85,
          kecepatanX: (Math.random() - 0.5) * 0.35,
          fase: Math.random() * Math.PI * 2,
          rotasi: Math.random() * Math.PI * 2,
          kecepatanRotasi: (Math.random() - 0.5) * 0.025,
          warna: warnaKelopak[Math.floor(Math.random() * warnaKelopak.length)]
        };
      }

      function buatBintang(dariAtas) {
        return {
          x: Math.random() * lebar,
          y: dariAtas ? -12 - Math.random() * 50 : Math.random() * tinggi,
          ukuran: 2.2 + Math.random() * 3.5,
          kecepatanY: 0.25 + Math.random() * 0.45,
          fase: Math.random() * Math.PI * 2
        };
      }

      const daftarKelopak = Array.from({ length: ${petalCount} }, function () { return buatKelopak(false); });
      const daftarBintang = Array.from({ length: ${starCount} }, function () { return buatBintang(false); });
      let waktu = 0;

      function gambar() {
        waktu += 1;
        ctx.clearRect(0, 0, lebar, tinggi);

        for (let i = 0; i < daftarBintang.length; i++) {
          const b = daftarBintang[i];
          const kilau = 0.45 + 0.55 * Math.sin(waktu * 0.03 + b.fase);
          ctx.save();
          ctx.translate(b.x, b.y);
          ctx.globalAlpha = kilau;
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          for (let j = 0; j < 8; j++) {
            const r = j % 2 === 0 ? b.ukuran : b.ukuran * 0.28;
            const sudut = (j * Math.PI) / 4;
            if (j === 0) ctx.moveTo(Math.cos(sudut) * r, Math.sin(sudut) * r);
            else ctx.lineTo(Math.cos(sudut) * r, Math.sin(sudut) * r);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          if (!kurangiGerak) {
            b.y += b.kecepatanY;
            if (b.y > tinggi + 16) daftarBintang[i] = buatBintang(true);
          }
        }

        for (let i = 0; i < daftarKelopak.length; i++) {
          const k = daftarKelopak[i];
          ctx.save();
          ctx.translate(k.x, k.y);
          ctx.rotate(k.rotasi);
          ctx.scale(1, 0.75 + Math.sin(waktu * 0.02 + k.fase) * 0.25);
          ctx.fillStyle = k.warna;
          ctx.beginPath();
          ctx.moveTo(0, -k.ukuran);
          ctx.bezierCurveTo(k.ukuran * 0.9, -k.ukuran * 0.65, k.ukuran * 0.85, k.ukuran * 0.65, 0, k.ukuran);
          ctx.bezierCurveTo(-k.ukuran * 0.65, k.ukuran * 0.6, -k.ukuran * 0.75, -k.ukuran * 0.55, 0, -k.ukuran);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          if (!kurangiGerak) {
            k.y += k.kecepatanY;
            k.x += k.kecepatanX + Math.sin(waktu * 0.012 + k.fase) * 0.35;
            k.rotasi += k.kecepatanRotasi;
            if (k.y > tinggi + 24) daftarKelopak[i] = buatKelopak(true);
          }
        }

        if (!kurangiGerak) requestAnimationFrame(gambar);
      }

      gambar();
    })();
  </script>
</body>
</html>`;
}
