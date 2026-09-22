export const EQ_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000] as const;

export interface EqPreset {
  name: string;
  gains: number[]; // 10 values in dB (-12 to +12)
}

export const EQ_PRESETS: Record<string, EqPreset> = {
  Flat: {
    name: 'Flat',
    gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  'Bass Boost': {
    name: 'Bass Boost',
    gains: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0],
  },
  'Bass Reducer': {
    name: 'Bass Reducer',
    gains: [-6, -5, -4, -2, 0, 0, 0, 0, 0, 0],
  },
  'Treble Boost': {
    name: 'Treble Boost',
    gains: [0, 0, 0, 0, 0, 1, 2, 4, 5, 6],
  },
  'Vocal Boost': {
    name: 'Vocal Boost',
    gains: [-2, -1, 0, 2, 4, 4, 3, 1, 0, -1],
  },
  Rock: {
    name: 'Rock',
    gains: [5, 4, 2, -1, -2, -1, 2, 4, 5, 5],
  },
  Pop: {
    name: 'Pop',
    gains: [-1, 2, 4, 4, 2, 0, -1, 2, 4, 4],
  },
  Electronic: {
    name: 'Electronic',
    gains: [5, 4, 1, 0, -2, 1, 2, 4, 5, 5],
  },
  Classical: {
    name: 'Classical',
    gains: [4, 3, 2, 1, -1, -1, 0, 2, 3, 4],
  },
  Jazz: {
    name: 'Jazz',
    gains: [3, 2, 1, 2, -1, -1, 0, 2, 3, 3],
  },
  Acoustic: {
    name: 'Acoustic',
    gains: [3, 2, 1, 1, 2, 2, 3, 4, 3, 2],
  },
};
