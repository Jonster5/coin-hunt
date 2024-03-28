import { Eid } from './types';

class Block {
	constructor(
		public low: number,
		public high: number
	) {}

	equals(other: Block): boolean {
		return this.low === other.low && this.high === other.high;
	}

	compare(other: Block) {
		if (this.low < other.low && this.high < other.low) return -1;
		if (other.low < this.low && other.high < this.low) return 1;
		return 0;
	}
}

export class EidAllocator {
	private blocks: Block[];
	readonly min: number = 0;
	readonly max: number = 100_000;

	constructor() {
		this.blocks = [new Block(this.min, this.max)];
	}

	use(): Eid {
		const b = this.blocks[0];
		if (!b) throw new Error('No Eids left');

		const num = b.low;

		if (++b.low > b.high) {
			this.blocks.shift();
		}

		return num as Eid;
	}

	free(eid: Eid): boolean {
		if (eid < this.min || eid > this.max) return false;
		if (this.blocks.length === 0) {
			this.blocks.push(new Block(eid, eid));
			return true;
		}

		let cbi = 0;
		while (cbi < this.blocks.length) {
			if ((this.blocks[cbi] as Block).low > eid) break;
			cbi++;
		}

		if (cbi > 0) {
			if ((this.blocks[cbi - 1] as Block).high >= eid) {
				return false;
			}

			if (eid + 1 === (this.blocks[cbi] as Block).low) {
				(this.blocks[cbi] as Block).low--;
				this.checkAndMerge(cbi);
			} else if (eid - 1 === (this.blocks[cbi - 1] as Block).high) {
				(this.blocks[cbi - 1] as Block).high++;
				this.checkAndMerge(cbi);
			} else {
				this.blocks.splice(cbi, 0, new Block(eid, eid));
			}
		} else {
			this.blocks.unshift(new Block(eid, eid));
		}

		return true;
	}

	private checkAndMerge(index: number) {
		if ((this.blocks[index - 1] as Block).high + 1 >= (this.blocks[index] as Block).low) {
			(this.blocks[index] as Block).low = (this.blocks[index - 1] as Block).low;
			this.blocks.splice(index - 1, 1);
		}
	}
}
