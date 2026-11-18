// Starlight Salvage — the world: the ship, the salvage shards, the asteroids
// and the particles. It owns spawning, movement, collisions and the score,
// and knows nothing about drawing or input.
import { ASTEROID, GAME, PARTICLES, PLAYER, PULSE, SHARD, VIEW } from './config.js';
import { angleTo, mulberry32, range } from './random.js';

export function makeShip(x, y) {
  return {
    x, y,
    vx: 0, vy: 0,
    angle: -Math.PI / 2,
    hull: PLAYER.hull,
    invulnerable: 0,
    trailTimer: 0,
  };
}

export function makeShard(random, x, y) {
  const angle = random() * Math.PI * 2;
  const speed = range(random, SHARD.drift * 0.4, SHARD.drift);
  return {
    x: x ?? range(random, 40, VIEW.width - 40),
    y: y ?? range(random, 90, VIEW.height - 90),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: SHARD.radius,
    spin: range(random, -1.2, 1.2),
    phase: random() * Math.PI * 2,
    kind: 'shard',
  };
}

export function makeAsteroid(random, wave, edge) {
  const radius = range(random, ASTEROID.radiusMin, ASTEROID.radiusMax);
  const speed = range(random, ASTEROID.speedMin, ASTEROID.speedMax) + (wave - 1) * ASTEROID.speedPerWave;
  // Spawn just outside one edge, drifting across the field.
  const side = edge ?? Math.floor(random() * 4);
  let x = 0;
  let y = 0;
  if (side === 0) { x = -radius - 10; y = range(random, 0, VIEW.height); }
  if (side === 1) { x = VIEW.width + radius + 10; y = range(random, 0, VIEW.height); }
  if (side === 2) { x = range(random, 0, VIEW.width); y = -radius - 10; }
  if (side === 3) { x = range(random, 0, VIEW.width); y = VIEW.height + radius + 10; }
  const targetX = range(random, VIEW.width * 0.2, VIEW.width * 0.8);
  const targetY = range(random, VIEW.height * 0.2, VIEW.height * 0.8);
  const heading = angleTo(x, y, targetX, targetY);
  const vertices = [];
  const count = 9 + Math.floor(random() * 4);
  for (let i = 0; i < count; i += 1) {
    vertices.push(range(random, 0.72, 1.15));
  }
  return {
    x, y,
    vx: Math.cos(heading) * speed,
    vy: Math.sin(heading) * speed,
    radius,
    spin: range(random, -0.9, 0.9),
    rotation: random() * Math.PI * 2,
    vertices,
    kind: 'asteroid',
  };
}

export function makeParticle(x, y, vx, vy, life, size, color) {
  return { x, y, vx, vy, life, maxLife: life, size, color, kind: 'particle' };
}

export class World {
  constructor(seed = 1) {
    this.random = mulberry32(seed);
    this.ship = makeShip(VIEW.width / 2, VIEW.height / 2);
    this.shards = [];
    this.asteroids = [];
    this.particles = [];
    this.pulseRings = [];
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.comboTimer = 0;
    this.chain = 0;
    this.wave = 1;
    this.energy = PULSE.max;
    this.shardTimer = 0;
    this.asteroidTimer = 0;
    this.shake = 0;
    this.time = 0;
    this.pulseFlashes = 0;
    for (let i = 0; i < GAME.startShards; i += 1) this.shards.push(makeShard(this.random));
    for (let i = 0; i < GAME.startAsteroids; i += 1) this.asteroids.push(makeAsteroid(this.random, 1));
  }

  waveFor(score) {
    return Math.floor(score / GAME.waveEvery) + 1;
  }

  spawnShard() {
    if (this.shards.length >= SHARD.maxOnScreen) return;
    this.shards.push(makeShard(this.random));
  }

  spawnAsteroid() {
    if (this.asteroids.length >= ASTEROID.maxOnScreen) return;
    this.asteroids.push(makeAsteroid(this.random, this.wave));
  }

  burst(x, y, count, color, speed = 180) {
    for (let i = 0; i < count; i += 1) {
      const angle = this.random() * Math.PI * 2;
      const velocity = range(this.random, speed * 0.25, speed);
      this.particles.push(makeParticle(
        x, y,
        Math.cos(angle) * velocity, Math.sin(angle) * velocity,
        range(this.random, 0.35, 0.8),
        range(this.random, 2, 4.5),
        color,
      ));
    }
  }

  collectShard(shard) {
    this.chain += 1;
    this.combo = Math.min(this.chain, SHARD.comboMax);
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.comboTimer = SHARD.comboWindow;
    const gained = SHARD.value * this.combo;
    this.score += gained;
    this.burst(shard.x, shard.y, PARTICLES.pickupBurst, '#ffd166', 150);
    const nextWave = this.waveFor(this.score);
    const wavedUp = nextWave > this.wave;
    this.wave = nextWave;
    return { gained, wavedUp };
  }

  hitAsteroid(asteroid) {
    this.ship.hull -= 1;
    this.ship.invulnerable = PLAYER.invulnerableSeconds;
    this.shake = 14;
    this.chain = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.burst(this.ship.x, this.ship.y, PARTICLES.explosionBurst, '#ff5d73', 260);
    this.burst(asteroid.x, asteroid.y, PARTICLES.explosionBurst, '#c9b8a3', 220);
    return this.ship.hull <= 0;
  }

  firePulse() {
    if (this.energy < PULSE.cost) return false;
    this.energy -= PULSE.cost;
    this.pulseFlashes += 1;
    this.pulseRings.push({ x: this.ship.x, y: this.ship.y, radius: 12, max: PULSE.radius, life: 0.45, maxLife: 0.45 });
    let destroyed = 0;
    this.asteroids = this.asteroids.filter((asteroid) => {
      const distance = Math.hypot(asteroid.x - this.ship.x, asteroid.y - this.ship.y);
      if (distance < PULSE.radius + asteroid.radius) {
        this.burst(asteroid.x, asteroid.y, 10, '#c9b8a3', 160);
        this.score += 5;
        destroyed += 1;
        return false;
      }
      return true;
    });
    return destroyed;
  }

  update(dt, thrust, steerTarget) {
    this.time += dt;
    const ship = this.ship;

    // Steering: keyboard thrust, or the mouse pulling the ship toward it.
    let ax = 0;
    let ay = 0;
    if (thrust) {
      ax = thrust.x * PLAYER.thrust;
      ay = thrust.y * PLAYER.thrust;
    } else if (steerTarget) {
      const dx = steerTarget.x - ship.x;
      const dy = steerTarget.y - ship.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 24) {
        const pull = Math.min(1, distance / 220);
        ax = (dx / distance) * PLAYER.thrust * pull;
        ay = (dy / distance) * PLAYER.thrust * pull;
      }
    }
    ship.vx += ax * dt;
    ship.vy += ay * dt;
    const dragFactor = 1 - dt * 0.55; // gentle drag so the ship glides, not slides
    ship.vx *= dragFactor;
    ship.vy *= dragFactor;
    const speed = Math.hypot(ship.vx, ship.vy);
    if (speed > PLAYER.maxSpeed) {
      ship.vx = (ship.vx / speed) * PLAYER.maxSpeed;
      ship.vy = (ship.vy / speed) * PLAYER.maxSpeed;
    }
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    if (speed > 40) ship.angle = Math.atan2(ship.vy, ship.vx);
    ship.x = Math.max(PLAYER.radius, Math.min(VIEW.width - PLAYER.radius, ship.x));
    ship.y = Math.max(PLAYER.radius + 56, Math.min(VIEW.height - PLAYER.radius, ship.y));
    if (ship.invulnerable > 0) ship.invulnerable -= dt;
    if (this.energy < PULSE.max) this.energy = Math.min(PULSE.max, this.energy + PULSE.recharge * dt);

    // Engine trail.
    ship.trailTimer -= dt;
    if (speed > 60 && ship.trailTimer <= 0) {
      ship.trailTimer = PARTICLES.trailEvery;
      const back = ship.angle + Math.PI;
      this.particles.push(makeParticle(
        ship.x + Math.cos(back) * 18, ship.y + Math.sin(back) * 18,
        Math.cos(back) * 60 + range(this.random, -20, 20),
        Math.sin(back) * 60 + range(this.random, -20, 20),
        0.35, 3, '#22d3ee',
      ));
    }

    // Combo decay.
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.chain = 0;
        this.combo = 0;
      }
    }

    // Spawning.
    this.shardTimer -= dt;
    if (this.shardTimer <= 0) {
      this.shardTimer = Math.max(0.6, SHARD.spawnEvery - (this.wave - 1) * 0.05);
      this.spawnShard();
    }
    this.asteroidTimer -= dt;
    if (this.asteroidTimer <= 0) {
      this.asteroidTimer = Math.max(ASTEROID.spawnEveryMin, ASTEROID.spawnEvery - (this.wave - 1) * 0.22);
      this.spawnAsteroid();
    }

    // Shards drift and wrap softly inside the field.
    for (const shard of this.shards) {
      shard.x += shard.vx * dt;
      shard.y += shard.vy * dt;
      shard.phase += dt * 3;
      if (shard.x < 20) { shard.x = 20; shard.vx = Math.abs(shard.vx); }
      if (shard.x > VIEW.width - 20) { shard.x = VIEW.width - 20; shard.vx = -Math.abs(shard.vx); }
      if (shard.y < 80) { shard.y = 80; shard.vy = Math.abs(shard.vy); }
      if (shard.y > VIEW.height - 20) { shard.y = VIEW.height - 20; shard.vy = -Math.abs(shard.vy); }
    }

    // Asteroids drift and spin; ones that leave the field are replaced.
    this.asteroids = this.asteroids.filter((asteroid) => {
      asteroid.x += asteroid.vx * dt;
      asteroid.y += asteroid.vy * dt;
      asteroid.rotation += asteroid.spin * dt;
      const margin = asteroid.radius + 60;
      return asteroid.x > -margin && asteroid.x < VIEW.width + margin
        && asteroid.y > -margin && asteroid.y < VIEW.height + margin;
    });

    // Particles fade.
    this.particles = this.particles.filter((particle) => {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= (1 - dt * 2);
      particle.vy *= (1 - dt * 2);
      particle.life -= dt;
      return particle.life > 0;
    });

    // Pulse rings expand and fade.
    this.pulseRings = this.pulseRings.filter((ring) => {
      ring.life -= dt;
      ring.radius += (ring.max - ring.radius) * dt * 9;
      return ring.life > 0;
    });

    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 40);
  }

  // Returns 'collected' (with points), 'hit' (with died flag) or null.
  checkCollisions() {
    const ship = this.ship;
    for (let i = this.shards.length - 1; i >= 0; i -= 1) {
      const shard = this.shards[i];
      const distance = Math.hypot(shard.x - ship.x, shard.y - ship.y);
      if (distance < shard.radius + PLAYER.radius) {
        this.shards.splice(i, 1);
        return { type: 'collected', ...this.collectShard(shard) };
      }
    }
    if (ship.invulnerable <= 0) {
      for (let i = this.asteroids.length - 1; i >= 0; i -= 1) {
        const asteroid = this.asteroids[i];
        const distance = Math.hypot(asteroid.x - ship.x, asteroid.y - ship.y);
        if (distance < asteroid.radius + PLAYER.radius - 4) {
          this.asteroids.splice(i, 1);
          const died = this.hitAsteroid(asteroid);
          return { type: 'hit', died };
        }
      }
    }
    return null;
  }
}
