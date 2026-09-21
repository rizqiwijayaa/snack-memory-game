import { findHintPair, getHiddenPlayableButtons, revealCardsTemporarily, shuffleBoard } from "./cards.js";

export async function useShopItem(ctx, itemKey) {
  const { refs, state, items, spendCoins, animatePurchase, closeShopModal, setMessage, updateStats, saveStats, saveProgress, shuffle } = ctx;
  const blockedByPause = state.isPaused && refs.shopModalEl.classList.contains("hidden");
  if (state.gameFinished || blockedByPause || state.revealInProgress || state.hintInProgress || state.lockBoard) {
    return;
  }

  const item = items[itemKey];
  if (!item || !spendCoins(item.price)) {
    updateStats();
    return;
  }

  animatePurchase(itemKey);
  closeShopModal();

  if (itemKey === "extra-time") {
    state.timeLeft += 5;
    setMessage("Extra time!", "You gained 5 more seconds.");
    updateStats();
    saveProgress?.();
    return;
  }

  if (itemKey === "reveal-cards") {
    const buttons = getHiddenPlayableButtons(refs);
    state.revealInProgress = true;
    state.lockBoard = true;
    setMessage("Reveal cards", "All available cards are open for 2 seconds.");
    updateStats();
    await revealCardsTemporarily(buttons, 2000);
    state.revealInProgress = false;
    state.lockBoard = false;
    updateStats();
    saveProgress?.();
    return;
  }

  if (itemKey === "hint-pair") {
    const pair = findHintPair(refs);
    if (!pair) {
      state.coins += item.price;
      saveStats();
      saveProgress?.();
      setMessage("No hint found", "All remaining pairs are already obvious.");
      updateStats();
      return;
    }

    state.hintInProgress = true;
    state.lockBoard = true;
    setMessage("Hint pair", "Watch these two matching cards.");
    updateStats();
    await revealCardsTemporarily(pair, 1600);
    state.hintInProgress = false;
    state.lockBoard = false;
    updateStats();
    saveProgress?.();
    return;
  }

  if (itemKey === "second-chance") {
    state.secondChanceArmed = true;
    state.secondChanceUsed = false;
    setMessage("Shield ready", "When time runs out, you will get 10 extra seconds once.");
    updateStats();
    saveProgress?.();
    return;
  }

  if (itemKey === "bonus-score") {
    state.score += 100;
    setMessage("Bonus score!", "You gained 100 extra points.");
    updateStats();
    saveProgress?.();
    return;
  }

  if (itemKey === "shuffle-board") {
    shuffleBoard(refs, state.deck, shuffle);
    setMessage("Board shuffled", "The unmatched cards were rearranged.");
    updateStats();
    saveProgress?.();
  }
}
