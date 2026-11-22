// Everything the eye sees: the gallery floor, the vault, the guards and
// their vision cones, the cameras, the thief, the smoke, the HUD and the
// title / win / lose screens. All art is drawn in code — no images.

import { WORLD_W, WORLD_H, WALLS, VAULT, EXIT, TERMINAL, STAR, LOOT, DECOR_PAINTINGS, LAMPS, CARPET } from './level.js';
import { pointInRect } from './geom.js';

const CONE_RAYS = 26;

// Trace a ray from (x, y) along `angle` until it hits a wall or the
// vault case, or runs out of range. Returns the hit point.
function rayHit(x, y, angle, range) {
  const dx = Math.cos(angle), dy = Math.sin(angle);
  for (let d = 8; d <= range; d += 8) {
    const px = x + dx * d, py = y + dy * d;
    for (const w of WALLS) if (pointInRect(px, py, w)) return { x: px, y: py };
    if (pointInRect(px, py, VAULT)) return { x: px, y: py };
  }
  return { x: x + dx * range, y: y + dy * range };
}

// Draw a vision cone that hugs the walls: a fan of short rays.
function drawCone(ctx, x, y, face, halfAngle, range, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 0; i <= CONE_RAYS; i++) {
    const a = face - halfAngle + (2 * halfAngle * i) / CONE_RAYS;
    const p = rayHit(x, y, a, range);
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.time = 0;
  }

  // ---- the room ----
  drawFloor(ctx) {
    // Dark marble checker.
    const tile = 40;
    for (let y = 0; y < WORLD_H / tile; y++) {
      for (let x = 0; x < WORLD_W / tile; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#1d1d2b' : '#232336';
        ctx.fillRect(x * tile, y * tile, tile, tile);
      }
    }
    // Red carpet runner down the central hall.
    ctx.fillStyle = '#5e1a24';
    ctx.fillRect(CARPET.x, CARPET.y, CARPET.w, CARPET.h);
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 2;
    ctx.strokeRect(CARPET.x + 4, CARPET.y + 4, CARPET.w - 8, CARPET.h - 8);

    // Warm lamp pools.
    for (const lamp of LAMPS) {
      const g = ctx.createRadialGradient(lamp.x, lamp.y, 8, lamp.x, lamp.y, lamp.r);
      g.addColorStop(0, 'rgba(255, 196, 110, 0.14)');
      g.addColorStop(1, 'rgba(255, 196, 110, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(lamp.x - lamp.r, lamp.y - lamp.r, lamp.r * 2, lamp.r * 2);
    }

    // Decorative paintings on the walls.
    for (const p of DECOR_PAINTINGS) {
      ctx.fillStyle = '#c9a227';
      ctx.fillRect(p.x - 3, p.y - 3, p.w + 6, p.h + 6);
      ctx.fillStyle = p.hue;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(p.x + 4, p.y + 4, p.w - 12, 4);
    }
  }

  drawWalls(ctx) {
    for (const w of WALLS) {
      ctx.fillStyle = '#3a3a52';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeStyle = '#c9a227';
      ctx.lineWidth = 1;
      ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
    }
  }

  drawVault(ctx, world) {
    // Glass case on a plinth, the star glinting inside.
    ctx.fillStyle = '#2c2c40';
    ctx.fillRect(VAULT.x - 6, VAULT.y - 6, VAULT.w + 12, VAULT.h + 12);
    ctx.fillStyle = 'rgba(150, 200, 255, 0.22)';
    ctx.fillRect(VAULT.x, VAULT.y, VAULT.w, VAULT.h);
    ctx.strokeStyle = '#9ec8ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(VAULT.x, VAULT.y, VAULT.w, VAULT.h);
    if (!world.starTaken) {
      const cx = VAULT.x + VAULT.w / 2, cy = VAULT.y + VAULT.h / 2;
      const tw = 0.7 + 0.3 * Math.sin(this.time * 3);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(this.time * 0.6);
      ctx.fillStyle = `rgba(255, 230, 120, ${tw})`;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const r = i % 2 === 0 ? 13 : 5;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#fff2b0';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AURORA STAR', cx, VAULT.y - 12);
    }
  }

  drawLoot(ctx, world) {
    for (const l of world.loot) {
      if (l.taken) continue;
      if (l.kind === 'painting') {
        ctx.fillStyle = '#c9a227';
        ctx.fillRect(l.x - 16, l.y - 12, 32, 24);
        ctx.fillStyle = '#8a5a2b';
        ctx.fillRect(l.x - 13, l.y - 9, 26, 18);
        ctx.fillStyle = '#ffd76a';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('$', l.x, l.y + 4);
      } else {
        ctx.fillStyle = '#c9a227';
        ctx.beginPath();
        ctx.moveTo(l.x - 14, l.y + 8);
        ctx.lineTo(l.x - 10, l.y - 6);
        ctx.lineTo(l.x + 10, l.y - 6);
        ctx.lineTo(l.x + 14, l.y + 8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffe98a';
        ctx.fillRect(l.x - 8, l.y - 4, 16, 3);
      }
      // A soft glint so loot reads at a glance.
      const g = ctx.createRadialGradient(l.x, l.y, 2, l.x, l.y, 26);
      g.addColorStop(0, 'rgba(255, 215, 106, 0.35)');
      g.addColorStop(1, 'rgba(255, 215, 106, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(l.x - 26, l.y - 26, 52, 52);
    }
  }

  drawTerminal(ctx, world) {
    const on = world.camerasDown > 0;
    ctx.fillStyle = '#1a2a1a';
    ctx.fillRect(TERMINAL.x - 12, TERMINAL.y - 16, 24, 32);
    ctx.fillStyle = on ? '#39d353' : '#ff5a5a';
    ctx.fillRect(TERMINAL.x - 8, TERMINAL.y - 12, 16, 12);
    ctx.fillStyle = '#0a0a12';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(on ? 'OFF' : 'CAM', TERMINAL.x, TERMINAL.y - 3);
    if (world.camerasDown > 0) {
      ctx.fillStyle = '#39d353';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`cameras down ${Math.ceil(world.camerasDown)}s`, TERMINAL.x, TERMINAL.y + 30);
    }
  }

  drawExit(ctx, world) {
    // Skylight door, top-right. Locked (grey) until the star is taken.
    ctx.fillStyle = world.exitOpen ? '#1f6f3a' : '#33333f';
    ctx.fillRect(EXIT.x - 26, EXIT.y - 20, 52, 40);
    ctx.strokeStyle = world.exitOpen ? '#39d353' : '#666';
    ctx.lineWidth = 2;
    ctx.strokeRect(EXIT.x - 26, EXIT.y - 20, 52, 40);
    ctx.fillStyle = world.exitOpen ? '#b6ffcb' : '#999';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(world.exitOpen ? 'ESCAPE' : 'LOCKED', EXIT.x, EXIT.y + 4);
    if (world.exitOpen) {
      const pulse = 0.5 + 0.5 * Math.sin(this.time * 4);
      ctx.strokeStyle = `rgba(57, 211, 83, ${0.4 + 0.4 * pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(EXIT.x, EXIT.y, 34 + pulse * 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  drawGuards(ctx, guards) {
    for (const g of guards) {
      drawCone(ctx, g.x, g.y, g.face, 0.62, 185, g.coneColor, g.coneEdge);
    }
    for (const g of guards) {
      // Body: dark uniform with a cap brim facing the look direction.
      ctx.fillStyle = '#232a4a';
      ctx.beginPath();
      ctx.arc(g.x, g.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = g.state === 'alert' ? '#ff2d2d' : '#8a93c9';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#d8dcf5';
      ctx.beginPath();
      ctx.arc(g.x + Math.cos(g.face) * 8, g.y + Math.sin(g.face) * 8, 4, 0, Math.PI * 2);
      ctx.fill();
      // Suspicion arc over the head.
      if (g.suspicion > 0.05) {
        ctx.strokeStyle = g.state === 'alert' ? '#ff2d2d' : '#ffb020';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(g.x, g.y, 20, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, g.suspicion));
        ctx.stroke();
      }
      if (g.state === 'alert') {
        ctx.fillStyle = '#ff2d2d';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', g.x, g.y - 24);
      }
    }
  }

  drawCameras(ctx, cameras) {
    for (const cam of cameras) {
      if (cam.disabled <= 0) {
        drawCone(ctx, cam.x, cam.y, cam.angle, 0.5, 205, 'rgba(255, 60, 60, 0.16)', 'rgba(255, 60, 60, 0.4)');
      }
    }
    for (const cam of cameras) {
      ctx.fillStyle = '#2a2a35';
      ctx.fillRect(cam.x - 9, cam.y - 7, 18, 14);
      ctx.fillStyle = cam.disabled > 0 ? '#555' : cam.seeing ? '#ff2d2d' : '#ff8080';
      ctx.beginPath();
      ctx.arc(cam.x + Math.cos(cam.angle) * 8, cam.y + Math.sin(cam.angle) * 8, 4, 0, Math.PI * 2);
      ctx.fill();
      if (cam.seeing) {
        ctx.fillStyle = '#ff2d2d';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('REC', cam.x, cam.y - 14);
      }
    }
  }

  drawPlayer(ctx, player, world) {
    // Smoke clouds first (they sit under the thief).
    for (const c of world.clouds) {
      const a = Math.min(0.75, c.t * 0.3);
      ctx.fillStyle = `rgba(180, 180, 195, ${a})`;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(220, 220, 235, ${a * 0.6})`;
      ctx.beginPath();
      ctx.arc(c.x - 20, c.y - 10, c.r * 0.55, 0, Math.PI * 2);
      ctx.arc(c.x + 24, c.y + 12, c.r * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // The thief: a hooded figure in deep violet, gold mask glint.
    const bob = player.moving ? Math.sin(player.stepPhase) * 1.5 : 0;
    ctx.save();
    ctx.translate(player.x, player.y + bob);
    ctx.fillStyle = '#3d2b5c';
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = player.sneaking ? '#7a5fd0' : '#b9a5ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Hood point + mask.
    ctx.fillStyle = '#241a3a';
    ctx.beginPath();
    ctx.moveTo(Math.cos(player.face) * 13, Math.sin(player.face) * 13);
    ctx.lineTo(Math.cos(player.face + 2.6) * 10, Math.sin(player.face + 2.6) * 10);
    ctx.lineTo(Math.cos(player.face - 2.6) * 10, Math.sin(player.face - 2.6) * 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.arc(Math.cos(player.face) * 7, Math.sin(player.face) * 7, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Carrying the star: a gold glint follows the thief.
    if (world.starTaken) {
      ctx.fillStyle = 'rgba(255, 230, 120, 0.9)';
      ctx.beginPath();
      ctx.arc(player.x + 12, player.y - 12, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Interact progress ring.
    if (player.interactTarget) {
      const t = player.interactTarget;
      const frac = Math.min(1, t.progress / t.needed);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#ffd76a';
      ctx.beginPath();
      ctx.arc(player.x, player.y, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t.label, player.x, player.y - 30);
    }
  }

  // ---- HUD ----
  drawHud(ctx, player, world, cameras) {
    ctx.fillStyle = 'rgba(8, 8, 16, 0.88)';
    ctx.fillRect(0, 0, WORLD_W, 34);
    ctx.fillStyle = '#c9a227';
    ctx.fillRect(0, 34, WORLD_W, 2);

    // Alarm meter.
    ctx.fillStyle = '#ff5a5a';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ALARM', 12, 22);
    ctx.fillStyle = '#2a1214';
    ctx.fillRect(70, 10, 170, 14);
    const aw = (world.alarm / 100) * 170;
    ctx.fillStyle = world.alarm >= 60 ? '#ff2d2d' : world.alarm >= 30 ? '#ff9f2d' : '#ffb020';
    ctx.fillRect(70, 10, aw, 14);
    ctx.strokeStyle = '#ff5a5a';
    ctx.lineWidth = 1;
    ctx.strokeRect(70.5, 10.5, 170, 14);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`${Math.round(world.alarm)}%`, 246, 22);

    // Objective.
    ctx.fillStyle = '#e8e8f0';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    const objective = world.starTaken
      ? '★ Star secured — reach the skylight ESCAPE'
      : 'Steal the Aurora Star from the vault case';
    ctx.fillText(objective, 480, 22);

    // Loot, smoke, cameras, dawn timer (right side).
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 13px sans-serif';
    const camsDown = cameras.every((c) => c.disabled > 0);
    const mins = Math.floor(world.timeLeft / 60);
    const secs = Math.floor(world.timeLeft % 60).toString().padStart(2, '0');
    ctx.fillText(
      `$${world.lootValue().toLocaleString()}   smoke ×${player.smoke}   ${camsDown ? 'CAMERAS DOWN' : 'cameras live'}   dawn ${mins}:${secs}`,
      WORLD_W - 12, 22,
    );
  }

  drawHint(ctx, text) {
    ctx.fillStyle = 'rgba(8, 8, 16, 0.8)';
    const w = ctx.measureText(text).width + 24;
    ctx.fillRect((WORLD_W - w) / 2, WORLD_H - 30, w, 22);
    ctx.fillStyle = '#cfcfe0';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, WORLD_W / 2, WORLD_H - 15);
  }

  // ---- screens ----
  drawTitle(ctx) {
    ctx.fillStyle = 'rgba(6, 6, 14, 0.82)';
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#c9a227';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('T H E   M A R L O W   G A L L E R Y  ·  2 : 4 0  A M', WORLD_W / 2, 128);
    ctx.fillStyle = '#f5e9c8';
    ctx.font = 'bold 64px Georgia, serif';
    ctx.fillText('THE GILDED', WORLD_W / 2, 200);
    ctx.fillText('VAULT', WORLD_W / 2, 268);
    ctx.fillStyle = '#e8e8f0';
    ctx.font = '16px sans-serif';
    ctx.fillText('One thief. One diamond. Three guards, two cameras, and dawn in five minutes.', WORLD_W / 2, 306);
    ctx.fillStyle = '#b9b9cc';
    ctx.font = '14px sans-serif';
    ctx.fillText('WASD / arrows — move      SHIFT — sneak      E — hold to crack, lift, hack', WORLD_W / 2, 344);
    ctx.fillText('Q — smoke pellet (×2)      M — mute      R — restart', WORLD_W / 2, 368);
    ctx.fillText('Lift paintings and gold on the way — but every second in a cone feeds the alarm.', WORLD_W / 2, 396);

    // Start button (also Enter / click).
    const bw = 240, bh = 52, bx = (WORLD_W - bw) / 2, by = 440;
    ctx.fillStyle = '#c9a227';
    roundRect(ctx, bx, by, bw, bh, 8);
    ctx.fill();
    ctx.fillStyle = '#14101f';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('BEGIN THE HEIST', WORLD_W / 2, by + 34);
    return { x: bx, y: by, w: bw, h: bh };
  }

  drawEnd(ctx, world, timeUsed) {
    const won = world.outcome === 'won';
    ctx.fillStyle = won ? 'rgba(6, 20, 10, 0.88)' : 'rgba(24, 6, 8, 0.88)';
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    ctx.textAlign = 'center';
    if (won) {
      ctx.fillStyle = '#ffd76a';
      ctx.font = 'bold 52px Georgia, serif';
      ctx.fillText('CLEAN GETAWAY', WORLD_W / 2, 190);
      ctx.fillStyle = '#e8e8f0';
      ctx.font = '20px sans-serif';
      ctx.fillText(`You slipped out of the skylight with $${world.lootValue().toLocaleString()} in loot.`, WORLD_W / 2, 238);
      ctx.fillStyle = '#b6ffcb';
      ctx.font = 'bold 17px sans-serif';
      ctx.fillText(world.rating(), WORLD_W / 2, 276);
      ctx.fillStyle = '#b9b9cc';
      ctx.font = '15px sans-serif';
      ctx.fillText(`Time inside: ${timeUsed}   ·   worst alarm: ${Math.round(world.maxAlarm)}%`, WORLD_W / 2, 310);
    } else {
      const reason = world.outcome === 'caught' ? 'A guard got a hand on you.'
        : world.outcome === 'lockdown' ? 'The alarm hit 100% — the gallery locked down.'
        : 'Dawn broke and the gallery opened its doors.';
      ctx.fillStyle = '#ff5a5a';
      ctx.font = 'bold 52px Georgia, serif';
      ctx.fillText('CAUGHT IN THE ACT', WORLD_W / 2, 190);
      ctx.fillStyle = '#e8e8f0';
      ctx.font = '20px sans-serif';
      ctx.fillText(reason, WORLD_W / 2, 238);
      ctx.fillStyle = '#b9b9cc';
      ctx.font = '15px sans-serif';
      ctx.fillText(`You carried $${world.lootValue().toLocaleString()} when it ended. The Star is still in its case.`, WORLD_W / 2, 276);
    }
    ctx.fillStyle = '#e8e8f0';
    ctx.font = '15px sans-serif';
    ctx.fillText('Press R or click to run it again', WORLD_W / 2, 360);
    const bw = 220, bh = 48, bx = (WORLD_W - bw) / 2, by = 400;
    ctx.fillStyle = '#c9a227';
    roundRect(ctx, bx, by, bw, bh, 8);
    ctx.fill();
    ctx.fillStyle = '#14101f';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('RUN IT AGAIN', WORLD_W / 2, by + 31);
    return { x: bx, y: by, w: bw, h: bh };
  }

  drawPaused(ctx) {
    ctx.fillStyle = 'rgba(6, 6, 14, 0.7)';
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    ctx.fillStyle = '#f5e9c8';
    ctx.font = 'bold 40px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', WORLD_W / 2, WORLD_H / 2);
    ctx.fillStyle = '#b9b9cc';
    ctx.font = '15px sans-serif';
    ctx.fillText('Press P to keep moving', WORLD_W / 2, WORLD_H / 2 + 34);
  }

  // ---- frame ----
  render(game) {
    const ctx = this.ctx;
    this.time = game.time;
    ctx.clearRect(0, 0, WORLD_W, WORLD_H);

    // The gallery is always drawn behind the title/end screens so the
    // first frame already shows the room.
    this.drawFloor(ctx);
    this.drawWalls(ctx);
    this.drawVault(ctx, game.world);
    this.drawLoot(ctx, game.world);
    this.drawTerminal(ctx, game.world);
    this.drawExit(ctx, game.world);
    this.drawCameras(ctx, game.cameras);
    this.drawGuards(ctx, game.guards);
    this.drawPlayer(ctx, game.player, game.world);

    if (game.mode === 'playing' || game.mode === 'paused') {
      this.drawHud(ctx, game.player, game.world, game.cameras);
      const near = game.world.nearestInteractable(game.player.x, game.player.y);
      if (near && !game.player.interactTarget) {
        this.drawHint(ctx, `Hold E — ${near.label}`);
      } else if (game.player.interactTarget) {
        this.drawHint(ctx, `${game.player.interactTarget.label}…`);
      } else if (game.world.starTaken) {
        this.drawHint(ctx, 'Star secured — get to the skylight door, top-right');
      } else {
        this.drawHint(ctx, 'WASD move · SHIFT sneak · E use · Q smoke');
      }
      if (game.mode === 'paused') this.drawPaused(ctx);
    } else if (game.mode === 'title') {
      this.drawHud(ctx, game.player, game.world, game.cameras);
      game.titleButton = this.drawTitle(ctx);
    } else if (game.mode === 'over') {
      game.endButton = this.drawEnd(ctx, game.world, game.timeUsedText());
    }
  }
}
