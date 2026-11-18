// Starlight Salvage — the entry point: the canvas, the game loop and the
// state machine (title, playing, paused, win, lose). It wires input, audio,
// the world and the renderer together, and exposes a small test hook so a
// headless browser can drive the game and read its state back.
import { VIEW } from './config.js';
import { SoundBank } from './audio.js';
import { Input } from './input.js';
import { Renderer } from './render.js';
import { stageScene } from './shots.js';
import { World } from './world.js';

const canvas = document.getElementById('game');
const statusLine = document.getElementById('status');
const query = new URLSearchParams(window.location.search);
const staged = query.has('shot');

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
  canvas.width = VIEW.width;
  canvas.height = VIEW.height;
  canvas.style.width = `${Math.floor(VIEW.width * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW.height * scale)}px`;
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

const input = new Input(canvas);
const sounds = new SoundBank();
const renderer = new Renderer(canvas);

let world = new World(1);
let screen = 'title';
let time = 0;
let waveBanner = 0;
let lastBannerWave = 1;

function announce(text) {
  if (statusLine) statusLine.textContent = text;
}

function startGame() {
  world = new World((Math.random() * 1e9) | 0);
  screen = 'playing';
  waveBanner = 0;
  lastBannerWave = 1;
  sounds.ensure();
  sounds.click();
  announce('Salvage run started. Collect light shards, dodge asteroids, reach 500 salvage.');
}

function toTitle() {
  world = new World(1);
  screen = 'title';
  announce('Starlight Salvage. Press Enter or click to launch.');
}

function endGame(won) {
  screen = won ? 'win' : 'lose';
  if (won) {
    sounds.win();
    announce(`Salvage complete. Score ${world.score}. Press R to play again.`);
  } else {
    sounds.lose();
    announce(`Ship lost. Score ${world.score}. Press R to try again.`);
  }
}

function handleInput() {
  if (input.wasPressed('enter', ' ')) {
    sounds.ensure();
    if (screen === 'title') {
      startGame();
      return;
    }
    if (screen === 'win' || screen === 'lose') {
      startGame();
      return;
    }
  }
  if (input.wasPressed('r')) {
    if (screen === 'win' || screen === 'lose' || screen === 'playing') {
      startGame();
      return;
    }
  }
  if (input.wasPressed('p', 'escape')) {
    if (screen === 'playing') {
      screen = 'paused';
      announce('Paused. Press P to resume.');
    } else if (screen === 'paused') {
      screen = 'playing';
      announce('Resumed.');
    }
    return;
  }
  if (input.wasPressed('m')) {
    const muted = sounds.toggleMute();
    announce(muted ? 'Sound muted.' : 'Sound on.');
  }
  if (input.mouse.down && (screen === 'title' || screen === 'win' || screen === 'lose')) {
    startGame();
  }
}

// A staged scene (for screenshots) replaces the live game entirely.
if (staged) {
  const stagedScene = stageScene(query);
  world = stagedScene.world;
  screen = stagedScene.screen;
  waveBanner = stagedScene.waveBanner;
  // Keep the renderer's stars but freeze the ship where the scene put it.
  window.__game = {
    screen: () => screen,
    world: () => world,
    start: startGame,
  };
  renderer.draw({ world, time: 0, screen, waveBanner });
} else {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;
    handleInput();

    if (screen === 'playing') {
      const thrust = input.thrustVector();
      const steer = input.mouse.down ? { x: input.mouse.x, y: input.mouse.y } : null;
      world.update(dt, thrust, steer);
      const event = world.checkCollisions();
      if (event) {
        if (event.type === 'collected') {
          sounds.ensure();
          sounds.pickup(world.combo);
          if (event.wavedUp) {
            waveBanner = 1.6;
            sounds.wave();
            announce(`Wave ${world.wave}. Asteroids are faster now.`);
          }
          if (world.score >= 500 && world.score - event.gained < 500) {
            endGame(true);
          }
        } else if (event.type === 'hit') {
          sounds.ensure();
          sounds.explosion();
          if (event.died) {
            endGame(false);
          } else {
            announce(`Hull hit. ${world.ship.hull} hull left.`);
          }
        }
      }
      if (input.wasPressed(' ')) {
        const destroyed = world.firePulse();
        if (destroyed !== false) {
          sounds.ensure();
          sounds.pulse();
          if (world.score >= 500) endGame(true);
        }
      }
      if (waveBanner > 0) waveBanner -= dt;
    }

    renderer.draw({ world, time, screen, waveBanner });
    input.endFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  window.__game = {
    screen: () => screen,
    world: () => world,
    start: startGame,
    sounds: () => sounds,
    input: () => input,
  };
  announce('Starlight Salvage. Press Enter or click to launch.');
}
