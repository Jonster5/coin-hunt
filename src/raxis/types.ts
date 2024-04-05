import { A } from 'ts-toolbelt';
import { Raxis } from './raxis';
import { Entity } from './entity';

export type GenericConstructor<T extends object = object> = new (...args: never[]) => T;

export type Eid = A.Type<number, 'RaxisEntityID'>;
export type EntityTag = symbol | string;

export type CompType<T extends object = object> = GenericConstructor<T> & {
	[Symbol.RaxisID]?: undefined;
};
export type Component<T extends GenericConstructor = CompType> = (T extends GenericConstructor<infer R>
	? R extends GenericConstructor
		? never
		: R
	: never) & {
	[Symbol.RaxisID]?: undefined;
	onInsert?(entity: Entity, r?: Raxis): void;
	onDestroy?(entity: Entity, r?: Raxis): void;
};

export type Bundle = Component[];

export type EventType<T extends object | string = object | string> = T extends object
	? GenericConstructor<T>
	: T extends string
	? T
	: never;

export type EventData<T extends EventType> = T extends string ? T : T extends GenericConstructor<infer I> ? I : never;

export type Global = {
	beforeStartup?(): void;
	beforeFirstCycle?(): void;
	onShutdown?(): void;
};

export type RaxisSystem = (r: Raxis) => void;
export type RaxisSystemAsync = (r: Raxis) => Promise<void> | void;

export type StartupSet = 'preStartup' | 'startup' | 'postStartup';
export type UpdateSet = 'first' | 'preUpdate' | 'update' | 'postUpdate' | 'last';
export type ShutdownSet = 'shutdown';
export type PositionalSystemSet = StartupSet | UpdateSet | ShutdownSet | 'external';

declare global {
	interface SymbolConstructor {
		readonly RaxisID: unique symbol;
	}
}

// @ts-expect-error setting RaxisID symbol
Symbol.RaxisID = Symbol.for('raxis');
