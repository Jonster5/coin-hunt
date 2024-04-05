export function linear(x: number): number {
	return x;
}

export function sineIn(x: number): number {
	return 1 - Math.cos((x * Math.PI) / 2);
}

export function sineOut(x: number): number {
	return Math.sin((x * Math.PI) / 2);
}

export function sineInOut(x: number): number {
	return -(Math.cos(Math.PI * x) - 1) / 2;
}

export function quadIn(x: number): number {
	return x * x;
}

export function quadOut(x: number): number {
	return 1 - (1 - x) * (1 - x);
}

export function quadInOut(x: number): number {
	return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

export function cubicIn(x: number): number {
	return x * x * x;
}

export function cubicOut(x: number): number {
	return 1 - Math.pow(1 - x, 3);
}

export function cubicInOut(x: number): number {
	return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function quartIn(x: number): number {
	return x * x * x * x;
}

export function quartOut(x: number): number {
	return 1 - Math.pow(1 - x, 4);
}

export function quartInOut(x: number): number {
	return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
}

export function quintIn(x: number): number {
	return x * x * x * x * x;
}

export function quintOut(x: number): number {
	return 1 - Math.pow(1 - x, 5);
}

export function quintInOut(x: number): number {
	return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
}

export function expoIn(x: number): number {
	return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
}

export function expoOut(x: number): number {
	return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

export function expoInOut(x: number): number {
	return x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2;
}

export function circIn(x: number): number {
	return 1 - Math.sqrt(1 - Math.pow(x, 2));
}

export function circOut(x: number): number {
	return Math.sqrt(1 - Math.pow(x - 1, 2));
}

export function circInOut(x: number): number {
	return x < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
}

export function backIn(x: number): number {
	const c1 = 1.70158;
	const c3 = c1 + 1;

	return c3 * x * x * x - c1 * x * x;
}

export function backOut(x: number): number {
	const c1 = 1.70158;
	const c3 = c1 + 1;

	return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

export function backInOut(x: number): number {
	const c1 = 1.70158;
	const c2 = c1 * 1.525;

	return x < 0.5
		? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
		: (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
}

export function elasticIn(x: number): number {
	const c4 = (2 * Math.PI) / 3;

	return x === 0 ? 0 : x === 1 ? 1 : -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * c4);
}

export function elasticOut(x: number): number {
	const c4 = (2 * Math.PI) / 3;

	return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

export function elasticInOut(x: number): number {
	const c5 = (2 * Math.PI) / 4.5;

	return x === 0
		? 0
		: x === 1
		? 1
		: x < 0.5
		? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2
		: (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1;
}

export function bounceIn(x: number): number {
	return 1 - bounceOut(1 - x);
}

export function bounceOut(x: number): number {
	const n1 = 7.5625;
	const d1 = 2.75;

	if (x < 1 / d1) {
		return n1 * x * x;
	} else if (x < 2 / d1) {
		return n1 * (x -= 1.5 / d1) * x + 0.75;
	} else if (x < 2.5 / d1) {
		return n1 * (x -= 2.25 / d1) * x + 0.9375;
	} else {
		return n1 * (x -= 2.625 / d1) * x + 0.984375;
	}
}

export function bounceInOut(x: number): number {
	return x < 0.5 ? (1 - bounceOut(1 - 2 * x)) / 2 : (1 + bounceOut(2 * x - 1)) / 2;
}
