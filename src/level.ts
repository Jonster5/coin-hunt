import { Raxis, SpriteBundle, SystemTimer, Texture, Transform, Vec2, With } from 'raxis';
import { MovePlayerSignal, SpawnPlayerSignal } from './player';
import { GameAssets } from './assets';
import { LavaPulseSignal } from './lava';


export class LevelDifficultyTracker {
	difficulty = 1;
	seed = 1;
}

export class LevelMusicSync {
	tempo = 120;
	bpm = 4;
	current_beat: 0
}

export class LevelSprite {}

export class Level {}

export class CollisionMap {
	map = new Array(50).fill(0).map(() => new Array(50).fill(0))
}

export class ClearLevelSignal {}
export class CreateNextLevelSignal {}

interface PerlinSettings {
    scale: number;
	rotation: number

	seed: number;
	octaves: number
	lacunarity: number
	contribution_factor: number
}

export class PerlinNoise implements PerlinSettings {
    scale = 0.07;
	rotation = 0;
	
	seed = 0;
	octaves = 4;
	lacunarity = 0.6;
	contribution_factor = 0.5;
}

const sserp = (a: number, b: number, x: number) => (b - a) * ((x * (x * 6 - 15) + 10) * x * x * x) + a;
const randomUnit = (uv: Vec2, seed: number) => new Vec2(Math.cos(((Math.sin(uv.dot(new Vec2(12.9898,78.233))+seed)*43758.5453123) % 1) * Math.PI * 2), Math.sin(((Math.sin(uv.dot(new Vec2(12.9898,78.233))+seed)*43758.5453123) % 1) * Math.PI * 2))
const mod = (n: number, d: number) => ((n % d) + d) % d;

function rotate(uv: Vec2, theta: number, noise: PerlinNoise) {
    const center = uv.clone().sub(noise.scale/2);
    return new Vec2(center.x * Math.cos(theta) - center.y * Math.sin(theta), center.x * Math.sin(theta) + center.y * Math.cos(theta));
}

function getAt(uv: Vec2, seed: number) {
    const pos = uv.clone()
    const TL = pos.clone().floor()
    const TR = new Vec2(Math.ceil(pos.x), Math.floor(pos.y))
    const BL = new Vec2(Math.floor(pos.x), Math.ceil(pos.y))
    const BR = pos.clone().ceil()

    const t = sserp(
        randomUnit(TL, seed).dot(pos.clone().sub(TL)),
        randomUnit(TR, seed).dot(pos.clone().sub(TR)),
        mod(pos.x, 1)
    )

    const b = sserp(
        randomUnit(BL, seed).dot(pos.clone().sub(BL)),
        randomUnit(BR, seed).dot(pos.clone().sub(BR)),
        mod(pos.x, 1)
    )

    return sserp(t, b, mod(pos.y, 1))+0.5
}

function fbm(noise: PerlinNoise, uv: Vec2) {
    let pos = rotate(uv.clone().mul(noise.scale), noise.rotation, noise)
    let sum = 0;
    let contribution = 0.5;
    for (let i = 0; i < noise.octaves; i++) {
        sum += getAt(pos, noise.seed) * contribution;
        pos = pos.div(noise.lacunarity);
        contribution *= noise.contribution_factor
        pos = rotate(pos, 1.2, noise)
    }

    return sum
}

function createNextLevel(r: Raxis) {
	if (r.noneAvailableOf(CreateNextLevelSignal)) return;

	const assets = r.global(GameAssets)

	r.spawn(
		new Level(),
		new LevelSprite(),
		new LevelMusicSync(),
		SpriteBundle({
			texture: new Texture(assets.map_image),
			transform: new Transform( {layer: -2, size: new Vec2(2500, 2500), translation: new Vec2(25, 25)})
		})
	)

	const ctx = assets['map_canvas'].getContext('2d')

	for (let i = 0; i < 50; i++) {
		for (let j = 0; j < 50; j++) {
			let val = fbm(r.global(PerlinNoise), new Vec2(j,i));
			if (val < 0.33) {
				ctx.drawImage(assets['textures']['lake'][Math.floor(Math.random() * 10) * 4], 50*j,50*i,50,50)
			} else if (Math.random() < 0.1) {
				ctx.drawImage(assets['textures']['leaves'][Math.floor(Math.random() * 10)], 50*j,50*i,50,50)
				r.global(CollisionMap).map[i][j] = 1
			} else {
				console.log((assets['textures']['grass']))
				ctx.drawImage(assets['textures']['grass'][Math.floor(Math.random() * 10)], 50*j,50*i,50,50)
				//return '#00' + Math.floor(300 - val * 256).toString(16).padStart(2, '0') + '00'
			}
		}
	}
	
	r.dispatch(new SpawnPlayerSignal());
}

function MusicTick(r: Raxis) {
	if (SystemTimer.check(r)) return;

	const level_music = r.query([LevelMusicSync], With(Level)).expectSingle();
	level_music.current_beat++;
	if (level_music.current_beat == level_music.bpm) level_music.current_beat = 0;

	r.dispatch(new MovePlayerSignal)
	r.dispatch(new LavaPulseSignal)

	SystemTimer.set(r, 1000 * 60 / level_music.tempo)
}


export const LevelPlugin = new Raxis.Builder()
	.useComponent(LevelSprite)
	.useComponent(Level)
	.useComponent(LevelMusicSync)
	.useGlobal(LevelDifficultyTracker)
	.useEvent(ClearLevelSignal)
	.useEvent(CreateNextLevelSignal)
	.useGlobal(CollisionMap)
	.useUpdate('preUpdate', createNextLevel)
	.useUpdate(MusicTick)
	.useGlobal(PerlinNoise);