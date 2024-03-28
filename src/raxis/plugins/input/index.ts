import { Raxis } from '../..';
import { setupEvents, KeydownEvent, KeyupEvent } from './events';
import { Input, KeyIdentifier } from './input';
import { KeyboardState } from './keyboard';
import { PointerState } from './pointer';

export const InputPlugin = new Raxis.Builder()
	.useEvent(KeydownEvent)
	.useEvent(KeyupEvent)
	.useGlobal(Input)
	.useStartup(setupEvents);

export { Input, KeydownEvent, KeyupEvent, KeyboardState, PointerState, type KeyIdentifier };
