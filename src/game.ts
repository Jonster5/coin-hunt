import { AssetsPlugin, GameAssets, gameAssetsSource } from './assets';
import { PlayerPlugin, PlayerSpawnEvent as SpawnPlayerEvent } from './player';
import {
	Camera2d,
	Camera2dBundle,
	CanvasRenderer,
	DefaultPlugin,
	Raxis,
	Tagged,
	Transform,
	Vec2,
	load,
	some,
} from './raxis';

export const Game = new Raxis.Builder()
	.use(DefaultPlugin)
	.use(AssetsPlugin)
	.use(PlayerPlugin)
	.useStartup(setup)
	.useUpdate(render);

async function setup(r: Raxis) {
	const assets = r.global(GameAssets);
	const source = gameAssetsSource;

	const renderer = new CanvasRenderer({
		width: window.innerWidth,
		height: window.innerHeight,
		target: document.body,
	});

	assets.jerry = await load(renderer, source.jerry).then(some);

	r.spawn(renderer).tag('renderer');
	r.spawn(
		Camera2dBundle({
			transform: new Transform({ size: new Vec2(100, (window.innerHeight / window.innerWidth) * 100) }),
		})
	).tag('camera');

	r.dispatch(new SpawnPlayerEvent());
}

function render(r: Raxis) {
	const renderer = r.query(CanvasRenderer, Tagged('renderer')).single().unwrap();
	const camera = r.query(Camera2d, Tagged('camera')).single().unwrap();

	renderer.render(camera);
}
