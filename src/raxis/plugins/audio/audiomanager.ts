import { AssetLoader, Handle } from '../assets';
import { SoundEffectOptions, SoundEffect } from './soundeffect';

export type AudioAssetSrc = { type: 'file'; src: string } | { type: 'effect'; options: SoundEffectOptions };

/** @Global */
export class AudioManager implements AssetLoader<AudioAssetSrc, SoundEffect | AudioPlayer> {
	loadAsset({ type, src }: SoundEffectOptions): Promise<Handle<string>> {
		throw new Error('Method not implemented.');
	}

	getEffect(name: string): SoundEffect;
}
