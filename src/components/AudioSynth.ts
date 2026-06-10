// Web Audio API Synthesizer for retro sounds and cyberpunk blips
class AudioSynth {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      // @ts-ignore
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // Play a military terminal warning alarm (Page 1)
  public playWarningAlert() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Play two alarm blips
    const playBlip = (startTime: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(880, startTime);
      osc.frequency.exponentialRampToValueAtTime(110, startTime + 0.35);

      gain.gain.setValueAtTime(0.08, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.4);
    };

    playBlip(now);
    playBlip(now + 0.25);
    playBlip(now + 0.5);
  }

  // Play a small terminal typewriter click (Page 2, 3)
  public playTypewriterClick() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    // Slight random pitch for realism
    const freq = 1200 + Math.random() * 400;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.015, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  // Play an 'Access Granted' digital chime (Page 3 transition)
  public playAccessGrantedChime() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C major arpeggio
    
    notes.forEach((freq, index) => {
      if (!this.ctx) return;
      const startTime = now + index * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.0, startTime);
      gain.gain.linearRampToValueAtTime(0.05, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }

  // Play romantic dream transition swoop (Page 4)
  public playDreamTransitionSwoop() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 1.2);

    filter.type = "peaking";
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(2000, now + 1.2);
    filter.Q.setValueAtTime(5, now);

    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 1.6);
  }

  // Play a soft magic twinkle for the final YES click (Page 8)
  public playProposalSuccessMagic() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 2.0;

    // We can play multiple high frequency notes over time to simulate magic sparkles
    for (let i = 0; i < 25; i++) {
      const startTime = now + Math.random() * duration;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      const freq = 800 + Math.random() * 2000;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.0, startTime);
      gain.gain.linearRampToValueAtTime(0.03, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.45);
    }
  }

  private musicInterval: any = null;

  public startBackgroundMusic() {
    this.init();
    if (!this.ctx) return;
    if (this.musicInterval) return; // Already running

    let beat = 0;
    const tempo = 0.6; // Seconds per note (100 BPM)
    const chords = [
      [261.63, 329.63, 392.00, 523.25], // C major arpeggio
      [196.00, 246.94, 293.66, 392.00], // G major arpeggio
      [220.00, 261.63, 329.63, 440.00], // A minor arpeggio
      [174.61, 220.00, 261.63, 349.23], // F major arpeggio
    ];

    const playNote = () => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const chordIndex = Math.floor(beat / 4) % chords.length;
      const noteIndex = beat % 4;
      const freq = chords[chordIndex][noteIndex];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Soft triangle wave for flute-like warm romantic sounds
      osc.type = "triangle"; 
      osc.frequency.setValueAtTime(freq, now);

      // Mellow filter cutoff
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1000, now);

      // Very soft gain level
      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.015, now + 0.1); // Soft attack
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2); // Soft release

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.4);

      beat++;
    };

    // Play first note
    playNote();
    this.musicInterval = setInterval(playNote, tempo * 1000);
  }

  public stopBackgroundMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  // Play a sweet chime pitch for caught game items
  public playCatchChime(index: number) {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Pentatonic scale starting at C5 for sweet harmonic feedback
    const scale = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51, 1567.98, 1760.00];
    const freq = scale[Math.min(index, scale.length - 1)];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }
}

export const synth = new AudioSynth();
