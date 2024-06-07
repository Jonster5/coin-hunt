import { Raxis, Sprite, SpriteBundle, Texture, Transform, Vec2, With } from "raxis";
import { MapPos, Player } from "./player";
import { GameAssets } from "./assets";

export class LavaPulseSignal {}

export class LavaGhost {
    position: Vec2

    constructor(p: Vec2) {
        this.position = p
    }
}

export class LavaMap {
	map = new Array(50).fill(0).map(() => new Array(50).fill(0))
}

function spawnLavaGhost(r: Raxis) {
    if (r.noneAvailableOf(LavaPulseSignal)) return;
    
    const pos_map = r.query([MapPos], With(Player)).expectSingle();
    const assets = r.global(GameAssets);

    const lava_pos = new Vec2(Math.floor(Math.random() * 11 - 5) + pos_map.pos.x, Math.floor(Math.random() * 11 - 5) + pos_map.pos.y).clamp(0, 49);
    r.global(LavaMap).map[lava_pos.y][lava_pos.x] = 1

    console.log(lava_pos)

    r.spawn(
        new LavaGhost(lava_pos),
        SpriteBundle({
            texture: new Texture(assets.lava),
            sprite: new Sprite({
                alpha: 1,
            }),
            transform: new Transform({
                translation: new Vec2(0,0)
            })
        })
    )
}

export const LavaPlugin = new Raxis.Builder()
    .useComponent(LavaGhost)
	.useEvent(LavaPulseSignal)
	.useUpdate(spawnLavaGhost)
    .useGlobal(LavaMap);