/**
 * Zero-dependency Web Audio API sound effects for EL-HABEED.
 * Synthesizes subtle tactile cybernetic clicks and audit completion chords.
 */

class SoundController {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = false;

  constructor() {
    // Sound disabled by default; can be toggled by user in header
    this.isEnabled = false;
  }

  public get enabled(): boolean {
    return this.isEnabled;
  }

  public toggle(): boolean {
    this.isEnabled = !this.isEnabled;
    if (this.isEnabled) {
      this.playBlip(600, 0.04);
    }
    return this.isEnabled;
  }

  private initContext() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public playClick() {
    if (!this.isEnabled) return;
    this.playBlip(440, 0.03, "sine", 0.05);
  }

  public playKeySelect() {
    if (!this.isEnabled) return;
    this.playBlip(880, 0.05, "triangle", 0.08);
  }

  public playSuccess() {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.08, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.16);
    });
  }

  private playBlip(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.05) {
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy fallback
    }
  }
}

export const sfx = new SoundController();
