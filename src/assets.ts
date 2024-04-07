import { Handle, Raxis } from './raxis';

export class GameAssets {
	coin_hunter: Handle<ImageBitmap[]> = undefined;

	cell_images: Record<string, Handle<ImageBitmap[]>> = undefined;
}

export const gameImageAssetsSource = {
	coin_hunter: ['coin_hunter.png'],
};

export const AssetsPlugin = new Raxis.Builder().useGlobal(GameAssets);
