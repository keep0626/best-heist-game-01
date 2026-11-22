// The Gilded Vault — game loop and state machine.
// Modes: title -> playing <-> paused -> over (won / caught / lockdown / dawn).

import { Input } from './input.js';
import { SoundBank } from './audio.js';
import { Player } from './player.js';
import { makeGuards, resetGuards } from './guards.js';
import { makeCameras, resetCameras } from './cameras.js';
import { World } from './world.js';
import { Renderer } from './render.js';
import { stageShot } from './shots.js';
import { WORLD_W, WORLD_H } from './level.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('game');
    this.canvas.width = WORLD_W;
    this.canvas.height = WORLD_H;
    // Keep the 3:2 frame intact at any window size (no stretching).
    const fit = () => {
      const scale = Math.min(window.innerWidth / WORLD_W, window.innerHeight / WORLD_H);
      this.canvas.style.width = `${WORLD_W * scale}px`;
      this.canvas.style.height = `${WORLD_H * scale}px`;
      this.canvas.style.left = `${(window.innerWidth - WORLD_W * scale) / 2}px`;
      this.canvas.style.top = `${(window.innerHeight - WORLD_H * scale) / 2}px`;
    };
    window.addEventListener('resize', fit);
    fit();
    this.status = document.getElementById('status');
    this.input = new Input(this.canvas);
    this.sounds = new SoundBank();
    this.player = new Player();
    this.guards = makeGuards();
    this.cameras = makeCameras();
    this.world = new World(this.sounds);
    this.renderer = new Renderer(this.canvas);
    this.mode = 'title';
    this.time = 0;
    this.playSeconds = 0;
    this.endTime = 0;
    this.titleButton = null;
    this.endButton = null;
    this.shotMode = stageShot(this);

    // Test / automation handle: read-only state for playtesting.
    window.HEIST = this;

    this.last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.frame(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  startRun() {
    this.player.reset();
    resetGuards(this.guards);
    resetCameras(this.cameras);
    this.world.reset();
    this.playSeconds = 0;
    this.mode = 'playing';
    this.announce('The heist begins. Steal the Aurora Star and reach the skylight.');
  }

  timeUsedText() {
    const s = Math.floor(this.mode === 'over' ? this.endTime : this.playSeconds);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  announce(text) { this.status.textContent = text; }

  stateSummary() {
    return {
      mode: this.mode,
      outcome: this.world.outcome,
      alarm: Math.round(this.world.alarm),
      loot: this.world.lootValue(),
      starTaken: this.world.starTaken,
      timeLeft: Math.round(this.world.timeLeft),
      player: { x: Math.round(this.player.x), y: Math.round(this.player.y), smoke: this.player.smoke },
      guards: this.guards.map((g) => ({ name: g.name, x: Math.round(g.x), y: Math.round(g.y), state: g.state, suspicion: Math.round(g.suspicion * 100) / 100 })),
      camerasDown: Math.round(this.world.camerasDown),
    };
  }

  frame(dt) {
    this.time += dt;
    const input = this.input;

    if (input.hit('KeyM')) {
      const muted = this.sounds.toggleMute();
      this.announce(muted ? 'Sound off.' : 'Sound on.');
    }

    if (this.mode === 'title') {
      if (input.hit('Enter', 'Space') || this.clickedButton(this.titleButton)) {
        this.sounds.ensure();
        this.startRun();
      }
    } else if (this.mode === 'playing') {
      if (input.hit('KeyP')) {
        this.mode = 'paused';
        this.announce('Paused.');
      } else if (input.hit('KeyR')) {
        this.startRun();
      } else {
        this.playSeconds += dt;
        this.player.update(dt, input, this.world);
        const clouds = this.world.clouds;
        for (const g of this.guards) g.update(dt, this.player, clouds, this.world.alarmHigh, this.sounds);
        this.world.update(dt, this.player, this.guards, this.cameras);
        if (this.world.outcome) {
          this.mode = 'over';
          this.endTime = this.playSeconds;
          const msg = this.world.outcome === 'won'
            ? `Clean getaway with $${this.world.lootValue().toLocaleString()}.`
            : this.world.outcome === 'caught' ? 'Caught by a guard.'
            : this.world.outcome === 'lockdown' ? 'Lockdown. The alarm hit 100 percent.'
            : 'Dawn broke.';
          this.announce(msg);
        }
      }
    } else if (this.mode === 'paused') {
      if (input.hit('KeyP')) this.mode = 'playing';
      else if (input.hit('KeyR')) this.startRun();
    } else if (this.mode === 'over') {
      if (input.hit('KeyR', 'Enter', 'Space') || this.clickedButton(this.endButton)) {
        this.sounds.ensure();
        this.startRun();
      }
    }

    this.renderer.render(this);
    input.endFrame();
  }

  clickedButton(rect) {
    if (!rect || !this.input.mouse.clicked) return false;
    const m = this.input.mouse;
    // Mouse coordinates are in canvas pixels (960x640 logical space).
    return m.x >= rect.x && m.x <= rect.x + rect.w && m.y >= rect.y && m.y <= rect.y + rect.h;
  }
}

new Game();
