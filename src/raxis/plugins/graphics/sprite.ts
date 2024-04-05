import { A } from 'ts-toolbelt';
import { GlobalTransform, Transform } from '../transform';
import { Entity, HasNoParent, Raxis, Option } from '../..';
import { Handle } from '../assets';
import { ColorValue } from '../../structures';

export type SpriteAnchor =
	| 'center'
	| 'top'
	| 'bottom'
	| 'left'
	| 'right'
	| 'top-left'
	| 'bottom-left'
	| 'top-right'
	| 'bottom-right';

/** @Component */
export class Sprite {
	alpha: number = 1;
	tint: 'none' | ColorValue = 'none';
	tintBlend: GlobalCompositeOperation = 'overlay';
	blend: GlobalCompositeOperation = 'source-over';
	anchor: SpriteAnchor = 'center';
	flipX: boolean = false;
	flipY: boolean = false;

	constructor(options: A.Compute<Partial<Omit<Sprite, 'tLeft' | 'materials'>>> = {}) {
		Object.assign(this, options);
	}
}

/** @Component */
export class Visibility {
	value: 'visible' | 'hidden' | 'inherited' = 'inherited';

	constructor(options: Partial<Visibility> = {}) {
		Object.assign(this, options);
	}
}

/** @Component */
export class GlobalVisibility {
	value: 'visible' | 'hidden' = 'visible';

	constructor(options: Partial<GlobalVisibility> = {}) {
		Object.assign(this, options);
	}
}

/** @Component */
export class Texture {
	material: Handle<ImageBitmap[]>;
	private index: number = 0;

	animating: boolean = false;
	tLeft: number = 0;
	delay: number = 100;

	get current(): number {
		return this.index;
	}

	set current(v: number) {
		this.index = Math.floor(v);
	}

	constructor(material: Handle<ImageBitmap[]>, options: A.Compute<Partial<Omit<Texture, 'material'>>> = {}) {
		this.material = material;
		Object.assign(this, options);
	}
}

/** @Bundle Sprite, Transform, GlobalTransform */
export const SpriteBundle = (comps: {
	texture: Texture;
	sprite?: Sprite;
	visibility?: Visibility;
	globalVisibility?: GlobalVisibility;
	transform?: Transform;
	globalTransform?: GlobalTransform;
}) => [
	comps.texture,
	comps.sprite ?? new Sprite(),
	comps.visibility ?? new Visibility(),
	comps.globalVisibility ?? new GlobalVisibility(),
	comps.transform ?? new Transform(),
	comps.globalTransform ?? new GlobalTransform(),
];

/** @System */
export function updateGlobalVisibility(r: Raxis) {
	const queue: Entity[] = [];

	for (const [v, gv, e] of r.query([Visibility, GlobalVisibility, Raxis.Entity], HasNoParent())) {
		gv.value = v.value === 'hidden' ? 'hidden' : 'visible';

		for (const child of e.children()) {
			queue.push(child);
		}
	}

	while (true) {
		const e = queue.shift();
		if (e === undefined) break;

		Option.all([
			e.access(Visibility),
			e.access(GlobalVisibility),
			e
				.parent()
				.map((p) => p.access(GlobalVisibility))
				.flatten(),
		]).some(([v, gv, pgv]) => {
			gv.value = v.value === 'inherited' ? pgv.value : v.value;

			for (const child of e.children()) {
				queue.push(child);
			}
		});
	}
}
