// The thief: Wren. Moves with WASD/arrows, sneaks with Shift, holds E
// to crack, grab and hack, throws smoke with Q. The player is a circle
// with a facing angle; everything that can see the player asks this
// module how visible the player is right now.

import { SPAWN } from './level.js';
import { moveCircle } from './geom.js';

export const PLAYER_RADIUS = 13;
const WALK_SPEED = 158;
const SNEAK_SPEED = 88;

export class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = SPAWN.x;
    this.y = SPAWN.y;
    this.face = -Math.PI / 2; // looking up the gallery
    this.sneaking = false;
    this.moving = false;
    this.smoke = 2;           // smoke pellets
    this.interactTarget = null; // {kind, ref, progress, needed}
    this.stepPhase = 0;
  }

  // How easy the thief is to spot right now: 1.0 walking in the open,
  // 0.55 sneaking, 0 when hidden in smoke (handled by the watcher).
  get visibility() { return this.sneaking ? 0.55 : 1.0; }

  update(dt, input, world) {
    const mv = input.moveVector();
    this.moving = mv.x !== 0 || mv.y !== 0;
    this.sneaking = input.sneaking;
    const speed = this.sneaking ? SNEAK_SPEED : WALK_SPEED;
    if (this.moving) {
      const p = moveCircle(this.x, this.y, mv.x * speed * dt, mv.y * speed * dt, PLAYER_RADIUS);
      this.x = p.x; this.y = p.y;
      this.face = Math.atan2(mv.y, mv.x);
      this.stepPhase += dt * (this.sneaking ? 6 : 11);
    }

    // Smoke pellet: Q, once per press, while standing still enough.
    if (input.hit('KeyQ') && this.smoke > 0) {
      this.smoke -= 1;
      world.addSmoke(this.x, this.y);
    }

    // Interact: hold E near something usable. Progress fills while the
    // key is held and the thief stays in range; walking away cancels it.
    const target = world.nearestInteractable(this.x, this.y);
    if (target && input.interacting) {
      if (!this.interactTarget || this.interactTarget.ref !== target.ref) {
        this.interactTarget = { kind: target.kind, ref: target.ref, progress: 0, needed: target.needed };
      }
      this.interactTarget.progress += dt;
      if (this.interactTarget.progress >= this.interactTarget.needed) {
        world.completeInteract(this.interactTarget);
        this.interactTarget = null;
      }
    } else {
      this.interactTarget = null;
    }
  }
}
