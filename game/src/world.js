// The world: everything that is not one actor. It owns the alarm meter,
// the smoke clouds, the loot and the terminal, the dawn timer, and the
// win/lose rules. The player, guards and cameras all ask it questions.

import { LOOT, STAR, TERMINAL, EXIT, VAULT } from './level.js';
import { dist } from './geom.js';

const DAWN_SECONDS = 300; // five minutes until the gallery opens
const ALARM_MAX = 100;

export class World {
  constructor(sounds) {
    this.sounds = sounds;
    this.reset();
  }

  reset() {
    this.alarm = 0;
    this.maxAlarm = 0;
    this.timeLeft = DAWN_SECONDS;
    this.clouds = []; // {x, y, r, t}
    this.loot = LOOT.map((l) => ({ ...l, taken: false }));
    this.starTaken = false;
    this.camerasDown = 0; // seconds the cameras stay hacked
    this.exitOpen = false;
    this.outcome = null; // null | 'won' | 'caught' | 'lockdown' | 'dawn'
    this.alarmBeepTimer = 0;
  }

  get alarmHigh() { return this.alarm >= 60; }

  addSmoke(x, y) {
    this.clouds.push({ x, y, r: 82, t: 5 });
    this.sounds.smoke();
  }

  // The nearest thing the thief can use right now, or null.
  nearestInteractable(px, py) {
    if (!this.starTaken && dist(px, py, STAR.x, STAR.y) < 58) {
      return { kind: 'star', ref: STAR, needed: 2.0, label: 'Crack the vault case' };
    }
    for (const l of this.loot) {
      if (!l.taken && dist(px, py, l.x, l.y) < 42) {
        return { kind: 'loot', ref: l, needed: 1.0, label: `Lift the ${l.name.toLowerCase()}` };
      }
    }
    if (this.camerasDown <= 0 && dist(px, py, TERMINAL.x, TERMINAL.y) < 52) {
      return { kind: 'terminal', ref: TERMINAL, needed: 2.0, label: 'Hack the cameras' };
    }
    return null;
  }

  completeInteract(act) {
    if (act.kind === 'star') {
      this.starTaken = true;
      this.exitOpen = true;
      this.sounds.pickup();
    } else if (act.kind === 'loot') {
      act.ref.taken = true;
      this.sounds.pickup();
    } else if (act.kind === 'terminal') {
      this.camerasDown = 20;
      this.sounds.hackDone();
    }
  }

  lootValue() {
    let v = 0;
    for (const l of this.loot) if (l.taken) v += l.value;
    if (this.starTaken) v += STAR.value;
    return v;
  }

  update(dt, player, guards, cameras) {
    if (this.outcome) return;

    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.outcome = 'dawn';
      this.sounds.caught();
      return;
    }

    // Smoke clouds shrink and fade.
    for (const c of this.clouds) c.t -= dt;
    this.clouds = this.clouds.filter((c) => c.t > 0);

    if (this.camerasDown > 0) this.camerasDown -= dt;

    // Cameras: each live camera that sees the thief pushes the alarm.
    let cameraHeat = 0;
    for (const cam of cameras) {
      cam.disabled = Math.max(0, this.camerasDown);
      cameraHeat += cam.update(dt, player, this.clouds);
    }
    if (cameraHeat > 0) this.alarm += dt * 26 * cameraHeat;

    // Guards: an alert guard pushes the alarm hard.
    let guardHeat = 0;
    for (const g of guards) {
      if (g.state === 'alert') guardHeat += 1;
      else if (g.state === 'suspicious') guardHeat += 0.25;
    }
    if (guardHeat > 0) this.alarm += dt * 14 * guardHeat;

    // The alarm cools when nobody is actively raising it.
    if (cameraHeat === 0 && guardHeat === 0) this.alarm -= dt * 3;
    this.alarm = Math.max(0, Math.min(ALARM_MAX, this.alarm));
    this.maxAlarm = Math.max(this.maxAlarm, this.alarm);

    // Alarm beeps get faster as the meter fills.
    if (this.alarm > 50) {
      this.alarmBeepTimer -= dt;
      if (this.alarmBeepTimer <= 0) {
        this.sounds.alarmTick();
        this.alarmBeepTimer = this.alarm > 80 ? 0.45 : 0.9;
      }
    }

    // Caught: a guard touches the thief, or the alarm hits the top.
    for (const g of guards) {
      if (dist(g.x, g.y, player.x, player.y) < 26) {
        this.outcome = 'caught';
        this.sounds.caught();
        return;
      }
    }
    if (this.alarm >= ALARM_MAX) {
      this.outcome = 'lockdown';
      this.sounds.caught();
      return;
    }

    // Escape: touch the skylight door with the star.
    if (this.exitOpen && dist(player.x, player.y, EXIT.x, EXIT.y) < EXIT.r) {
      this.outcome = 'won';
      this.sounds.win();
    }
  }

  // Stealth rating for the win screen, from the worst the alarm got.
  rating() {
    if (this.maxAlarm < 25) return 'GHOST — never even a whisper';
    if (this.maxAlarm < 55) return 'SHADOW — a few close calls';
    if (this.maxAlarm < 85) return 'PROFESSIONAL — loud, but clean';
    return 'AMATEUR — the whole gallery knows';
  }
}
