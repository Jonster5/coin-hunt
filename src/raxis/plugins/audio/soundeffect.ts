import { Option, none } from '../../option';

export type SoundEffectOptions = {
	/** Freqeuncy in Hz */
	frequency: number;
	attack: number;
	decay: number;
	type: OscillatorType;
	volume: number;
	pan: number;
	wait: number;
	pitchBendAmount: number;
	reverse: boolean;
	random: number;
	echo: Option<{ delay: number; feedback: number; filter: number }>;
	reverb: Option<{ duration: number; decay: number; reverse: boolean }>;
};

export const SoundEffectOptions: SoundEffectOptions = {
	frequency: 1000,
	attack: 0,
	decay: 1,
	type: 'sine',
	volume: 1,
	pan: 0,
	wait: 0,
	pitchBendAmount: 0,
	reverse: false,
	random: 0,
	echo: none,
	reverb: none,
};

export class SoundEffect {
	private ctx: AudioContext;
	private oscillatorNode: OscillatorNode;
	private volumeNode: GainNode;
	private panNode: StereoPannerNode;
	private wait: number;

	constructor(options: SoundEffectOptions) {
		this.ctx = new AudioContext({ latencyHint: 'interactive' });
		this.oscillatorNode = this.ctx.createOscillator();
		this.wait = options.wait;

		this.volumeNode = this.ctx.createGain();
		this.panNode = this.ctx.createStereoPanner();

		this.oscillatorNode.connect(this.volumeNode);
		this.volumeNode.connect(this.panNode);
		this.panNode.connect(this.ctx.destination);
		this.volumeNode.gain.value = options.volume;
		this.panNode.pan.value = options.pan;
		this.oscillatorNode.type = options.type;

		if (options.random > 0) {
			this.oscillatorNode.frequency.value =
				Math.floor(
					Math.random() *
						(options.frequency + options.random / 2 - (options.frequency - options.random / 2) + 1)
				) +
				(options.frequency - options.random / 2);
		} else {
			this.oscillatorNode.frequency.value = options.frequency;
		}

		if (options.attack > 0) {
			this.volumeNode.gain.value = 0;

			this.volumeNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + this.wait);
			this.volumeNode.gain.linearRampToValueAtTime(
				options.volume,
				this.ctx.currentTime + this.wait + options.attack
			);
		}

		if (options.decay > 0) {
			this.volumeNode.gain.linearRampToValueAtTime(
				options.volume,
				this.ctx.currentTime + this.wait + options.attack
			);
			this.volumeNode.gain.linearRampToValueAtTime(
				0,
				this.ctx.currentTime + this.wait + options.attack + options.decay
			);
		}

		if (options.pitchBendAmount > 0) {
			const f = this.oscillatorNode.frequency.value;

			this.oscillatorNode.frequency.linearRampToValueAtTime(f, this.ctx.currentTime + this.wait);
			this.oscillatorNode.frequency.linearRampToValueAtTime(
				f + (options.reverse ? -options.pitchBendAmount : options.pitchBendAmount),
				this.ctx.currentTime + this.wait + options.attack + options.decay
			);
		}

		options.echo.some((echo) => {
			const feedback = this.ctx.createGain();
			const delay = this.ctx.createDelay();
			const filter = this.ctx.createBiquadFilter();

			delay.delayTime.value = echo.delay;
			feedback.gain.value = echo.feedback;
			filter.frequency.value = echo.filter;

			delay.connect(feedback);
			if (echo.filter) {
				feedback.connect(filter);
				filter.connect(delay);
			} else {
				feedback.connect(delay);
			}

			this.volumeNode.connect(delay);
			delay.connect(this.panNode);
		});

		options.reverb.some((reverb) => {
			const length = this.ctx.sampleRate * reverb.duration;
			const impulse = this.ctx.createBuffer(2, length, this.ctx.sampleRate);
			const convolver = this.ctx.createConvolver();

			const left = impulse.getChannelData(0);
			const right = impulse.getChannelData(1);

			for (let i = 0; i < length; i++) {
				const n = reverb.reverse ? length - i : i;

				left[i] = (Math.random() * 2 - 1) * (1 - n / length) ** reverb.decay;
				right[i] = (Math.random() * 2 - 1) * (1 - n / length) ** reverb.decay;
			}

			convolver.buffer = impulse;
			this.volumeNode.connect(convolver);
			convolver.connect(this.panNode);
		});
	}

	play() {
		this.oscillatorNode.start(this.ctx.currentTime + this.wait);
	}

	stop() {
		this.oscillatorNode.stop(this.ctx.currentTime);
	}

	get volume() {
		return this.volumeNode.gain;
	}

	get pan() {
		return this.panNode.pan;
	}
}
