import { GameAssets } from './assets';
import { Raxis, Sprite, SpriteBundle, Tagged, Texture, Transform, Vec2, KeydownEvent } from './raxis';

export class PlayerSpawnEvent {
	constructor() {}
}

function disableSystems(r: Raxis) {
	r.disable(playerMovement);
}

function spawnPlayer(r: Raxis) {
	if (r.noneAvailableOf(PlayerSpawnEvent)) return;
	if (r.query([Raxis.Entity], Tagged('player')).size() !== 0) return;

	const assets = r.global(GameAssets);

	r.spawn(
		SpriteBundle({
			texture: new Texture(assets.jerry.unwrap()),
			sprite: new Sprite({
				tint: '#aaaaff',
				alpha: 1,
			}),
			transform: new Transform({ size: new Vec2(10, 10) }),
		})
	).tag('jerry');

	r.enable(playerMovement);
}

function playerMovement(r: Raxis) {
	const jerry = r.query(Transform, Tagged('jerry')).single().unwrap();

	for (const e of r.poll(KeydownEvent) as Iterable<KeydownEvent>) {
		if (e.code === 'KeyW') jerry.translation.y += jerry.size.y;
		else if (e.code === 'KeyA') jerry.translation.x -= jerry.size.x;
		else if (e.code === 'KeyS') jerry.translation.y -= jerry.size.y;
		else if (e.code === 'KeyD') jerry.translation.x += jerry.size.x;
	}
}

export const PlayerPlugin = new Raxis.Builder()
	.useEvent(PlayerSpawnEvent)
	.useStartup(disableSystems)
	.useUpdate(spawnPlayer, playerMovement);
