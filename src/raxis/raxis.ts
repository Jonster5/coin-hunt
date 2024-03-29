import { ComponentRegistry } from './component';
import { EventRegistry } from './event';
import {
	CompType,
	Component,
	EventData,
	EventType,
	RaxisSystem,
	RaxisSystemAsync,
	ShutdownSet,
	StartupSet,
	UpdateSet,
} from './types';
import { Entity, EntityRegistry } from './entity';
import { wrap, none, Option, some } from './option';
import { GlobalResources } from './resource';
import { SystemContext } from './system';
import { Query, QueryFilter, QueryResults, QueryItem } from './query';
import { RaxisDOMHook } from './hook';

export class Raxis {
	private components: ComponentRegistry;
	private entities: EntityRegistry;
	private globals: GlobalResources;
	private events: EventRegistry;
	private queries: Map<Query, QueryResults>;

	private startup: SystemContext[];
	private update: SystemContext[];
	private shutdown: SystemContext[];
	private allSystems: WeakMap<RaxisSystem | RaxisSystemAsync, SystemContext>;

	private externalContext: SystemContext;
	private currentContext: SystemContext;

	private cycle: number;
	private elapsed: number;
	private loopID: Option<number>;

	constructor(
		compTypes: CompType[],
		eventTypes: EventType[],
		globals: Map<CompType, ConstructorParameters<CompType>>,
		preStartup: RaxisSystem[],
		startup: RaxisSystem[],
		postStartup: RaxisSystem[],
		first: RaxisSystem[],
		preUpdate: RaxisSystem[],
		update: RaxisSystem[],
		postUpdate: RaxisSystem[],
		last: RaxisSystem[],
		shutdown: RaxisSystem[]
	) {
		this.components = new ComponentRegistry(compTypes);
		this.events = new EventRegistry(eventTypes);
		this.globals = new GlobalResources(globals);
		this.queries = new Map();
		this.entities = new EntityRegistry(this, this.components, this.queries);

		this.externalContext = new SystemContext(function RaxisExternalContext() {}, this.events.keys, 'external');
		this.currentContext = this.externalContext;

		this.startup = [
			...preStartup.map((fn) => new SystemContext(fn, this.events.keys, 'preStartup')),
			...startup.map((fn) => new SystemContext(fn, this.events.keys, 'startup')),
			...postStartup.map((fn) => new SystemContext(fn, this.events.keys, 'postStartup')),
		];

		this.update = [
			...first.map((fn) => new SystemContext(fn, this.events.keys, 'first')),
			...preUpdate.map((fn) => new SystemContext(fn, this.events.keys, 'preUpdate')),
			...update.map((fn) => new SystemContext(fn, this.events.keys, 'update')),
			...postUpdate.map((fn) => new SystemContext(fn, this.events.keys, 'postUpdate')),
			...last.map((fn) => new SystemContext(fn, this.events.keys, 'last')),
		];

		this.shutdown = [...shutdown.map((fn) => new SystemContext(fn, this.events.keys, 'shutdown'))];

		this.allSystems = new WeakMap([...this.startup, ...this.update, ...this.shutdown].map((ctx) => [ctx.fn, ctx]));

		this.cycle = 0;
		this.elapsed = 0;
		this.loopID = none;
	}

	/**
	 * @returns The current execution cycle number
	 */
	getCycle(): number {
		return this.cycle;
	}

	getElapsedTime(): number {
		return this.elapsed;
	}

	/**
	 * @description Enables the specified system
	 */
	enable(system: RaxisSystem | RaxisSystemAsync): void {
		wrap(this.allSystems.get(system)).some((ctx) => (ctx.enabled = true));
	}

	/**
	 * @description Disables the specified system
	 */
	disable(system: RaxisSystem): void {
		wrap(this.allSystems.get(system)).some((ctx) => (ctx.enabled = false));
	}

	/**
	 * @description Toggles the specified system on or off
	 */
	toggle(system: RaxisSystem): void {
		wrap(this.allSystems.get(system)).some((ctx) => (ctx.enabled = !ctx.enabled));
	}

	/**
	 * @description Spawns a new entity with specified components inserted
	 * @returns The newly created entity
	 */
	spawn(...comps: (Component | Component[])[]): Entity {
		return this.entities.create(comps.flat(), none);
	}

	/**
	 * @returns The specified global resource
	 */
	global<K extends CompType>(type: K): Component<K> {
		return this.globals.access(type);
	}

	/**
	 * @returns An Option containing the specified resource
	 */
	local<T extends CompType>(type: T): Option<Component<T>>;
	local<C extends Component>(comp: C): C;
	local(arg: Component | CompType): Component | Option<Component> {
		if (typeof arg === 'function') {
			return wrap(this.currentContext.resources.get(arg));
		} else {
			this.currentContext.resources.set(arg.constructor as CompType, arg);
			return arg;
		}
	}

	/**
	 * @description Deletes the specified local resource
	 */
	delete(type: CompType): boolean {
		return this.currentContext.resources.delete(type);
	}

	/**
	 * @returns True if there are no unread events of the specified type available now
	 * @example
	 * ```ts
	 * function someSystem(r: Raxis) {
	 *     if (r.noUnread(MyEvent)) return;
	 *
	 *     ...
	 * }
	 * ```
	 */
	noneAvailableOf(type: EventType): boolean {
		const manager = this.events.getManager(type);
		const key = this.events.keyOf(type);
		const offset = this.currentContext.eventOffsets[key] ?? 0;

		return offset >= manager.size;
	}

	/**
	 * @returns An iterable containing all unread events of the specified type for this system context
	 * @example
	 * ```ts
	 * function someSystem(r: Raxis) {
	 *     for (const event of r.read(MyEvent)) {
	 * 	     // Do something
	 *     }
	 * }
	 * ```
	 */
	poll<T extends EventType>(type: T): IterableIterator<EventData<T>> {
		const manager = this.events.getManager(type);
		const key = this.events.keyOf(type);
		const index = this.currentContext.eventOffsets[key] as number;
		this.currentContext.eventOffsets[key] = this.events.sizeOf(key);
		return manager.getEventsAfter(index);
	}

	/**
	 * @description Pushes a new event
	 */
	dispatch<K extends EventType>(event: EventData<K>): void {
		this.events.dispatchEvent(event);
	}

	query<const R extends [QueryItem, ...QueryItem[]]>(items: R, ...filters: QueryFilter[]): QueryResults<Query<R>>;
	query<I extends QueryItem>(items: I extends Query ? never : I, ...filters: QueryFilter[]): QueryResults<Query<[I]>>;
	query<Q extends Query>(query: Q): QueryResults<Q>;
	query(a: Query | QueryItem | [QueryItem, ...QueryItem[]], ...b: QueryFilter[]): QueryResults {
		let query: Query;

		if (Array.isArray(a)) {
			query = new Query(a, ...b);

			for (const existingQuery of this.queries.keys()) {
				if (existingQuery.matches(query)) {
					query = existingQuery;
				}
			}
		} else if (a instanceof Query) {
			query = a as Query;
		} else {
			query = new Query([a], ...b);
		}

		return wrap(this.queries.get(query)).unwrapOrElse(() => {
			const results = new QueryResults(query, this.components, this.entities);
			this.queries.set(query, results);
			return results;
		});
	}

	createHook(
		target: HTMLElement,
		initialValue: string,
		options?: { tag?: keyof HTMLElementTagNameMap; class?: string; style?: string }
	): RaxisDOMHook {
		const element = document.createElement(options?.tag ?? 'span') as HTMLElement;
		element.setAttribute('class', options?.class ?? '');
		element.setAttribute('style', options?.style ?? '');
		element.innerHTML = initialValue;
		target.appendChild(element);

		return new RaxisDOMHook(element);
	}

	private updateLoop(time: number) {
		const shiftAmounts = this.events.tick();
		this.elapsed = time;

		for (const sys of this.update) {
			for (const key of this.events.keys) {
				const current = this.currentContext.eventOffsets[key] as number;
				const offsetAmount = shiftAmounts[key] as number;

				this.currentContext.eventOffsets[key] = Math.max(current - offsetAmount, 0);
			}

			if (!sys.enabled) continue;
			this.currentContext = sys;
			void sys.fn(this);
		}

		this.currentContext = this.externalContext;
		this.loopID = some(window.requestAnimationFrame(this.updateLoop.bind(this)));
	}

	/**
	 * Runs startup systems and immediately afterwards begins execution of main loop
	 */
	async start() {
		this.globals.startup();

		for (const sys of this.startup) {
			if (!sys.enabled) continue;
			this.currentContext = sys;
			await sys.fn(this);
		}

		this.globals.firstCycle();
		this.currentContext = this.externalContext;
		this.loopID = some(window.requestAnimationFrame(this.updateLoop.bind(this)));
	}

	pause() {
		this.loopID.some((v) => {
			window.cancelAnimationFrame(v);
		});
	}

	resume() {
		if (this.loopID.isNone()) return;

		this.loopID = some(window.requestAnimationFrame(this.updateLoop.bind(this)));
	}

	async stop() {
		for (const sys of this.shutdown) {
			if (!sys.enabled) continue;
			this.currentContext = sys;
			await sys.fn(this);
		}

		this.loopID.some(window.cancelAnimationFrame);
		this.currentContext = this.externalContext;
	}
}

export namespace Raxis {
	export const Entity: unique symbol = Symbol();

	export class Builder {
		private comps: CompType[] = [];
		private events: EventType[] = [];
		private globals: Map<CompType, never[]> = new Map();

		private preStartup: (RaxisSystem | RaxisSystemAsync)[] = [];
		private startup: (RaxisSystem | RaxisSystemAsync)[] = [];
		private postStartup: (RaxisSystem | RaxisSystemAsync)[] = [];
		private first: RaxisSystem[] = [];
		private preUpdate: RaxisSystem[] = [];
		private update: RaxisSystem[] = [];
		private postUpdate: RaxisSystem[] = [];
		private last: RaxisSystem[] = [];
		private shutdown: RaxisSystem[] = [];

		private dedupedArray<O>(list: O[]): O[] {
			return list.filter((e, i) => list.indexOf(e) === i);
		}

		private copy(): Builder {
			const next = new Builder();
			next.comps = this.dedupedArray(this.comps);
			next.events = this.dedupedArray(this.events);
			next.globals = new Map(this.globals);

			next.preStartup = this.dedupedArray(this.preStartup);
			next.startup = this.dedupedArray(this.startup);
			next.postStartup = this.dedupedArray(this.postStartup);
			next.first = this.dedupedArray(this.first);
			next.preUpdate = this.dedupedArray(this.preUpdate);
			next.update = this.dedupedArray(this.update);
			next.postUpdate = this.dedupedArray(this.postUpdate);
			next.last = this.dedupedArray(this.last);
			next.shutdown = this.dedupedArray(this.shutdown);

			return next;
		}

		useComponent<C extends CompType>(type: C): Builder {
			const copy = this.copy();
			copy.comps = this.dedupedArray([...this.comps, type]);
			return copy;
		}

		useEvent<E extends EventType>(type: E): Builder {
			const copy = this.copy();
			copy.events = this.dedupedArray([...this.events, type]);
			return copy;
		}

		useGlobal<G extends CompType>(type: G, ...args: ConstructorParameters<G>): Builder {
			const copy = this.copy();
			copy.globals.set(type, args);
			return copy;
		}

		useStartup(...systems: [RaxisSystemAsync, ...RaxisSystemAsync[]]): Builder;
		useStartup(set: StartupSet, ...systems: [RaxisSystemAsync, ...RaxisSystemAsync[]]): Builder;
		useStartup(a: StartupSet | RaxisSystemAsync, ...b: RaxisSystemAsync[]): Builder {
			const copy = this.copy();

			if (typeof a === 'string') {
				copy[a] = this.dedupedArray([...this[a], ...b]);
			} else {
				copy.startup = this.dedupedArray([...this.startup, a, ...b]);
			}

			return copy;
		}

		useUpdate(...systems: [RaxisSystem, ...RaxisSystem[]]): Builder;
		useUpdate(set: UpdateSet, ...systems: [RaxisSystem, ...RaxisSystem[]]): Builder;
		useUpdate(a: UpdateSet | RaxisSystem, ...b: RaxisSystem[]): Builder {
			const copy = this.copy();

			if (typeof a === 'string') {
				copy[a] = this.dedupedArray([...this[a], ...b]);
			} else {
				copy.update = this.dedupedArray([...this.update, a, ...b]);
			}

			return copy;
		}

		useShutdown(...systems: [RaxisSystem, ...RaxisSystem[]]): Builder;
		useShutdown(set: ShutdownSet, ...systems: [RaxisSystem, ...RaxisSystem[]]): Builder;
		useShutdown(a: ShutdownSet | RaxisSystem, ...b: RaxisSystem[]): Builder {
			const copy = this.copy();

			if (typeof a === 'string') {
				copy[a] = this.dedupedArray([...this[a], ...b]);
			} else {
				copy.shutdown = this.dedupedArray([...this.update, a, ...b]);
			}

			return copy;
		}

		use(plugin: Builder): Builder {
			const copy = this.copy();

			copy.comps = this.dedupedArray([...this.comps, ...plugin.comps]);
			copy.events = this.dedupedArray([...this.events, ...plugin.events]);
			copy.globals = new Map([...this.globals, ...plugin.globals]);
			copy.preStartup = this.dedupedArray([...this.preStartup, ...plugin.preStartup]);
			copy.startup = this.dedupedArray([...this.startup, ...plugin.startup]);
			copy.postStartup = this.dedupedArray([...this.postStartup, ...plugin.postStartup]);
			copy.first = this.dedupedArray([...this.first, ...plugin.first]);
			copy.preUpdate = this.dedupedArray([...this.preUpdate, ...plugin.preUpdate]);
			copy.update = this.dedupedArray([...this.update, ...plugin.update]);
			copy.postUpdate = this.dedupedArray([...this.postUpdate, ...plugin.postUpdate]);
			copy.last = this.dedupedArray([...this.last, ...plugin.last]);
			copy.shutdown = this.dedupedArray([...this.shutdown, ...plugin.shutdown]);

			return copy;
		}

		build(): Raxis {
			return new Raxis(
				this.comps,
				this.events,
				this.globals,
				this.preStartup,
				this.startup,
				this.postStartup,
				this.first,
				this.preUpdate,
				this.update,
				this.postUpdate,
				this.last,
				this.shutdown
			);
		}
	}
}
