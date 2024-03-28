import { RaxisError } from './error';
import { CompType, Component, Global } from './types';

export class GlobalResources {
	private store: Map<CompType, Component<CompType> & Global>;

	constructor(globals: Map<CompType, ConstructorParameters<CompType>>) {
		this.store = new Map();

		for (const [type, args] of globals) {
			this.store.set(type, new type(...args));
		}
	}

	hasType(type: CompType): type is CompType {
		return this.store.has(type);
	}

	access<T extends CompType>(type: T): Component<T> {
		const g = this.store.get(type);

		if (g === undefined) {
			throw new RaxisError('Unknown Global Access', type);
		}

		return g as Component<T>;
	}

	startup() {
		for (const g of this.store.values()) {
			g.beforeStartup?.();
		}
	}

	firstCycle() {
		for (const g of this.store.values()) {
			g.beforeFirstCycle?.();
		}
	}

	shutdown() {
		for (const g of this.store.values()) {
			g.onShutdown?.();
		}
	}
}
