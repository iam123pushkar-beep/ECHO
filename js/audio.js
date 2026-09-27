/**
 * ECHO - Procedural Web Audio API Sound Engine
 * Synthesizes futuristic sci-fi sound effects, ambient facility hum, footsteps, and warnings
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterVolume = 0.8;
    this.sfxVolume = 0.8;
    this.ambientVolume = 0.65;

    this.masterGain = null;
    this.sfxGain = null;
    this.ambientGain = null;

    this.ambientOsc1 = null;
    this.ambientOsc2 = null;
    this.ambientHumOsc = null;
    this.ambientFilter = null;
    this.isInitialized = false;

    // Footstep throttling
    this.lastFootstepTime = 0;

    // Proximity warning throttling
    this.lastProximityPingTime = 0;

    // Load saved settings
    try {
      const savedMute = localStorage.getItem('echo_game_muted');
      if (savedMute !== null) this.isMuted = JSON.parse(savedMute);

      const savedMaster = localStorage.getItem('echo_master_vol');
      if (savedMaster !== null) this.masterVolume = parseFloat(savedMaster);

      const savedSfx = localStorage.getItem('echo_sfx_vol');
      if (savedSfx !== null) this.sfxVolume = parseFloat(savedSfx);

      const savedAmb = localStorage.getItem('echo_amb_vol');
      if (savedAmb !== null) this.ambientVolume = parseFloat(savedAmb);
    } catch (e) {}
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Gain Node
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX Gain Node
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Ambient Gain Node
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.ambientVolume * 0.09, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.isInitialized = true;
      this.startAmbient();
    } catch (err) {
      console.warn('Web Audio API not supported or blocked:', err);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('echo_game_muted', JSON.stringify(this.isMuted));
    } catch (e) {}

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    try { localStorage.setItem('echo_master_vol', this.masterVolume.toString()); } catch (e) {}
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }
  }

  setSfxVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    try { localStorage.setItem('echo_sfx_vol', this.sfxVolume.toString()); } catch (e) {}
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  setAmbientVolume(val) {
    this.ambientVolume = Math.max(0, Math.min(1, val));
    try { localStorage.setItem('echo_amb_vol', this.ambientVolume.toString()); } catch (e) {}
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(this.ambientVolume * 0.09, this.ctx.currentTime);
    }
  }

  // 1. Ambient Facility Rumble + 60Hz Electrical Hum
  startAmbient() {
    if (!this.ctx || this.ambientOsc1) return;

    try {
      const now = this.ctx.currentTime;

      this.ambientFilter = this.ctx.createBiquadFilter();
      this.ambientFilter.type = 'lowpass';
      this.ambientFilter.frequency.setValueAtTime(160, now);

      // Deep drone osc 1 (55Hz - A1)
      this.ambientOsc1 = this.ctx.createOscillator();
      this.ambientOsc1.type = 'sawtooth';
      this.ambientOsc1.frequency.setValueAtTime(55, now);

      // Detuned sub osc 2 (54.2Hz for subtle binaural beating)
      this.ambientOsc2 = this.ctx.createOscillator();
      this.ambientOsc2.type = 'sine';
      this.ambientOsc2.frequency.setValueAtTime(54.2, now);

      // Electrical Hum (60Hz with lowpass filter)
      this.ambientHumOsc = this.ctx.createOscillator();
      this.ambientHumOsc.type = 'triangle';
      this.ambientHumOsc.frequency.setValueAtTime(60, now);

      const humGain = this.ctx.createGain();
      humGain.gain.setValueAtTime(0.35, now);

      this.ambientOsc1.connect(this.ambientFilter);
      this.ambientOsc2.connect(this.ambientFilter);
      this.ambientFilter.connect(this.ambientGain);

      this.ambientHumOsc.connect(humGain);
      humGain.connect(this.ambientGain);

      this.ambientOsc1.start();
      this.ambientOsc2.start();
      this.ambientHumOsc.start();
    } catch (e) {
      console.warn('Ambient drone start error:', e);
    }
  }

  // 2. Operative Footstep (Subtle metallic boot tap)
  playFootstep() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - this.lastFootstepTime < 0.22) return;
    this.lastFootstepTime = now;
    this.resume();

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(260 + Math.random() * 80, now);
      filter.Q.setValueAtTime(3.0, now);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 + Math.random() * 30, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.05);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }

  // 3. Orb Collection (Crystalline harmonic chime)
  playOrbCollect(orbIndex = 0) {
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // Pentatonic progression C5-E6
    const baseFreq = freqs[Math.min(orbIndex, freqs.length - 1)];

    // Primary crystal chime
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.18);

    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain1);
    gain1.connect(this.sfxGain || this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);

    // Harmonic overtone sparkle
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(baseFreq * 2.0, now + 0.04);
    osc2.frequency.exponentialRampToValueAtTime(baseFreq * 2.5, now + 0.25);

    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.15, now + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc2.connect(gain2);
    gain2.connect(this.sfxGain || this.ctx.destination);
    osc2.start(now + 0.04);
    osc2.stop(now + 0.4);
  }

  // 4. Switch Activation (Mechanical latch + electronic pulse)
  playSwitchActivate(type = 'player') {
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;

    // Relay mechanical click
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(1200, now);
    clickGain.gain.setValueAtTime(0.12, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    clickOsc.connect(clickGain);
    clickGain.connect(this.sfxGain || this.ctx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.04);

    // Resonant tone (Bright cyan for player, deep violet for echo)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'player') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(680, now + 0.02);
      osc.frequency.exponentialRampToValueAtTime(1020, now + 0.16);
      gain.gain.setValueAtTime(0.24, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now + 0.02);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.2);
      gain.gain.setValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    }

    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);
    osc.start(now + 0.02);
    osc.stop(now + 0.26);
  }

  // 5. Door Opening (Hydraulic depressurization hiss + heavy mechanical slide)
  playDoorOpen() {
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;

    // Hydraulic steam hiss
    try {
      const bufferSize = this.ctx.sampleRate * 0.35;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.5;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1400, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(400, now + 0.35);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.sfxGain || this.ctx.destination);
      noise.start(now);
      noise.stop(now + 0.35);
    } catch (e) {}

    // Heavy mechanical slide clunk
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.4);

    gain.gain.setValueAtTime(0.28, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);
    osc.start(now + 0.05);
    osc.stop(now + 0.4);
  }

  // 6. Echo Incoming Warning (Countdown beeps for 3, 2, 1)
  playEchoWarning(step = 3) {
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Increasing pitch as countdown approaches 0
    const pitches = { 3: 520, 2: 660, 1: 880 };
    const freq = pitches[step] || 520;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (step === 1 ? 0.18 : 0.12));

    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);

    osc.start(now);
    osc.stop(now + (step === 1 ? 0.18 : 0.12));
  }

  // 7. Echo Spawn (Temporal bass drop + frequency sweep)
  playEchoSpawn() {
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.Q.value = 5.0;
    filter.frequency.setValueAtTime(180, now);
    filter.frequency.exponentialRampToValueAtTime(1600, now + 0.35);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.35);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  // 8. Echo Proximity Warning (Heartbeat / sonar ping when near Echo)
  playEchoProximity(dist = 60) {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Throttle rate based on closeness
    const interval = Math.max(0.25, (dist / 95) * 0.85);
    if (now - this.lastProximityPingTime < interval) return;
    this.lastProximityPingTime = now;
    this.resume();

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(85, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.1);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {}
  }

  // 9. Paradox Zone Rewind (Reverse tape-stop whoosh)
  playParadoxRewind() {
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + 0.38);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.exponentialRampToValueAtTime(130, now + 0.38);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.42);
  }

  // 10. Exit Portal Unlocked (Resonant energy surge chord)
  playExitUnlocked() {
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const chords = [330, 415.3, 493.88, 659.25]; // E major chord

    chords.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.22, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + 0.95);
    });
  }

  // 10b. Final Nexus Activation (Deep sub-bass swell + grand harmonic crescendo)
  playFinalNexusActivation() {
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;

    // 1. Deep Sub-bass rising drone
    try {
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(45, now);
      subOsc.frequency.exponentialRampToValueAtTime(110, now + 1.8);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(90, now);
      filter.frequency.exponentialRampToValueAtTime(320, now + 1.8);

      subGain.gain.setValueAtTime(0, now);
      subGain.gain.linearRampToValueAtTime(0.35, now + 0.6);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);

      subOsc.connect(filter);
      filter.connect(subGain);
      subGain.connect(this.sfxGain || this.ctx.destination);

      subOsc.start(now);
      subOsc.stop(now + 2.4);
    } catch (e) {}

    // 2. Ascending Grand Portal Chords (Radiant ascension)
    const nexusChords = [
      { freq: 220.00, time: 0.1, dur: 1.8, gain: 0.22 },
      { freq: 329.63, time: 0.25, dur: 1.8, gain: 0.20 },
      { freq: 440.00, time: 0.45, dur: 2.0, gain: 0.22 },
      { freq: 554.37, time: 0.70, dur: 2.2, gain: 0.25 },
      { freq: 659.25, time: 0.95, dur: 2.4, gain: 0.26 },
      { freq: 830.61, time: 1.20, dur: 2.6, gain: 0.24 },
      { freq: 1108.73, time: 1.45, dur: 2.8, gain: 0.22 },
    ];

    nexusChords.forEach(({ freq, time, dur, gain: targetGain }) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0, now + time);
      gain.gain.linearRampToValueAtTime(targetGain, now + time + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur);
    });
  }

  // 11. Level Completion Motif
  playLevelComplete() {
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const notes = [
      { f: 523.25, t: 0.0, d: 0.2 },
      { f: 659.25, t: 0.15, d: 0.2 },
      { f: 783.99, t: 0.30, d: 0.25 },
      { f: 1046.50, t: 0.48, d: 0.6 }
    ];

    notes.forEach(({ f, t, d }) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + t);

      gain.gain.setValueAtTime(0, now + t);
      gain.gain.linearRampToValueAtTime(0.22, now + t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);

      osc.start(now + t);
      osc.stop(now + t + d);
    });
  }

  // 12. Game Over (Sub-bass descent & temporal flatline)
  playGameOver() {
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;

    // Sub-bass descent
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.9);

    gain.gain.setValueAtTime(0.38, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.95);

    // Eerie descending flatline tone
    const flatline = this.ctx.createOscillator();
    const flatGain = this.ctx.createGain();
    flatline.type = 'sine';
    flatline.frequency.setValueAtTime(440, now + 0.3);
    flatline.frequency.exponentialRampToValueAtTime(110, now + 1.2);

    flatGain.gain.setValueAtTime(0, now);
    flatGain.gain.setValueAtTime(0.18, now + 0.3);
    flatGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    flatline.connect(flatGain);
    flatGain.connect(this.sfxGain || this.ctx.destination);

    flatline.start(now + 0.3);
    flatline.stop(now + 1.2);
  }

  // 13. Hit / Damage
  playHit() {
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // 14. UI Click
  playClick() {
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(350, now + 0.04);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  // 15. Portal Entry
  playPortalEnter() {
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.65);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.7);
  }

  // 16. Ending Fanfare
  playEndingFanfare() {
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const chord1 = [261.63, 329.63, 392.00, 523.25]; // C Major
    const chord2 = [349.23, 440.00, 523.25, 698.46]; // F Major
    const chord3 = [392.00, 493.88, 587.33, 783.99]; // G Major
    const chord4 = [523.25, 659.25, 783.99, 1046.50]; // C High

    const progression = [
      { notes: chord1, start: 0, duration: 1.2 },
      { notes: chord2, start: 1.0, duration: 1.2 },
      { notes: chord3, start: 2.0, duration: 1.4 },
      { notes: chord4, start: 3.2, duration: 2.8 }
    ];

    progression.forEach(({ notes, start, duration }) => {
      notes.forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);

        gain.gain.setValueAtTime(0, now + start);
        gain.gain.linearRampToValueAtTime(0.08, now + start + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

        osc.connect(gain);
        gain.connect(this.sfxGain || this.ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + duration);
      });
    });
  }
}

export const sound = new SoundEngine();
