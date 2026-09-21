import { createAudioManager } from "./js/audio.js";
import { createGame } from "./js/game.js";
import { loadAudioSettings } from "./js/storage.js";
import { getRefs } from "./js/ui.js";

const refs = getRefs(document);
const audioSettings = loadAudioSettings("memory-card-audio-settings");
const audio = createAudioManager({
  bgmSrc: "./assets/audio/music/Find Pou_Memory - Pou (REMIX) [vQj91VsSWrg].mp3",
  initialMusicVolume: audioSettings.music / 100,
  initialEffectsVolume: audioSettings.effects / 100,
  initialMuted: audioSettings.muted,
});
const game = createGame(refs, audio);

refs.shopButton.addEventListener("click", game.openShopModal);
refs.pauseButton.addEventListener("click", game.togglePause);
refs.restartButton.addEventListener("click", game.handleRestartButton);
refs.startGameButton.addEventListener("click", game.startGameFromMenu);
refs.continueGameButton.addEventListener("click", game.continueSavedRun);
refs.menuStatsButton.addEventListener("click", () => game.openMenuInfo("statistics"));
refs.menuSettingsButton.addEventListener("click", () => game.openMenuInfo("settings"));
refs.menuCreditsButton.addEventListener("click", () => game.openMenuInfo("credits"));
refs.playAgainButton.addEventListener("click", game.playAgainFromGameOver);
refs.backToHomeButton.addEventListener("click", game.backToHome);
refs.victoryPlayAgainButton.addEventListener("click", game.playAgainFromVictory);
refs.victoryBackHomeButton.addEventListener("click", game.backToHome);
refs.shopButtons.forEach((button) => {
  button.addEventListener("click", () => {
    game.useShopItem(button.dataset.shopItem);
  });
});
refs.shopCloseButton.addEventListener("click", game.closeShopModal);
refs.shopModalEl.addEventListener("click", (event) => {
  if (event.target === refs.shopModalEl) {
    game.closeShopModal();
  }
});
refs.overlayButton.addEventListener("click", game.handleOverlayButton);
refs.overlayHomeButton.addEventListener("click", game.backToHome);

window.resetGame = (...args) => game.resetGame(...args);
window.previewLevel = (levelNumber) => game.previewLevel(levelNumber);

["currentLevelIndex", "score", "moves", "matches"].forEach((key) => {
  Object.defineProperty(window, key, {
    configurable: true,
    get() {
      return game.getDebugValue(key);
    },
    set(value) {
      game.setDebugValue(key, value);
    },
  });
});

game.initialize();
