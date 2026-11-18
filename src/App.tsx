/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import QRCode from 'qrcode';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Flower2,
  Heart,
  ImagePlus,
  Images,
  Link2,
  Music,
  Printer,
  QrCode,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import FallingAmbiance, { type AmbianceMode } from './components/FallingAmbiance';
import RecipientKeepsakeView from './components/RecipientKeepsakeView';
import {
  buildStandaloneHtml,
  type GalleryLayout,
  type GreetingCardContent,
  type PhotoMemory,
} from './utils/standaloneHtml';
import {
  ROMANTIC_TRACKS,
  getRomanticTrackUrl,
  type RomanticTrackId,
} from './utils/romanticAudio';

const INITIAL_TEXT = {
  kicker: 'Untukmu, di Hari Istimewamu',
  headline: 'Selamat Ulang Tahun, [Nama Pasangan]',
  galleryHeading: 'Jejak Kenangan Kita',
  paragraph1:
    'Dari detik pertama aku bertemu kamu, dunia terasa memiliki warna yang sebelumnya tidak pernah kukenal. Setiap tawa kecilmu, caramu menatapku saat bercerita, dan ketenangan yang selalu kamu bawa membuat setiap hari bersamamu terasa seperti anugerah yang tak ternilai.',
  paragraph2:
    'Di hari ulang tahunmu ini, aku hanya ingin kamu tahu betapa berartinya dirimu dalam hidupku. Terima kasih sudah menjadi rumah paling hangat tempatku pulang, menjadi penguat di saat langkahku terasa berat, dan menjadi alasan di balik doa-doa terbaik yang selalu kupanjatkan.',
  paragraph3:
    'Semoga tahun baru dalam hidupmu ini dipenuhi kebahagiaan yang tulus, kesehatan, dan mimpi-mimpi indah yang satu per satu terwujud. Apa pun yang menanti di depan sana, aku ingin terus menggenggam tanganmu dan merayakan setiap ulang tahunmu—hari ini, esok, dan selamanya.',
  closingLabel: 'Dengan segenap cinta,',
  senderName: 'Selalu milikmu, [Namamu]',
};

const INITIAL_PHOTOS: PhotoMemory[] = [
  {
    id: 'starter-1',
    src: '/src/assets/images/romantic_sunset_walk_1795017694134.jpg',
    caption: 'Langkah kecil kita menyusuri senja',
  },
  {
    id: 'starter-2',
    src: '/src/assets/images/romantic_roses_letter_1795017694805.jpg',
    caption: 'Setiap mawar mengingatkan pada senyummu',
  },
  {
    id: 'starter-3',
    src: '/src/assets/images/romantic_candlelight_evening_1795017694540.jpg',
    caption: 'Malam hangat penuh tawa dan doa baik',
  },
];

function getShareIdFromLocation(): string | null {
  const pathMatch = window.location.pathname.match(/^\/u\/([A-Za-z0-9_-]{4,24})\/?$/);
  if (pathMatch) return pathMatch[1];
  const queryId = new URLSearchParams(window.location.search).get('u');
  if (queryId && /^[A-Za-z0-9_-]{4,24}$/.test(queryId)) return queryId;
  return null;
}

function readFileAsOptimizedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.onload = (e) => {
      const dataUrl = e.target?.result;
      if (typeof dataUrl !== 'string') {
        reject(new Error('Format gambar tidak valid'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        const maxDim = 1400;
        if (img.width <= maxDim && img.height <= maxDim) {
          resolve(dataUrl);
          return;
        }
        const scale = Math.min(maxDim / img.width, maxDim / img.height);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

async function resolveImageToDataUrl(src: string): Promise<string> {
  if (src.startsWith('data:')) return src;
  try {
    const response = await fetch(src);
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        typeof reader.result === 'string' ? resolve(reader.result) : reject();
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return src;
  }
}

interface ShareResult {
  shareUrl: string;
  sharePath: string;
  qrDataUrl: string;
}

export default function App() {
  const [routeCardId] = useState<string | null>(() => getShareIdFromLocation());

  if (routeCardId) {
    return <RecipientKeepsakeView cardId={routeCardId} />;
  }

  return <EditorApp />;
}

function EditorApp() {
  const [ambianceMode, setAmbianceMode] = useState<AmbianceMode>('both');
  const [galleryLayout, setGalleryLayout] = useState<GalleryLayout>('polaroid');
  const [musicTrack, setMusicTrack] = useState<RomanticTrackId>('senja');
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [photos, setPhotos] = useState<PhotoMemory[]>(INITIAL_PHOTOS);
  const [activeSlide, setActiveSlide] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareResult, setShareResult] = useState<ShareResult | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetIdRef = useRef<string | null>(null);

  const trackUrl = useMemo(() => getRomanticTrackUrl(musicTrack), [musicTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.45;
    if (isMusicPlaying) {
      audio.play().catch(() => {
        setIsMusicPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isMusicPlaying, trackUrl]);

  const handleToggleMusic = () => {
    setIsMusicPlaying((prev) => !prev);
  };

  const kickerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const galleryHeadingRef = useRef<HTMLDivElement>(null);
  const captionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const p1Ref = useRef<HTMLDivElement>(null);
  const p2Ref = useRef<HTMLDivElement>(null);
  const p3Ref = useRef<HTMLDivElement>(null);
  const closingRef = useRef<HTMLDivElement>(null);
  const senderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeSlide >= photos.length && photos.length > 0) {
      setActiveSlide(photos.length - 1);
    }
  }, [photos.length, activeSlide]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev + 1) % photos.length
        );
      }
      if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev - 1 + photos.length) % photos.length
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIndex, photos.length]);

  const collectCardContent = async (): Promise<GreetingCardContent> => {
    const embeddedPhotos = await Promise.all(
      photos.map(async (photo) => ({
        ...photo,
        src: await resolveImageToDataUrl(photo.src),
        caption:
          captionRefs.current[photo.id]?.innerText.trim() || photo.caption,
      }))
    );

    return {
      kicker: kickerRef.current?.innerText.trim() || INITIAL_TEXT.kicker,
      headline: headlineRef.current?.innerText.trim() || INITIAL_TEXT.headline,
      galleryHeading:
        galleryHeadingRef.current?.innerText.trim() ||
        INITIAL_TEXT.galleryHeading,
      galleryLayout,
      ambianceMode,
      musicTrack,
      photos: embeddedPhotos,
      paragraph1: p1Ref.current?.innerText.trim() || INITIAL_TEXT.paragraph1,
      paragraph2: p2Ref.current?.innerText.trim() || INITIAL_TEXT.paragraph2,
      paragraph3: p3Ref.current?.innerText.trim() || INITIAL_TEXT.paragraph3,
      closingLabel:
        closingRef.current?.innerText.trim() || INITIAL_TEXT.closingLabel,
      senderName:
        senderRef.current?.innerText.trim() || INITIAL_TEXT.senderName,
    };
  };

  const handleAddPhotos = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const loaded = await Promise.all(
      files.map(async (file, idx) => ({
        id: `photo-${Date.now()}-${idx}`,
        src: await readFileAsOptimizedDataUrl(file),
        caption: 'Momen manis bersamamu',
      }))
    );

    setPhotos((prev) => {
      const next = [...prev, ...loaded];
      setActiveSlide(prev.length);
      return next;
    });

    event.target.value = '';
  };

  const triggerReplacePhoto = (photoId: string) => {
    replaceTargetIdRef.current = photoId;
    replaceInputRef.current?.click();
  };

  const handleReplacePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const targetId = replaceTargetIdRef.current;
    if (!file || !targetId) return;

    const optimized = await readFileAsOptimizedDataUrl(file);
    setPhotos((prev) =>
      prev.map((item) => (item.id === targetId ? { ...item, src: optimized } : item))
    );
    replaceTargetIdRef.current = null;
    event.target.value = '';
  };

  const handleRemovePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((item) => item.id !== photoId));
  };

  const handleCreateShareLink = async () => {
    if (isCreatingLink) return;
    setIsCreatingLink(true);
    setShareError(null);
    setCopiedLink(false);

    try {
      const content = await collectCardContent();
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });

      if (!response.ok) {
        throw new Error('Gagal membuat link ucapan. Coba kurangi ukuran foto atau ulangi.');
      }

      const data = (await response.json()) as { id: string; sharePath: string };
      const shareUrl = `${window.location.origin}${data.sharePath}`;
      const qrDataUrl = await QRCode.toDataURL(shareUrl, {
        width: 360,
        margin: 2,
        color: {
          dark: '#4a1936',
          light: '#ffffff',
        },
      });

      setShareResult({
        shareUrl,
        sharePath: data.sharePath,
        qrDataUrl,
      });
    } catch (err: unknown) {
      setShareError(
        err instanceof Error
          ? err.message
          : 'Terjadi kendala saat membuat link.'
      );
    } finally {
      setIsCreatingLink(false);
    }
  };

  const handleCopyShareUrl = async () => {
    if (!shareResult) return;
    try {
      await navigator.clipboard.writeText(shareResult.shareUrl);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      setCopiedLink(false);
    }
  };

  const handleDownloadQrPng = () => {
    if (!shareResult) return;
    const link = document.createElement('a');
    link.href = shareResult.qrDataUrl;
    link.download = 'qr-ucapan-ulang-tahun.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadHtml = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const content = await collectCardContent();
      const html = buildStandaloneHtml(content);

      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ucapan-ulang-tahun.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSavedFeedback(true);
      window.setTimeout(() => setSavedFeedback(false), 2400);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getPolaroidTiltClass = (index: number) => {
    const tilts = [
      'md:-rotate-[1.8deg]',
      'md:rotate-[1.4deg] md:translate-y-1',
      'md:-rotate-[1.2deg]',
      'md:rotate-[1.7deg]',
    ];
    return tilts[index % tilts.length];
  };

  return (
    <div className="romantic-backdrop relative flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-8">
      {/* Elemen audio tersembunyi untuk memutar instrumental romantis */}
      <audio
        ref={audioRef}
        src={trackUrl}
        loop
        preload="auto"
        className="hidden"
      />
      <FallingAmbiance mode={ambianceMode} />

      <main className="relative z-10 flex w-full max-w-[820px] flex-col items-center">
        {/* Kartu Ucapan Romantis */}
        <article
          className="print-card w-full rounded-3xl border border-white/25 bg-white/[0.08] px-6 py-10 text-center shadow-[0_24px_60px_rgba(38,6,48,0.36)] backdrop-blur-xl sm:px-12 sm:py-14"
          aria-label="Kartu Ucapan Ulang Tahun"
        >
          <div
            ref={kickerRef}
            contentEditable
            suppressContentEditableWarning
            aria-label="Pembuka ucapan"
            className="editable-block font-ui mb-3 inline-block px-2 py-1 text-xs font-medium tracking-[0.16em] text-rose-100/90 uppercase"
          >
            {INITIAL_TEXT.kicker}
          </div>

          <h1 className="m-0 font-normal">
            <div
              ref={headlineRef}
              contentEditable
              suppressContentEditableWarning
              aria-label="Judul ucapan ulang tahun"
              className="editable-block font-calligraphy mb-5 px-2 py-1 text-[clamp(2.6rem,6vw,4.15rem)] leading-[1.2] text-white [text-wrap:balance] drop-shadow-[0_2px_18px_rgba(45,10,49,0.35)]"
            >
              {INITIAL_TEXT.headline}
            </div>
          </h1>

          {/* Pemisah ornamen halus */}
          <div
            className="mx-auto mb-8 flex max-w-[240px] items-center justify-center gap-3.5 opacity-80"
            aria-hidden="true"
          >
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            <Heart className="h-4 w-4 text-rose-100" strokeWidth={1.6} />
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          </div>

          {/* Galeri Foto Kenangan Romantis */}
          {photos.length > 0 && (
            <section aria-label="Galeri foto kenangan" className="mb-10">
              <div className="mb-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                <div
                  ref={galleryHeadingRef}
                  contentEditable
                  suppressContentEditableWarning
                  aria-label="Judul galeri foto"
                  className="editable-block font-calligraphy px-2 py-0.5 text-[clamp(1.75rem,3.5vw,2.2rem)] leading-tight text-rose-50"
                >
                  {INITIAL_TEXT.galleryHeading}
                </div>

                {/* Pengalih Gaya Tampilan Galeri */}
                <div
                  role="group"
                  aria-label="Tampilan galeri foto"
                  className="no-print font-ui flex items-center gap-1 rounded-xl border border-white/20 bg-white/10 p-1"
                >
                  <button
                    type="button"
                    onClick={() => setGalleryLayout('polaroid')}
                    className={`inline-flex min-h-[34px] cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                      galleryLayout === 'polaroid'
                        ? 'bg-white text-rose-900 shadow-sm'
                        : 'text-white/85 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Images className="h-3.5 w-3.5" aria-hidden="true" />
                    Polaroid
                  </button>
                  <button
                    type="button"
                    onClick={() => setGalleryLayout('slide')}
                    className={`inline-flex min-h-[34px] cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                      galleryLayout === 'slide'
                        ? 'bg-white text-rose-900 shadow-sm'
                        : 'text-white/85 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                    Slide
                  </button>
                </div>
              </div>

              {galleryLayout === 'polaroid' ? (
                <div className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 md:grid-cols-3">
                  {photos.map((photo, index) => (
                    <figure
                      key={photo.id}
                      className={`group w-full max-w-[260px] rounded-xl bg-[#fff9fb] p-2.5 pb-4 text-rose-950 shadow-[0_16px_34px_rgba(34,6,44,0.34)] transition-transform duration-200 ease-out hover:z-10 hover:rotate-0 hover:-translate-y-1 ${getPolaroidTiltClass(
                        index
                      )}`}
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-rose-100">
                        <button
                          type="button"
                          onClick={() => setLightboxIndex(index)}
                          aria-label={`Lihat foto ${index + 1} lebih besar`}
                          className="block h-full w-full cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
                        >
                          <img
                            src={photo.src}
                            alt={photo.caption}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                        </button>

                        <div className="no-print font-ui absolute top-2 right-2 flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                          <button
                            type="button"
                            onClick={() => triggerReplacePhoto(photo.id)}
                            className="min-h-[28px] cursor-pointer rounded-md border border-white/40 bg-rose-950/75 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm transition-colors hover:bg-rose-900 focus-visible:outline-2 focus-visible:outline-white"
                          >
                            Ganti
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(photo.id)}
                            aria-label="Hapus foto ini"
                            className="inline-flex min-h-[28px] min-w-[28px] cursor-pointer items-center justify-center rounded-md border border-white/40 bg-rose-950/75 p-1 text-white backdrop-blur-sm transition-colors hover:bg-rose-900 focus-visible:outline-2 focus-visible:outline-white"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <figcaption className="mt-3 px-1">
                        <div
                          ref={(el) => {
                            captionRefs.current[photo.id] = el;
                          }}
                          contentEditable
                          suppressContentEditableWarning
                          aria-label={`Keterangan foto ${index + 1}`}
                          className="font-serif-body rounded-md px-1.5 py-0.5 text-[0.98rem] leading-snug font-medium italic text-rose-950/90 outline-none transition-colors hover:bg-rose-900/10 focus:bg-rose-900/10 focus:ring-1 focus:ring-rose-800/35"
                        >
                          {photo.caption}
                        </div>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              ) : (
                <div className="mx-auto max-w-[480px]">
                  <figure className="group rounded-2xl bg-[#fff9fb] p-3 pb-5 text-rose-950 shadow-[0_20px_44px_rgba(34,6,44,0.38)]">
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-rose-100">
                      <button
                        type="button"
                        onClick={() => setLightboxIndex(activeSlide)}
                        aria-label="Lihat foto lebih besar"
                        className="block h-full w-full cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
                      >
                        <img
                          src={photos[activeSlide]?.src}
                          alt={photos[activeSlide]?.caption}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      </button>

                      <div className="no-print font-ui absolute top-2.5 right-2.5 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            triggerReplacePhoto(photos[activeSlide].id)
                          }
                          className="min-h-[30px] cursor-pointer rounded-md border border-white/40 bg-rose-950/75 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-rose-900"
                        >
                          Ganti Foto
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleRemovePhoto(photos[activeSlide].id)
                          }
                          aria-label="Hapus foto ini"
                          className="inline-flex min-h-[30px] min-w-[30px] cursor-pointer items-center justify-center rounded-md border border-white/40 bg-rose-950/75 p-1 text-white backdrop-blur-sm transition-colors hover:bg-rose-900"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <figcaption className="mt-3.5 px-2">
                      <div
                        key={photos[activeSlide]?.id}
                        ref={(el) => {
                          if (photos[activeSlide]) {
                            captionRefs.current[photos[activeSlide].id] = el;
                          }
                        }}
                        contentEditable
                        suppressContentEditableWarning
                        aria-label="Keterangan foto"
                        className="font-serif-body rounded-md px-2 py-0.5 text-lg leading-snug font-medium italic text-rose-950/90 outline-none transition-colors hover:bg-rose-900/10 focus:bg-rose-900/10 focus:ring-1 focus:ring-rose-800/35"
                      >
                        {photos[activeSlide]?.caption}
                      </div>
                    </figcaption>
                  </figure>

                  {photos.length > 1 && (
                    <div className="no-print font-ui mt-4 flex items-center justify-center gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveSlide(
                            (prev) => (prev - 1 + photos.length) % photos.length
                          )
                        }
                        aria-label="Foto sebelumnya"
                        className="inline-flex min-h-[40px] min-w-[40px] cursor-pointer items-center justify-center rounded-xl border border-white/25 bg-white/12 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
                      >
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                      </button>

                      <span className="text-xs font-medium tracking-wider text-rose-100 tabular-nums">
                        {activeSlide + 1} / {photos.length}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveSlide((prev) => (prev + 1) % photos.length)
                        }
                        aria-label="Foto berikutnya"
                        className="inline-flex min-h-[40px] min-w-[40px] cursor-pointer items-center justify-center rounded-xl border border-white/25 bg-white/12 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
                      >
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* 3 Paragraf Pesan Romantis yang Dapat Diedit Langsung */}
          <div className="font-serif-body mx-auto flex max-w-[600px] flex-col gap-5 text-[clamp(1.125rem,2.2vw,1.25rem)] leading-[1.82] text-white/95 drop-shadow-[0_1px_10px_rgba(38,6,48,0.25)]">
            <div
              ref={p1Ref}
              contentEditable
              suppressContentEditableWarning
              aria-label="Paragraf pertama"
              className="editable-block px-2 py-1"
            >
              {INITIAL_TEXT.paragraph1}
            </div>

            <div
              ref={p2Ref}
              contentEditable
              suppressContentEditableWarning
              aria-label="Paragraf kedua"
              className="editable-block px-2 py-1"
            >
              {INITIAL_TEXT.paragraph2}
            </div>

            <div
              ref={p3Ref}
              contentEditable
              suppressContentEditableWarning
              aria-label="Paragraf ketiga"
              className="editable-block px-2 py-1"
            >
              {INITIAL_TEXT.paragraph3}
            </div>
          </div>

          {/* Penutup & Tanda Tangan */}
          <footer className="mx-auto mt-9 max-w-[600px] border-t border-white/15 pt-6">
            <div
              ref={closingRef}
              contentEditable
              suppressContentEditableWarning
              aria-label="Salam penutup"
              className="editable-block font-serif-body inline-block px-2 py-0.5 text-[1.0625rem] italic text-rose-50/90"
            >
              {INITIAL_TEXT.closingLabel}
            </div>

            <div>
              <div
                ref={senderRef}
                contentEditable
                suppressContentEditableWarning
                aria-label="Nama pengirim"
                className="editable-block font-calligraphy mt-1 inline-block px-3 py-1 text-[clamp(2rem,4.5vw,2.65rem)] leading-tight text-white"
              >
                {INITIAL_TEXT.senderName}
              </div>
            </div>
          </footer>
        </article>

        {/* Input tersembunyi untuk unggah banyak foto atau ganti foto */}
        <input
          ref={addInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleAddPhotos}
          className="hidden"
          aria-label="Pilih beberapa foto dari perangkat"
        />
        <input
          ref={replaceInputRef}
          type="file"
          accept="image/*"
          onChange={handleReplacePhoto}
          className="hidden"
          aria-label="Ganti foto terpilih"
        />

        {/* Bilah Aksi & Pengaturan Efek */}
        <section
          aria-label="Aksi kartu ucapan"
          className="no-print font-ui mt-7 flex flex-col items-center gap-3"
        >
          {/* Baris Pengaturan Efek & Musik Instrumental */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* Pilihan Efek Latar */}
            <div
              role="group"
              aria-label="Efek partikel jatuh"
              className="flex items-center gap-1 rounded-xl border border-white/20 bg-white/10 p-1 backdrop-blur-md"
            >
              <button
                type="button"
                onClick={() => setAmbianceMode('both')}
                className={`min-h-[36px] cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                  ambianceMode === 'both'
                    ? 'bg-white text-rose-900 shadow-sm'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                Kelopak &amp; Bintang
              </button>
              <button
                type="button"
                onClick={() => setAmbianceMode('petals')}
                className={`inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                  ambianceMode === 'petals'
                    ? 'bg-white text-rose-900 shadow-sm'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Flower2 className="h-3.5 w-3.5" aria-hidden="true" />
                Kelopak Mawar
              </button>
              <button
                type="button"
                onClick={() => setAmbianceMode('stars')}
                className={`inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                  ambianceMode === 'stars'
                    ? 'bg-white text-rose-900 shadow-sm'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Bintang
              </button>
            </div>

            {/* Pilihan Lagu Instrumental & Tombol Nyala/Mati */}
            <div className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 p-1 backdrop-blur-md">
              <div className="flex items-center gap-1.5 pl-2.5 text-xs text-rose-100">
                <Music className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <select
                  aria-label="Pilih lagu instrumental romantis"
                  value={musicTrack}
                  onChange={(e) =>
                    setMusicTrack(e.target.value as RomanticTrackId)
                  }
                  className="min-h-[34px] cursor-pointer bg-transparent pr-1 text-xs font-medium text-white outline-none"
                >
                  {ROMANTIC_TRACKS.map((track) => (
                    <option
                      key={track.id}
                      value={track.id}
                      className="bg-rose-950 text-white"
                    >
                      {track.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleToggleMusic}
                aria-label={
                  isMusicPlaying
                    ? 'Matikan musik instrumental'
                    : 'Nyalakan musik instrumental'
                }
                className={`inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                  isMusicPlaying
                    ? 'bg-white text-rose-900 shadow-sm'
                    : 'bg-white/15 text-white hover:bg-white/25'
                }`}
              >
                {isMusicPlaying ? (
                  <>
                    <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Nyala
                  </>
                ) : (
                  <>
                    <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
                    Mati
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => addInputRef.current?.click()}
              className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-white/30 bg-white/12 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white whitespace-nowrap shrink-0"
            >
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
              Tambah Foto
            </button>

            <button
              type="button"
              onClick={handleCreateShareLink}
              disabled={isCreatingLink}
              className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-rose-900 shadow-sm transition-colors hover:bg-rose-50 disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white whitespace-nowrap shrink-0"
            >
              <Link2 className="h-4 w-4" aria-hidden="true" />
              {isCreatingLink ? 'Membuat Link...' : 'Buat Link & QR'}
            </button>

            <button
              type="button"
              onClick={handleDownloadHtml}
              disabled={isExporting}
              className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-white/30 bg-white/12 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20 disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white whitespace-nowrap shrink-0"
            >
              {savedFeedback ? (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Tersimpan (.html)
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" aria-hidden="true" />
                  {isExporting ? 'Menyimpan...' : 'Simpan HTML'}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-white/30 bg-white/12 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white whitespace-nowrap shrink-0"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              Cetak
            </button>
          </div>
        </section>

        {shareError && (
          <p className="no-print font-ui mt-3 rounded-xl border border-rose-200/40 bg-rose-950/60 px-4 py-2 text-xs text-rose-100">
            {shareError}
          </p>
        )}

        <p className="no-print font-ui mt-4 text-center text-xs text-rose-100/75">
          Edit teks dan foto di sini. Tekan Buat Link &amp; QR untuk mendapatkan link khusus dan QR Code tanpa tombol edit di bagian bawahnya.
        </p>
      </main>

      {/* Modal Link Khusus & QR Code */}
      {shareResult && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Link Ucapan dan QR Code"
          onClick={() => setShareResult(null)}
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-rose-950/80 p-4 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="font-ui relative w-full max-w-md rounded-3xl border border-rose-200 bg-[#fff9fb] p-6 text-center text-rose-950 shadow-2xl sm:p-8"
          >
            <button
              type="button"
              onClick={() => setShareResult(null)}
              aria-label="Tutup"
              className="absolute top-4 right-4 inline-flex min-h-[36px] min-w-[36px] cursor-pointer items-center justify-center rounded-full text-rose-900/70 transition-colors hover:bg-rose-100 hover:text-rose-950"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-800">
              <QrCode className="h-5 w-5" aria-hidden="true" />
            </div>

            <h2 className="font-calligraphy text-3xl text-rose-950">
              Link &amp; QR Code Siap
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-rose-900/75">
              Saat pasanganmu memindai QR Code atau membuka link ini, hanya kartu ucapan romantis yang tampil—bersih tanpa tombol opsi di bawah.
            </p>

            <div className="mx-auto my-5 inline-block rounded-2xl border border-rose-200 bg-white p-3 shadow-sm">
              <img
                src={shareResult.qrDataUrl}
                alt="QR Code Kartu Ucapan"
                className="h-48 w-48"
              />
            </div>

            <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2">
              <input
                type="text"
                readOnly
                value={shareResult.shareUrl}
                onFocus={(e) => e.target.select()}
                aria-label="Link kartu ucapan"
                className="w-full truncate bg-transparent text-xs font-medium text-rose-950 outline-none"
              />
              <button
                type="button"
                onClick={handleCopyShareUrl}
                className="inline-flex min-h-[34px] cursor-pointer items-center gap-1.5 rounded-lg bg-rose-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-rose-800 whitespace-nowrap shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    Tersalin
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    Salin
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={handleDownloadQrPng}
                className="inline-flex min-h-[42px] cursor-pointer items-center gap-2 rounded-xl bg-rose-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-800 whitespace-nowrap shrink-0"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Unduh QR (.png)
              </button>

              <a
                href={shareResult.sharePath}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-medium text-rose-900 transition-colors hover:bg-rose-50 whitespace-nowrap shrink-0"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Buka Tampilan Hadiah
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox untuk memperbesar foto saat diklik */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pratinjau foto kenangan"
          onClick={() => setLightboxIndex(null)}
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-rose-950/85 p-4 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-w-2xl flex-col items-center rounded-2xl bg-[#fff9fb] p-3 pb-5 text-rose-950 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              aria-label="Tutup pratinjau"
              className="font-ui absolute -top-3 -right-3 inline-flex min-h-[36px] min-w-[36px] cursor-pointer items-center justify-center rounded-full bg-white text-rose-950 shadow-lg transition-colors hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            <img
              src={photos[lightboxIndex].src}
              alt={photos[lightboxIndex].caption}
              referrerPolicy="no-referrer"
              className="max-h-[70vh] w-auto rounded-xl object-contain"
            />

            <p className="font-serif-body mt-3 px-4 text-center text-lg italic text-rose-950">
              {photos[lightboxIndex].caption}
            </p>

            {photos.length > 1 && (
              <div className="font-ui mt-3 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex(
                      (lightboxIndex - 1 + photos.length) % photos.length
                    )
                  }
                  aria-label="Foto sebelumnya"
                  className="inline-flex min-h-[36px] min-w-[36px] cursor-pointer items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <span className="text-xs font-medium text-rose-800 tabular-nums">
                  {lightboxIndex + 1} / {photos.length}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((lightboxIndex + 1) % photos.length)
                  }
                  aria-label="Foto berikutnya"
                  className="inline-flex min-h-[36px] min-w-[36px] cursor-pointer items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
