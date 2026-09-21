export function createAudioManager(options = {}) {
  let audioContext = null;
  let masterGain = null;
  let effectsGain = null;
  let musicGain = null;
  let backgroundStarted = false;
  let backgroundTimerId = null;
  let backgroundAudio = null;
  let backgroundMode = null;
  let duckResetTimerId = null;
  let isMuted = false;

  let effectsBaseVolume = 1;
  let fileBgmBaseVolume = 0.24;
  let synthBgmBaseVolume = 0.24;
  const duckedBgmVolume = 0.09;

  if (typeof options.initialMusicVolume === "number") {
    fileBgmBaseVolume = Math.max(0, Math.min(1, options.initialMusicVolume));
    synthBgmBaseVolume = fileBgmBaseVolume;
  }

  if (typeof options.initialEffectsVolume === "number") {
    effectsBaseVolume = Math.max(0, Math.min(1, options.initialEffectsVolume));
  }

  if (typeof options.initialMuted === "boolean") {
    isMuted = options.initialMuted;
  }

  function ensureBackgroundAudio() {
    if (typeof window === "undefined" || !options.bgmSrc) {
      return null;
    }

    if (!backgroundAudio) {
      backgroundAudio = new Audio(options.bgmSrc);
      backgroundAudio.loop = true;
      backgroundAudio.volume = fileBgmBaseVolume;
      backgroundAudio.muted = isMuted;
      backgroundAudio.preload = "auto";
    }

    return backgroundAudio;
  }

  function ensureContext() {
    if (typeof window === "undefined") {
      return null;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      return null;
    }

    if (!audioContext) {
      audioContext = new AudioCtx();
      masterGain = audioContext.createGain();
      effectsGain = audioContext.createGain();
      musicGain = audioContext.createGain();
      masterGain.gain.value = 0.26;
      effectsGain.gain.value = effectsBaseVolume;
      musicGain.gain.value = synthBgmBaseVolume;
      effectsGain.connect(masterGain);
      musicGain.connect(masterGain);
      masterGain.connect(audioContext.destination);
    }

    return audioContext;
  }

  function unlock() {
    const ctx = ensureContext();
    if (!ctx) {
      return;
    }

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    startBackgroundMusic();
  }

  function startAudio() {
    unlock();
  }

  function playTone({
    frequency,
    type = "sine",
    duration = 0.12,
    delay = 0,
    volume = 0.18,
    endFrequency = frequency,
    output = "effects",
  }) {
    const ctx = ensureContext();
    if (!ctx || !masterGain) {
      return;
    }

    const startAt = ctx.currentTime + delay;
    const stopAt = startAt + duration;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const outputGain = output === "music" ? musicGain : effectsGain;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), stopAt);

    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(volume, startAt + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, stopAt);

    oscillator.connect(gainNode);
    gainNode.connect(outputGain);

    oscillator.start(startAt);
    oscillator.stop(stopAt + 0.02);
  }

  function duckBackground(duration = 280) {
    if (!backgroundStarted) {
      return;
    }

    if (backgroundMode === "file") {
      const bgm = ensureBackgroundAudio();
      if (!bgm) {
        return;
      }

      bgm.volume = duckedBgmVolume;
      bgm.muted = isMuted;
      if (duckResetTimerId) {
        window.clearTimeout(duckResetTimerId);
      }
      duckResetTimerId = window.setTimeout(() => {
        bgm.volume = fileBgmBaseVolume;
      }, duration);
      return;
    }

    if (backgroundMode === "synth" && musicGain && audioContext) {
      const now = audioContext.currentTime;
      musicGain.gain.cancelScheduledValues(now);
      musicGain.gain.setValueAtTime(musicGain.gain.value, now);
      musicGain.gain.linearRampToValueAtTime(duckedBgmVolume, now + 0.03);
      musicGain.gain.linearRampToValueAtTime(synthBgmBaseVolume, now + (duration / 1000));
    }
  }

  function scheduleMusicBar(offset = 0) {
    const notes = [
      { frequency: 523.25, delay: 0.0, duration: 0.42, volume: 0.05 },
      { frequency: 659.25, delay: 0.45, duration: 0.38, volume: 0.05 },
      { frequency: 783.99, delay: 0.9, duration: 0.4, volume: 0.055 },
      { frequency: 659.25, delay: 1.35, duration: 0.36, volume: 0.05 },
      { frequency: 587.33, delay: 1.8, duration: 0.42, volume: 0.05 },
      { frequency: 698.46, delay: 2.25, duration: 0.4, volume: 0.055 },
      { frequency: 783.99, delay: 2.7, duration: 0.46, volume: 0.06 },
      { frequency: 659.25, delay: 3.2, duration: 0.5, volume: 0.05 },
    ];

    notes.forEach((note) => {
      playTone({
        frequency: note.frequency,
        endFrequency: note.frequency,
        type: "triangle",
        duration: note.duration,
        delay: offset + note.delay,
        volume: note.volume,
        output: "music",
      });
    });

    [130.81, 146.83, 164.81, 146.83].forEach((frequency, index) => {
      playTone({
        frequency,
        endFrequency: frequency,
        type: "sine",
        duration: 0.7,
        delay: offset + (index * 0.9),
        volume: 0.03,
        output: "music",
      });
    });
  }

  function startBackgroundMusic() {
    const ctx = ensureContext();
    if (!ctx || backgroundStarted) {
      return;
    }

    backgroundStarted = true;
    const bgm = ensureBackgroundAudio();

    if (bgm) {
      backgroundMode = "file";
      bgm.muted = isMuted;
      bgm.play().catch(() => {});
      return;
    }

    backgroundMode = "synth";
    scheduleMusicBar(0);
    backgroundTimerId = window.setInterval(() => {
      if (ctx.state !== "running" || backgroundMode !== "synth") {
        return;
      }
      scheduleMusicBar(0);
    }, 3600);
  }

  function playCardFlip() {
    unlock();
    duckBackground(180);
    playTone({
      frequency: 620,
      endFrequency: 820,
      type: "triangle",
      duration: 0.08,
      volume: 0.2,
    });
  }

  function playMatch() {
    unlock();
    duckBackground(320);
    playTone({ frequency: 520, endFrequency: 640, type: "sine", duration: 0.1, volume: 0.22 });
    playTone({ frequency: 700, endFrequency: 880, type: "triangle", duration: 0.14, delay: 0.07, volume: 0.24 });
  }

  function playMismatch() {
    unlock();
    duckBackground(320);
    playTone({ frequency: 320, endFrequency: 240, type: "sawtooth", duration: 0.12, volume: 0.16 });
    playTone({ frequency: 220, endFrequency: 160, type: "square", duration: 0.1, delay: 0.08, volume: 0.14 });
  }

  function playLevelWin() {
    unlock();
    duckBackground(900);
    playTone({ frequency: 523.25, endFrequency: 523.25, type: "triangle", duration: 0.12, volume: 0.18 });
    playTone({ frequency: 659.25, endFrequency: 659.25, type: "triangle", duration: 0.12, delay: 0.1, volume: 0.2 });
    playTone({ frequency: 783.99, endFrequency: 783.99, type: "triangle", duration: 0.15, delay: 0.2, volume: 0.22 });
    playTone({ frequency: 1046.5, endFrequency: 1046.5, type: "sine", duration: 0.22, delay: 0.3, volume: 0.22 });
  }

  function playGameOver() {
    unlock();
    duckBackground(900);
    playTone({ frequency: 392, endFrequency: 320, type: "triangle", duration: 0.16, volume: 0.16 });
    playTone({ frequency: 311.13, endFrequency: 246.94, type: "triangle", duration: 0.18, delay: 0.12, volume: 0.16 });
    playTone({ frequency: 246.94, endFrequency: 164.81, type: "sine", duration: 0.24, delay: 0.25, volume: 0.14 });
  }

  function setEffectsVolume(value) {
    effectsBaseVolume = Math.max(0, Math.min(1, Number(value) || 0));
    ensureContext();
    if (effectsGain) {
      effectsGain.gain.value = effectsBaseVolume;
    }
  }

  function setMusicVolume(value) {
    const safeValue = Math.max(0, Math.min(1, Number(value) || 0));
    fileBgmBaseVolume = safeValue;
    synthBgmBaseVolume = safeValue;
    ensureContext();

    if (backgroundAudio) {
      backgroundAudio.volume = safeValue;
      backgroundAudio.muted = isMuted;
    }

    if (musicGain && backgroundMode !== "file") {
      musicGain.gain.value = safeValue;
    }
  }

  function setMuted(value) {
    isMuted = !!value;
    ensureContext();

    if (masterGain) {
      masterGain.gain.value = isMuted ? 0 : 0.26;
    }

    if (backgroundAudio) {
      backgroundAudio.muted = isMuted;
    }
  }

  function getVolumeSettings() {
    return {
      effects: effectsBaseVolume,
      music: fileBgmBaseVolume,
      muted: isMuted,
    };
  }

  return {
    getVolumeSettings,
    playCardFlip,
    playGameOver,
    playLevelWin,
    playMatch,
    playMismatch,
    setEffectsVolume,
    setMusicVolume,
    setMuted,
    startAudio,
  };
}
