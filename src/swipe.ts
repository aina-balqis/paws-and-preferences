interface SwipeOptions {
  onLike: () => void;
  onDislike: () => void;
}

export function initSwipe(card: HTMLElement, options: SwipeOptions) {
  let startX = 0;
  let currentX = 0;

  card.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
  });

  card.addEventListener("touchmove", e => {
    currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    card.style.transform = `translateX(${diff}px) rotate(${diff / 15}deg)`;
  });

  card.addEventListener("touchend", () => {
    const diff = currentX - startX;

    if (diff > 120) {
      card.classList.add("like");
      options.onLike();
    } else if (diff < -120) {
      card.classList.add("dislike");
      options.onDislike();
    } else {
      card.style.transform = "";
    }
  });
}
