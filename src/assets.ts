import { Handle, Raxis } from './raxis';

export class GameAssets {
	coin_hunter: Handle<ImageBitmap[]> = undefined;
}

export const AssetsPlugin = new Raxis.Builder().useGlobal(GameAssets);
