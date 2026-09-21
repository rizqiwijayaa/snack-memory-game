export function createDefaultPlayerStats() {
  return {
    gamesPlayed: 0,
    bestScore: 0,
    highestLevel: 1,
    longestWinStreak: 0,
    currentWinStreak: 0,
    currentCoins: 0,
  };
}

export function loadPlayerStats(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return createDefaultPlayerStats();
    }

    const parsed = JSON.parse(raw);
    const savedCurrentCoins = Number(parsed.currentCoins);
    return {
      gamesPlayed: Number(parsed.gamesPlayed) || 0,
      bestScore: Number(parsed.bestScore) || 0,
      highestLevel: Math.max(1, Number(parsed.highestLevel) || 1),
      longestWinStreak: Number(parsed.longestWinStreak) || 0,
      currentWinStreak: Number(parsed.currentWinStreak) || 0,
      currentCoins: Number.isFinite(savedCurrentCoins) ? savedCurrentCoins : 0,
    };
  } catch {
    return createDefaultPlayerStats();
  }
}

export function savePlayerStats(storageKey, playerStats, coins) {
  const nextStats = {
    ...playerStats,
    currentCoins: coins,
  };
  localStorage.setItem(storageKey, JSON.stringify(nextStats));
}

export function resetPlayerStats(storageKey) {
  localStorage.removeItem(storageKey);
}

export function createDefaultAudioSettings() {
  return {
    music: 24,
    effects: 100,
    muted: false,
  };
}

export function loadAudioSettings(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return createDefaultAudioSettings();
    }

    const parsed = JSON.parse(raw);
    return {
      music: Math.max(0, Math.min(100, Number(parsed.music) || 24)),
      effects: Math.max(0, Math.min(100, Number(parsed.effects) || 100)),
      muted: !!parsed.muted,
    };
  } catch {
    return createDefaultAudioSettings();
  }
}

export function saveAudioSettings(storageKey, settings) {
  localStorage.setItem(storageKey, JSON.stringify(settings));
}

export function loadRunProgress(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.activeRun) {
      return null;
    }

    return {
      activeRun: true,
      currentLevelIndex: Math.max(0, Number(parsed.currentLevelIndex) || 0),
      score: Math.max(0, Number(parsed.score) || 0),
      moves: Math.max(0, Number(parsed.moves) || 0),
      coins: Math.max(0, Number(parsed.coins) || 0),
      sessionHighestLevel: Math.max(1, Number(parsed.sessionHighestLevel) || 1),
    };
  } catch {
    return null;
  }
}

export function saveRunProgress(storageKey, progress) {
  localStorage.setItem(storageKey, JSON.stringify(progress));
}

export function clearRunProgress(storageKey) {
  localStorage.removeItem(storageKey);
}
