import { Raxis } from '../..';
import { GlobalTransform, Transform } from '../transform';
import { GlobalVisibility, Sprite, Texture } from '.';
import { ColorValue, Vec2 } from '../../structures';
import { Handle } from '../assets';

export type RenderData = {
	type: 'sprite';
	viewPos: Vec2;
	viewSize: Vec2;
	viewScale: Vec2;
	viewRot: number;
	textureAsset: Handle<ImageBitmap[]>;
	textureIndex: number;
	flipX: boolean;
	flipY: boolean;
	tint: string;
	tintBlend: GlobalCompositeOperation;
	blend: GlobalCompositeOperation;
	alpha: number;
	skipRender: boolean;
};

export class Camera2d {
	clear: 'transparent' | ColorValue = 'transparent';
	active: boolean = true;
	near: number = -100;
	far: number = 100;

	private objects: RenderData[] = [];

	getObjectsFromCurrentFrame(): Iterable<RenderData> {
		return this.objects;
	}

	resetFrame() {
		this.objects = [];
	}

	createObject([sprite, tex, gt, gv]: [Sprite, Texture, GlobalTransform, GlobalVisibility], cgt: GlobalTransform) {
		const obj: RenderData = {
			type: 'sprite',
			viewPos: gt.translation.sub(cgt.translation).div(cgt.size),
			viewSize: gt.size.div(cgt.size),
			viewScale: gt.scale.mul(cgt.scale),
			viewRot: gt.rotation - cgt.rotation,
			textureAsset: tex.material,
			textureIndex: tex.current,
			flipX: sprite.flipX,
			flipY: sprite.flipY,
			tint: sprite.tint,
			tintBlend: sprite.tintBlend,
			blend: sprite.blend,
			alpha: sprite.alpha,
			skipRender: gv.value === 'hidden',
		};

		this.objects.push(obj);
	}

	constructor(options: Partial<Camera2d> = {}) {
		Object.assign(this, options);
	}
}

export const Camera2dBundle = (
	options: {
		camera2d?: Camera2d;
		transform?: Transform;
		globalTransform?: GlobalTransform;
	} = {}
) => [
	options.camera2d ?? new Camera2d(),
	options.transform ?? new Transform(),
	options.globalTransform ?? new GlobalTransform(),
];

function aabbTest(p1: Vec2, s1: Vec2, p2: Vec2, s2: Vec2): boolean {
	const distance = p1.sub(p2);
	const combinedSizes = s1.div(2).add(s2.div(2));
	return Math.abs(distance.x) < combinedSizes.width && Math.abs(distance.y) < combinedSizes.height;
}

export function validateSprites(r: Raxis) {
	for (const [camera, cgt] of r.query([Camera2d, GlobalTransform])) {
		camera.resetFrame();
		const entitiesInFrame: [Sprite, Texture, GlobalTransform, GlobalVisibility][] = [];
		for (const [sprite, tex, gt, gv] of r.query([Sprite, Texture, GlobalTransform, GlobalVisibility])) {
			const isOverlapping = aabbTest(cgt.translation, cgt.size.mul(2), gt.translation, gt.size.mul(2));
			const isNotTooClose = cgt.layer + camera.near < gt.layer;
			const isNotTooFar = cgt.layer + camera.far > gt.layer;

			if (isOverlapping && isNotTooClose && isNotTooFar) {
				entitiesInFrame.push([sprite, tex, gt, gv]);
			}
		}
		entitiesInFrame.sort(([, , a], [, , b]) => a.layer - b.layer);

		for (const item of entitiesInFrame) {
			camera.createObject(item, cgt);
		}
	}
}
