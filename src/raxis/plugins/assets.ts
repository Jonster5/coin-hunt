declare const AssetId: unique symbol;
export type HandleId<T> = PropertyKey & { [AssetId]: T };

export class Handle<T> {
	readonly id: HandleId<T> = crypto.randomUUID() as HandleId<T>;
	readonly store: symbol;

	constructor(store: symbol, id?: HandleId<T>) {
		this.store = store;
		if (id !== undefined) {
			this.id = id;
		}
	}
}

export interface AssetLoader<S, R> {
	loadAsset(src: S): Promise<Handle<R>>;
}

export class AssetStore<T> {
	private store: Record<HandleId<T>, T> = {};
	readonly storeId = Symbol();

	addAsset(asset: T): Handle<T> {
		const handle = new Handle<T>(this.storeId);
		this.store[handle.id] = asset;

		return handle;
	}

	getAsset(handle: Handle<T>): T {
		if (handle.store !== this.storeId) {
			throw new ReferenceError('Attempted asset access by unknown handle', { cause: handle });
		}

		return this.store[handle.id] as T;
	}
}

export async function load<S, R>(loader: AssetLoader<S, R>, src: S): Promise<Handle<R>>;
export async function load<S, R>(loader: AssetLoader<S, R>, a: S): Promise<unknown> {
	return await loader.loadAsset(a);
}
