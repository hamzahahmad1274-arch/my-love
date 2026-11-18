import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, Volume2, VolumeX, X } from 'lucide-react';
import FallingAmbiance from './FallingAmbiance';
import type { GreetingCardContent } from '../utils/standaloneHtml';
import { getRomanticTrackUrl } from '../utils/romanticAudio';

interface RecipientKeepsakeViewProps {
  cardId: string;
}

export default function RecipientKeepsakeView({
  cardId,
}: RecipientKeepsakeViewProps) {
  const [card, setCard] = useState<GreetingCardContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const trackUrl = useMemo(
    () => getRomanticTrackUrl(card?.musicTrack || 'senja'),
    [card?.musicTrack]
  );

  const toggleMusic = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isMusicPlaying) {
      audio.pause();
      setIsMusicPlaying(false);
    } else {
      try {
        audio.volume = 0.45;
        await audio.play();
        setIsMusicPlaying(true);
      } catch {
        setIsMusicPlaying(false);
      }
    }
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetch(`/api/cards/${encodeURIComponent(cardId)}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Kartu ucapan tidak ditemukan atau sudah kedaluwarsa.');
        }
        return (await res.json()) as GreetingCardContent;
      })
      .then((data) => {
        if (!active) return;
        setCard(data);
        if (data.headline) {
          document.title = data.headline;
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : 'Gagal membuka kartu ucapan.'
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [cardId]);

  useEffect(() => {
    if (lightboxIndex === null || !card) return;
    const total = card.photos.length;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight' && total > 0) {
        setLightboxIndex((prev) => (prev === null ? null : (prev + 1) % total));
      }
      if (e.key === 'ArrowLeft' && total > 0) {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev - 1 + total) % total
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIndex, card]);

  const getPolaroidTiltClass = (index: number) => {
    const tilts = [
      'md:-rotate-[1.8deg]',
      'md:rotate-[1.4deg] md:translate-y-1',
      'md:-rotate-[1.2deg]',
      'md:rotate-[1.7deg]',
    ];
    return tilts[index % tilts.length];
  };

  if (loading) {
    return (
      <div className="romantic-backdrop relative flex min-h-screen items-center justify-center px-4 py-10">
        <FallingAmbiance mode="both" />
        <div className="relative z-10 rounded-2xl border border-white/20 bg-white/10 px-8 py-6 text-center backdrop-blur-xl">
          <p className="font-calligraphy text-3xl text-white">
            Membuka ucapan istimewa...
          </p>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="romantic-backdrop relative flex min-h-screen items-center justify-center px-4 py-10">
        <FallingAmbiance mode="both" />
        <main className="relative z-10 max-w-md rounded-3xl border border-white/25 bg-white/10 p-8 text-center backdrop-blur-xl">
          <h1 className="font-calligraphy mb-3 text-4xl text-white">
            Maaf...
          </h1>
          <p className="font-serif-body mb-6 text-lg text-rose-100">
            {error || 'Kartu ucapan tidak ditemukan.'}
          </p>
          <a
            href="/"
            className="font-ui inline-flex min-h-[44px] items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-rose-900 transition-colors hover:bg-rose-50"
          >
            Buat Kartu Ucapan Baru
          </a>
        </main>
      </div>
    );
  }

  const photos = card.photos || [];

  return (
    <div className="romantic-backdrop relative flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-8">
      <audio
        ref={audioRef}
        src={trackUrl}
        loop
        preload="auto"
        className="hidden"
      />
      <FallingAmbiance mode={card.ambianceMode || 'both'} />

      <button
        type="button"
        onClick={toggleMusic}
        aria-label={isMusicPlaying ? 'Matikan musik latar' : 'Putar musik romantis'}
        className="no-print font-ui fixed top-4 right-4 z-20 inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-xl border border-white/25 bg-white/12 px-3.5 py-2 text-xs font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
      >
        {isMusicPlaying ? (
          <>
            <Volume2 className="h-4 w-4" aria-hidden="true" />
            Musik Nyala
          </>
        ) : (
          <>
            <VolumeX className="h-4 w-4" aria-hidden="true" />
            Putar Musik
          </>
        )}
      </button>

      <main className="relative z-10 flex w-full max-w-[820px] flex-col items-center">
        <article
          className="print-card w-full rounded-3xl border border-white/25 bg-white/[0.08] px-6 py-10 text-center shadow-[0_24px_60px_rgba(38,6,48,0.36)] backdrop-blur-xl sm:px-12 sm:py-14"
          aria-label="Kartu Ucapan Ulang Tahun"
        >
          <div className="font-ui mb-3 text-xs font-medium tracking-[0.16em] text-rose-100/90 uppercase">
            {card.kicker}
          </div>

          <h1 className="font-calligraphy mb-5 text-[clamp(2.6rem,6vw,4.15rem)] leading-[1.2] font-normal text-white [text-wrap:balance] drop-shadow-[0_2px_18px_rgba(45,10,49,0.35)]">
            {card.headline}
          </h1>

          <div
            className="mx-auto mb-8 flex max-w-[240px] items-center justify-center gap-3.5 opacity-80"
            aria-hidden="true"
          >
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            <Heart className="h-4 w-4 text-rose-100" strokeWidth={1.6} />
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          </div>

          {photos.length > 0 && (
            <section aria-label="Galeri foto kenangan" className="mb-10">
              <div className="font-calligraphy mb-5 text-[clamp(1.75rem,3.5vw,2.25rem)] leading-tight text-rose-50">
                {card.galleryHeading}
              </div>

              {card.galleryLayout === 'polaroid' ? (
                <div className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 md:grid-cols-3">
                  {photos.map((photo, index) => (
                    <figure
                      key={photo.id || index}
                      className={`group w-full max-w-[260px] rounded-xl bg-[#fff9fb] p-2.5 pb-4 text-rose-950 shadow-[0_16px_34px_rgba(34,6,44,0.34)] transition-transform duration-200 ease-out hover:z-10 hover:rotate-0 hover:-translate-y-1 ${getPolaroidTiltClass(
                        index
                      )}`}
                    >
                      <button
                        type="button"
                        onClick={() => setLightboxIndex(index)}
                        aria-label={`Lihat foto ${index + 1} lebih besar`}
                        className="block aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-lg bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
                      >
                        <img
                          src={photo.src}
                          alt={photo.caption}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      </button>
                      <figcaption className="font-serif-body mt-3 px-1 text-[0.98rem] leading-snug font-medium italic text-rose-950/90">
                        {photo.caption}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              ) : (
                <div className="mx-auto max-w-[480px]">
                  <figure className="rounded-2xl bg-[#fff9fb] p-3 pb-5 text-rose-950 shadow-[0_20px_44px_rgba(34,6,44,0.38)]">
                    <button
                      type="button"
                      onClick={() => setLightboxIndex(activeSlide)}
                      aria-label="Lihat foto lebih besar"
                      className="block aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-xl bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
                    >
                      <img
                        src={photos[activeSlide]?.src}
                        alt={photos[activeSlide]?.caption}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    </button>
                    <figcaption className="font-serif-body mt-3.5 px-2 text-lg leading-snug font-medium italic text-rose-950/90">
                      {photos[activeSlide]?.caption}
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
                        className="inline-flex min-h-[40px] min-w-[40px] cursor-pointer items-center justify-center rounded-xl border border-white/25 bg-white/12 text-white transition-colors hover:bg-white/20"
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
                        className="inline-flex min-h-[40px] min-w-[40px] cursor-pointer items-center justify-center rounded-xl border border-white/25 bg-white/12 text-white transition-colors hover:bg-white/20"
                      >
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          <div className="font-serif-body mx-auto flex max-w-[600px] flex-col gap-5 text-[clamp(1.125rem,2.2vw,1.25rem)] leading-[1.82] text-white/95 drop-shadow-[0_1px_10px_rgba(38,6,48,0.25)]">
            {card.paragraph1 && <div>{card.paragraph1}</div>}
            {card.paragraph2 && <div>{card.paragraph2}</div>}
            {card.paragraph3 && <div>{card.paragraph3}</div>}
          </div>

          <footer className="mx-auto mt-9 max-w-[600px] border-t border-white/15 pt-6">
            <div className="font-serif-body text-[1.0625rem] italic text-rose-50/90">
              {card.closingLabel}
            </div>
            <div className="font-calligraphy mt-1 text-[clamp(2rem,4.5vw,2.65rem)] leading-tight text-white">
              {card.senderName}
            </div>
          </footer>
        </article>
      </main>

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
              className="font-ui absolute -top-3 -right-3 inline-flex min-h-[36px] min-w-[36px] cursor-pointer items-center justify-center rounded-full bg-white text-rose-950 shadow-lg transition-colors hover:bg-rose-100"
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
