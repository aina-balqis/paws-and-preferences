import { initSwipe } from "./swipe";

const TOTAL_CATS = 12;
const likedCats: string[] = [];
let currentIndex = 0;

const cardStack = document.getElementById("card-stack")!;
const summary = document.getElementById("summary")!;

const cats = Array.from({ length: TOTAL_CATS }, () =>
  `https://cataas.com/cat?random=${Math.random()}`
);

function createCard(imageUrl: string) {
  const card = document.createElement("div");
  card.className = "cat-card";
  card.style.backgroundImage = `url(${imageUrl})`;

  initSwipe(card, {
    onLike: () => {
      likedCats.push(imageUrl);
      nextCard();
    },
    onDislike: () => nextCard()
  });

  cardStack.appendChild(card);
}

function nextCard() {
  currentIndex++;
  if (currentIndex < cats.length) {
    createCard(cats[currentIndex]);
  } else {
    showSummary();
  }
}

function showSummary() {
  cardStack.innerHTML = "";
  summary.classList.remove("d-none");

  summary.innerHTML = `
    <h4>You liked ${likedCats.length} cats 😻</h4>
    <div class="liked-grid mt-3">
      ${likedCats.map(cat => `<img src="${cat}" />`).join("")}
    </div>
  `;
}

createCard(cats[currentIndex]);
