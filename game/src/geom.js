// Geometry helpers shared by the player, the guards and the cameras:
// wall collision for a circle, and line of sight between two points.

import { WALLS, VAULT } from './level.js';

export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

export function circleHitsSolid(x, y, radius) {
  for (const w of WALLS) {
    const cx = Math.max(w.x, Math.min(x, w.x + w.w));
    const cy = Math.max(w.y, Math.min(y, w.y + w.h));
    const dx = x - cx, dy = y - cy;
    if (dx * dx + dy * dy < radius * radius) return true;
  }
  const cx = Math.max(VAULT.x, Math.min(x, VAULT.x + VAULT.w));
  const cy = Math.max(VAULT.y, Math.min(y, VAULT.y + VAULT.h));
  const dx = x - cx, dy = y - cy;
  return dx * dx + dy * dy < radius * radius;
}

// Move a circle along (dx, dy), sliding along walls axis by axis.
// Returns the new position.
export function moveCircle(x, y, dx, dy, radius) {
  let nx = x + dx;
  if (!circleHitsSolid(nx, y, radius)) x = nx;
  let ny = y + dy;
  if (!circleHitsSolid(x, ny, radius)) y = ny;
  // Clamp inside the outer shell as a backstop.
  x = Math.max(16 + radius, Math.min(944 - radius, x));
  y = Math.max(16 + radius, Math.min(624 - radius, y));
  return { x, y };
}

// Is the straight segment (x1,y1)-(x2,y2) blocked by any wall or the
// vault case? Sampled every 6 px, which is fine at our ranges.
export function lineBlocked(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const px = x1 + dx * t, py = y1 + dy * t;
    for (const w of WALLS) if (pointInRect(px, py, w)) return true;
    if (pointInRect(px, py, VAULT)) return true;
  }
  return false;
}

// Does the segment pass through any smoke cloud? A cloud hides the thief.
export function lineThroughSmoke(x1, y1, x2, y2, clouds) {
  const dx = x2 - x1, dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (const c of clouds) {
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = x1 + dx * t, py = y1 + dy * t;
      const ddx = px - c.x, ddy = py - c.y;
      if (ddx * ddx + ddy * ddy < c.r * c.r) return true;
    }
  }
  return false;
}

export function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }

export function angleTo(ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax); }

// Smallest absolute difference between two angles, in radians.
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return Math.abs(d);
}
