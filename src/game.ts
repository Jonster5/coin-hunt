import { GameAssets } from './assets';
import {
	Camera2d,
	Camera2dBundle,
	CanvasRenderer,
	DefaultPlugin,
	Input,
	Raxis,
	Sprite,
	SpriteBundle,
	Tagged,
	Texture,
	Time,
	Transform,
	Vec2,
	load,
	some,
} from './raxis';

export const Game = new Raxis.Builder()
	.use(DefaultPlugin)
	.useStartup(setup, square)
	.useGlobal(GameAssets)
	.useUpdate(render, oscillate, move);

async function setup(r: Raxis) {
	const assets = r.global(GameAssets);

	const renderer = new CanvasRenderer({
		width: window.innerWidth,
		height: window.innerHeight,
		target: document.body,
	});

	assets.square = await load(renderer, ['jerry.jpg']).then(some);

	r.spawn(renderer).tag('renderer');
	r.spawn(
		Camera2dBundle({
			transform: new Transform({ size: new Vec2(100, (window.innerHeight / window.innerWidth) * 100) }),
		})
	).tag('camera');
}

function square(r: Raxis) {
	const assets = r.global(GameAssets);

	r.spawn(
		SpriteBundle({
			texture: new Texture(assets.square.unwrap()),
			sprite: new Sprite({
				tint: 'Aqua',
				alpha: 1,
			}),
			transform: new Transform({ size: new Vec2(10, 10) }),
		})
	).tag('jerry');
}

function render(r: Raxis) {
	const renderer = r.query(CanvasRenderer, Tagged('renderer')).single().unwrap();
	const camera = r.query(Camera2d, Tagged('camera')).single().unwrap();

	renderer.render(camera);
}

function oscillate(r: Raxis) {
	const time = r.global(Time);

	r.query(Sprite, Tagged('jerry'))
		.single()
		.some((jerry) => {
			// this makes it so it flashes 2 times per second
			jerry.alpha = (jerry.alpha + 2 * (time.delta / 1000)) % 1;
		});
}

function move(r: Raxis) {
	const { keyboard } = r.global(Input);
	const jerry = r.query(Transform, Tagged('jerry')).single().unwrap();
	const dt = r.global(Time).delta / 1000;

	if (keyboard.KeyW) {
		jerry.translation.y += 10 * dt;
	}
	if (keyboard.KeyA) {
		jerry.translation.x -= 10 * dt;
	}
	if (keyboard.KeyS) {
		jerry.translation.y -= 10 * dt;
	}
	if (keyboard.KeyD) {
		jerry.translation.x += 10 * dt;
	}
}
