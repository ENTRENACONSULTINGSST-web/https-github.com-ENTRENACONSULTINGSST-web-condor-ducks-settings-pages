/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  setMute(isMuted: boolean) {
    this.muted = isMuted;
  }

  isMuted() {
    return this.muted;
  }

  // Quick helper to play sound
  private playWithNodes(generator: (ctx: AudioContext, destination: AudioNode) => void) {
    if (this.muted) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;
      generator(ctx, ctx.destination);
    } catch (e) {
      console.warn('Audio Context error:', e);
    }
  }

  playShot() {
    this.playWithNodes((ctx, dest) => {
      // Noise/sharp decay for firearm/airgun gunshot shot sound
      const bufferSize = ctx.sampleRate * 0.08; // 80ms
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1000, ctx.currentTime);
      filter.Q.setValueAtTime(5, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      // Add a high click transient
      const clickOsc = ctx.createOscillator();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(2200, ctx.currentTime);
      clickOsc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.02);

      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(0.3, ctx.currentTime);
      clickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);

      clickOsc.connect(clickGain);
      clickGain.connect(dest);

      noiseNode.start();
      clickOsc.start();
      noiseNode.stop(ctx.currentTime + 0.08);
      clickOsc.stop(ctx.currentTime + 0.03);
    });
  }

  playPop(balloonColor: string) {
    this.playWithNodes((ctx, dest) => {
      // Sweeping frequency bubble pop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Color maps to slight pitch shifts for variety
      let baseFreq = 400;
      if (balloonColor === '#ff4d4d') baseFreq = 380; // Red (deeper)
      if (balloonColor === '#ffd24d') baseFreq = 510; // Yellow (pitch)
      if (balloonColor === '#66ff66') baseFreq = 440; // Green
      if (balloonColor === '#4dd2ff') baseFreq = 480; // Blue
      if (balloonColor === '#ff66ff') baseFreq = 540; // Purple (higher)

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      // Fast drop down
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(dest);

      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    });
  }

  playClockExtra() {
    this.playWithNodes((ctx, dest) => {
      // Beautiful shiny time chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.3);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(dest);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.45);
      osc2.stop(ctx.currentTime + 0.45);
    });
  }

  playCondorHit() {
    this.playWithNodes((ctx, dest) => {
      // Deep ominous metallic screech for condor strike
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(450, ctx.currentTime + 0.2);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.82);

      osc2.type = 'square';
      osc2.frequency.setValueAtTime(95, ctx.currentTime);
      osc2.frequency.linearRampToValueAtTime(15, ctx.currentTime + 0.7);

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.85);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(dest);

      osc.start();
      osc2.start();
      osc.stop(ctx.currentTime + 0.9);
      osc2.stop(ctx.currentTime + 0.9);
    });
  }

  playStart() {
    this.playWithNodes((ctx, dest) => {
      // Arpeggio up for coin star insert
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      const noteDuration = 0.08;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * noteDuration);

        gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * noteDuration);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * noteDuration + 0.15);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(ctx.currentTime + idx * noteDuration);
        osc.stop(ctx.currentTime + idx * noteDuration + 0.2);
      });
    });
  }

  playGameOver() {
    this.playWithNodes((ctx, dest) => {
      // Retro sad down-cascade
      const notes = [659.25, 587.33, 440.00, 349.23, 293.66, 196.00];
      const noteDuration = 0.14;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * noteDuration);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.7, ctx.currentTime + idx * noteDuration + 0.2);

        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * noteDuration);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * noteDuration + 0.25);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(ctx.currentTime + idx * noteDuration);
        osc.stop(ctx.currentTime + idx * noteDuration + 0.3);
      });
    });
  }

  playLowTime(isLastSeconds: boolean) {
    this.playWithNodes((ctx, dest) => {
      // Warning sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isLastSeconds ? 1200 : 700, ctx.currentTime);

      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(dest);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    });
  }

  playRecord() {
    this.playWithNodes((ctx, dest) => {
      // Uplifting scale for new record
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
      const noteDur = 0.06;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * noteDur);

        gain.gain.setValueAtTime(0.06, ctx.currentTime + idx * noteDur);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * noteDur + 0.2);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(ctx.currentTime + idx * noteDur);
        osc.stop(ctx.currentTime + idx * noteDur + 0.25);
      });
    });
  }
}

export const sound = new SoundEngine();
