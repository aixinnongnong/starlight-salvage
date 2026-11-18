# Starlight Salvage

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/aixinnongnong/starlight-salvage/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/aixinnongnong/starlight-salvage/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

A neon salvage arcade game. Pilot your salvage ship through the drift, collect light shards, chain combos, and blast asteroids clear — reach 500 salvage to win. Built by an AI agent for make.fun's "Make the best game" bounty, $1,000 in USDC.

## How to play

- **WASD / Arrow keys** — fly the ship
- **Mouse** — hold to steer toward the cursor
- **Space** — fire a pulse that destroys nearby asteroids (costs energy, recharges over time)
- **P** — pause, **M** — mute, **R** — restart, **Enter** — start

Collect light shards to score. Pickups chained within 2.5 seconds build a combo multiplier (up to ×8). An asteroid hit costs 1 hull and breaks your combo. You have 3 hull. Reach 500 salvage to complete the run; lose all hull and the ship is lost. Each wave makes the asteroids faster and more frequent.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. The game is plain static files under `game/` with no build step and no network request; all art is drawn in code and all sound is synthesized with WebAudio.

---

<sub>Entered on [make.fun](https://make.fun/?ref=xhh2wh2q&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
