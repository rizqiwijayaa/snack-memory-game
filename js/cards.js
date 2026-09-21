export function renderBoard(refs, deck, currentLevel, onCardClick) {
  refs.cardGridEl.innerHTML = "";
  refs.cardGridEl.style.gridTemplateColumns = `repeat(${currentLevel.columns}, minmax(0, 1fr))`;

  deck.forEach((cardData) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "card";
    button.dataset.symbol = cardData.symbol;
    button.dataset.id = cardData.id;
    button.setAttribute("aria-label", "Hidden card");
    button.innerHTML = `
      <span class="card-face-side card-back-side">?</span>
      <span class="card-face-side card-front-side">${cardData.symbol}</span>
    `;

    button.addEventListener("click", () => onCardClick(button, cardData));
    refs.cardGridEl.appendChild(button);
  });
}

export function getCardButtons(refs) {
  return [...refs.cardGridEl.querySelectorAll(".card")];
}

export function getPlayableButtons(refs) {
  return getCardButtons(refs).filter((button) => !button.classList.contains("matched"));
}

export function getHiddenPlayableButtons(refs) {
  return getPlayableButtons(refs).filter((button) => !button.classList.contains("flipped"));
}

export function revealCardsTemporarily(buttons, duration) {
  buttons.forEach((button) => {
    button.classList.add("flipped");
    button.setAttribute("aria-label", `Card ${button.dataset.symbol}`);
  });

  return new Promise((resolve) => {
    setTimeout(() => {
      buttons.forEach((button) => {
        if (!button.classList.contains("matched")) {
          button.classList.remove("flipped");
          button.setAttribute("aria-label", "Hidden card");
        }
      });
      resolve();
    }, duration);
  });
}

export function findHintPair(refs) {
  const pairMap = new Map();

  getPlayableButtons(refs).forEach((button) => {
    const symbol = button.dataset.symbol;
    if (!pairMap.has(symbol)) {
      pairMap.set(symbol, []);
    }
    pairMap.get(symbol).push(button);
  });

  for (const pair of pairMap.values()) {
    if (pair.length >= 2) {
      return pair.slice(0, 2);
    }
  }

  return null;
}

function syncDeckFromDom(refs, deck) {
  const cardsById = new Map(deck.map((card) => [card.id, card]));
  getCardButtons(refs).forEach((button) => {
    const card = cardsById.get(button.dataset.id);
    if (card) {
      card.symbol = button.dataset.symbol;
      card.matched = button.classList.contains("matched");
    }
  });
}

export function shuffleBoard(refs, deck, shuffle) {
  const unmatchedButtons = getPlayableButtons(refs);
  const shuffledSymbols = shuffle(unmatchedButtons.map((button) => button.dataset.symbol));

  unmatchedButtons.forEach((button, index) => {
    button.dataset.symbol = shuffledSymbols[index];
    const front = button.querySelector(".card-front-side");
    if (front) {
      front.textContent = shuffledSymbols[index];
    }
  });

  syncDeckFromDom(refs, deck);
}
