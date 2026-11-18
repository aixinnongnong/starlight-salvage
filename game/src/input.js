// Starlight Salvage — keyboard and mouse state. The ship answers WASD or the
// arrow keys, the mouse steers it while held, Space fires the pulse, and P
// pauses. Every key is read as a held state each frame, so controls feel
// immediate instead of waiting for a key event to arrive.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, down: false };
    this.pressed = new Set(); // keys pressed since the last frame (edge)
    this.canvas = canvas;

    window.addEventListener('keydown', (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
        event.preventDefault();
      }
      if (!event.repeat) this.pressed.add(event.key.toLowerCase());
      this.keys.add(event.key.toLowerCase());
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.key.toLowerCase());
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.mouse.down = false;
    });

    canvas.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = (event.clientX - rect.left) * (canvas.width / rect.width);
      this.mouse.y = (event.clientY - rect.top) * (canvas.height / rect.height);
    });
    canvas.addEventListener('mousedown', (event) => {
      if (event.button === 0) this.mouse.down = true;
    });
    window.addEventListener('mouseup', () => {
      this.mouse.down = false;
    });
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  held(...names) {
    return names.some((name) => this.keys.has(name));
  }

  wasPressed(...names) {
    return names.some((name) => this.pressed.has(name));
  }

  // Thrust direction from the keys: a unit vector, or null when idle.
  thrustVector() {
    let x = 0;
    let y = 0;
    if (this.held('a', 'arrowleft')) x -= 1;
    if (this.held('d', 'arrowright')) x += 1;
    if (this.held('w', 'arrowup')) y -= 1;
    if (this.held('s', 'arrowdown')) y += 1;
    if (x === 0 && y === 0) return null;
    const length = Math.hypot(x, y);
    return { x: x / length, y: y / length };
  }

  endFrame() {
    this.pressed.clear();
  }
}
