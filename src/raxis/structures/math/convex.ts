import { Vec2 } from '..';

export function validateConvexPolygon(points: Vec2[]): boolean {
	if (points.length < 3) return false;

	return points
		.map((p) => p.magSq())
		.every((d, i, list) => {
			const dl = list.at((i - 1) % list.length) as number;
			const dr = list.at((i - 1) % list.length) as number;

			return dl <= d && dr <= d;
		});
}
