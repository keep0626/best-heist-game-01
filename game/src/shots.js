// Screenshot staging: ?shot=start|play|end|caught puts the game in a
// fixed, deterministic state so the maker's screenshots show the game
// at its best. No randomness: the same URL always stages the same frame.

export function stageShot(game) {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (!shot) return false;

  if (shot === 'start') {
    game.mode = 'title';
  } else if (shot === 'play') {
    // Mid-heist: the thief is on the carpet below the vault, one
    // painting already lifted, the alarm at a tense 35%, Dmitri
    // suspicious in the north hall and the cameras sweeping.
    game.startRun();
    game.player.x = 430;
    game.player.y = 430;
    game.player.face = -Math.PI / 2;
    game.world.loot[0].taken = true;
    game.world.alarm = 35;
    game.world.timeLeft = 240;
    game.guards[0].x = 200; game.guards[0].y = 300; game.guards[0].face = 0;
    game.guards[1].x = 480; game.guards[1].y = 176; game.guards[1].face = Math.PI / 2;
    game.guards[1].suspicion = 0.55; game.guards[1].state = 'suspicious'; game.guards[1].lookTimer = 2.5;
    game.guards[2].x = 880; game.guards[2].y = 300; game.guards[2].face = Math.PI;
    game.cameras[0].phase = 0.4;
    game.cameras[1].phase = -0.6;
  } else if (shot === 'end') {
    game.startRun();
    game.world.starTaken = true;
    game.world.exitOpen = true;
    game.world.loot[0].taken = true;
    game.world.loot[2].taken = true;
    game.world.maxAlarm = 41;
    game.world.timeLeft = 152;
    game.player.x = 880;
    game.player.y = 90;
    game.world.outcome = 'won';
    game.mode = 'over';
    game.endTime = 148; // 2:28 inside
  } else if (shot === 'caught') {
    game.startRun();
    game.world.alarm = 100;
    game.world.maxAlarm = 100;
    game.world.outcome = 'caught';
    game.mode = 'over';
    game.endTime = 96;
  } else {
    return false;
  }

  // The first render has happened by now; tell the screenshot runner.
  requestAnimationFrame(() => { window.__shotReady = true; });
  return true;
}
