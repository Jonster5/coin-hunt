import { NonNull, Option, none, wrap } from '../../option';

export class Tree<T extends NonNull> {
	private val: T;
	private pNode: Option<Tree<T>>;
	private cNodes: Set<Tree<T>>;

	constructor(value: T) {
		this.val = value;
		this.pNode = none;
		this.cNodes = new Set();
	}

	value(newValue?: T): T {
		if (newValue !== undefined) this.val = newValue;

		return this.val;
	}

	isRoot(): boolean {
		return this.pNode.isNone();
	}

	isLeaf(): boolean {
		return this.cNodes.size === 0;
	}

	isChildOf(node: Tree<T>): boolean {
		return this.pNode.map((p) => p === node).unwrapOr(false);
	}

	isParentOf(node: Tree<T>): boolean {
		return this.cNodes.has(node);
	}

	root(): Tree<T> {
		return this.pNode.map((p) => p.root()).unwrapOr(this);
	}

	parent(): Option<Tree<T>> {
		return this.pNode;
	}

	children(): Iterable<Tree<T>> {
		return this.cNodes.values();
	}

	size(): number {
		return this.cNodes.size;
	}

	attachTo(node: Tree<T>): this {
		this.pNode.some((p) => p.cNodes.delete(this));
		this.pNode = wrap(node);
		this.pNode.some((p) => p.cNodes.add(this));

		return this;
	}

	detachFromParent(): this {
		this.pNode.some((p) => p.cNodes.delete(this));
		this.pNode = none;

		return this;
	}

	addChild(child: Tree<T>): this {
		child.pNode.some((p) => p.cNodes.delete(this));
		child.pNode = wrap(this);
		this.cNodes.add(child);

		return this;
	}

	removeChild(child: Tree<T>): this {
		if (this.isParentOf(child)) child.pNode = none;
		this.cNodes.delete(child);

		return this;
	}

	createChild(value: T): Tree<T> {
		const child = new Tree(value);
		this.addChild(child);

		return child;
	}

	createChildren(values: T[]): this {
		for (const value of values) {
			this.addChild(new Tree(value));
		}

		return this;
	}

	*getBF(): Iterator<Tree<T>> {
		const queue: Tree<T>[] = [this];

		while (queue.length > 0) {
			const node = queue.shift() as Tree<T>;

			yield node;

			queue.push(...node.children());
		}
	}

	*getDF(): Iterator<Tree<T>> {
		yield this;
		throw new Error('Not Implemented.');
	}
}
