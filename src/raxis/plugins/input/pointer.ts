import { Vec2 } from '../../structures';

export class PointerState {
	screenPosition: Vec2 = new Vec2(0, 0);
	buttonLeft: boolean = false;
	buttonRight: boolean = false;
	buttonMiddle: boolean = false;
	buttonSide1: boolean = false;
	buttonSide2: boolean = false;
	scrollDelta: Vec2 = new Vec2(0, 0);
}
