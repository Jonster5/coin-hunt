import { Vec2 } from '../../../structures';
import { A } from 'ts-toolbelt';
import { Camera2d } from '../camera';
import { AssetLoader, AssetStore, Handle } from '../../assets';
import { Renderer } from './renderer';

export type ImageAssetSrc =
	| [string, ...string[]]
	| { url: string; amount: number; offset?: number; width: number; height: number; scale?: number };

export class CanvasRenderer implements AssetLoader<ImageAssetSrc, ImageBitmap[]>, Renderer {
	element: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private buffer: OffscreenCanvas;
	private bx: OffscreenCanvasRenderingContext2D;
	private store: AssetStore<ImageBitmap[]> = new AssetStore();

	constructor(
		options: A.Compute<
			Omit<Partial<CanvasRenderer>, 'loadAsset' | 'render'> & {
				target: HTMLElement;
				width: number;
				height: number;
				class?: string;
				style?: string;
			},
			'flat'
		>
	) {
		const dpr = window.devicePixelRatio;

		this.element = options.element ?? document.createElement('canvas');
		this.element.width = Math.floor(options.width * dpr);
		this.element.height = Math.floor(options.height * dpr);

		this.ctx = this.element.getContext('2d') as CanvasRenderingContext2D;
		this.ctx.scale(dpr, dpr);

		this.element.setAttribute('class', options.class ?? '');
		this.element.setAttribute(
			'style',
			options.style ?? 'width: 100%; height: 100%; margin: none; image-rendering: crisp-edges'
		);

		options.target.appendChild(this.element);

		this.buffer = new OffscreenCanvas(0, 0);
		this.bx = this.buffer.getContext('2d') as OffscreenCanvasRenderingContext2D;
	}

	async loadAsset(src: ImageAssetSrc): Promise<Handle<ImageBitmap[]>> {
		const images = [];

		if (Array.isArray(src)) {
			for await (const blob of src.map((s) => fetch(s).then((s) => s.blob()))) {
				images.push(await createImageBitmap(blob));
			}
		} else {
			const blob = await fetch(src.url).then((s) => s.blob());
			for (let i = src.offset ?? 0; i < src.amount + (src.offset ?? 0); i++) {
				images.push(
					await createImageBitmap(blob, src.width * i, 0, src.width, src.height, {
						resizeWidth: src.scale ?? 1,
						resizeHeight: src.scale ?? 1,
						resizeQuality: 'pixelated',
					})
				);
			}
		}

		return this.store.addAsset(images);
	}

	render(camera: Camera2d) {
		const list = camera.getObjectsFromCurrentFrame();

		const elementSize = new Vec2(this.element.width, this.element.height);

		if (camera.clear === 'transparent') {
			this.ctx.clearRect(0, 0, this.element.width, this.element.height);
		} else {
			this.ctx.fillStyle = camera.clear;
			this.ctx.fillRect(0, 0, this.element.width, this.element.height);
		}

		for (const data of list) {
			const renderPos = data.viewPos.mul(elementSize);
			const renderSize = data.viewSize.mul(elementSize);
			const renderScale = data.viewScale;
			const rangle = data.viewRot;

			this.ctx.save();
			this.ctx.translate(elementSize.x / 2 + renderPos.x, elementSize.y / 2 - renderPos.y);
			this.ctx.rotate(rangle);
			this.ctx.scale(renderScale.x * (data.flipX ? -1 : 1), renderScale.y * (data.flipY ? -1 : 1));

			this.ctx.globalAlpha = data.alpha;
			this.ctx.globalCompositeOperation = data.blend;

			if (!data.skipRender) {
				const list = this.store.getAsset(data.textureAsset);
				const texture = list.at((data.textureIndex | 1) % list.length) as ImageBitmap;

				if (data.tint !== 'none') {
					this.buffer.width = texture.width;
					this.buffer.height = texture.height;
					this.bx.clearRect(0, 0, texture.width, texture.height);

					this.bx.drawImage(texture, 0, 0);
					this.bx.fillStyle = data.tint;
					this.bx.globalCompositeOperation = data.tintBlend;
					this.bx.fillRect(0, 0, this.buffer.width, this.buffer.height);
					this.bx.globalCompositeOperation = 'destination-in';
					this.bx.drawImage(texture, 0, 0);

					this.ctx.drawImage(
						this.buffer,
						-renderSize.width / 2,
						-renderSize.height / 2,
						renderSize.width,
						renderSize.height
					);
				} else {
					this.ctx.drawImage(
						texture,
						-renderSize.width / 2,
						-renderSize.height / 2,
						renderSize.width,
						renderSize.height
					);
				}
			}

			this.ctx.restore();
		}
	}
}
