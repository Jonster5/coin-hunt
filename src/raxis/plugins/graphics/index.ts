import { Raxis } from '../..';
import { CanvasRenderer } from './renderers/canvas';
import { GlobalVisibility, Sprite, SpriteBundle, Texture, Visibility } from './sprite';
import { Camera2d, Camera2dBundle, validateSprites } from './camera';

export const GraphicsPlugin = new Raxis.Builder()
	.useComponent(CanvasRenderer)
	.useComponent(Camera2d)
	.useComponent(Sprite)
	.useComponent(Texture)
	.useComponent(Visibility)
	.useComponent(GlobalVisibility)
	.useUpdate('preUpdate', validateSprites);

export { Sprite, Texture, Visibility, GlobalVisibility, CanvasRenderer, Camera2d, SpriteBundle, Camera2dBundle };
