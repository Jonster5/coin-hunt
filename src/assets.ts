import { Handle, Raxis } from './raxis';
import { Renderable } from './raxis/plugins/graphics/renderers/canvas';

interface Textures {
	dirt: HTMLImageElement[];
	bricks_floor: HTMLImageElement[];
	grass: HTMLImageElement[];
	lake: HTMLImageElement[];
	leaves: HTMLImageElement[];
	river: HTMLImageElement[];
	stone_floor: HTMLImageElement[];
	stone_wall: HTMLImageElement[];
	bricks_wall: HTMLImageElement[];
}

export class GameAssets {
	coin_hunter: Handle<Renderable> = undefined;
	lava: Handle<Renderable> = undefined;
	arrow: Handle<Renderable> = undefined;
	map_image: Handle<Renderable> = undefined;
	map_canvas: OffscreenCanvas = undefined;
	textures: Textures = {
		dirt: undefined,
		bricks_floor: undefined,
		grass: undefined,
		lake: undefined,
		leaves: undefined,
		river: undefined,
		stone_floor: undefined,
		stone_wall: undefined,
		bricks_wall: undefined
	};
}

export const AssetsPlugin = new Raxis.Builder().useGlobal(GameAssets);
