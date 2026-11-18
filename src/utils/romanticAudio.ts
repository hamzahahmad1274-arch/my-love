export type RomanticTrackId = 'senja' | 'bintang' | 'abadi';

export interface RomanticTrack {
  id: RomanticTrackId;
  label: string;
}

export const ROMANTIC_TRACKS: RomanticTrack[] = [
  { id: 'senja', label: 'Melodi Senja (Piano)' },
  { id: 'bintang', label: 'Bintang Malam (Harpa)' },
  { id: 'abadi', label: 'Janji Abadi (Nokturne)' },
];

interface NoteEvent {
  start: number;
  duration: number;
  freq: number;
  gain: number;
}

const SAMPLE_RATE = 22050;
const LOOP_SECONDS = 12;

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function buildTrackEvents(trackId: RomanticTrackId): {
  events: NoteEvent[];
  timbre: 'piano' | 'harp' | 'nocturne';
} {
  const events: NoteEvent[] = [];

  if (trackId === 'senja') {
    // Progresi F - Dm - Bb - C (lembut dan hangat, 3/4 waltz)
    const chords = [
      [53, 57, 60, 65], // F
      [50, 53, 57, 62], // Dm
      [46, 53, 58, 62], // Bb
      [48, 55, 60, 64], // C
    ];
    const melody = [
      // Bar 1 (0 - 3s)
      { t: 0.0, d: 1.4, m: 69 },
      { t: 1.0, d: 0.9, m: 72 },
      { t: 2.0, d: 1.2, m: 74 },
      // Bar 2 (3 - 6s)
      { t: 3.0, d: 1.6, m: 72 },
      { t: 4.5, d: 0.9, m: 69 },
      { t: 5.25, d: 0.9, m: 67 },
      // Bar 3 (6 - 9s)
      { t: 6.0, d: 1.4, m: 65 },
      { t: 7.0, d: 1.0, m: 69 },
      { t: 8.0, d: 1.2, m: 70 },
      // Bar 4 (9 - 12s)
      { t: 9.0, d: 1.5, m: 69 },
      { t: 10.5, d: 1.4, m: 67 },
    ];

    chords.forEach((chord, bar) => {
      const barStart = bar * 3.0;
      // Arpeggio lembut per ketukan
      for (let beat = 0; beat < 6; beat++) {
        const note = chord[beat % chord.length];
        events.push({
          start: barStart + beat * 0.5,
          duration: 1.6,
          freq: midiToFreq(note),
          gain: beat === 0 ? 0.22 : 0.14,
        });
      }
      // Bas hangat di ketukan pertama
      events.push({
        start: barStart,
        duration: 2.8,
        freq: midiToFreq(chord[0] - 12),
        gain: 0.24,
      });
    });

    melody.forEach((n) => {
      events.push({
        start: n.t,
        duration: n.d + 0.5,
        freq: midiToFreq(n.m),
        gain: 0.26,
      });
    });

    return { events, timbre: 'piano' };
  }

  if (trackId === 'bintang') {
    // Progresi G - Em - C - D (harpa / kotak musik malam berbintang)
    const chords = [
      [55, 59, 62, 67], // G
      [52, 55, 59, 64], // Em
      [48, 55, 60, 64], // C
      [50, 57, 62, 66], // D
    ];
    const melody = [
      { t: 0.0, d: 1.2, m: 79 },
      { t: 0.75, d: 1.0, m: 78 },
      { t: 1.5, d: 1.4, m: 74 },
      { t: 3.0, d: 1.2, m: 76 },
      { t: 3.75, d: 1.0, m: 74 },
      { t: 4.5, d: 1.4, m: 71 },
      { t: 6.0, d: 1.2, m: 72 },
      { t: 6.75, d: 1.0, m: 74 },
      { t: 7.5, d: 1.4, m: 76 },
      { t: 9.0, d: 1.4, m: 74 },
      { t: 10.5, d: 1.4, m: 78 },
    ];

    chords.forEach((chord, bar) => {
      const barStart = bar * 3.0;
      for (let i = 0; i < 8; i++) {
        const note = chord[i % chord.length];
        events.push({
          start: barStart + i * 0.375,
          duration: 1.4,
          freq: midiToFreq(note + 12),
          gain: 0.14,
        });
      }
      events.push({
        start: barStart,
        duration: 2.8,
        freq: midiToFreq(chord[0] - 12),
        gain: 0.2,
      });
    });

    melody.forEach((n) => {
      events.push({
        start: n.t,
        duration: n.d + 0.6,
        freq: midiToFreq(n.m + 12),
        gain: 0.2,
      });
    });

    return { events, timbre: 'harp' };
  }

  // 'abadi': Progresi C - Am - F - G (nokturne piano lambat & syahdu)
  const chords = [
    [48, 55, 60, 64], // C
    [45, 52, 57, 60], // Am
    [41, 48, 53, 57], // F
    [43, 50, 55, 59], // G
  ];
  const melody = [
    { t: 0.0, d: 1.8, m: 72 },
    { t: 1.5, d: 1.4, m: 76 },
    { t: 3.0, d: 1.6, m: 74 },
    { t: 4.5, d: 1.4, m: 72 },
    { t: 6.0, d: 1.6, m: 69 },
    { t: 7.5, d: 1.4, m: 72 },
    { t: 9.0, d: 1.6, m: 71 },
    { t: 10.5, d: 1.4, m: 67 },
  ];

  chords.forEach((chord, bar) => {
    const barStart = bar * 3.0;
    chord.forEach((note, idx) => {
      events.push({
        start: barStart + idx * 0.18,
        duration: 2.7,
        freq: midiToFreq(note),
        gain: idx === 0 ? 0.24 : 0.15,
      });
    });
  });

  melody.forEach((n) => {
    events.push({
      start: n.t,
      duration: n.d + 0.8,
      freq: midiToFreq(n.m),
      gain: 0.25,
    });
  });

  return { events, timbre: 'nocturne' };
}

function encodeWavFromSamples(samples: Float32Array): Blob {
  const numSamples = samples.length;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

const cachedBlobUrls: Partial<Record<RomanticTrackId, string>> = {};

export function getRomanticTrackUrl(trackId: RomanticTrackId): string {
  const cached = cachedBlobUrls[trackId];
  if (cached) return cached;

  const totalSamples = SAMPLE_RATE * LOOP_SECONDS;
  const dry = new Float32Array(totalSamples);
  const { events, timbre } = buildTrackEvents(trackId);

  for (const ev of events) {
    const startIdx = Math.floor(ev.start * SAMPLE_RATE);
    const lenIdx = Math.floor(ev.duration * SAMPLE_RATE);
    const attackSamples = Math.floor(0.018 * SAMPLE_RATE);
    const omega = 2 * Math.PI * ev.freq;

    for (let i = 0; i < lenIdx; i++) {
      const idx = (startIdx + i) % totalSamples;
      const t = i / SAMPLE_RATE;
      const attack = i < attackSamples ? i / attackSamples : 1;
      const decayRate = timbre === 'harp' ? 2.4 : timbre === 'piano' ? 1.85 : 1.35;
      const env = attack * Math.exp(-decayRate * t);

      let wave = 0;
      if (timbre === 'harp') {
        wave =
          0.75 * Math.sin(omega * t) +
          0.2 * Math.sin(2 * omega * t) * Math.exp(-3.5 * t) +
          0.05 * Math.sin(3 * omega * t) * Math.exp(-5 * t);
      } else if (timbre === 'piano') {
        wave =
          0.72 * Math.sin(omega * t) +
          0.22 * Math.sin(2 * omega * t) * Math.exp(-2.2 * t) +
          0.06 * Math.sin(3 * omega * t) * Math.exp(-4.0 * t);
      } else {
        wave =
          0.78 * Math.sin(omega * t) +
          0.18 * Math.sin(2 * omega * t) +
          0.04 * Math.sin(0.5 * omega * t);
      }

      dry[idx] += wave * env * ev.gain;
    }
  }

  // Tambah pantulan gema lembut (wrap-around agar loop mulus)
  const wet = new Float32Array(totalSamples);
  const delay1 = Math.floor(0.27 * SAMPLE_RATE);
  const delay2 = Math.floor(0.51 * SAMPLE_RATE);
  for (let i = 0; i < totalSamples; i++) {
    const tap1 = dry[(i - delay1 + totalSamples) % totalSamples];
    const tap2 = dry[(i - delay2 + totalSamples) % totalSamples];
    wet[i] = dry[i] + tap1 * 0.28 + tap2 * 0.16;
  }

  // Normalisasi halus
  let peak = 0;
  for (let i = 0; i < totalSamples; i++) {
    const abs = Math.abs(wet[i]);
    if (abs > peak) peak = abs;
  }
  const norm = peak > 0 ? 0.68 / peak : 1;
  for (let i = 0; i < totalSamples; i++) {
    wet[i] *= norm;
  }

  const blob = encodeWavFromSamples(wet);
  const url = URL.createObjectURL(blob);
  cachedBlobUrls[trackId] = url;
  return url;
}
