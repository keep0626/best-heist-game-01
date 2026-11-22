// The Marlow Gallery: one floor, three wings, one vault.
// Coordinates live on a 960 x 640 canvas. Walls are solid rectangles;
// every other object (loot, terminal, spawn, exit) sits in open floor.

export const WORLD_W = 960;
export const WORLD_H = 640;

export const WALLS = [
  // Outer shell (thickness 16)
  { x: 0, y: 0, w: 960, h: 16 },      // north wall
  { x: 0, y: 624, w: 960, h: 16 },    // south wall
  { x: 0, y: 0, w: 16, h: 640 },      // west wall
  { x: 944, y: 0, w: 16, h: 640 },    // east wall

  // West wing divider: gap (door) at y 420..500
  { x: 300, y: 16, w: 14, h: 404 },
  { x: 300, y: 500, w: 14, h: 124 },

  // East wing divider: gap (door) at y 140..220
  { x: 660, y: 220, w: 14, h: 404 },
  { x: 660, y: 16, w: 14, h: 124 },

  // Vault-room wall: gap (door) at x 440..520
  { x: 314, y: 220, w: 126, h: 14 },
  { x: 520, y: 220, w: 140, h: 14 },

  // Cover pillars (sneak behind these)
  { x: 120, y: 300, w: 40, h: 40 },
  { x: 180, y: 120, w: 40, h: 40 },
  { x: 380, y: 380, w: 44, h: 44 },
  { x: 560, y: 380, w: 44, h: 44 },
  { x: 760, y: 300, w: 40, h: 40 },
  { x: 820, y: 120, w: 40, h: 40 },
  { x: 420, y: 90, w: 44, h: 44 },
];

// The glass vault case in the middle of the central hall. Solid: you
// circle it and crack it from the front.
export const VAULT = { x: 448, y: 272, w: 64, h: 56 };

export const SPAWN = { x: 56, y: 580 };
export const EXIT = { x: 896, y: 56, r: 30 }; // skylight door, top-right

// Optional loot: paintings and gold. Each takes a second of holding E.
export const LOOT = [
  { id: 'painting-a', kind: 'painting', name: 'Portrait of Lady Vane', value: 8000, x: 96, y: 120 },
  { id: 'painting-b', kind: 'painting', name: 'The Weeping Orchard', value: 6000, x: 96, y: 520 },
  { id: 'gold-a', kind: 'gold', name: 'Gold ingots', value: 10000, x: 872, y: 140 },
  { id: 'gold-b', kind: 'gold', name: 'Gold ingots', value: 7000, x: 720, y: 560 },
];

// The star itself: the job. Cracking the case takes two seconds.
export const STAR = { id: 'aurora-star', name: 'The Aurora Star', value: 50000, x: 480, y: 300 };

// Security terminal: hold E beside it to kill the cameras for 20 seconds.
export const TERMINAL = { x: 900, y: 560 };

// Guard patrols: waypoints the guard walks between, looping.
export const GUARD_DEFS = [
  { name: 'Mara', x: 200, y: 120, waypoints: [[200, 120], [200, 520]], speed: 62 },
  { name: 'Dmitri', x: 360, y: 176, waypoints: [[360, 176], [600, 176]], speed: 70 },
  { name: 'Sofia', x: 880, y: 150, waypoints: [[880, 150], [880, 540]], speed: 66 },
];

// Wall cameras: fixed mount, sweeping cone.
export const CAMERA_DEFS = [
  { name: 'CAM-1', x: 480, y: 24, baseAngle: Math.PI / 2, sweep: 0.9, speed: 0.55 },
  { name: 'CAM-2', x: 936, y: 300, baseAngle: Math.PI, sweep: 0.8, speed: 0.45 },
];

// Wall paintings that are just decor (the loot paintings hang elsewhere).
export const DECOR_PAINTINGS = [
  { x: 60, y: 200, w: 34, h: 26, hue: '#7a4a2b' },
  { x: 60, y: 380, w: 34, h: 26, hue: '#2b5a7a' },
  { x: 700, y: 60, w: 34, h: 26, hue: '#5a7a2b' },
  { x: 360, y: 600, w: 34, h: 26, hue: '#7a2b5a' },
  { x: 880, y: 400, w: 34, h: 26, hue: '#3b3b6e' },
];

// Warm lamp pools on the floor.
export const LAMPS = [
  { x: 150, y: 90, r: 110 },
  { x: 480, y: 130, r: 120 },
  { x: 810, y: 90, r: 110 },
  { x: 480, y: 480, r: 120 },
  { x: 810, y: 480, r: 110 },
];

// Red carpet runner down the central hall.
export const CARPET = { x: 440, y: 234, w: 80, h: 390 };
