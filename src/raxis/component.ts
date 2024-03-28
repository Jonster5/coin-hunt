import { none, Option, wrap } from './option';
import { CompType, Component, Eid } from './types';
import { RaxisError } from './error';

export class ComponentRegistry {
	private components: Readonly<Record<string, Option<Component>[]>>;
	private listSize: number;

	constructor(types: CompType[]) {
		this.listSize = 1000;
		const record = {} as Record<string, Option<Component>[]>;

		for (const type of types) {
			record[type.name] = new Array<Option<Component>>(this.listSize).fill(none);
		}

		this.components = Object.freeze(record);
	}

	size(): number {
		return this.listSize;
	}

	has(type: CompType): boolean {
		return type.name in this.components;
	}

	get<T extends CompType>(eid: Eid, type: T): Option<Component<T>> {
		const list = this.components[type.name] as Option<Component<T>>[] | undefined;

		if (!list) {
			throw new RaxisError('Unknown CompType', type);
		}

		return list[eid] ?? none;
	}

	*getColumn(eid: Eid): Iterable<Option<Component>> {
		for (const comps of Object.values(this.components)) {
			yield comps[eid] ?? none;
		}
	}

	set<T extends Component>(eid: Eid, comp: T): void {
		const type = comp.constructor as CompType;

		const list = this.components[type.name];

		if (!list) {
			throw new RaxisError('Unknown CompType', type);
		}

		if (eid >= list.length) {
			this.grow();
		}

		list[eid] = wrap(comp);
	}

	delete(eid: Eid, type: CompType): void {
		const list = this.components[type.name];

		if (!list) {
			return;
		}

		list[eid] = none;
	}

	deleteColumn(eid: Eid): void {
		for (const list of Object.values(this.components)) {
			list[eid] = none;
		}
	}

	grow(): number {
		const oldSize = this.listSize;
		this.listSize *= 2;

		for (const list of Object.values(this.components)) {
			list.length = this.listSize;

			for (let i = oldSize; i < this.listSize; i++) {
				list[i] = none;
			}
		}

		return this.listSize;
	}
}

// type BundleParams<T extends Record<PropertyKey, { key: string; type: CompType; base?: () => Component }>> = {
// 	[K in keyof T as T[K]['key']]: T[K]['base'] extends undefined
// 		? Component<T[K]['type']>
// 		: Component<T[K]['type']> | undefined;
// };

// export function CreateBundle<T extends [...{ key: string; type: CompType; base?: () => Component }[]]>(comps: T) {
// 	return function (comps: BundleParams<T>) {
// 		const out = [];

// 		for (const [key, value] of Object.keys(comps)) {

// 		}
// 	};
// }
