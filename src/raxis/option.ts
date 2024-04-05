/** Any possible value that is guaranteed not to be null or undefined */
export type NonNull = NonNullable<unknown>;

export abstract class Option<T extends NonNull> {
	/** @returns True if the contained value exists, false if it doesn't. */
	abstract isSome(): this is Some<T>;
	/** @returns True if the contained value does not exist, false if it does. */
	abstract isNone(): this is None;

	/** @returns The value contained in the option, or throws an error if the contained value does not exist. */
	abstract unwrap(): T;
	/** @return The value contained in the option, or throws an error with the specified error message if the option is a None value. */
	abstract expect(msg: string): T;
	/** @returns The value contained in the option, or returns the input `other` value if the contained value does not exist. */
	abstract unwrapOr(other: T): T;
	/** @returns The value contained in the option, or returns the output if the function `fn` if the contained value does not exist. */
	abstract unwrapOrElse(fn: () => T): T;

	/** Calls the function `fn` with the contained value if it exists, does nothing if the contained value does not exist.
	 * @returns A reference to `this`.
	 */
	abstract some(fn: (value: T) => void): this;
	/** Calls the function `fn` if the contained value does not exist, does nothing if the contained value does exist.
	 * @returns A reference to `this`.
	 */
	abstract none(fn: () => void): this;
	/** Creates a new Option containing the output of `fn` if the contained value of this Option exists, if it doesn't, nothing happens.
	 * @returns The newly created Option, or a reference to `this` if nothing happened.
	 */
	abstract map<R extends NonNull>(fn: (value: T) => R | undefined | null): Option<R>;
	/** Creates and returns a new Option containing the output of the function `fn` if the contained value exists. If not, then a new Option containing the value `other` is returned.
	 * @returns The newly created Option.
	 */
	abstract mapOr<R extends NonNull>(fn: (value: T) => R | undefined | null, other: R): Option<R>;
	/** Creates and returns a new Option containing the output of the function `fn` if the contained value exists. If not, then a new Option containing the value outputted by the function `other` is returned.
	 * @returns The newly created Option.
	 */
	abstract mapOrElse<R extends NonNull>(
		fn: (value: T) => R | undefined | null,
		other: () => R | undefined | null
	): Option<R>;
	/** Removes one layer of nested Options, does nothing if there's no extra layers of Options
	 * @returns A new Option with one less layer of Options
	 */
	abstract flatten(): Option<Unwrapped<T>>;

	abstract [Symbol.iterator](): Iterator<T>;
}

export class None extends Option<never> {
	static readonly value = new this();
	private constructor() {
		super();
	}

	isSome(): false {
		return false;
	}

	isNone(): this is None {
		return true;
	}

	expect(msg: string): never {
		throw new Error(`Expected: ${msg}`);
	}

	unwrap(): never {
		throw new ReferenceError('Called unwrap on a None value');
	}

	unwrapOr<T extends NonNull>(other: T): T {
		return other;
	}

	unwrapOrElse<T extends NonNull>(fn: () => T): T {
		return fn();
	}

	[Symbol.iterator](): Iterator<never> {
		return undefined as never;
	}

	some(): this {
		return this;
	}

	none(fn: () => void): this {
		fn();
		return this;
	}

	map(): Option<never> {
		return this;
	}

	mapOr<R extends NonNull>(_: (value: never) => R | undefined | null, other: R): Option<R> {
		return wrap(other);
	}

	mapOrElse<R extends NonNull>(
		_: (value: never) => R | undefined | null,
		other: () => R | undefined | null
	): Option<R> {
		return wrap(other());
	}

	flatten(): Option<Unwrapped<never>> {
		return this;
	}
}

export class Some<T extends NonNull = NonNull> extends Option<T> {
	private readonly value: T;

	constructor(value: T) {
		super();
		this.value = value;
	}

	isSome(): this is Some<T> {
		return true;
	}

	isNone(): false {
		return false;
	}

	expect(): T {
		return this.value;
	}

	unwrap(): T {
		return this.value;
	}

	unwrapOr(): T {
		return this.value;
	}

	unwrapOrElse(): T {
		return this.value;
	}

	*[Symbol.iterator]() {
		yield this.value;
	}

	some(fn: (value: T) => void) {
		fn(this.value);
		return this;
	}

	none() {
		return this;
	}

	map<R extends NonNull>(fn: (value: T) => R | undefined | null): Option<R> {
		return wrap(fn(this.value));
	}

	mapOr<R extends NonNull>(fn: (value: T) => R | null | undefined): Option<R> {
		return wrap(fn(this.value));
	}

	mapOrElse<R extends NonNull>(fn: (value: T) => R | null | undefined): Option<R> {
		return wrap(fn(this.value));
	}

	flatten(): Option<Unwrapped<T>> {
		if (this.value instanceof Some) {
			return new Some(this.value.value as Unwrapped<T>);
		} else if (this.value instanceof None) {
			return this.value;
		} else {
			return new Some(this.value as Unwrapped<T>);
		}
	}
}

type MappedInnerValue<A extends Option<NonNull>[]> = {
	[K in keyof A]: A[K] extends Option<infer I> ? I : never;
};

/** Gets the type of the value contained within an Option */
export type Unwrapped<T> = T extends Option<infer I> ? I : T;

export namespace Option {
	/**
	 * Converts a group of separate Options into a single Option that exists only of all of the contained Options exist
	 *
	 * @param options An array of Options
	 * @returns An option containing a tuple of all the contained values in the same order as the input options
	 *
	 * @example
	 * ```ts
	 * declare const o1: Option<number>
	 * declare const o2: Option<string>
	 *
	 * const o3 = all([o1, o2]) // Option<[number, string]>
	 * ```
	 */
	export function all<T extends [...Option<NonNull>[]]>(options: [...T]): Option<MappedInnerValue<T>> {
		if (options.some((o) => o.isNone())) return none;
		return some(options.map((o) => o.unwrap()) as MappedInnerValue<T>);
	}
}

/**
 * Takes in any unknown value and returns an Option containing that value
 *
 * @example
 * ```ts
 * const val = localStorage.getItem("someKey") // string | undefined
 *
 * const opt = wrap(val) // Option<string>
 * ```
 */
export function wrap<T extends NonNull>(value: T | undefined | null): Option<T> {
	if (value === undefined || value === null) {
		return None.value;
	} else {
		return new Some(value);
	}
}

export const none: Option<never> = None.value;
export type none = None;

export const some = <T extends NonNull>(value: T) => new Some(value) as Option<T>;
export type some<T extends NonNull> = Some<T>;
