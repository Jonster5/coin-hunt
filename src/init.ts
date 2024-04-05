import { GameAssets, gameImageAssetsSource } from './assets';
import { SpawnPlayerSignal } from './player';
import { Camera2dBundle, CanvasRenderer, Raxis, Tagged, Transform, Vec2, load } from './raxis';

export const RendererTag: unique symbol = Symbol();
function setupRenderer(r: Raxis) {
	r.spawn(
		new CanvasRenderer({
			width: window.innerWidth,
			height: window.innerHeight,
			target: document.body,
		})
	).tag(RendererTag);
}

export const CameraTag: unique symbol = Symbol();
function setupCamera(r: Raxis) {
	r.spawn(
		Camera2dBundle({
			transform: new Transform({ size: new Vec2(1000, (window.innerHeight / window.innerWidth) * 1000) }),
		})
	).tag(CameraTag);
}

async function loadAssets(r: Raxis) {
	const renderer = r.query(CanvasRenderer, Tagged(RendererTag)).expectSingle();
	const assets = r.global(GameAssets);
	const source = gameImageAssetsSource;

	for (const key in source) {
		assets[key as keyof GameAssets] = await load(renderer, source[key as keyof GameAssets]);
	}

	r.dispatch(new SpawnPlayerSignal());
}

export const InitPlugin = new Raxis.Builder().useStartup(setupRenderer, setupCamera, loadAssets);
