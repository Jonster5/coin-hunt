import { Entity, HasNoParent, Raxis, Option } from '..';
import { Vec2 } from '../structures';

export class Transform {
	readonly size: Vec2 = new Vec2();
	readonly scale: Vec2 = new Vec2(1, 1);
	readonly translation: Vec2 = new Vec2();
	layer: number = 0;
	rotation: number = 0;

	constructor(options: Partial<Transform> = {}) {
		Object.assign(this, options);
	}

	withSize(size: Vec2): Transform {
		return new Transform({ ...this, size });
	}

	withScale(scale: Vec2): Transform {
		return new Transform({ ...this, scale });
	}

	withTranslation(translation: Vec2): Transform {
		return new Transform({ ...this, translation: translation });
	}

	withLayer(layer: number): Transform {
		return new Transform({ ...this, layer });
	}

	withAngle(rotation: number): Transform {
		return new Transform({ ...this, rotation });
	}
}

export class GlobalTransform implements Transform {
	readonly size: Vec2 = new Vec2();
	readonly scale: Vec2 = new Vec2(1, 1);
	readonly translation: Vec2 = new Vec2();
	layer: number = 0;
	rotation: number = 0;

	constructor(options: Partial<GlobalTransform> = {}) {
		Object.assign(this, options);
	}

	withSize(size: Vec2): GlobalTransform {
		return new GlobalTransform({ ...this, size });
	}

	withScale(scale: Vec2): GlobalTransform {
		return new GlobalTransform({ ...this, scale });
	}

	withTranslation(translation: Vec2): GlobalTransform {
		return new GlobalTransform({ ...this, translation });
	}

	withLayer(layer: number): GlobalTransform {
		return new GlobalTransform({ ...this, layer });
	}

	withAngle(rotation: number): GlobalTransform {
		return new GlobalTransform({ ...this, rotation });
	}
}

export const TransformBundle = (args: { transform?: Transform; globalTransform?: GlobalTransform } = {}) => [
	args.transform ?? new Transform(),
	args.globalTransform ?? new GlobalTransform(),
];

function updateGlobalTransforms(r: Raxis) {
	const queue: Entity[] = [];

	for (const [t, gt, e] of r.query([Transform, GlobalTransform, Raxis.Entity], HasNoParent())) {
		gt.size.set(t.size);
		gt.scale.set(t.scale);
		gt.translation.set(t.translation);
		gt.layer = t.layer;
		gt.rotation = t.rotation;

		for (const child of e.children()) {
			queue.push(child);
		}
	}

	while (true) {
		const e = queue.shift();
		if (e === undefined) break;

		Option.all([
			e.access(Transform),
			e.access(GlobalTransform),
			e
				.parent()
				.map((p) => p.access(GlobalTransform))
				.flatten(),
		]).some(([t, gt, pgt]) => {
			gt.size.set(pgt.size.add(t.size));
			gt.scale.set(pgt.scale.mul(t.scale));
			gt.translation.set(pgt.translation.add(t.translation));
			gt.layer = pgt.layer + t.layer;
			gt.rotation = pgt.rotation + t.rotation;

			for (const child of e.children()) {
				queue.push(child);
			}
		});
	}
}

export const TransformPlugin = new Raxis.Builder()
	.useComponent(Transform)
	.useComponent(GlobalTransform)
	.useUpdate('postUpdate', updateGlobalTransforms);
