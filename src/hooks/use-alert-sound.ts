"use client";

import { useRef, useState, useEffect, useCallback } from 'react';

// ─── Duration constant ────────────────────────────────────────────────────────
const ALERT_DURATION_MS = 60_000; // 1 minute

// ─── Fire alarm sound ─────────────────────────────────────────────────────────
// Classic klaxon/bell pattern: rapid high-pitched pulses
function createFireAlarm(ctx: AudioContext): () => void {
  const nodes: { osc: OscillatorNode; gain: GainNode }[] = [];
  const stopHandles: ReturnType<typeof setTimeout>[] = [];
  let stopped = false;

  const scheduleBeep = (startTime: number) => {
    if (stopped) return;
    // Two-tone klaxon: alternating 1200Hz and 800Hz, 0.15s each
    [1200, 800, 1200, 800].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime + i * 0.15);
      gain.gain.setValueAtTime(0, startTime + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.5, startTime + i * 0.15 + 0.02);
      gain.gain.setValueAtTime(0.5, startTime + i * 0.15 + 0.12);
      gain.gain.linearRampToValueAtTime(0, startTime + i * 0.15 + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime + i * 0.15);
      osc.stop(startTime + i * 0.15 + 0.16);
      nodes.push({ osc, gain });
    });
  };

  // Schedule repeating pattern every 0.8s for 1 minute
  const totalBeeps = Math.floor(ALERT_DURATION_MS / 800);
  for (let i = 0; i < totalBeeps; i++) {
    scheduleBeep(ctx.currentTime + i * 0.8);
  }

  const autoStop = setTimeout(() => stop(), ALERT_DURATION_MS + 200);
  stopHandles.push(autoStop);

  function stop() {
    stopped = true;
    stopHandles.forEach(h => clearTimeout(h));
    nodes.forEach(({ osc, gain }) => {
      try {
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
        osc.stop(ctx.currentTime + 0.1);
      } catch {}
    });
  }

  return stop;
}

// ─── Police patrol car siren ──────────────────────────────────────────────────
// Classic wee-woo: sweeps between 600Hz and 1200Hz, 0.5s per sweep
function createPoliceSiren(ctx: AudioContext): () => void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  let stopped = false;

  osc.type = 'sawtooth';
  gain.gain.setValueAtTime(0.4, ctx.currentTime);
  osc.connect(gain);
  gain.connect(ctx.destination);

  // Schedule wee-woo sweeps for 1 minute
  const sweepDuration = 0.5;
  const totalSweeps = Math.floor(ALERT_DURATION_MS / (sweepDuration * 1000));
  for (let i = 0; i < totalSweeps; i++) {
    const t = ctx.currentTime + i * sweepDuration;
    if (i % 2 === 0) {
      // Wee: low to high
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.linearRampToValueAtTime(1200, t + sweepDuration);
    } else {
      // Woo: high to low
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.linearRampToValueAtTime(600, t + sweepDuration);
    }
  }

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + ALERT_DURATION_MS / 1000 + 0.1);

  const autoStop = setTimeout(() => stop(), ALERT_DURATION_MS + 200);

  function stop() {
    if (stopped) return;
    stopped = true;
    clearTimeout(autoStop);
    try {
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }

  return stop;
}

// ─── Ambulance hi-lo siren ────────────────────────────────────────────────────
// European ambulance: alternates between two distinct tones (hi-lo)
function createAmbulanceSiren(ctx: AudioContext): () => void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  let stopped = false;

  osc.type = 'sine';
  gain.gain.setValueAtTime(0.45, ctx.currentTime);
  osc.connect(gain);
  gain.connect(ctx.destination);

  // Hi-lo: 960Hz for 0.4s, then 770Hz for 0.4s
  const toneDuration = 0.4;
  const totalTones = Math.floor(ALERT_DURATION_MS / (toneDuration * 1000));
  for (let i = 0; i < totalTones; i++) {
    const t = ctx.currentTime + i * toneDuration;
    const freq = i % 2 === 0 ? 960 : 770;
    osc.frequency.setValueAtTime(freq, t);
    // Sharp transition with slight glide
    osc.frequency.linearRampToValueAtTime(freq, t + toneDuration - 0.02);
  }

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + ALERT_DURATION_MS / 1000 + 0.1);

  const autoStop = setTimeout(() => stop(), ALERT_DURATION_MS + 200);

  function stop() {
    if (stopped) return;
    stopped = true;
    clearTimeout(autoStop);
    try {
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }

  return stop;
}

// ─── Escaped inmate / all-agencies alarm ─────────────────────────────────────
// Rapid urgent pulse: fast repeating high-pitched bursts (prison break alarm)
// Plays 3 attempts (3 rounds of 5 seconds each with 1s gap), then stops
function createEscapeAlarm(ctx: AudioContext): () => void {
  const nodes: { osc: OscillatorNode; gain: GainNode }[] = [];
  const stopHandles: ReturnType<typeof setTimeout>[] = [];
  let stopped = false;

  const ATTEMPT_DURATION = 5.0;  // 5 seconds per attempt
  const ATTEMPT_GAP = 1.0;       // 1 second gap between attempts
  const TOTAL_ATTEMPTS = 3;

  for (let attempt = 0; attempt < TOTAL_ATTEMPTS; attempt++) {
    const attemptStart = attempt * (ATTEMPT_DURATION + ATTEMPT_GAP);
    // Rapid pulses: 20 pulses per second for 5 seconds
    const pulseInterval = 0.05; // 50ms per pulse
    const totalPulses = Math.floor(ATTEMPT_DURATION / pulseInterval);

    for (let p = 0; p < totalPulses; p++) {
      const t = ctx.currentTime + attemptStart + p * pulseInterval;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      // Alternating high tones for urgency
      osc.type = 'square';
      osc.frequency.setValueAtTime(p % 2 === 0 ? 1800 : 1400, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.4, t + 0.01);
      gain.gain.linearRampToValueAtTime(0, t + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.05);
      nodes.push({ osc, gain });
    }
  }

  const totalDuration = TOTAL_ATTEMPTS * (ATTEMPT_DURATION + ATTEMPT_GAP) * 1000;
  const autoStop = setTimeout(() => stop(), totalDuration + 200);
  stopHandles.push(autoStop);

  function stop() {
    if (stopped) return;
    stopped = true;
    stopHandles.forEach(h => clearTimeout(h));
    nodes.forEach(({ osc, gain }) => {
      try {
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
        osc.stop(ctx.currentTime + 0.1);
      } catch {}
    });
  }

  return stop;
}

// ─── New incident beep (3-beep notification) ─────────────────────────────────
function playAlertBeep(ctx: AudioContext, type: 'fire' | 'police' | 'medical' | 'all' = 'fire') {
  const configs = {
    fire:    [{ f: 1200, t: 0 }, { f: 1000, t: 0.5 }, { f: 1200, t: 1.0 }],
    police:  [{ f: 800,  t: 0 }, { f: 1200, t: 0.4 }, { f: 800,  t: 0.8 }],
    medical: [{ f: 960,  t: 0 }, { f: 770,  t: 0.4 }, { f: 960,  t: 0.8 }],
    all:     [{ f: 1800, t: 0 }, { f: 1400, t: 0.2 }, { f: 1800, t: 0.4 }, { f: 1400, t: 0.6 }],
  };

  configs[type].forEach(({ f, t }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type === 'all' ? 'square' : 'sawtooth';
    osc.frequency.setValueAtTime(f, ctx.currentTime + t);
    gain.gain.setValueAtTime(0, ctx.currentTime + t);
    gain.gain.linearRampToValueAtTime(0.45, ctx.currentTime + t + 0.02);
    gain.gain.setValueAtTime(0.45, ctx.currentTime + t + 0.28);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + t + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + t);
    osc.stop(ctx.currentTime + t + 0.37);
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export type AgencyType = 'fire' | 'police' | 'medical' | 'all';

interface UseAlertSoundReturn {
  soundEnabled: boolean;
  toggleSound: () => void;
  playNewIncident: (type?: AgencyType) => void;
  playSiren: (type?: AgencyType) => void;
  stopSiren: () => void;
  sirenActive: boolean;
}

export function useAlertSound(): UseAlertSoundReturn {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sirenActive, setSirenActive] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const stopSirenRef = useRef<(() => void) | null>(null);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playNewIncident = useCallback((type: AgencyType = 'fire') => {
    if (!soundEnabled) return;
    try {
      const ctx = getCtx();
      playAlertBeep(ctx, type);
    } catch (e) {
      console.warn('Audio playback failed:', e);
    }
  }, [soundEnabled, getCtx]);

  const playSiren = useCallback((type: AgencyType = 'fire') => {
    if (!soundEnabled) return;
    try {
      const ctx = getCtx();
      // Stop any existing siren
      if (stopSirenRef.current) {
        stopSirenRef.current();
        stopSirenRef.current = null;
      }
      // Start the appropriate siren
      let stopFn: () => void;
      switch (type) {
        case 'fire':    stopFn = createFireAlarm(ctx);    break;
        case 'police':  stopFn = createPoliceSiren(ctx);  break;
        case 'medical': stopFn = createAmbulanceSiren(ctx); break;
        case 'all':     stopFn = createEscapeAlarm(ctx);  break;
        default:        stopFn = createFireAlarm(ctx);
      }
      stopSirenRef.current = stopFn;
      setSirenActive(true);

      // Auto-stop after duration
      const duration = type === 'all'
        ? 3 * (5000 + 1000) + 200  // 3 attempts × (5s + 1s gap)
        : ALERT_DURATION_MS + 200;
      setTimeout(() => {
        setSirenActive(false);
        stopSirenRef.current = null;
      }, duration);
    } catch (e) {
      console.warn('Siren playback failed:', e);
    }
  }, [soundEnabled, getCtx]);

  const stopSiren = useCallback(() => {
    if (stopSirenRef.current) {
      stopSirenRef.current();
      stopSirenRef.current = null;
    }
    setSirenActive(false);
  }, []);

  const autoOnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev;
      if (prev && sirenActive) stopSiren();
      // If turning OFF, auto-turn back ON after 2 seconds
      if (prev) {
        if (autoOnTimerRef.current) clearTimeout(autoOnTimerRef.current);
        autoOnTimerRef.current = setTimeout(() => {
          setSoundEnabled(true);
          autoOnTimerRef.current = null;
        }, 2000);
      } else {
        // Turning ON manually — cancel any pending auto-on
        if (autoOnTimerRef.current) {
          clearTimeout(autoOnTimerRef.current);
          autoOnTimerRef.current = null;
        }
      }
      return next;
    });
  }, [sirenActive, stopSiren]);

  useEffect(() => {
    return () => {
      if (stopSirenRef.current) stopSirenRef.current();
      if (autoOnTimerRef.current) clearTimeout(autoOnTimerRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  return { soundEnabled, toggleSound, playNewIncident, playSiren, stopSiren, sirenActive };
}
