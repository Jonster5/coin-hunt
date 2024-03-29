import { A } from 'ts-toolbelt';
import { RaxisError } from '.';
import { EventData, EventType } from './types';

export type ValidEventKey = A.Type<string, 'EventKey'>;

export class EventRegistry {
	private store: Record<ValidEventKey, EventManager>;
	readonly keys: ValidEventKey[];

	constructor(types: EventType[]) {
		this.keys = [];
		this.store = {};

		for (const type of types) {
			if (typeof type === 'string') {
				this.store[type as ValidEventKey] = new EventManager();
				this.keys.push(type as ValidEventKey);
			} else {
				this.store[type.name as ValidEventKey] = new EventManager();
				this.keys.push(type.name as ValidEventKey);
			}
		}
	}

	keyOf(type: EventType): ValidEventKey {
		const key = typeof type === 'string' ? type : type.name;
		this.checkTypeKey(key);
		return key;
	}

	checkTypeKey(key: string): asserts key is ValidEventKey {
		if (!this.keys.includes(key as ValidEventKey)) {
			throw new RaxisError('Unknown EventType', key);
		}
	}

	getManager<T extends EventType>(type: T): EventManager<T> {
		const key = this.keyOf(type);

		return this.store[key] as EventManager<T>;
	}

	dispatchEvent(event: EventData<EventType>) {
		const key = this.keyOf(typeof event === 'string' ? event : event.constructor.name);

		const manager = this.store[key] as EventManager;
		manager.pushEvent(event);
	}

	tick(): Record<ValidEventKey, number> {
		const shiftAmount: Record<ValidEventKey, number> = {};

		for (const key of this.keys) {
			shiftAmount[key] = (this.store[key] as EventManager).shiftQueues();
		}

		return shiftAmount;
	}

	sizeOf(key: ValidEventKey): number {
		return (this.store[key] as EventManager).size;
	}
}

export class EventManager<T extends EventType = EventType> {
	private qIn: EventData<T>[] = [];
	private qOut: EventData<T>[] = [];

	get size() {
		return this.qIn.length + this.qOut.length;
	}

	shiftQueues(): number {
		const len = this.qIn.length;
		this.qOut = this.qIn;
		this.qIn = [];
		return len;
	}

	pushEvent(value: EventData<T>): void {
		this.qIn.push(value);
	}

	*getEventsAfter(index: number): IterableIterator<EventData<T>> {
		const offset = Math.max(Math.min(index, this.size), 0);
		if (offset === this.size) return;

		yield* [...this.qOut, ...this.qIn].slice(offset);
	}
}
