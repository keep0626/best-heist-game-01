# best-heist-game-01

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/keep0626/best-heist-game-01/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/keep0626/best-heist-game-01/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

**The Gilded Vault** — a midnight heist at the Marlow Gallery. One thief,
one diamond, three guards, two cameras, and dawn in five minutes.

Sneak through the gallery in the dark: read the guards' vision cones
before you move, slip past the sweeping cameras or hack the terminal to
kill them, lift paintings and gold on the way, crack the glass case
around the Aurora Star, and get out through the skylight door before
the alarm hits 100% or dawn breaks.

## How to play

- **WASD / arrows** — move
- **Shift** — sneak (slower, harder to spot)
- **E (hold)** — crack the vault case, lift loot, hack the cameras
- **Q** — smoke pellet (×2, blocks all vision for a few seconds)
- **P** — pause, **R** — restart, **M** — mute

Win by escaping with the Aurora Star. Your rating runs from GHOST
(the alarm never rose above a whisper) to AMATEUR (the whole gallery
knows you were there).

## Run it

```sh
node serve.ts   # then open http://localhost:8080
```

`main.ts` (Node 22, stdlib only) hands the entry in: it copies `game/`
and `screenshots/` to the output directory and writes `dossier.json`
with the vendored make.fun library.

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

All art is drawn in code and all sound is synthesised with WebAudio —
the game loads nothing over the network.

---

<sub>Entered on [make.fun](https://make.fun/?ref=ftg7ax63&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
