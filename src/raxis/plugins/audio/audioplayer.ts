import { Option, none, some } from '../../option';

export type AudioPlayerOptions = {
	playbackRate: number;
	loop: boolean;
	startTime: number;
	startOffset: number;

	echo: Option<{ feedback: number; delay: number; filter: number }>;
	reverb: Option<{ duration: number; decay: number; reverse: boolean }>;
};

export class AudioPlayer {
	ctx: AudioContext = new AudioContext();

	private soundNode: AudioBufferSourceNode;
	private volumeNode: GainNode;
	private panNode: StereoPannerNode;
	private convolverNode: ConvolverNode;
	private delayNode: DelayNode;
	private feedbackNode: GainNode;
	private filterNode: BiquadFilterNode;

	private playing: boolean = false;
	private playbackRate: number;
	private startTime: number;
	private startOffset: number;
	loop: boolean;

	private echo: Option<{ feedback: number; delay: number; filter: number }> = none;
	private reverb: Option<AudioBuffer>;

	constructor(private buffer: AudioBuffer, options: AudioPlayerOptions) {
		this.ctx = new AudioContext();
		this.soundNode = this.ctx.createBufferSource();
		this.volumeNode = this.ctx.createGain();
		this.panNode = this.ctx.createStereoPanner();
		this.convolverNode = this.ctx.createConvolver();
		this.delayNode = this.ctx.createDelay();
		this.feedbackNode = this.ctx.createGain();
		this.filterNode = this.ctx.createBiquadFilter();

		this.playbackRate = options.playbackRate;
		this.startTime = options.startTime;
		this.startOffset = options.startOffset;
		this.loop = options.loop;

		this.echo = options.echo;
		this.reverb = options.reverb.map(({ duration, decay, reverse }) => {
			const length = this.ctx.sampleRate * duration;
			const impulse = this.ctx.createBuffer(2, length, this.ctx.sampleRate);

			const left = impulse.getChannelData(0);
			const right = impulse.getChannelData(1);

			for (let i = 0; i < length; i++) {
				const n = reverse ? length - i : i;

				left[i] = (Math.random() * 2 - 1) * (1 - n / length) ** decay;
				right[i] = (Math.random() * 2 - 1) * (1 - n / length) ** decay;
			}

			return impulse;
		});
	}

	play() {
		if (this.playing) return;

		this.startTime = this.ctx.currentTime;

		this.soundNode = this.ctx.createBufferSource();
		this.soundNode.buffer = this.buffer;

		this.soundNode.connect(this.volumeNode);

		this.reverb
			.some((buffer) => {
				this.volumeNode.connect(this.convolverNode);
				this.convolverNode.connect(this.panNode);
				this.convolverNode.buffer = buffer;
			})
			.none(() => this.volumeNode.connect(this.panNode));

		this.panNode.connect(this.ctx.destination);

		this.echo.some(({ feedback, delay, filter }) => {
			this.feedbackNode.gain.value = feedback;
			this.delayNode.delayTime.value = delay;
			this.filterNode.frequency.value = filter;
			this.delayNode.connect(this.feedbackNode);
			if (filter > 0) {
				this.feedbackNode.connect(this.filterNode);
				this.filterNode.connect(this.delayNode);
			} else {
				this.feedbackNode.connect(this.delayNode);
			}
			this.volumeNode.connect(this.delayNode);
			this.delayNode.connect(this.panNode);
		});

		this.soundNode.loop = this.loop;
		this.soundNode.playbackRate.value = this.playbackRate;

		this.soundNode.start(this.startTime, this.startOffset % this.buffer.duration);
		this.playing = true;
	}

	playFrom(t: number) {
		if (this.playing) this.soundNode.stop(this.ctx.currentTime);

		this.startOffset = t;
		this.play();
	}

	pause() {
		if (!this.playing) return;

		this.soundNode.stop(this.ctx.currentTime);
		this.startOffset += this.ctx.currentTime - this.startTime;
		this.playing = false;

		return this.startOffset;
	}

	restart() {
		if (this.playing) this.soundNode.stop(this.ctx.currentTime);

		this.startOffset = 0;
		this.startTime = 0;
		this.play();
	}

	setEcho(options: Option<{ delay: number; feedback: number; filter: number }>) {
		this.echo = options;
	}

	setReverbOptions(options: Option<{ duration: number; decay: number; reverse: boolean }>) {
		options
			.some(({ duration, decay, reverse }) => {
				const length = this.ctx.sampleRate * duration;
				const impulse = this.ctx.createBuffer(2, length, this.ctx.sampleRate);

				const left = impulse.getChannelData(0);
				const right = impulse.getChannelData(1);

				for (let i = 0; i < length; i++) {
					const n = reverse ? length - i : i;

					left[i] = (Math.random() * 2 - 1) * (1 - n / length) ** decay;
					right[i] = (Math.random() * 2 - 1) * (1 - n / length) ** decay;
				}

				this.reverb = some(impulse);
			})
			.none(() => (this.reverb = none));
	}

	get volume() {
		return this.volumeNode.gain.value;
	}

	set volume(v: number) {
		this.volumeNode.gain.value = v;
	}

	get pan() {
		return this.panNode.pan.value;
	}

	set pan(v: number) {
		this.panNode.pan.value = v;
	}
}
