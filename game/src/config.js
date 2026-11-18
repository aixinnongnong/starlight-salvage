// Starlight Salvage — tuning and palette. One place for every number that
// shapes how the game feels, so balancing is a single edit, not a hunt.
export const VIEW = { width: 1280, height: 720 };

export const PALETTE = {
  space: '#070b16',
  spaceDeep: '#0a1024',
  star: '#cfe4ff',
  ship: '#5df2ff',
  shipGlow: '#22d3ee',
  shard: '#ffd166',
  shardGlow: '#ffb703',
  asteroid: '#8b7d6b',
  asteroidEdge: '#c9b8a3',
  danger: '#ff5d73',
  pulse: '#7c5cff',
  text: '#eaf6ff',
  muted: '#8fa8c7',
  panel: 'rgba(10, 18, 38, 0.82)',
  panelEdge: 'rgba(93, 242, 255, 0.35)',
  gold: '#ffd166',
};

export const PLAYER = {
  radius: 16,
  thrust: 620, // px/s^2
  maxSpeed: 340, // px/s
  drag: 0.9, // velocity retained per second (exponential)
  hull: 3,
  invulnerableSeconds: 1.2,
};

export const SHARD = {
  radius: 11,
  value: 10,
  comboWindow: 2.5, // seconds to chain the next pickup
  comboMax: 8,
  spawnEvery: 1.1, // seconds between spawns (shrinks slightly per wave)
  maxOnScreen: 9,
  drift: 26, // px/s
};

export const ASTEROID = {
  radiusMin: 16,
  radiusMax: 42,
  spawnEvery: 2.2, // seconds at wave 1; shrinks per wave
  spawnEveryMin: 0.75,
  speedMin: 55,
  speedMax: 130,
  speedPerWave: 9,
  maxOnScreen: 14,
};

export const PULSE = {
  radius: 190,
  cost: 50, // energy out of 100
  recharge: 10, // energy per second
  max: 100,
};

export const GAME = {
  winScore: 500, // salvage target: reach it to complete the run
  waveEvery: 100, // score per wave
  startShards: 4,
  startAsteroids: 3,
};

export const PARTICLES = {
  pickupBurst: 14,
  explosionBurst: 26,
  pulseRing: 1,
  trailEvery: 0.03, // seconds between engine trail puffs
};
