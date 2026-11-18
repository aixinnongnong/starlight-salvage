// Starlight Salvage — staged scenes for screenshots. `?shot=` picks a scene
// and `?seed=` fixes the random generator, so every screenshot is a real,
// deterministic render of the game's own code: the title screen, play in
// progress, a pulse going off mid-game, and the win screen.
import { GAME } from './config.js';
import { World, makeAsteroid, makeShard } from './world.js';

function seedFromQuery(query) {
  const seed = Number.parseInt(query.get('seed') || '1', 10);
  return Number.isFinite(seed) ? seed : 1;
}

export function stageScene(query) {
  const shot = query.get('shot') || 'play';
  const seed = seedFromQuery(query);
  const world = new World(seed);
  // Let the world settle a little so the scene is not the empty first frame.
  const random = world.random;
  if (shot === 'start') {
    world.ship.x = 640;
    world.ship.y = 380;
    world.ship.angle = -Math.PI / 2;
    return { world, screen: 'title', waveBanner: 0 };
  }
  if (shot === 'play') {
    for (let i = 0; i < 26; i += 1) world.update(1 / 30, null, null);
    world.score = 130;
    world.combo = 3;
    world.chain = 3;
    world.comboTimer = 1.8;
    world.wave = 2;
    return { world, screen: 'playing', waveBanner: 0 };
  }
  if (shot === 'action') {
    for (let i = 0; i < 40; i += 1) world.update(1 / 30, null, null);
    world.score = 240;
    world.combo = 5;
    world.chain = 5;
    world.comboTimer = 2.1;
    world.wave = 3;
    world.energy = 50;
    // A pulse going off, ring half-expanded, asteroids breaking around it.
    world.firePulse();
    for (let i = 0; i < 6; i += 1) world.update(1 / 30, null, null);
    world.shards.push(makeShard(random, 640, 300));
    world.asteroids.push(makeAsteroid(random, 3, 0));
    return { world, screen: 'playing', waveBanner: 0 };
  }
  if (shot === 'end') {
    for (let i = 0; i < 30; i += 1) world.update(1 / 30, null, null);
    world.score = GAME.winScore;
    world.bestCombo = 6;
    world.pulseFlashes = 4;
    world.wave = 6;
    world.ship.hull = 2;
    return { world, screen: 'win', waveBanner: 0 };
  }
  if (shot === 'lose') {
    for (let i = 0; i < 30; i += 1) world.update(1 / 30, null, null);
    world.score = 210;
    world.bestCombo = 4;
    world.wave = 3;
    world.ship.hull = 0;
    return { world, screen: 'lose', waveBanner: 0 };
  }
  return { world, screen: 'playing', waveBanner: 0 };
}
