import { GameAssets } from './assets';
import { CreateNextLevelSignal } from './level';
import { Camera2dBundle, CanvasRenderer, Raxis, Tagged, Transform, TweenManager, Vec2, load } from 'raxis';

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
		}),
		new TweenManager()
	).tag(CameraTag);
}

async function loadTextures(path: string, length: number): Promise<HTMLImageElement[]> {
	const pending_images = Array.from({ length }, (_, i) => path + '/' + i.toString().padStart(4, '0') + '.png').map(
		(path) =>
			new Promise<HTMLImageElement>((resolve) => {
				const img = new Image();
				img.src = path;
				img.onload = () => resolve(img);
			})
	);

	return await Promise.all(pending_images);
}

async function loadAssets(r: Raxis) {
	const renderer = r.query(CanvasRenderer, Tagged(RendererTag)).expectSingle();
	const map_image = new OffscreenCanvas(2500, 2500);
	const assets = r.global(GameAssets);

	assets['coin_hunter'] = await load(renderer, ['coin_hunter.png']);
	assets['arrow'] = await load(renderer, ['arrow.png']);
	assets['lava'] = await load(renderer, ['Textures/River/0004.png']);
	assets['map_image'] = await load(renderer, map_image);
	assets['map_canvas'] = map_image;
	assets['textures']['dirt'] = await loadTextures('Textures/Dirt', 10);
	assets['textures']['bricks_floor'] = await loadTextures('Textures/Floor Bricks', 10);
	assets['textures']['grass'] = await loadTextures('Textures/Grass', 10);
	assets['textures']['lake'] = await loadTextures('Textures/Lake', 40);
	assets['textures']['leaves'] = await loadTextures('Textures/Leaves', 10);
	assets['textures']['river'] = await loadTextures('Textures/River', 40);
	assets['textures']['stone_floor'] = await loadTextures('Textures/Stone Floor', 10);
	assets['textures']['stone_wall'] = await loadTextures('Textures/Stone Wall', 10);
	assets['textures']['bricks_wall'] = await loadTextures('Textures/Wall Bricks', 10);

	r.dispatch(new CreateNextLevelSignal());
}

export const InitPlugin = new Raxis.Builder().useStartup(setupRenderer, setupCamera, loadAssets);
