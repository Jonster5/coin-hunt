import { Global, Raxis } from '..';

export class Time implements Global {
	elapsed: number = 0;
	last: number = 0;
	delta: number = 0;

	beforeFirstCycle(): void {
		this.last = performance.now();
		this.elapsed = this.last;
	}
}

/**
 * Local resource for tracking how much time a system has left before running again
 */
export class SystemTimer {
	constructor(public tleft: number) {}

	static set(r: Raxis, duration: number) {
		r.local(new SystemTimer(duration));
	}

	static check(r: Raxis) {
		const timer: SystemTimer = r.local(SystemTimer).unwrapOrElse(() => r.local(new SystemTimer(0)));
		timer.tleft -= r.global(Time).delta;
		return timer.tleft > 0;
	}
}

function updateTime(r: Raxis) {
	const time = r.global(Time);
	const now = r.getElapsedTime();

	time.delta = now - time.last;
	time.elapsed += time.delta;
	time.last = now;
}

export const TimePlugin = new Raxis.Builder().useGlobal(Time).useUpdate(updateTime);
