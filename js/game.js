import { allSymbols, gameTime, levels, playerStatsStorageKey, shopItems } from "./config.js";
import { renderBoard } from "./cards.js";
import {
  clearRunProgress,
  createDefaultPlayerStats,
  loadRunProgress,
  loadPlayerStats,
  resetPlayerStats,
  saveAudioSettings,
  savePlayerStats,
  saveRunProgress,
} from "./storage.js";
import {
  animateLevelClear,
  animateMatchedCards,
  animateShopPurchase,
  closeShopModal as closeShopModalUi,
  hideOverlay,
  hideGameOverScreen,
  hideGameScreen,
  hideMainMenu,
  hideVictoryScreen,
  openShopModal as openShopModalUi,
  renderPlayerStats,
  setMessage,
  showGameOverScreen,
  showMainMenu,
  showOverlay,
  showGameScreen,
  showMenuPanel,
  showVictoryScreen,
  updateContinueButton,
  updateShopButtons,
  updateStats,
} from "./ui.js";
import { useShopItem } from "./shop.js";

export function createGame(refs, audio) {
  const audioSettingsStorageKey = "memory-card-audio-settings";
  const runProgressStorageKey = "memory-card-run-progress";
  const state = {
    deck: [],
    firstCard: null,
    secondCard: null,
    lockBoard: false,
    score: 0,
    coins: 0,
    moves: 0,
    matches: 0,
    timeLeft: gameTime,
    timerId: null,
    isPaused: false,
    gameFinished: false,
    currentLevelIndex: 0,
    secondChanceArmed: false,
    secondChanceUsed: false,
    revealInProgress: false,
    hintInProgress: false,
    wasPausedBeforeShop: false,
    sessionCoinsEarned: 0,
    sessionHighestLevel: 1,
    levelMistakes: 0,
    levelMatchCoinsEarned: 0,
    hasStarted: false,
    playerStats: loadPlayerStats(playerStatsStorageKey),
  };

  function shuffle(array) {
    const next = [...array];
    for (let i = next.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    return next;
  }

  function getCurrentLevel() {
    const safeIndex = Math.max(0, Math.min(levels.length - 1, Number(state.currentLevelIndex) || 0));
    state.currentLevelIndex = safeIndex;
    return levels[safeIndex];
  }

  function persistAudioSettings() {
    const settings = audio?.getVolumeSettings?.() ?? { music: 0.24, effects: 1, muted: false };
    saveAudioSettings(audioSettingsStorageKey, {
      music: Math.round(settings.music * 100),
      effects: Math.round(settings.effects * 100),
      muted: settings.muted,
    });
  }

  function persistPlayerStats() {
    state.playerStats.currentCoins = state.coins;
    savePlayerStats(playerStatsStorageKey, state.playerStats, state.coins);
  }

  function persistRunProgress() {
    if (!state.hasStarted || state.gameFinished) {
      clearRunProgress(runProgressStorageKey);
      updateContinueButton(refs, false);
      return;
    }

    saveRunProgress(runProgressStorageKey, {
      activeRun: true,
      currentLevelIndex: state.currentLevelIndex,
      score: state.score,
      moves: state.moves,
      coins: state.coins,
      sessionHighestLevel: state.sessionHighestLevel,
    });
    updateContinueButton(refs, true);
  }

  function clearSavedRun() {
    clearRunProgress(runProgressStorageKey);
    updateContinueButton(refs, false);
  }

  function renderSavedStats() {
    renderPlayerStats(refs, state.playerStats);
  }

  function commitPlayerStatsAtRunEnd() {
    state.playerStats.gamesPlayed += 1;
    state.playerStats.bestScore = Math.max(state.playerStats.bestScore, state.score);
    state.playerStats.highestLevel = Math.max(state.playerStats.highestLevel, state.sessionHighestLevel);
    persistPlayerStats();
    renderSavedStats();
  }

  function registerWinStreak(win) {
    if (win) {
      state.playerStats.currentWinStreak += 1;
      state.playerStats.longestWinStreak = Math.max(state.playerStats.longestWinStreak, state.playerStats.currentWinStreak);
    } else {
      state.playerStats.currentWinStreak = 0;
    }
  }

  function createDeck() {
    const currentLevel = getCurrentLevel();
    const symbols = allSymbols.slice(0, currentLevel.pairs);
    return shuffle(
      symbols.concat(symbols).map((symbol, index) => ({
        id: `${symbol}-${index}`,
        symbol,
        matched: false,
      }))
    );
  }

  function updateShopButtonsBound() {
    updateShopButtons(refs, state, shopItems);
  }

  function updateStatsBound() {
    updateStats(refs, state, getCurrentLevel(), gameTime, updateShopButtonsBound);
  }

  function setMessageBound(title, text) {
    setMessage(refs, title, text);
  }

  function resetTurn() {
    state.firstCard = null;
    state.secondCard = null;
    state.lockBoard = false;
    updateShopButtonsBound();
  }

  function showOverlayBound(tag, title, text, buttonLabel, showHomeButton = false) {
    showOverlay(refs, tag, title, text, buttonLabel, showHomeButton);
  }

  function hideOverlayBound() {
    hideOverlay(refs);
  }

  function openShopModal() {
    if (!state.hasStarted || state.gameFinished || state.revealInProgress || state.hintInProgress) {
      return;
    }

    state.wasPausedBeforeShop = state.isPaused;
    state.isPaused = true;
    openShopModalUi(refs);
    updateShopButtonsBound();
  }

  function closeShopModal() {
    state.isPaused = state.wasPausedBeforeShop;
    closeShopModalUi(refs);
    updateStatsBound();
  }

  function clearTimer() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function spendCoins(amount) {
    if (state.coins < amount) {
      setMessageBound("Not enough coins", "Match more cards to buy this item.");
      return false;
    }

    state.coins -= amount;
    persistPlayerStats();
    persistRunProgress();
    return true;
  }

  function getAccuracyBonusCoins(levelNumber, mistakes) {
    if (mistakes <= 2) {
      return levelNumber * 5;
    }
    if (mistakes <= 5) {
      return levelNumber * 3;
    }
    return 0;
  }

  function getMatchScore(levelNumber) {
    return 8 + (levelNumber * 2);
  }

  function getMismatchPenalty(levelNumber) {
    return Math.max(1, Math.floor((levelNumber + 1) / 3));
  }

  function getMatchCoins(levelNumber) {
    return 4 + levelNumber;
  }

  function finishGame(win) {
    const currentLevel = getCurrentLevel();
    state.gameFinished = true;
    clearTimer();
    state.lockBoard = true;

    if (win) {
      audio?.playLevelWin();
      animateLevelClear(refs);
      const accuracyBonusCoins = getAccuracyBonusCoins(currentLevel.level, state.levelMistakes);
      const totalLevelCoinsEarned = state.levelMatchCoinsEarned + accuracyBonusCoins;
      state.coins += accuracyBonusCoins;
      state.sessionCoinsEarned += accuracyBonusCoins;
      persistPlayerStats();
      const hasNextLevel = state.currentLevelIndex < levels.length - 1;
      const title = hasNextLevel ? `Level ${currentLevel.level} cleared` : "All levels cleared";
      const text = hasNextLevel
        ? `Score ${state.score} with ${state.moves} moves.\nMistakes: ${state.levelMistakes}.\nCoins: ${state.levelMatchCoinsEarned} from matches + ${accuracyBonusCoins} accuracy bonus = ${totalLevelCoinsEarned}.\nReady for level ${levels[state.currentLevelIndex + 1].level}?`
        : `Final score: ${state.score} with ${state.moves} moves.\nMistakes: ${state.levelMistakes}.\nCoins: ${state.levelMatchCoinsEarned} from matches + ${accuracyBonusCoins} accuracy bonus = ${totalLevelCoinsEarned}.\nYou cleared every level.`;
      setMessageBound("You win!", hasNextLevel ? "All pairs matched. Continue to the next level." : "All pairs matched. You beat every level.");
      updateStatsBound();
      if (hasNextLevel) {
      showOverlayBound("Great!", title, text, "Next level");
      } else {
        hideOverlayBound();
        hideGameScreen(refs);
        showVictoryScreen(
          refs,
          "You Beat The Game",
          `
            <p>Final score: <strong>${state.score}</strong></p>
            <p>Total coins: <strong>${state.coins}</strong></p>
            <p>Total moves: <strong>${state.moves}</strong></p>
            <p>Highest level reached: <strong>${state.sessionHighestLevel}</strong></p>
            <p>Mistakes on final level: <strong>${state.levelMistakes}</strong></p>
          `
        );
        registerWinStreak(true);
        commitPlayerStatsAtRunEnd();
        clearSavedRun();
      }
    } else {
      audio?.playGameOver();
      setMessageBound("Time up!", "Try one more round and beat your last score.");
      registerWinStreak(false);
      commitPlayerStatsAtRunEnd();
      hideOverlayBound();
      hideGameScreen(refs);
      showGameOverScreen(
        refs,
        "Game Over",
        `
          <p>Level reached: <strong>${currentLevel.level}</strong></p>
          <p>Score: <strong>${state.score}</strong></p>
          <p>Coins: <strong>${state.coins}</strong></p>
          <p>Moves: <strong>${state.moves}</strong></p>
          <p>Matched pairs: <strong>${state.matches} / ${currentLevel.pairs}</strong></p>
          <p>Mistakes: <strong>${state.levelMistakes}</strong></p>
        `
      );
      clearSavedRun();
    }
  }

  function startTimer() {
    clearTimer();
    const currentLevel = getCurrentLevel();
    state.timerId = setInterval(() => {
      if (state.isPaused || state.gameFinished) {
        return;
      }

      state.timeLeft -= 1;

      if (state.timeLeft <= 10) {
        refs.timerFillEl.style.background = "linear-gradient(90deg, #ffbf80 0%, #ff6b6b 100%)";
      }

      if (state.timeLeft <= 0) {
        state.timeLeft = 0;
        if (state.secondChanceArmed && !state.secondChanceUsed) {
          state.secondChanceArmed = false;
          state.secondChanceUsed = true;
          state.timeLeft = 10;
          setMessageBound("Second chance!", "Your shield gave you 10 extra seconds.");
          updateStatsBound();
          return;
        }

        updateStatsBound();
        finishGame(false);
        return;
      }

      updateStatsBound();
    }, 1000);
  }

  function unflipCards() {
    setTimeout(() => {
      state.firstCard.classList.remove("flipped");
      state.secondCard.classList.remove("flipped");
      state.firstCard.setAttribute("aria-label", "Hidden card");
      state.secondCard.setAttribute("aria-label", "Hidden card");
      resetTurn();
    }, 700);
  }

  function markMatch() {
    const currentLevel = getCurrentLevel();
    const matchScore = getMatchScore(currentLevel.level);
    const matchCoins = getMatchCoins(currentLevel.level);
    audio?.playMatch();
    state.firstCard.classList.add("matched");
    state.secondCard.classList.add("matched");
    animateMatchedCards([state.firstCard, state.secondCard]);
    state.firstCard.disabled = true;
    state.secondCard.disabled = true;
    state.score += matchScore;
    state.coins += matchCoins;
    state.sessionCoinsEarned += matchCoins;
    state.levelMatchCoinsEarned += matchCoins;
    persistPlayerStats();
    persistRunProgress();
    state.matches += 1;
    setMessageBound("Nice match!", `You found ${state.matches} of ${currentLevel.pairs} pairs and earned ${matchCoins} coins.`);
    updateStatsBound();
    resetTurn();

    if (state.matches === currentLevel.pairs) {
      finishGame(true);
    }
  }

  function handleCardClick(button, cardData) {
    if (
      !state.hasStarted ||
      state.lockBoard ||
      state.isPaused ||
      state.gameFinished ||
      state.revealInProgress ||
      state.hintInProgress ||
      button === state.firstCard ||
      button.classList.contains("matched")
    ) {
      return;
    }

    audio?.playCardFlip();
    button.classList.add("flipped");
    button.setAttribute("aria-label", `Card ${cardData.symbol}`);

    if (!state.firstCard) {
      state.firstCard = button;
      return;
    }

    state.secondCard = button;
    state.lockBoard = true;
    state.moves += 1;
    updateStatsBound();

    if (state.firstCard.dataset.symbol === state.secondCard.dataset.symbol) {
      markMatch();
    } else {
      const mismatchPenalty = getMismatchPenalty(getCurrentLevel().level);
      state.levelMistakes += 1;
      state.score = Math.max(0, state.score - mismatchPenalty);
      audio?.playMismatch();
      setMessageBound("Keep trying!", `Those two cards are different. Score -${mismatchPenalty}.`);
      updateStatsBound();
      persistRunProgress();
      unflipCards();
    }
  }

  async function useShopItemBound(itemKey) {
    return useShopItem({
      refs,
      state,
      items: shopItems,
      spendCoins,
      animatePurchase: (key) => animateShopPurchase(refs, key),
      closeShopModal,
      setMessage: setMessageBound,
      updateStats: updateStatsBound,
      saveStats: persistPlayerStats,
      saveProgress: persistRunProgress,
      shuffle,
    }, itemKey);
  }

  function resetGame(resetLevel = true, preserveCoins = false) {
    const savedCoins = state.coins;
    if (resetLevel) {
      state.currentLevelIndex = 0;
      state.score = 0;
      state.moves = 0;
      state.sessionCoinsEarned = 0;
      state.sessionHighestLevel = 1;
    }

    state.coins = preserveCoins ? savedCoins : state.playerStats.currentCoins;
    state.deck = createDeck();
    state.firstCard = null;
    state.secondCard = null;
    state.lockBoard = false;
    state.matches = 0;
    state.timeLeft = getCurrentLevel().timeLimit || gameTime;
    state.isPaused = false;
    state.gameFinished = false;
    state.secondChanceArmed = false;
    state.secondChanceUsed = false;
    state.revealInProgress = false;
    state.hintInProgress = false;
    state.wasPausedBeforeShop = false;
    state.sessionHighestLevel = Math.max(state.sessionHighestLevel, getCurrentLevel().level);
    state.levelMistakes = 0;
    state.levelMatchCoinsEarned = 0;
    hideVictoryScreen(refs);
    closeShopModal();
    refs.timerFillEl.style.background = "linear-gradient(90deg, #fff6bd 0%, #fff 100%)";
    refs.pauseButton.textContent = "II";
    setMessageBound("Find the pairs", `Open ${getCurrentLevel().pairs} matching pairs before time runs out.`);
    hideOverlayBound();
    renderBoard(refs, state.deck, getCurrentLevel(), handleCardClick);
    updateStatsBound();
    persistRunProgress();
    startTimer();
  }

  function prepareStartScreen() {
    clearTimer();
    state.coins = state.playerStats.currentCoins;
    state.deck = createDeck();
    state.firstCard = null;
    state.secondCard = null;
    state.lockBoard = false;
    state.matches = 0;
    state.timeLeft = getCurrentLevel().timeLimit || gameTime;
    state.isPaused = false;
    state.gameFinished = false;
    state.revealInProgress = false;
    state.hintInProgress = false;
    state.secondChanceArmed = false;
    state.secondChanceUsed = false;
    state.wasPausedBeforeShop = false;
    refs.timerFillEl.style.background = "linear-gradient(90deg, #fff6bd 0%, #fff 100%)";
    refs.pauseButton.textContent = "II";
    setMessageBound("Ready to play?", "Press Start Game to begin the first round.");
    hideOverlayBound();
    hideGameOverScreen(refs);
    hideVictoryScreen(refs);
    closeShopModalUi(refs);
    renderBoard(refs, state.deck, getCurrentLevel(), handleCardClick);
    updateStatsBound();
  }

  function resetAllProgress() {
    resetPlayerStats(playerStatsStorageKey);
    state.playerStats = createDefaultPlayerStats();
    state.score = 0;
    state.coins = 0;
    state.moves = 0;
    state.matches = 0;
    state.currentLevelIndex = 0;
    state.sessionCoinsEarned = 0;
    state.sessionHighestLevel = 1;
    state.levelMistakes = 0;
    state.levelMatchCoinsEarned = 0;
    state.hasStarted = false;
    renderSavedStats();
    clearSavedRun();
    prepareStartScreen();
  }

  function startGameFromMenu() {
    audio?.startAudio?.();
    state.hasStarted = true;
    hideMainMenu(refs);
    hideGameOverScreen(refs);
    hideVictoryScreen(refs);
    showGameScreen(refs);
    resetGame(true, false);
  }

  function backToHome() {
    clearTimer();
    state.hasStarted = false;
    state.isPaused = false;
    state.gameFinished = false;
    hideOverlayBound();
    closeShopModalUi(refs);
    hideGameOverScreen(refs);
    hideVictoryScreen(refs);
    hideGameScreen(refs);
    showMainMenu(refs);
    prepareStartScreen();
    showMenuPanel(
      refs,
      "Welcome Back",
      "Choose an option",
      "<p>Start a fresh run, continue your saved progress, or open the menu sections to tune the game.</p>"
    );
  }

  function openMenuInfo(section) {
    if (section === "statistics") {
      showMenuPanel(
        refs,
        "Statistics",
        "Saved in this browser",
        `
          <p>Games Played: <strong>${state.playerStats.gamesPlayed}</strong></p>
          <p>Best Score: <strong>${state.playerStats.bestScore}</strong></p>
          <p>Highest Level: <strong>${state.playerStats.highestLevel}</strong></p>
          <p>Longest Win Streak: <strong>${state.playerStats.longestWinStreak}</strong></p>
          <p>Current Coins: <strong>${state.playerStats.currentCoins}</strong></p>
        `
      );
      return;
    }

    if (section === "settings") {
      const { music, effects, muted } = audio?.getVolumeSettings?.() ?? { music: 0.24, effects: 1, muted: false };
      showMenuPanel(
        refs,
        "Settings",
        "Audio, reset, and game info",
        `
          <div class="settings-group">
            <div class="settings-row">
              <span class="settings-name">BGM Volume</span>
              <span class="settings-value" id="musicVolumeValue">${Math.round(music * 100)}%</span>
            </div>
            <input class="settings-slider" id="musicVolumeSlider" type="range" min="0" max="100" value="${Math.round(music * 100)}">
          </div>
          <div class="settings-group">
            <div class="settings-row">
              <span class="settings-name">SFX Volume</span>
              <span class="settings-value" id="effectsVolumeValue">${Math.round(effects * 100)}%</span>
            </div>
            <input class="settings-slider" id="effectsVolumeSlider" type="range" min="0" max="100" value="${Math.round(effects * 100)}">
          </div>
          <div class="settings-group">
            <div class="settings-row">
              <span class="settings-name">Mute All Sounds</span>
              <button class="settings-toggle" id="muteToggleButton" type="button">${muted ? "ON" : "OFF"}</button>
            </div>
            <p class="settings-note">Turn every sound in the game on or off at once.</p>
          </div>
          <div class="settings-group">
            <div class="settings-row">
              <span class="settings-name">Reset Statistics</span>
            </div>
            <button class="settings-danger" id="resetStatsButton" type="button">Reset score, coin, highest level, and more</button>
            <p class="settings-note">This clears saved progress in this browser.</p>
          </div>
          <div class="settings-group">
            <div class="settings-row">
              <span class="settings-name">About Game</span>
            </div>
            <p>Memory Match</p>
            <p>Version 1.0</p>
            <p>Created by Rizqi Wijaya</p>
          </div>
        `
      );

      const musicSlider = refs.menuPanelContentEl.querySelector("#musicVolumeSlider");
      const effectsSlider = refs.menuPanelContentEl.querySelector("#effectsVolumeSlider");
      const musicValue = refs.menuPanelContentEl.querySelector("#musicVolumeValue");
      const effectsValue = refs.menuPanelContentEl.querySelector("#effectsVolumeValue");
      const muteToggleButton = refs.menuPanelContentEl.querySelector("#muteToggleButton");
      const resetStatsButton = refs.menuPanelContentEl.querySelector("#resetStatsButton");

      musicSlider?.addEventListener("input", (event) => {
        const value = Number(event.target.value) || 0;
        audio?.setMusicVolume?.(value / 100);
        persistAudioSettings();
        if (musicValue) {
          musicValue.textContent = `${value}%`;
        }
      });

      effectsSlider?.addEventListener("input", (event) => {
        const value = Number(event.target.value) || 0;
        audio?.setEffectsVolume?.(value / 100);
        persistAudioSettings();
        if (effectsValue) {
          effectsValue.textContent = `${value}%`;
        }
      });

      muteToggleButton?.addEventListener("click", () => {
        const currentlyMuted = muteToggleButton.textContent === "ON";
        const nextMuted = !currentlyMuted;
        audio?.setMuted?.(nextMuted);
        persistAudioSettings();
        muteToggleButton.textContent = nextMuted ? "ON" : "OFF";
      });

      resetStatsButton?.addEventListener("click", () => {
        const shouldReset = window.confirm("Are you sure?");
        if (!shouldReset) {
          return;
        }

        resetAllProgress();
      });

      return;
    }

    showMenuPanel(
      refs,
      "Credits",
      "Project notes",
      `
        <p>Memory Match built with HTML, CSS, and modular JavaScript.</p>
        <p>Food emojis, local save data, shop system, and level flow are all handled locally in the browser.</p>
        <p>Background music uses your local BGM file, while gameplay effects use built-in generated sounds.</p>
      `
    );
  }

  function goToNextLevel() {
    if (state.currentLevelIndex < levels.length - 1) {
      state.currentLevelIndex += 1;
      resetGame(false);
      return;
    }

    resetGame(true);
  }

  function togglePause() {
    if (state.gameFinished) {
      return;
    }

    state.isPaused = !state.isPaused;
    refs.pauseButton.textContent = state.isPaused ? ">" : "II";

    if (state.isPaused) {
      showOverlayBound("Paused", "Game stopped", "Tap continue when you are ready to keep matching.", "Continue", true);
    } else {
      hideOverlayBound();
    }

    updateStatsBound();
  }

  function handleOverlayButton() {
    if (state.gameFinished) {
      if (state.matches === getCurrentLevel().pairs) {
        goToNextLevel();
      } else {
        resetGame(true, true);
      }
      return;
    }

    state.isPaused = false;
    refs.pauseButton.textContent = "II";
    hideOverlayBound();
  }

  function initialize() {
    renderSavedStats();
    hideGameScreen(refs);
    hideGameOverScreen(refs);
    hideVictoryScreen(refs);
    prepareStartScreen();
    updateContinueButton(refs, !!loadRunProgress(runProgressStorageKey));
    showMenuPanel(
      refs,
      "Welcome",
      "Choose an option",
      "<p>Start the game when you are ready, or open the menu sections to check your stats, adjust sound, and read the credits.</p>"
    );
  }

  function handleRestartButton() {
    if (!state.hasStarted) {
      prepareStartScreen();
      return;
    }

    resetGame();
  }

  function playAgainFromGameOver() {
    audio?.startAudio?.();
    state.hasStarted = true;
    hideGameOverScreen(refs);
    hideVictoryScreen(refs);
    showGameScreen(refs);
    resetGame(true, true);
  }

  function playAgainFromVictory() {
    audio?.startAudio?.();
    state.hasStarted = true;
    hideVictoryScreen(refs);
    showGameScreen(refs);
    resetGame(true, true);
  }

  function continueSavedRun() {
    const savedRun = loadRunProgress(runProgressStorageKey);
    if (!savedRun) {
      updateContinueButton(refs, false);
      return;
    }

    audio?.startAudio?.();
    state.hasStarted = true;
    state.currentLevelIndex = savedRun.currentLevelIndex;
    state.score = savedRun.score;
    state.moves = savedRun.moves;
    state.coins = savedRun.coins;
    state.sessionHighestLevel = savedRun.sessionHighestLevel;
    hideMainMenu(refs);
    hideGameOverScreen(refs);
    hideVictoryScreen(refs);
    showGameScreen(refs);
    resetGame(false, true);
  }

  function previewLevel(levelNumber) {
    const nextIndex = Math.max(0, Math.min(levels.length - 1, Number(levelNumber) - 1));
    state.currentLevelIndex = nextIndex;
    state.score = 0;
    state.moves = 0;
    state.matches = 0;
    resetGame(false, true);
  }

  function getDebugValue(key) {
    return state[key];
  }

  function setDebugValue(key, value) {
    if (!Object.prototype.hasOwnProperty.call(state, key)) {
      return;
    }

    if (key === "currentLevelIndex") {
      state.currentLevelIndex = Math.max(0, Math.min(levels.length - 1, Number(value) || 0));
      return;
    }

    state[key] = value;
  }

  return {
    closeShopModal,
    getDebugValue,
    handleOverlayButton,
    handleRestartButton,
    initialize,
    openMenuInfo,
    openShopModal,
    continueSavedRun,
    playAgainFromGameOver,
    playAgainFromVictory,
    previewLevel,
    backToHome,
    resetGame,
    setDebugValue,
    startGameFromMenu,
    togglePause,
    useShopItem: useShopItemBound,
  };
}
