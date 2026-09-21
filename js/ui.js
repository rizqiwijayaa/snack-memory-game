export function getRefs(doc) {
  return {
    gameScreenEl: doc.getElementById("gameScreen"),
    gameOverScreenEl: doc.getElementById("gameOverScreen"),
    victoryScreenEl: doc.getElementById("victoryScreen"),
    gamePanelEl: doc.querySelector(".game-panel"),
    scoreEl: doc.getElementById("score"),
    coinsEl: doc.getElementById("coins"),
    movesEl: doc.getElementById("moves"),
    timeValueEl: doc.getElementById("timeValue"),
    timerFillEl: doc.getElementById("timerFill"),
    levelLabelEl: doc.getElementById("levelLabel"),
    cardGridEl: doc.getElementById("cardGrid"),
    shopButton: doc.getElementById("shopButton"),
    pauseButton: doc.getElementById("pauseButton"),
    restartButton: doc.getElementById("restartButton"),
    overlayEl: doc.getElementById("overlay"),
    overlayTagEl: doc.getElementById("overlayTag"),
    overlayTitleEl: doc.getElementById("overlayTitle"),
    overlayTextEl: doc.getElementById("overlayText"),
    overlayButton: doc.getElementById("overlayButton"),
    overlayHomeButton: doc.getElementById("overlayHomeButton"),
    shopModalEl: doc.getElementById("shopModal"),
    shopCloseButton: doc.getElementById("shopCloseButton"),
    mainMenuEl: doc.getElementById("mainMenu"),
    startGameButton: doc.getElementById("startGameButton"),
    continueGameButton: doc.getElementById("continueGameButton"),
    menuStatsButton: doc.getElementById("menuStatsButton"),
    menuSettingsButton: doc.getElementById("menuSettingsButton"),
    menuCreditsButton: doc.getElementById("menuCreditsButton"),
    playAgainButton: doc.getElementById("playAgainButton"),
    backToHomeButton: doc.getElementById("backToHomeButton"),
    victoryPlayAgainButton: doc.getElementById("victoryPlayAgainButton"),
    victoryBackHomeButton: doc.getElementById("victoryBackHomeButton"),
    menuPanelTitleEl: doc.getElementById("menuPanelTitle"),
    menuPanelSubtitleEl: doc.getElementById("menuPanelSubtitle"),
    menuPanelContentEl: doc.getElementById("menuPanelContent"),
    gameOverTitleEl: doc.getElementById("gameOverTitle"),
    gameOverSummaryEl: doc.getElementById("gameOverSummary"),
    victoryTitleEl: doc.getElementById("victoryTitle"),
    victorySummaryEl: doc.getElementById("victorySummary"),
    messageBox: doc.getElementById("messageBox"),
    shopButtons: [...doc.querySelectorAll("[data-shop-item]")],
    gamesPlayedStatEl: doc.getElementById("gamesPlayedStat"),
    bestScoreStatEl: doc.getElementById("bestScoreStat"),
    highestLevelStatEl: doc.getElementById("highestLevelStat"),
    longestWinStreakStatEl: doc.getElementById("longestWinStreakStat"),
  };
}

export function renderPlayerStats(refs, playerStats) {
  refs.gamesPlayedStatEl.textContent = String(playerStats.gamesPlayed);
  refs.bestScoreStatEl.textContent = String(playerStats.bestScore);
  refs.highestLevelStatEl.textContent = String(playerStats.highestLevel);
  refs.longestWinStreakStatEl.textContent = String(playerStats.longestWinStreak);
}

export function updateStats(refs, state, currentLevel, baseGameTime, updateShopButtons) {
  const safeTimeLeft = Math.max(0, state.timeLeft);
  const levelTimeLimit = currentLevel.timeLimit || baseGameTime;
  const timeRatio = Math.max(0, Math.min(1, safeTimeLeft / levelTimeLimit));
  refs.scoreEl.textContent = state.score;
  refs.coinsEl.textContent = state.coins;
  refs.movesEl.textContent = state.moves;
  refs.timeValueEl.textContent = `${safeTimeLeft}s`;
  refs.timerFillEl.style.width = `${timeRatio * 100}%`;
  refs.levelLabelEl.textContent = `Level ${currentLevel.level} - ${currentLevel.pairs} pairs`;
  updateShopButtons();
}

export function setMessage(refs, title, text) {
  refs.messageBox.innerHTML = `
    <p class="preview-title">${title}</p>
    <p class="preview-text">${text}</p>
  `;
}

export function showOverlay(refs, tag, title, text, buttonLabel, showHomeButton = false) {
  refs.overlayTagEl.textContent = tag;
  refs.overlayTitleEl.textContent = title;
  refs.overlayTextEl.innerHTML = text.replace(/\n/g, "<br>");
  refs.overlayButton.textContent = buttonLabel;
  refs.overlayHomeButton.classList.toggle("hidden", !showHomeButton);
  refs.overlayEl.classList.remove("hidden");
}

export function hideOverlay(refs) {
  refs.overlayHomeButton.classList.add("hidden");
  refs.overlayEl.classList.add("hidden");
}

export function openShopModal(refs) {
  refs.shopModalEl.classList.remove("hidden");
  refs.shopModalEl.setAttribute("aria-hidden", "false");
}

export function closeShopModal(refs) {
  refs.shopModalEl.classList.add("hidden");
  refs.shopModalEl.setAttribute("aria-hidden", "true");
}

export function hideMainMenu(refs) {
  refs.mainMenuEl.classList.add("hidden");
  refs.mainMenuEl.setAttribute("aria-hidden", "true");
}

export function showMainMenu(refs) {
  refs.mainMenuEl.classList.remove("hidden");
  refs.mainMenuEl.setAttribute("aria-hidden", "false");
}

export function showGameScreen(refs) {
  refs.gameScreenEl.classList.remove("hidden");
  refs.gameScreenEl.setAttribute("aria-hidden", "false");
}

export function hideGameScreen(refs) {
  refs.gameScreenEl.classList.add("hidden");
  refs.gameScreenEl.setAttribute("aria-hidden", "true");
}

export function showGameOverScreen(refs, title, summaryHtml) {
  refs.gameOverTitleEl.textContent = title;
  refs.gameOverSummaryEl.innerHTML = summaryHtml;
  refs.gameOverScreenEl.classList.remove("hidden");
  refs.gameOverScreenEl.setAttribute("aria-hidden", "false");
}

export function hideGameOverScreen(refs) {
  refs.gameOverScreenEl.classList.add("hidden");
  refs.gameOverScreenEl.setAttribute("aria-hidden", "true");
}

export function showVictoryScreen(refs, title, summaryHtml) {
  refs.victoryTitleEl.textContent = title;
  refs.victorySummaryEl.innerHTML = summaryHtml;
  refs.victoryScreenEl.classList.remove("hidden");
  refs.victoryScreenEl.setAttribute("aria-hidden", "false");
}

export function hideVictoryScreen(refs) {
  refs.victoryScreenEl.classList.add("hidden");
  refs.victoryScreenEl.setAttribute("aria-hidden", "true");
}

export function showMenuPanel(refs, title, subtitle, content) {
  refs.menuPanelTitleEl.textContent = title;
  refs.menuPanelSubtitleEl.textContent = subtitle;
  refs.menuPanelContentEl.innerHTML = content;
}

export function updateContinueButton(refs, hasProgress) {
  refs.continueGameButton.disabled = !hasProgress;
  refs.continueGameButton.setAttribute("aria-disabled", String(!hasProgress));
}

export function updateShopButtons(refs, state, items) {
  refs.shopButtons.forEach((button) => {
    const itemKey = button.dataset.shopItem;
    const item = items[itemKey];
    const blockedByPause = state.isPaused && refs.shopModalEl.classList.contains("hidden");
    let disabled =
      state.gameFinished ||
      blockedByPause ||
      state.revealInProgress ||
      state.hintInProgress ||
      state.lockBoard ||
      state.coins < item.price;

    if (itemKey === "second-chance" && (state.secondChanceArmed || state.secondChanceUsed)) {
      disabled = true;
    }

    if (itemKey === "shuffle-board" && !state.deck.some((card) => !card.matched)) {
      disabled = true;
    }

    button.disabled = disabled;
  });
}

export function animateShopPurchase(refs, itemKey) {
  const button = refs.shopButtons.find((shopButtonEl) => shopButtonEl.dataset.shopItem === itemKey);
  if (!button) {
    return;
  }

  button.classList.add("is-buying");
  setTimeout(() => {
    button.classList.remove("is-buying");
  }, 180);
}

export function animateMatchedCards(cards) {
  cards.forEach((card) => {
    card.classList.add("matched-pop");
    setTimeout(() => {
      card.classList.remove("matched-pop");
    }, 520);
  });
}

export function animateLevelClear(refs) {
  if (!refs.gamePanelEl) {
    return;
  }

  refs.gamePanelEl.classList.add("level-clear-burst");
  setTimeout(() => {
    refs.gamePanelEl.classList.remove("level-clear-burst");
  }, 900);
}
