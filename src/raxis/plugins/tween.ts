import { F } from 'ts-toolbelt';
import { Raxis, Time, Option, none, some } from '..';
import { linear } from '../structures';

type TweenOptions = {
	/** In milliseconds */
	duration: number;
	delay?: number;
	label?: string;
};

export type BasicTweenOptions = {
	start: number;
	finish: number;
	/**
	 * @param value the current value of the subject of the tween
	 * @param state is a number between 0 and 1 representing the current progress of the tween
	 */
	onUpdate?: (value: number, state: number) => unknown;
	easing?: (t: number) => number;
	onComplete?: () => unknown;
} & TweenOptions;

export type ActiveTweenOptions<T extends object> = {
	obj: T;
	to: F.NoInfer<Partial<T>>;
	/**
	 * @param value the subject of the tween
	 * @param state is a number between 0 and 1 representing the current progress of the tween
	 */
	onUpdate?: (value: T, state: number) => unknown;
	easing?: (t: number) => number;
	onComplete?: () => unknown;
} & TweenOptions;

export type AnyTween = BasicTween | ActiveTween;
export type AnyTweenOptions = BasicTweenOptions | ActiveTweenOptions<any>;

export class TweenManager {
	pending: { type: 'basic' | 'active'; options: AnyTweenOptions }[] = [];
	tweens: AnyTween[] = [];
	private labeled_tweens: Map<string, Option<AnyTween>> = new Map();

	newBasic(options: BasicTweenOptions): void {
		this.add('basic', options);
	}

	newActive<T extends object>(options: ActiveTweenOptions<T>): void {
		this.add('active', options);
	}

	private add(type: 'basic' | 'active', options: AnyTweenOptions) {
		if (options.delay !== undefined && options.delay > 0) {
			this.pending.push({ type, options });

			if (options.label !== undefined) {
				this.labeled_tweens.set(options.label, none);
			}
		} else {
			let tween: AnyTween;
			if (type === 'basic') tween = new BasicTween(options as never);
			else if (type === 'active') tween = new ActiveTween(options as never);

			this.tweens.push(tween);

			if (options.label !== undefined) {
				this.labeled_tweens.set(options.label, some(tween));
			}
		}
	}

	// newDynamic<T extends object, P extends [...(keyof OnlyNumberProps<T>)[]]>(
	//     options: DynamicTweenOptions<T, P>
	// ): void {}

	cancel(label: string): void {
		const tween = this.labeled_tweens.get(label);
		if (tween === undefined) return;
		this.labeled_tweens.delete(label);

		tween
			.some((t) => {
				const tweens_index = this.tweens.indexOf(t);
				if (tweens_index !== -1) this.tweens.splice(tweens_index, 1);
			})
			.none(() => {
				const pending_index = this.pending.findIndex(({ options }) => options.label === label);
				if (pending_index !== -1) this.pending.splice(pending_index, 1);
			});
	}
}

class BasicTween {
	readonly tag = 'basic' as const;

	duration: number;
	start: number;
	finish: number;
	distance: number;
	ease: (x: number) => number;
	onComplete?: () => unknown;
	onUpdate?: (value: number, state: number) => unknown;

	state: number;
	value: number;

	constructor(options: BasicTweenOptions) {
		this.duration = options.duration;
		this.start = options.start;
		this.finish = options.finish;
		this.distance = this.finish - this.start;
		this.ease = options.easing ?? linear;
		this.onComplete = options.onComplete;
		this.onUpdate = options.onUpdate;
		this.state = 0;
		this.value = this.start;
	}

	update(dt: number) {
		if (this.state >= 1) {
			this.onComplete?.();
			return;
		}

		this.state += (1 / this.duration) * dt;
		this.state = Math.min(this.state, 1);
		this.value = this.ease(this.state) * this.distance + this.start;
		this.onUpdate?.(this.value, this.state);
	}
}

class ActiveTween {
	readonly tag = 'active' as const;

	obj: any;
	target: any;

	state: number;
	fields: { key: string; start: number; distance: number }[];

	duration: number;
	ease: (x: number) => number;
	onComplete?: () => unknown;
	onUpdate?: (obj: any, state: number) => unknown;

	constructor(options: ActiveTweenOptions<object>) {
		this.obj = options.obj;
		this.target = options.to;
		this.state = 0;
		this.duration = options.duration;
		this.ease = options.easing ?? linear;
		this.onUpdate = options.onUpdate;

		this.onComplete = options.onComplete;
		this.fields = [];

		for (const key of Object.keys(this.target)) {
			if (!(key in this.obj)) throw new Error(`Key ${key} does not exist on type ${this.obj.constructor}`);

			this.fields.push({
				key,
				start: this.obj[key],
				distance: this.target[key] - this.obj[key],
			});
		}
	}

	update(dt: number): boolean {
		if (this.state >= 1) {
			if (this.onComplete !== undefined) this.onComplete();
			return false;
		}

		this.state += (1 / this.duration) * dt;
		this.state = Math.min(this.state, 1);

		for (const f of this.fields) {
			this.obj[f.key] = this.ease(this.state) * f.distance + f.start;
		}

		this.onUpdate?.(this.obj, this.state);

		return true;
	}
}

function updateTweens(r: Raxis) {
	const dt = r.global(Time).delta; // in milliseconds;

	for (const tm of r.query(TweenManager)) {
		tm.tweens = tm.tweens.filter((tween) => tween.update(dt));

		tm.pending.forEach(({ options }) => (options.delay -= dt));
		tm.pending = tm.pending.filter(({ type, options }) => {
			if (options.delay > 0) return true;

			if (type === 'basic') tm.newBasic(options as never);
			else if (type === 'active') tm.newActive(options as never);
			return false;
		});
	}
}

export const TweenPlugin = new Raxis.Builder().useComponent(TweenManager).useUpdate(updateTweens);
