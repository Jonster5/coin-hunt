import { Raxis } from '../..';
import { CanvasRenderer, OffscreenCanvasRenderer } from './renderers/canvas';
import { GlobalVisibility, Sprite, SpriteBundle, Texture, Visibility } from './sprite';
import { Camera2d, Camera2dBundle, validateSprites } from './camera';

export const GraphicsPlugin = new Raxis.Builder()
	.useComponent(CanvasRenderer)
	.useComponent(OffscreenCanvasRenderer)
	.useComponent(Camera2d)
	.useComponent(Sprite)
	.useComponent(Texture)
	.useComponent(Visibility)
	.useComponent(GlobalVisibility)
	.useUpdate('preUpdate', validateSprites);

export { Sprite, Texture, Visibility, GlobalVisibility, CanvasRenderer, OffscreenCanvasRenderer, Camera2d, SpriteBundle, Camera2dBundle };
