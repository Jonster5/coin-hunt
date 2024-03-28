export class RaxisDOMHook {
	constructor(readonly element: HTMLElement) {}

	set(value: string) {
		this.element.innerHTML = value;
	}

	update(fn: (current: string) => string) {
		this.element.innerHTML = fn(this.element.innerHTML);
	}

	readCurrentValue(): string {
		return this.element.innerHTML;
	}
}
