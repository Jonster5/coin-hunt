import { Handle, none, Option, Raxis } from './raxis';
import { ImageAssetSrc } from './raxis/plugins/graphics/renderers/canvas';

export class GameAssets {
	jerry: Option<Handle<ImageBitmap[]>> = none;
}

export const gameAssetsSource = {
	jerry: ['jerry.jpg'] as ImageAssetSrc,
};

export const AssetsPlugin = new Raxis.Builder().useGlobal(GameAssets);
