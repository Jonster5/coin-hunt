import { ValidEventKey } from './event';
import { CompType, Component, PositionalSystemSet, RaxisSystem, RaxisSystemAsync } from './types';

export class SystemContext {
	fn: RaxisSystem | RaxisSystemAsync;
	set: PositionalSystemSet;

	enabled: boolean;
	resources: Map<CompType, Component>;
	eventOffsets: Record<ValidEventKey, number>;

	constructor(fn: RaxisSystem, eventKeys: ValidEventKey[], set: PositionalSystemSet) {
		this.fn = fn;

		this.enabled = true;
		this.resources = new Map();
		this.eventOffsets = {};
		this.set = set;

		for (const key of eventKeys) {
			this.eventOffsets[key] = 0;
		}
	}
}
