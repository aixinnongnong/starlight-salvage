// Starlight Salvage — everything the player sees. The renderer draws the
// starfield, the ship, the shards and asteroids, the particles, the HUD and
// the title, win, loss and pause screens, all in canvas shapes: no image
// files, so the game stays offline and the palette stays coherent.
import { GAME, PALETTE, PLAYER, PULSE, SHARD, VIEW } from './config.js';

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawStarfield(ctx, stars, time) {
  ctx.fillStyle = PALETTE.space;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  const gradient = ctx.createRadialGradient(
    VIEW.width / 2, VIEW.height * 0.42, 60,
    VIEW.width / 2, VIEW.height * 0.42, VIEW.height * 0.85,
  );
  gradient.addColorStop(0, 'rgba(28, 48, 96, 0.55)');
  gradient.addColorStop(1, 'rgba(7, 11, 22, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  for (const star of stars) {
    const twinkle = 0.55 + 0.45 * Math.sin(time * star.twinkle + star.phase);
    ctx.globalAlpha = star.alpha * twinkle;
    ctx.fillStyle = star.color;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawShip(ctx, ship, time) {
  ctx.save();
  ctx.translate(ship.x, ship.y);
  const blink = ship.invulnerable > 0 && Math.floor(time * 14) % 2 === 0;
  ctx.globalAlpha = blink ? 0.35 : 1;
  ctx.rotate(ship.angle);
  // Engine glow.
  const flame = 14 + Math.sin(time * 22) * 4;
  const glow = ctx.createRadialGradient(-14, 0, 2, -14, 0, flame + 12);
  glow.addColorStop(0, 'rgba(94, 242, 255, 0.85)');
  glow.addColorStop(1, 'rgba(94, 242, 255, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(-14, 0, flame + 12, 0, Math.PI * 2);
  ctx.fill();
  // Hull: a sleek dart.
  ctx.beginPath();
  ctx.moveTo(22, 0);
  ctx.lineTo(-12, -11);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-12, 11);
  ctx.closePath();
  ctx.fillStyle = '#0e2a3d';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = PALETTE.ship;
  ctx.stroke();
  // Cockpit.
  ctx.beginPath();
  ctx.arc(6, 0, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.shipGlow;
  ctx.fill();
  // Wing lights.
  ctx.fillStyle = PALETTE.shard;
  ctx.beginPath();
  ctx.arc(-10, -10, 2, 0, Math.PI * 2);
  ctx.arc(-10, 10, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawShard(ctx, shard) {
  const pulse = 1 + 0.18 * Math.sin(shard.phase);
  const size = shard.radius * pulse;
  ctx.save();
  ctx.translate(shard.x, shard.y);
  ctx.rotate(Math.sin(shard.phase * 0.5) * 0.4);
  const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, size * 2.4);
  glow.addColorStop(0, 'rgba(255, 209, 102, 0.55)');
  glow.addColorStop(1, 'rgba(255, 209, 102, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, size * 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.72, 0);
  ctx.lineTo(0, size);
  ctx.lineTo(-size * 0.72, 0);
  ctx.closePath();
  ctx.fillStyle = PALETTE.shard;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.45);
  ctx.lineTo(size * 0.32, 0);
  ctx.lineTo(0, size * 0.45);
  ctx.lineTo(-size * 0.32, 0);
  ctx.closePath();
  ctx.fillStyle = '#fff3c4';
  ctx.fill();
  ctx.restore();
}

function drawAsteroid(ctx, asteroid) {
  ctx.save();
  ctx.translate(asteroid.x, asteroid.y);
  ctx.rotate(asteroid.rotation);
  ctx.beginPath();
  const count = asteroid.vertices.length;
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    const radius = asteroid.radius * asteroid.vertices[i];
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = PALETTE.asteroid;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = PALETTE.asteroidEdge;
  ctx.stroke();
  // Craters.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.arc(-asteroid.radius * 0.25, -asteroid.radius * 0.15, asteroid.radius * 0.22, 0, Math.PI * 2);
  ctx.arc(asteroid.radius * 0.3, asteroid.radius * 0.3, asteroid.radius * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawParticles(ctx, particles) {
  for (const particle of particles) {
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawPulseRings(ctx, rings) {
  for (const ring of rings) {
    const alpha = Math.max(0, ring.life / ring.maxLife);
    ctx.globalAlpha = alpha * 0.9;
    ctx.lineWidth = 5;
    ctx.strokeStyle = PALETTE.pulse;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = alpha * 0.25;
    ctx.fillStyle = PALETTE.pulse;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawHullHearts(ctx, hull, maxHull) {
  for (let i = 0; i < maxHull; i += 1) {
    const x = 30 + i * 34;
    const y = VIEW.height - 34;
    const filled = i < hull;
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.bezierCurveTo(-12, -4, -6, -12, 0, -5);
    ctx.bezierCurveTo(6, -12, 12, -4, 0, 8);
    ctx.closePath();
    ctx.fillStyle = filled ? '#ff5d73' : 'rgba(255, 93, 115, 0.18)';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = filled ? '#ff8fa3' : 'rgba(255, 143, 163, 0.35)';
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('HULL', 30, VIEW.height - 58);
}

function drawHud(ctx, world) {
  // Top bar.
  ctx.fillStyle = 'rgba(7, 11, 22, 0.55)';
  ctx.fillRect(0, 0, VIEW.width, 56);
  ctx.fillStyle = PALETTE.panelEdge;
  ctx.fillRect(0, 56, VIEW.width, 1);

  ctx.textBaseline = 'middle';
  // Score, left.
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.fillText('SCORE', 24, 16);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '700 26px system-ui, sans-serif';
  ctx.fillText(String(world.score), 24, 38);

  // Combo, beside the score.
  if (world.combo > 1) {
    ctx.fillStyle = PALETTE.shard;
    ctx.font = '700 22px system-ui, sans-serif';
    ctx.fillText(`×${world.combo}`, 150, 38);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.fillText('COMBO', 150, 16);
    // Combo timer bar.
    const width = 64;
    ctx.fillStyle = 'rgba(255, 209, 102, 0.25)';
    ctx.fillRect(150, 50, width, 4);
    ctx.fillStyle = PALETTE.shard;
    ctx.fillRect(150, 50, width * Math.max(0, world.comboTimer / SHARD.comboWindow), 4);
  }

  // Salvage progress, centre: the road to the win.
  const barWidth = 340;
  const barX = (VIEW.width - barWidth) / 2;
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`SALVAGE  ${Math.min(world.score, GAME.winScore)} / ${GAME.winScore}`, VIEW.width / 2, 16);
  ctx.fillStyle = 'rgba(93, 242, 255, 0.18)';
  roundRect(ctx, barX, 28, barWidth, 12, 6);
  ctx.fill();
  ctx.fillStyle = PALETTE.shipGlow;
  roundRect(ctx, barX, 28, barWidth * Math.min(1, world.score / GAME.winScore), 12, 6);
  ctx.fill();

  // Wave, right.
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.fillText('WAVE', VIEW.width - 24, 16);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '700 26px system-ui, sans-serif';
  ctx.fillText(String(world.wave), VIEW.width - 24, 38);

  // Hull, bottom left. Pulse energy, bottom right.
  drawHullHearts(ctx, world.ship.hull, PLAYER.hull);
  const energyWidth = 200;
  const energyX = VIEW.width - 24 - energyWidth;
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillText('PULSE — SPACE', VIEW.width - 24, VIEW.height - 58);
  ctx.fillStyle = 'rgba(124, 92, 255, 0.22)';
  roundRect(ctx, energyX, VIEW.height - 44, energyWidth, 12, 6);
  ctx.fill();
  ctx.fillStyle = world.energy >= PULSE.cost ? PALETTE.pulse : 'rgba(124, 92, 255, 0.45)';
  roundRect(ctx, energyX, VIEW.height - 44, energyWidth * (world.energy / PULSE.max), 12, 6);
  ctx.fill();
  if (world.energy >= PULSE.cost) {
    ctx.fillStyle = PALETTE.text;
    ctx.font = '700 12px system-ui, sans-serif';
    ctx.fillText('READY', VIEW.width - 24, VIEW.height - 24);
  }
}

function drawPanel(ctx, x, y, width, height) {
  ctx.fillStyle = PALETTE.panel;
  roundRect(ctx, x, y, width, height, 18);
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.stroke();
}

function drawTitle(ctx, time) {
  ctx.fillStyle = 'rgba(7, 11, 22, 0.45)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  const panelX = VIEW.width / 2 - 380;
  const panelY = 128;
  drawPanel(ctx, panelX, panelY, 760, 420);

  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.shard;
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.fillText('A NEON SALVAGE ARCADE', VIEW.width / 2, panelY + 48);

  ctx.fillStyle = PALETTE.text;
  ctx.font = '800 64px system-ui, sans-serif';
  ctx.fillText('STARLIGHT', VIEW.width / 2, panelY + 118);
  ctx.fillStyle = PALETTE.ship;
  ctx.fillText('SALVAGE', VIEW.width / 2, panelY + 184);

  ctx.fillStyle = PALETTE.muted;
  ctx.font = '400 18px system-ui, sans-serif';
  ctx.fillText('Pilot your salvage ship through the drift. Collect light shards,', VIEW.width / 2, panelY + 232);
  ctx.fillText('chain combos, and blast asteroids clear — reach 500 salvage to win.', VIEW.width / 2, panelY + 258);

  ctx.fillStyle = PALETTE.text;
  ctx.font = '600 16px system-ui, sans-serif';
  ctx.fillText('WASD / ARROWS — fly      MOUSE — steer      SPACE — pulse      P — pause      M — mute', VIEW.width / 2, panelY + 306);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '400 15px system-ui, sans-serif';
  ctx.fillText('3 hull. An asteroid hit costs 1 hull and breaks your combo.', VIEW.width / 2, panelY + 334);

  const blink = 0.65 + 0.35 * Math.sin(time * 3.2);
  ctx.globalAlpha = blink;
  ctx.fillStyle = PALETTE.shipGlow;
  ctx.font = '700 24px system-ui, sans-serif';
  ctx.fillText('PRESS ENTER OR CLICK TO LAUNCH', VIEW.width / 2, panelY + 384);
  ctx.globalAlpha = 1;
}

function drawEnd(ctx, { title, titleColor, subtitle, stats, prompt }) {
  ctx.fillStyle = 'rgba(7, 11, 22, 0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  const panelX = VIEW.width / 2 - 360;
  const panelY = 150;
  drawPanel(ctx, panelX, panelY, 720, 380);

  ctx.textAlign = 'center';
  ctx.fillStyle = titleColor;
  ctx.font = '800 52px system-ui, sans-serif';
  ctx.fillText(title, VIEW.width / 2, panelY + 92);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '400 18px system-ui, sans-serif';
  ctx.fillText(subtitle, VIEW.width / 2, panelY + 138);

  ctx.fillStyle = PALETTE.text;
  ctx.font = '700 22px system-ui, sans-serif';
  let y = panelY + 196;
  for (const line of stats) {
    ctx.fillText(line, VIEW.width / 2, y);
    y += 34;
  }

  const blink = 0.65 + 0.35 * Math.sin(Date.now() / 280);
  ctx.globalAlpha = blink;
  ctx.fillStyle = PALETTE.shipGlow;
  ctx.font = '700 22px system-ui, sans-serif';
  ctx.fillText(prompt, VIEW.width / 2, panelY + 330);
  ctx.globalAlpha = 1;
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(7, 11, 22, 0.6)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = '800 44px system-ui, sans-serif';
  ctx.fillText('PAUSED', VIEW.width / 2, VIEW.height / 2 - 12);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '400 18px system-ui, sans-serif';
  ctx.fillText('Press P to resume', VIEW.width / 2, VIEW.height / 2 + 28);
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.stars = [];
    const random = Math.random;
    for (let i = 0; i < 150; i += 1) {
      this.stars.push({
        x: random() * VIEW.width,
        y: random() * VIEW.height,
        size: random() * 1.6 + 0.5,
        alpha: random() * 0.7 + 0.3,
        twinkle: random() * 2 + 0.5,
        phase: random() * Math.PI * 2,
        color: random() < 0.85 ? PALETTE.star : '#ffd166',
      });
    }
  }

  draw(state) {
    const { ctx } = this;
    const { world, time, screen, waveBanner } = state;
    ctx.save();
    if (world.shake > 0) {
      ctx.translate((Math.random() - 0.5) * world.shake, (Math.random() - 0.5) * world.shake);
    }
    drawStarfield(ctx, this.stars, time);
    for (const shard of world.shards) drawShard(ctx, shard);
    for (const asteroid of world.asteroids) drawAsteroid(ctx, asteroid);
    drawParticles(ctx, world.particles);
    drawPulseRings(ctx, world.pulseRings);
    if (screen === 'playing' || screen === 'paused') drawShip(ctx, world.ship, time);
    drawHud(ctx, world);

    if (waveBanner > 0) {
      ctx.globalAlpha = Math.min(1, waveBanner);
      ctx.textAlign = 'center';
      ctx.fillStyle = PALETTE.shard;
      ctx.font = '800 44px system-ui, sans-serif';
      ctx.fillText(`WAVE ${world.wave}`, VIEW.width / 2, 150);
      ctx.globalAlpha = 1;
    }

    if (screen === 'title') drawTitle(ctx, time);
    if (screen === 'win') {
      drawEnd(ctx, {
        title: 'SALVAGE COMPLETE',
        titleColor: PALETTE.shard,
        subtitle: 'You gathered every shard the drift had to offer. The run is yours.',
        stats: [
          `Score  ${world.score}`,
          `Best combo  ×${world.bestCombo}`,
          `Pulses fired  ${world.pulseFlashes}`,
          `Waves cleared  ${world.wave - 1}`,
        ],
        prompt: 'PRESS R OR CLICK TO PLAY AGAIN',
      });
    }
    if (screen === 'lose') {
      drawEnd(ctx, {
        title: 'SHIP LOST',
        titleColor: PALETTE.danger,
        subtitle: 'The drift took your hull. Your salvage is logged — fly again.',
        stats: [
          `Score  ${world.score}`,
          `Best combo  ×${world.bestCombo}`,
          `Wave reached  ${world.wave}`,
          `Salvage target  ${GAME.winScore}`,
        ],
        prompt: 'PRESS R OR CLICK TO TRY AGAIN',
      });
    }
    if (screen === 'paused') drawPaused(ctx);
    ctx.restore();
  }
}
