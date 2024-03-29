export * from './component';
// export * from './debugger';
export * from './eid';
export * from './entity';
export * from './error';
export * from './event';
export * from './query';
export * from './raxis';
export * from './resource';
export * from './system';
export * from './hook';
export * from './types';

export { Vec2, type Vec2Like, Tree, type ColorValue } from './structures';

export { type Option, Some, None, some, none, wrap, all } from './option';

import { AssetsPlugin } from './plugins/assets';
import { GraphicsPlugin } from './plugins/graphics';
import { InputPlugin } from './plugins/input';
import { TimePlugin } from './plugins/time';
import { TransformPlugin } from './plugins/transform';
import { Raxis } from './raxis';

export * from './plugins/time';
export * from './plugins/transform';
export * from './plugins/input';
export * from './plugins/graphics';
export * from './plugins/assets';
// export * from './plugins/audio';

export const DefaultPlugin = new Raxis.Builder()
	.use(TimePlugin)
	.use(TransformPlugin)
	.use(InputPlugin)
	.use(GraphicsPlugin);
// .use(AudioPlugin);
