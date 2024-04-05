import { CompType, EventType, Query } from '.';

export type RaxisErrorType =
	| 'Unknown CompType'
	| 'Invalid Entity'
	| 'Unknown Global Access'
	| 'Unknown EventType'
	| 'No Results Available In Query'
	| 'More Than One Result Available In Query'
	| 'Plugin Or Plugins Required'
	| 'Unique tag applied to more than one entity';

export class RaxisError extends Error {
	readonly type: RaxisErrorType;

	constructor(err: 'Invalid Entity');
	constructor(err: 'Unknown CompType', type: CompType);
	constructor(err: 'Unknown Global Access', type: CompType);
	constructor(err: 'Unknown EventType', type: EventType);
	constructor(err: 'No Results Available In Query', query: Query);
	constructor(err: 'More Than One Result Available In Query', query: Query);
	constructor(err: 'Plugin Or Plugins Required', ...plugins: string[]);
	constructor(err: 'Unique tag applied to more than one entity', tag: symbol);
	constructor(err: RaxisErrorType, ...subjects: unknown[]) {
		// @ts-expect-error it is guaranteed to have a name of some kind
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
		super(`${err}: [${subjects.map((s) => s.name ?? s.constructor.name).join('] [')}]`);
		this.type = err;
		this.name = 'RaxisError';
	}
}
