import { KeyboardState } from './keyboard';
import { PointerState } from './pointer';

export type KeyIdentifier = keyof KeyboardState;

export class Input {
	private keyboardState: KeyboardState;
	private pointerState: PointerState;

	constructor(target = window) {
		this.keyboardState = new KeyboardState();
		this.pointerState = new PointerState();

		target.addEventListener('keydown', this.onkeydown);
		target.addEventListener('keyup', this.onkeyup);

		window.addEventListener('pointerdown', this.onpointerdown);
		window.addEventListener('pointerup', this.onpointerup);
		window.addEventListener('pointermove', this.onpointermove);
		window.addEventListener('contextmenu', (e) => {
			e.preventDefault();
		});
	}

	private onkeydown = ((e: KeyboardEvent) => {
		if (!(e.code in this.keyboardState)) return;
		this.keyboardState[e.code as keyof KeyboardState] = true;
	}).bind(this);

	private onkeyup = ((e: KeyboardEvent) => {
		if (!(e.code in this.keyboardState)) return;
		this.keyboardState[e.code as keyof KeyboardState] = false;
	}).bind(this);

	private onpointerdown = ((e: PointerEvent) => {
		e.preventDefault();

		if (e.button === 0) this.pointerState.buttonLeft = true;
		else if (e.button === 1) this.pointerState.buttonMiddle = true;
		else if (e.button === 2) this.pointerState.buttonRight = true;
		else if (e.button === 3) this.pointerState.buttonSide1 = true;
		else if (e.button === 4) this.pointerState.buttonSide2 = true;
	}).bind(this);

	private onpointerup = ((e: PointerEvent) => {
		e.preventDefault();

		if (e.button === 0) this.pointerState.buttonLeft = false;
		else if (e.button === 1) this.pointerState.buttonMiddle = false;
		else if (e.button === 2) this.pointerState.buttonRight = false;
		else if (e.button === 3) this.pointerState.buttonSide1 = false;
		else if (e.button === 4) this.pointerState.buttonSide2 = false;
	}).bind(this);

	private onpointermove = ((e: PointerEvent) => {
		e.preventDefault();

		this.pointerState.screenPosition.set(e.pageX / window.innerWidth + 1, e.pageY / window.innerHeight + 1);
	}).bind(this);

	get keyboard(): Readonly<KeyboardState> {
		return this.keyboardState;
	}

	get pointer(): Readonly<PointerState> {
		return this.pointerState;
	}
}
