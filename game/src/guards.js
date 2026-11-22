// Guards: they walk a patrol, sweep a vision cone, and remember what
// they saw. States: patrol -> suspicious (walk to the last seen spot
// and look around) -> alert (chase the thief). A guard that reaches the
// thief catches them; a guard that loses the thief calms back down.

import { GUARD_DEFS } from './level.js';
import { moveCircle, lineBlocked, lineThroughSmoke, dist, angleTo, angleDiff } from './geom.js';

export const GUARD_RADIUS = 14;
const CONE_RANGE = 185;
const CONE_HALF = 0.62; // ~71 degrees of vision

export class Guard {
  constructor(def) {
    this.name = def.name;
    this.x = def.x;
    this.y = def.y;
    this.waypoints = def.waypoints;
    this.wpIndex = 1;
    this.speed = def.speed;
    this.face = Math.PI / 2;
    this.state = 'patrol'; // patrol | suspicious | alert
    this.suspicion = 0;    // 0..1, fills while the thief is in the cone
    this.lastSeen = null;  // {x, y}
    this.lookTimer = 0;    // how long to stare while suspicious
    this.pauseTimer = 0;   // pause at each waypoint
    this.alertTimer = 0;
  }

  reset(def) {
    this.x = def.x; this.y = def.y;
    this.wpIndex = 1;
    this.face = Math.PI / 2;
    this.state = 'patrol';
    this.suspicion = 0;
    this.lastSeen = null;
    this.lookTimer = 0;
    this.pauseTimer = 0;
    this.alertTimer = 0;
  }

  // Can this guard see the thief right now? Cone + line of sight +
  // smoke. Returns a 0..1 strength (1 = point blank, dead centre).
  canSee(player, clouds) {
    const d = dist(this.x, this.y, player.x, player.y);
    if (d > CONE_RANGE) return 0;
    if (angleDiff(angleTo(this.x, this.y, player.x, player.y), this.face) > CONE_HALF) return 0;
    if (lineBlocked(this.x, this.y, player.x, player.y)) return 0;
    if (lineThroughSmoke(this.x, this.y, player.x, player.y, clouds)) return 0;
    // Closer and more central = stronger. A sneaking thief is weaker.
    const centre = 1 - angleDiff(angleTo(this.x, this.y, player.x, player.y), this.face) / CONE_HALF;
    const near = 1 - d / CONE_RANGE;
    return (0.35 + 0.65 * centre) * (0.5 + 0.5 * near) * player.visibility;
  }

  update(dt, player, clouds, alarmHigh, sounds) {
    const seen = this.canSee(player, clouds);

    if (seen > 0) {
      // Suspicion fills faster up close; a running thief is obvious.
      this.suspicion += dt * seen * 1.15;
      this.lastSeen = { x: player.x, y: player.y };
      if (this.suspicion >= 1 && this.state !== 'alert') {
        this.state = 'alert';
        this.alertTimer = 4;
        sounds.spotted();
      } else if (this.suspicion > 0.3 && this.state === 'patrol') {
        this.state = 'suspicious';
        this.lookTimer = 2.5;
      }
    } else {
      this.suspicion = Math.max(0, this.suspicion - dt * 0.22);
      if (this.state === 'suspicious') {
        this.lookTimer -= dt;
        if (this.lookTimer <= 0 && this.suspicion < 0.3) this.state = 'patrol';
      }
    }

    // High alarm puts every guard on edge: faster, and they drift
    // towards the thief's last known spot.
    const speedMul = this.state === 'alert' ? 1.9 : alarmHigh ? 1.25 : 1;

    if (this.state === 'alert') {
      this.alertTimer -= dt;
      const target = this.lastSeen || { x: player.x, y: player.y };
      this.walkToward(dt, target.x, target.y, this.speed * speedMul);
      if (this.alertTimer <= 0) {
        this.state = this.suspicion > 0.3 ? 'suspicious' : 'patrol';
        this.lookTimer = 2;
      }
    } else if (this.state === 'suspicious' && this.lastSeen) {
      const arrived = this.walkToward(dt, this.lastSeen.x, this.lastSeen.y, this.speed * 1.3);
      if (arrived) {
        // Reached the spot: look around, then give up.
        this.face += dt * 1.8;
        this.lookTimer -= dt * 0.6;
        if (this.lookTimer <= 0) { this.state = 'patrol'; this.lastSeen = null; }
      }
    } else {
      // Patrol: walk the waypoints, pausing a beat at each end.
      if (this.pauseTimer > 0) {
        this.pauseTimer -= dt;
        this.face += dt * 0.5; // glance around while waiting
      } else {
        const [tx, ty] = this.waypoints[this.wpIndex];
        const arrived = this.walkToward(dt, tx, ty, this.speed * speedMul);
        if (arrived) {
          this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
          this.pauseTimer = 1.2;
        }
      }
    }
  }

  // Walk towards (tx, ty). Returns true when arrived.
  walkToward(dt, tx, ty, speed) {
    const dx = tx - this.x, dy = ty - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 6) return true;
    const step = Math.min(d, speed * dt);
    const p = moveCircle(this.x, this.y, (dx / d) * step, (dy / d) * step, GUARD_RADIUS);
    this.x = p.x; this.y = p.y;
    this.face = Math.atan2(dy, dx);
    return d <= 8;
  }

  get coneColor() {
    if (this.state === 'alert') return 'rgba(255, 45, 45, 0.30)';
    if (this.state === 'suspicious') return 'rgba(255, 150, 40, 0.26)';
    return 'rgba(255, 214, 90, 0.20)';
  }

  get coneEdge() {
    if (this.state === 'alert') return 'rgba(255, 45, 45, 0.55)';
    if (this.state === 'suspicious') return 'rgba(255, 150, 40, 0.5)';
    return 'rgba(255, 214, 90, 0.38)';
  }
}

export function makeGuards() {
  return GUARD_DEFS.map((d) => new Guard(d));
}

export function resetGuards(guards) {
  guards.forEach((g, i) => g.reset(GUARD_DEFS[i]));
}
