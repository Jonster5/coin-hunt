import { Option, wrap, none } from './option';
import { Tree } from './structures';
import { ComponentRegistry } from './component';
import { Raxis } from './raxis';
import { CompType, Component, Eid, EntityTag } from './types';
import { RaxisError } from './error';
import { EidAllocator } from './eid';
import { Query, QueryFilter, QueryResults } from './query';

export class Entity {
	private readonly eid: Eid;
	private readonly ereg: EntityRegistry;
	private readonly creg: ComponentRegistry;
	private readonly tags: Set<EntityTag>;
	static readonly [Symbol.RaxisID] = 'entity';
	readonly [Symbol.RaxisID] = 'entity-instance';

	private valid: boolean;

	private get node() {
		return this.ereg.nodeOf(this.eid).unwrap();
	}

	constructor(eid: Eid, ereg: EntityRegistry, creg: ComponentRegistry, tags: Set<EntityTag>) {
		this.eid = eid;
		this.ereg = ereg;
		this.creg = creg;
		this.tags = tags;
		this.valid = true;
	}

	/**
	 * @returns Whether this entity is a valid and currently exists
	 */
	isValid(): boolean {
		return this.valid;
	}

	/**
	 * @returns Whether this entity has been destroyed
	 */
	isInvalid(): boolean {
		return !this.valid;
	}

	private check(): void {
		if (this.isInvalid()) {
			throw new RaxisError('Invalid Entity');
		}
	}

	/**
	 * Destroys the entity and all of it's components and child entities
	 */
	destroy(): void {
		this.check();

		this.ereg.destroy(this.eid);

		this.valid = false;
	}

	tag(...tags: EntityTag[]): this;
	tag(tags: EntityTag[]): this;
	tag(a: EntityTag | EntityTag[], ...b: EntityTag[]): this {
		this.check();

		if (Array.isArray(a)) {
			for (const t of a) {
				if (typeof t === 'symbol') {
					if (this.ereg.unique_tags.has(t))
						throw new RaxisError('Unique tag applied to more than one entity', t);
					this.ereg.unique_tags.add(t);
				}
				this.tags.add(t);
			}
		} else {
			if (typeof a === 'symbol') {
				if (this.ereg.unique_tags.has(a)) throw new RaxisError('Unique tag applied to more than one entity', a);
				this.ereg.unique_tags.add(a);
			}
			this.tags.add(a);

			for (const t of b) {
				if (typeof t === 'symbol') {
					if (this.ereg.unique_tags.has(t))
						throw new RaxisError('Unique tag applied to more than one entity', t);
					this.ereg.unique_tags.add(t);
				}
				this.tags.add(t);
			}
		}

		this.ereg.validateQueries(this.eid);

		return this;
	}

	hasTag(t: EntityTag): boolean {
		this.check();

		return this.tags.has(t);
	}

	untag(t: EntityTag): this {
		this.check();

		this.tags.delete(t);
		if (typeof t === 'symbol') this.ereg.unique_tags.delete(t);

		this.ereg.validateQueries(this.eid);

		return this;
	}

	insert(comp: Component): this {
		this.check();

		this.creg.set(this.eid, comp);

		this.ereg.validateQueries(this.eid);

		return this;
	}

	access<T extends CompType>(type: T): Option<Component<T>>;
	access<A extends CompType, B extends [CompType, ...CompType[]]>(
		type: A,
		...types: B
	): Option<[Component<A>, ...{ [K in keyof B]: Component<B[K]> }]>;
	access(...types: [CompType, ...CompType[]]): Option<Component | Component[]> {
		this.check();

		if (types.length === 1) {
			return this.creg.get(this.eid, types[0]);
		} else {
			return Option.all(types.map((t) => this.creg.get(this.eid, t)));
		}
	}

	delete<T extends CompType>(type: T): this {
		this.check();

		this.creg.delete(this.eid, type);

		this.ereg.validateQueries(this.eid);

		return this;
	}

	spawn(...comps: (Component | Component[])[]): Entity {
		this.check();

		const entity = this.ereg.create(comps.flat(), wrap(this.eid));
		this.addChild(entity);

		return entity;
	}

	id(): Eid {
		this.check();

		return this.eid;
	}

	removeParent() {
		this.check();
	}

	parent(): Option<Entity> {
		this.check();

		return this.node.parent().map((h) => h.value());
	}

	*children(...filters: QueryFilter[]): Iterable<Entity> {
		this.check();

		for (const child of this.node.children()) {
			if (filters.length > 0 && filters.some((f) => !f.validate(child.value().eid, this.creg, this.ereg))) {
				continue;
			}

			yield child.value();
		}
	}

	addChild(entity: Entity) {
		this.check();

		this.node.addChild(entity.node);
	}

	removeChild() {
		this.check();
	}
}

export class EntityRegistry {
	private allocator: EidAllocator;

	private eids: Set<Eid>;
	private entities: Option<Entity>[];
	private nodes: Option<Tree<Entity>>[];
	private tags: Set<EntityTag>[];
	unique_tags: Set<symbol>;

	constructor(private raxis: Raxis, private creg: ComponentRegistry, private queries: Map<Query, QueryResults>) {
		this.allocator = new EidAllocator();
		this.eids = new Set();
		this.entities = new Array<Option<Entity>>(1000).fill(none);
		this.nodes = new Array<Option<Tree<Entity>>>(1000).fill(none);
		this.tags = Array.from({ length: 1000 }, () => new Set());
		this.unique_tags = new Set();
	}

	validateQueries(eid: Eid) {
		for (const res of this.queries.values()) {
			res.validate(eid);
		}
	}

	removeFromQueries(eid: Eid) {
		for (const res of this.queries.values()) {
			res.remove(eid);
		}
	}

	create(comps: Component[], parent: Option<Eid>): Entity {
		const eid = this.allocator.use();
		const entity = new Entity(eid, this, this.creg, this.tags[eid] as Set<EntityTag>);
		const node = new Tree(entity);

		for (const comp of comps) {
			this.creg.set(eid, comp);
		}

		parent
			.map((p) => this.nodeOf(p))
			.flatten()
			.some((p) => node.attachTo(p));

		this.eids.add(eid);
		this.entities[eid] = wrap(entity);
		this.nodes[eid] = wrap(node);
		this.validateQueries(eid);

		for (const comp of comps) {
			comp.onInsert?.(entity, this.raxis);
		}

		return entity;
	}

	destroy(eid: Eid) {
		if (!this.eids.has(eid)) return;

		for (const comp of this.creg.getColumn(eid)) {
			comp.some((c) => c.onDestroy?.(this.entityOf(eid).unwrap(), this.raxis));
		}

		this.creg.deleteColumn(eid);

		this.nodeOf(eid).unwrap().detachFromParent();

		this.eids.delete(eid);
		this.entities[eid] = none;
		this.nodes[eid] = none;

		this.removeFromQueries(eid);
	}

	active(): Iterable<Eid> {
		return this.eids;
	}

	tagsOf(eid: Eid): Option<Set<EntityTag>> {
		return wrap(this.tags[eid]);
	}

	entityOf(eid: Eid): Option<Entity> {
		return this.entities[eid] ?? none;
	}

	nodeOf(eid: Eid): Option<Tree<Entity>> {
		return this.nodes[eid] ?? none;
	}
}
