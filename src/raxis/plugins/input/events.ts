import { Raxis } from '../..';

export class KeydownEvent {
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/KeyboardEvent/altKey) */
	readonly altKey: boolean;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/KeyboardEvent/code) */
	readonly code: string;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/KeyboardEvent/ctrlKey) */
	readonly ctrlKey: boolean;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/KeyboardEvent/isComposing) */
	readonly isComposing: boolean;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/KeyboardEvent/key) */
	readonly key: string;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/KeyboardEvent/location) */
	readonly location: number;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/KeyboardEvent/metaKey) */
	readonly metaKey: boolean;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/KeyboardEvent/repeat) */
	readonly repeat: boolean;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/KeyboardEvent/shiftKey) */
	readonly shiftKey: boolean;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/KeyboardEvent/getModifierState) */
	readonly getModifierState: (keyArg: string) => boolean;

	readonly DOM_KEY_LOCATION_STANDARD = 0x00 as const;
	readonly DOM_KEY_LOCATION_LEFT = 0x01 as const;
	readonly DOM_KEY_LOCATION_RIGHT = 0x02 as const;
	readonly DOM_KEY_LOCATION_NUMPAD = 0x03 as const;
	constructor(e: KeyboardEvent) {
		this.altKey = e.altKey;
		this.code = e.code;
		this.ctrlKey = e.ctrlKey;
		this.isComposing = e.isComposing;
		this.key = e.key;
		this.location = e.location;
		this.metaKey = e.metaKey;
		this.repeat = e.repeat;
		this.shiftKey = e.shiftKey;
		this.getModifierState = e.getModifierState.bind(this);
	}
}

export class KeyupEvent {
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/KeyboardEvent/altKey) */
	readonly altKey: boolean;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/KeyboardEvent/code) */
	readonly code: string;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/KeyboardEvent/ctrlKey) */
	readonly ctrlKey: boolean;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/KeyboardEvent/isComposing) */
	readonly isComposing: boolean;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/KeyboardEvent/key) */
	readonly key: string;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/KeyboardEvent/location) */
	readonly location: number;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/KeyboardEvent/metaKey) */
	readonly metaKey: boolean;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/KeyboardEvent/repeat) */
	readonly repeat: boolean;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/KeyboardEvent/shiftKey) */
	readonly shiftKey: boolean;
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/KeyboardEvent/getModifierState) */
	readonly getModifierState: (keyArg: string) => boolean;

	readonly DOM_KEY_LOCATION_STANDARD = 0x00 as const;
	readonly DOM_KEY_LOCATION_LEFT = 0x01 as const;
	readonly DOM_KEY_LOCATION_RIGHT = 0x02 as const;
	readonly DOM_KEY_LOCATION_NUMPAD = 0x03 as const;
	constructor(e: KeyboardEvent) {
		this.altKey = e.altKey;
		this.code = e.code;
		this.ctrlKey = e.ctrlKey;
		this.isComposing = e.isComposing;
		this.key = e.key;
		this.location = e.location;
		this.metaKey = e.metaKey;
		this.repeat = e.repeat;
		this.shiftKey = e.shiftKey;
		this.getModifierState = e.getModifierState.bind(this);
	}
}

export function setupEvents(r: Raxis) {
	window.addEventListener('keydown', (e) => {
		if (!e.repeat) r.dispatch(new KeydownEvent(e));
	});
	window.addEventListener('keyup', (e) => {
		r.dispatch(new KeyupEvent(e));
	});
}
