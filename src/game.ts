import { AssetsPlugin } from './assets';
import { CoinPlugin } from './coin';
import { CameraTag, InitPlugin, RendererTag } from './init';
import { LavaPlugin } from './lava';
import { LevelPlugin } from './level';
import { PlayerPlugin } from './player';
import { Camera2d, CanvasRenderer, DefaultPlugin, Raxis, Tagged, Option } from './raxis';

function render(r: Raxis) {
	const renderer_option = r.query(CanvasRenderer, Tagged(RendererTag)).single();
	const camera_option = r.query(Camera2d, Tagged(CameraTag)).single();

	Option.all([renderer_option, camera_option]).some(([renderer, camera]) => renderer.render(camera));
}

export const Game = new Raxis.Builder()
	.use(DefaultPlugin)
	.use(InitPlugin)
	.use(LevelPlugin)
	.use(AssetsPlugin)
	.use(PlayerPlugin)
	.use(LavaPlugin)
	.use(CoinPlugin)
	.useUpdate('postUpdate', render);
