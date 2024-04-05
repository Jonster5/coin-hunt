import { Handle, Raxis } from './raxis';
import { ImageAssetSrc } from './raxis/plugins/graphics/renderers/canvas';

export class GameAssets {
	coin_hunter: Handle<ImageBitmap[]> = undefined;
}

export const gameImageAssetsSource: Record<keyof GameAssets, ImageAssetSrc> = {
	coin_hunter: ['coin_hunter.png'],
};

export const AssetsPlugin = new Raxis.Builder().useGlobal(GameAssets);
