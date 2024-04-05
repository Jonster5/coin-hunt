import { NonNull, Option, none, some } from './option';
import { Entity, EntityRegistry } from './entity';
import { CompType, Component, Eid, EntityTag } from './types';
import { ComponentRegistry } from './component';
import { RaxisError } from './error';
import { Raxis } from './raxis';

export type QueryItem =
	| (CompType & { [Symbol.RaxisID]?: undefined })
	| typeof Raxis.Entity
	| (QueryPreprocesser & { [Symbol.RaxisID]: 'query-preprocessor-instance' });

type ResultFrom<I extends QueryItem> = I extends typeof Raxis.Entity
	? Entity
	: I extends QueryPreprocesser<infer R>
	? R
	: I extends CompType<infer C>
	? C
	: never;

type ExtractResultsFrom<Q extends Query> = Q extends Query<infer R extends [QueryItem]>
	? ResultFrom<R[0]>
	: Q extends Query<infer R extends [QueryItem, ...QueryItem[]]>
	? { [K in keyof R]: ResultFrom<R[K]> }
	: never;

export class Query<const Items extends QueryItem[] = [QueryItem, ...QueryItem[]]> {
	readonly items: Items;
	readonly filters: QueryFilter[];
	readonly [Symbol.RaxisID] = 'query-instance' as const;
	static readonly [Symbol.RaxisID] = 'query' as const;

	constructor(types: Items, ...filters: QueryFilter[]) {
		this.items = types;
		this.filters = filters;
	}

	matches(other: Query): boolean {
		if (this.items.length !== other.items.length) return false;

		for (let i = 0; i < this.items.length; i++) {
			const a = this.items[i] as QueryItem;
			const b = other.items[i] as QueryItem;

			if (
				(a instanceof QueryPreprocesser && !(b instanceof QueryPreprocesser)) ||
				(b instanceof QueryPreprocesser && !(a instanceof QueryPreprocesser))
			) {
				return false;
			}

			if (a instanceof QueryPreprocesser && b instanceof QueryPreprocesser) {
				if (!a.matches(b)) return false;
			} else {
				if (a !== b) return false;
			}
		}

		if (this.filters.length !== other.filters.length) return false;

		for (let i = 0; i < this.filters.length; i++) {
			if (!this.filters[i]?.matches(other.filters[i] as QueryFilter)) return false;
		}

		return true;
	}

	static DefinePreprocessor<const Args extends unknown[], R extends NonNull>(
		processor: QueryResultTransformer<Args>,
		validator: QueryValidator<Args>
	): QueryResultModifier<Args, R> {
		return (...args: Args) =>
			new QueryPreprocesser<R>(
				processor as QueryResultTransformer<unknown[], R>,
				validator as QueryValidator<unknown[]>,
				args
			);
	}

	static DefineParameter<const Args extends unknown[]>(validator: QueryValidator<Args>): QueryParameter<Args> {
		return (...args: Args) => new QueryFilter(validator as QueryValidator<unknown[]>, args);
	}
}

export type QueryValidator<Args extends unknown[] = []> = (
	eid: Eid,
	creg: Readonly<ComponentRegistry>,
	ereg: Readonly<EntityRegistry>,
	args: Args
) => boolean;

export type QueryResultTransformer<Args extends unknown[] = [], R extends NonNull = NonNull> = (
	eid: Eid,
	creg: Readonly<ComponentRegistry>,
	ereg: Readonly<EntityRegistry>,
	args: Args
) => R;

export class QueryPreprocesser<R extends NonNull = NonNull> {
	static readonly [Symbol.RaxisID] = 'query-preprocessor' as const;
	readonly [Symbol.RaxisID] = 'query-preprocessor-instance' as const;

	constructor(
		private prc: QueryResultTransformer<unknown[], R>,
		private val: QueryValidator<unknown[]>,
		private args: unknown[]
	) {}

	matches(other: QueryPreprocesser): boolean {
		if (this.prc !== other.prc) {
			return false;
		}

		if (this.args.length === 0) {
			return true;
		}

		for (let i = 0; i < this.args.length; i++) {
			if (this.args[i] !== other.args[i]) return false;
		}

		return true;
	}

	process(eid: Eid, creg: Readonly<ComponentRegistry>, ereg: Readonly<EntityRegistry>): R {
		return this.prc(eid, creg, ereg, this.args);
	}

	validate(eid: Eid, creg: ComponentRegistry, ereg: EntityRegistry): boolean {
		return this.val(eid, creg, ereg, this.args);
	}
}

export class QueryFilter {
	static readonly [Symbol.RaxisID] = 'query-filter' as const;
	readonly [Symbol.RaxisID] = 'query-filter-instance' as const;

	constructor(private fn: QueryValidator<unknown[]>, private args: unknown[]) {}

	matches(other: QueryFilter): boolean {
		if (this.fn !== other.fn) {
			return false;
		}

		if (this.args.length === 0) {
			return true;
		}

		for (let i = 0; i < this.args.length; i++) {
			if (this.args[i] !== other.args[i]) return false;
		}

		return true;
	}

	validate(eid: Eid, creg: ComponentRegistry, ereg: EntityRegistry): boolean {
		return this.fn(eid, creg, ereg, this.args);
	}
}

export type QueryParameter<Args extends unknown[]> = (...args: Args) => QueryFilter;
export type QueryResultModifier<Args extends unknown[], R extends NonNull = NonNull> = (
	...args: Args
) => QueryPreprocesser<R>;

export class QueryResults<Q extends Query = Query> {
	private query: Q;
	private eids: Set<Eid>;
	private creg: ComponentRegistry;
	private ereg: EntityRegistry;

	constructor(query: Q, creg: ComponentRegistry, ereg: EntityRegistry) {
		this.query = query;
		this.eids = new Set();
		this.creg = creg;
		this.ereg = ereg;
		for (const eid of this.ereg.active()) {
			this.validate(eid);
		}
	}

	empty(): boolean {
		return this.eids.size === 0;
	}

	size(): number {
		return this.eids.size;
	}

	private getResult<I extends QueryItem>(item: I, eid: Eid): ExtractResultsFrom<Q> {
		if (item === Raxis.Entity) {
			return this.ereg.entityOf(eid).expect('An active entity') as ExtractResultsFrom<Q>;
		} else if (item[Symbol.RaxisID] === 'query-preprocessor-instance') {
			return (item as QueryPreprocesser).process(eid, this.creg, this.ereg) as ExtractResultsFrom<Q>;
		} else {
			return this.creg.get(eid, item as CompType).expect('An existing component') as ExtractResultsFrom<Q>;
		}
	}

	*[Symbol.iterator](): Iterator<ExtractResultsFrom<Q>> {
		if (this.query.items.length === 1) {
			for (const eid of this.eids) {
				yield this.getResult(this.query.items[0], eid);
			}
		} else {
			for (const eid of this.eids) {
				const out = new Array(this.query.items.length) as ExtractResultsFrom<Q>;
				for (let i = 0; i < this.query.items.length; i++) {
					out[i] = this.getResult(this.query.items[i] as QueryItem, eid);
				}
				yield out;
			}
		}
	}

	single(): Option<ExtractResultsFrom<Q>> {
		if (this.eids.size !== 1) {
			return none;
		}

		const eid = this.eids.values().next().value as Eid;

		if (this.query.items.length === 1) {
			return some(this.getResult(this.query.items[0], eid));
		} else {
			const out = new Array(this.query.items.length) as ExtractResultsFrom<Q>;
			for (let i = 0; i < this.query.items.length; i++) {
				out[i] = this.getResult(this.query.items[i] as QueryItem, eid);
			}
			return some(out);
		}
	}

	expectSingle(): ExtractResultsFrom<Q> {
		if (this.eids.size === 0) {
			throw new RaxisError('No Results Available In Query', this.query);
		} else if (this.eids.size > 1) {
			throw new RaxisError('More Than One Result Available In Query', this.query);
		}

		const eid = this.eids.values().next().value as Eid;

		if (this.query.items.length === 1) {
			return this.getResult(this.query.items[0], eid);
		} else {
			const out = new Array(this.query.items.length) as ExtractResultsFrom<Q>;
			for (let i = 0; i < this.query.items.length; i++) {
				out[i] = this.getResult(this.query.items[i] as QueryItem, eid);
			}
			return out;
		}
	}

	/** @internal */
	validate(eid: Eid) {
		for (const item of this.query.items) {
			if (item === Raxis.Entity) {
				continue;
			}
			if (item instanceof QueryPreprocesser) {
				if (!(item as QueryPreprocesser).validate(eid, this.creg, this.ereg)) {
					this.eids.delete(eid);
					return;
				}
			} else if (this.creg.get(eid, item as CompType).isNone()) {
				this.eids.delete(eid);
				return;
			}
		}

		for (const filter of this.query.filters) {
			if (!filter.validate(eid, this.creg, this.ereg)) {
				this.eids.delete(eid);
				return;
			}
		}

		this.eids.add(eid);
	}

	/** @internal */
	remove(eid: Eid) {
		this.eids.delete(eid);
	}
}

export const Optionally = Query.DefinePreprocessor<[CompType], Option<Component>>(
	function (eid, creg, _, [type]): Option<Component> {
		return creg.get(eid, type);
	},
	function () {
		return true;
	}
) as <T extends Component>(type: CompType<T>) => QueryPreprocesser<Option<T>>;

/**
 * Only validates entities that have the input CompType
 */
export const With = Query.DefineParameter<CompType[]>(function With(eid, creg, _ereg, types) {
	return !types.some((t) => creg.get(eid, t).isNone());
}) as (type: CompType, ...types: CompType[]) => QueryFilter;

export const Tagged = Query.DefineParameter<[EntityTag]>(function WithTag(eid, _creg, ereg, [tag]) {
	return ereg
		.tagsOf(eid)
		.map((t) => t.has(tag))
		.unwrap();
}) as (tag: EntityTag) => QueryFilter;

export const Nottagged = Query.DefineParameter<[EntityTag]>(function WithoutTag(eid, _creg, ereg, [tag]) {
	return ereg
		.tagsOf(eid)
		.map((t) => !t.has(tag))
		.unwrap();
}) as (tag: EntityTag) => QueryFilter;

/**
 * Only validates entities that do not have the input CompType
 */
export const Without = Query.DefineParameter<[CompType]>(function Without(eid, creg, _ereg, [type]) {
	return creg.get(eid, type).isNone();
}) as (type: CompType) => QueryFilter;

/**
 * Only validates entities that are the parent of a child which has that the input CompType
 */
export const ChildWith = Query.DefineParameter<[CompType]>(function ChildWith(eid, creg, ereg, [type]) {
	const node = ereg.nodeOf(eid).unwrap();

	if (node.size() === 0) {
		return false;
	}

	for (const child of node.children()) {
		if (creg.get(child.value().id(), type).isSome()) return true;
	}

	return false;
}) as (type: CompType) => QueryFilter;

export const HasNoParent = Query.DefineParameter<[]>(function HasNoParent(eid, _creg, ereg) {
	return ereg
		.nodeOf(eid)
		.map((n) => n.isRoot())
		.unwrap();
}) as () => QueryFilter;

// export function ParentWith<C extends CompType>(type: C): __QueryFilter<'pw', C> {
// 	return ['pw', type];
// }

// export function ParentWithout<C extends CompType>(type: C): __QueryFilter<'pwo', C> {
// 	return ['pwo', type];
// }
