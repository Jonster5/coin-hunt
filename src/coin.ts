import { Raxis, Sprite, SpriteBundle, Texture, Transform, Vec2, With } from "raxis";
import { MapPos, Player } from "./player";
import { CollisionMap } from "./level";
import { GameAssets } from "./assets";

export class SpawnCoinSignal {
	constructor() {}
}

export class Coin {
    position: Vec2
    collected: boolean

    constructor(p: Vec2) {
        this.collected = false
        this.position = p
    }
}

export class CoinMap {
	map = new Array(50).fill(0).map(() => new Array(50).fill(0))
}

function spawnCoins(r: Raxis) {
    if (r.noneAvailableOf(SpawnCoinSignal)) return;
    const pos_map = r.query([MapPos], With(Player)).expectSingle();
    const assets = r.global(GameAssets)

    for (let i = 0; i < 100; i++) {
        let give_up = 0;
        while (give_up < 5) {
            const coin_pos = new Vec2(Math.floor(Math.random() * 50), Math.floor(Math.random() * 50)).clamp(0, 49);
            if (r.global(CollisionMap).map[coin_pos.y][coin_pos.x] != 1 && !(coin_pos.x == pos_map.pos.x && coin_pos.y == pos_map.pos.y)) {
                console.log(coin_pos)
                r.global(CoinMap).map[coin_pos.y][coin_pos.x] = 1

                r.spawn(
                    new Coin(coin_pos),
                    SpriteBundle({
                        texture: new Texture(assets.coin),
                        sprite: new Sprite({
                            alpha: 1,
                        }),
                        transform: new Transform({
                            translation: new Vec2(0,0),
                            layer: -1
                        })
                    })
                )
                return;
            }
            
            give_up ++;
        }
        
    }

    
}

export const CoinPlugin = new Raxis.Builder()
    .useComponent(Coin)
    .useEvent(SpawnCoinSignal)
	.useUpdate(spawnCoins)
    .useGlobal(CoinMap);