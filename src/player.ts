import { GameAssets } from './assets';
import { Raxis, Sprite, SpriteBundle, Texture, Transform, Vec2, KeydownEvent, With, TweenManager, Camera2d, SystemTimer, Tagged } from 'raxis';
import { CollisionMap } from './level';

export class SpawnPlayerSignal {
	constructor() {}
}

export class MovePlayerSignal {}

export class MapPos {
	pos = new Vec2(24,25)
}

export class Player {}

export class Arrow {
	dest = 'none'
	rotation = 0
}

function disableSystems(r: Raxis) {
	r.disable(playerQueueMovement);
}

function spawnPlayer(r: Raxis) {
	if (r.noneAvailableOf(SpawnPlayerSignal)) return;
	if (r.query([Raxis.Entity], With(Player)).size() !== 0) return;

	const assets = r.global(GameAssets);

	r.spawn(
		new Player(),
		new MapPos(),
		SpriteBundle({
			texture: new Texture(assets.coin_hunter),
			sprite: new Sprite({
				tint: '#aaaaff',
				alpha: 1,
			}),
			transform: new Transform({ size: new Vec2(50, 50) }),
		}),
		new TweenManager()
	);

	r.spawn(
		new Arrow(),
		SpriteBundle({
			texture: new Texture(assets.arrow),
			sprite: new Sprite({
				alpha: 0.6
			}),
			transform: new Transform({ size: new Vec2(1, 1), layer: -1 })
		}),
		new TweenManager()
	);

	r.enable(playerQueueMovement);
}

const randomRotation = (pos: Vec2) => (((Math.sin(pos.dot(new Vec2(12.9898,78.233)))*43758.5453123) % 1) - 0.5) * Math.PI / 2

function playerQueueMovement(r: Raxis) {
	if (SystemTimer.check(r)) return;

	const [player, pos_map] = r.query([Transform, MapPos], With(Player)).expectSingle();
	const [arrow, arrow_tf, tm] = r.query([Arrow, Transform, TweenManager]).expectSingle();
	let dest = new Vec2();
	let rot = arrow_tf.rotation;
	const pos = player.translation;

	for (const e of r.poll(KeydownEvent)) {
		if (e.code == 'KeyW' || e.code == 'KeyS' || e.code == 'KeyA' || e.code == 'KeyD') {
			SystemTimer.set(r, 100)
		}

		// if you press a key that isn't wasd it crashes

		if (e.code === 'KeyW') {
			if (pos_map.pos.y <= 0 || r.global(CollisionMap).map[pos_map.pos.y - 1][pos_map.pos.x] == 1) return
			arrow.dest = 'up'
			arrow.rotation = 3*Math.PI/2
			dest = pos.add(0, player.size.height);
		} else if (e.code === 'KeyA') {
			if (pos_map.pos.x <= 0 || r.global(CollisionMap).map[pos_map.pos.y][pos_map.pos.x - 1] == 1) return
			arrow.dest = 'left'
			arrow.rotation = 2*Math.PI/2;
			dest = pos.add(-player.size.width, 0);
		} else if (e.code === 'KeyS') {
			if (pos_map.pos.y >= 49 || r.global(CollisionMap).map[pos_map.pos.y + 1][pos_map.pos.x] == 1 ) return
			arrow.dest = 'down'
			arrow.rotation = 1*Math.PI/2;
			dest = pos.add(0, -player.size.height);
		} else if (e.code === 'KeyD') {
			if (pos_map.pos.x >= 49 || r.global(CollisionMap).map[pos_map.pos.y][pos_map.pos.x + 1] == 1) return
			arrow.dest = 'right'
			arrow.rotation = 0*Math.PI/2;
			dest = pos.add(player.size.width, 0);
		};

		tm.cancel('arrow-scale-up')
		tm.cancel('arrow-scale-down')
		tm.cancel('arrow-move')
		tm.newActive({ duration: 100, obj: arrow_tf.translation, to: dest, label: 'arrow-move', easing: (t) => Math.pow(t, 0.3)});
		tm.newActive({ duration: 50, obj: arrow_tf.scale, to: new Vec2(50,50), label: 'arrow-scale-up' });
	}

	tm.newBasic({ duration: 100, start: arrow_tf.rotation, finish: arrow.rotation, label: 'rotate', onUpdate: (v) => arrow_tf.rotation = v, onComplete: () => arrow_tf.rotation = rot});
}

function movePlayer(r: Raxis) {	
	const [player, tm, pos_map] = r.query([Transform, TweenManager, MapPos], With(Player)).expectSingle();
	tm.forceUpdateBasic(r, 'player-spin')


	if (!SystemTimer.check(r)) r.enable(playerQueueMovement);
	if (r.noneAvailableOf(MovePlayerSignal)) return;

	r.disable(playerQueueMovement)

	const [arrow, arrow_tf, arrow_tm] = r.query([Arrow, Transform, TweenManager]).expectSingle()
	const [camera, camera_tm] = r.query([Transform, TweenManager], With(Camera2d)).expectSingle();

	let dest: Vec2;
	let dir: 'hori' | 'vert';
	const pos = player.translation;
	
	if (arrow.dest === 'up') {
		dest = pos.add(0, player.size.height);
		dir = 'vert';
		pos_map.pos.y -= 1
	} else if (arrow.dest === 'left') {
		dest = pos.add(-player.size.width, 0);
		dir = 'hori';
		pos_map.pos.x -= 1
	} else if (arrow.dest === 'down') {
		dest = pos.add(0, -player.size.height);
		dir = 'vert';
		pos_map.pos.y += 1
	} else if (arrow.dest === 'right') {
		dest = pos.add(player.size.width, 0);
		dir = 'hori';
		pos_map.pos.x += 1
	};

	SystemTimer.set(r, 100)

	const dir_vec = dir === 'vert' ? new Vec2(1, 0.5) : new Vec2(0.5, 1);

	if (arrow.dest !== 'none') {
		tm.newActive({ duration: 300, obj: player.translation, to: dest, label: 'move', easing: (t) => -2.3 * t * t + 3.3 * t});
		camera_tm.newActive({ duration: 200, obj: camera.translation, to: dest, label: 'move', easing: (t) => Math.pow(t, 0.5)});
		arrow_tm.newActive({ duration: 200, obj: arrow_tf.translation, to: dest, label: 'move', easing: (t) => Math.pow(t, 0.5)});

		tm.newActive({ delay: 0, duration: 50, obj: player.scale, to: dir_vec, label: 'squish-in', easing: (t) => Math.pow(t, 0.3) });
		tm.newActive({ delay: 50, duration: 50, obj: player.scale, to: new Vec2(1, 1), label: 'squish-out', easing: (t) => Math.pow(t, 0.8)});
		tm.cancel('player-spin')
		tm.newBasic({ duration: 200, start: randomRotation(pos_map.pos), finish: 0, label: 'player-spin', onUpdate: (v) => player.rotation = v, onComplete: () => player.rotation = 0, easing: (t) => Math.pow(t, 0.3) });
	} else {
		tm.newActive({ delay: 0, duration: 5, obj: player.scale, to: new Vec2(1.1,1.1), label: 'player-pulse' });
		tm.newActive({ delay: 5, duration: 150, obj: player.scale, to: new Vec2(1,1), label: 'player-pulse' });
	}

	arrow_tm.newActive({ duration: 300, obj: arrow_tf.scale, to: new Vec2(0,0), label: 'arrow-scale-down' });

	arrow.dest = 'none'
}

export const PlayerPlugin = new Raxis.Builder()
	.useComponent(Player)
	.useComponent(MapPos)
	.useComponent(Arrow)
	.useEvent(SpawnPlayerSignal)
	.useEvent(MovePlayerSignal)
	.useStartup(disableSystems)
	.useUpdate(spawnPlayer, playerQueueMovement, movePlayer);
