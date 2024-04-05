import { GameAssets } from './assets';
import { Raxis, Sprite, SpriteBundle, Texture, Transform, Vec2, KeydownEvent, With, TweenManager } from './raxis';

export class SpawnPlayerSignal {
	constructor() {}
}

export class Player {}

function disableSystems(r: Raxis) {
	r.disable(playerMovement);
}

function spawnPlayer(r: Raxis) {
	if (r.noneAvailableOf(SpawnPlayerSignal)) return;
	if (r.query([Raxis.Entity], With(Player)).size() !== 0) return;

	const assets = r.global(GameAssets);

	r.spawn(
		new Player(),
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

	r.enable(playerMovement);
}

function playerMovement(r: Raxis) {
	const [player, tm] = r.query([Transform, TweenManager], With(Player)).expectSingle();

	for (const e of r.poll(KeydownEvent)) {
		const pos = player.translation;
		let dest: Vec2;
		let dir: 'hori' | 'vert';

		if (e.code === 'KeyW') {
			dest = pos.add(0, player.size.height);
			dir = 'vert';
		} else if (e.code === 'KeyA') {
			dest = pos.add(-player.size.width, 0);
			dir = 'hori';
		} else if (e.code === 'KeyS') {
			dest = pos.add(0, -player.size.height);
			dir = 'vert';
		} else if (e.code === 'KeyD') {
			dest = pos.add(player.size.width, 0);
			dir = 'hori';
		}

		const dir_vec = dir === 'vert' ? new Vec2(1, 0.5) : new Vec2(0.5, 1);

		tm.newActive({ duration: 100, obj: player.translation, to: dest, label: 'move' });

		tm.newActive({ delay: 0, duration: 50, obj: player.scale, to: dir_vec, label: 'squish-in' });
		tm.newActive({ delay: 50, duration: 50, obj: player.scale, to: new Vec2(1, 1), label: 'squish-out' });
	}
}

export const PlayerPlugin = new Raxis.Builder()
	.useComponent(Player)
	.useEvent(SpawnPlayerSignal)
	.useStartup(disableSystems)
	.useUpdate(spawnPlayer, playerMovement);
