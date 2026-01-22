import { initSwipe } from './swipe.js';

class PawsAndPreferences {
    constructor() {
        this.config = {
            totalCats: 12,
            swipeThreshold: 120,
            apiBaseUrl: 'https://cataas.com/cat'
        };
        this.cats = [];
        this.likedCats = [];
        this.currentIndex = 0;
        this.isAnimating = false;
        this.swipeManager = null;
        this.restartButton = null;
        
        this.initializeDOM( );
        this.initializeCats();
        this.setupEventListeners();
        
        // Terus tunjuk kad pertama tanpa tunggu semua preloading selesai
        this.showCurrentCard();
    }

    initializeDOM() {
        this.cardStack = document.getElementById('card-stack');
        this.summarySection = document.getElementById('summary');
        this.likeButton = document.getElementById('like-btn');
        this.dislikeButton = document.getElementById('dislike-btn');
        this.progressBar = document.getElementById('progress-bar');
        this.progressText = document.getElementById('progress-text');
        this.loadingOverlay = document.getElementById('loading-overlay');
    }

    initializeCats() {
        this.cats = Array.from({ length: this.config.totalCats }, (_, index) => ({
            id: index + 1,
            // Gunakan saiz yang lebih kecil untuk pemuatan lebih pantas
            imageUrl: `${this.config.apiBaseUrl}?width=350&height=450&random=${Date.now() + index}`,
            liked: false,
            viewed: false
        }));
        
        // Preload gambar seterusnya di latar belakang (background)
        this.preloadNextImages(1);
    }

    async preloadNextImages(startIndex) {
        const nextImages = this.cats.slice(startIndex, startIndex + 3).map(cat => cat.imageUrl);
        nextImages.forEach(url => {
            const img = new Image();
            img.src = url;
        });
    }

    setupEventListeners() {
        this.likeButton.addEventListener('click', () => this.handleLike());
        this.dislikeButton.addEventListener('click', () => this.handleDislike());
        
        document.addEventListener('keydown', (e) => {
            if (this.isAnimating || this.currentIndex >= this.cats.length) return;
            switch (e.key) {
                case 'ArrowRight':
                case 'd':
                case 'D':
                    e.preventDefault();
                    this.handleLike();
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    e.preventDefault();
                    this.handleDislike();
                    break;
            }
        });

        this.cardStack.addEventListener('touchmove', (e) => {
            if (this.isAnimating) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    showCurrentCard() {
        if (this.currentIndex >= this.cats.length) {
            this.showSummary();
            return;
        }
        const currentCat = this.cats[this.currentIndex];
        currentCat.viewed = true;
        this.createCard(currentCat);
        this.updateProgress();
    }

    createCard(cat) {
        this.cardStack.innerHTML = '';
        const card = document.createElement('div');
        card.className = 'cat-card card-enter';
        card.dataset.id = cat.id.toString();

        const counter = document.createElement('div');
        counter.className = 'card-counter';
        counter.textContent = `${this.currentIndex + 1}/${this.config.totalCats}`;
        card.appendChild(counter);

        const img = new Image();
        img.onload = () => {
            card.style.backgroundImage = `url(${cat.imageUrl})`;
            card.classList.remove('loading');
            const indicator = document.createElement('div');
            indicator.className = 'swipe-indicator';
            card.appendChild(indicator);
            
            // Tutup loading overlay sebaik sahaja gambar pertama sedia
            this.hideLoadingOverlay();
        };
        img.onerror = () => {
            card.classList.remove('loading');
            card.classList.add('error');
            card.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-cat fa-4x mb-3"></i>
                    <h3>Cat #${cat.id}</h3>
                    <p>This cat is camera shy!</p>
                    <small>Image failed to load</small>
                </div>
            `;
            this.hideLoadingOverlay();
        };

        card.classList.add('loading');
        img.src = cat.imageUrl;

        const overlay = document.createElement('div');
        overlay.className = 'card-overlay';
        overlay.innerHTML = `
            <div class="card-info">
                <h3>Cat #${cat.id}</h3>
                <p>Will this kitty capture your heart?</p>
                <div class="swipe-hint">
                    <span class="hint-left">👎 Dislike</span>
                    <span class="hint-right">Like 👍</span>
                </div>
            </div>
        `;
        card.appendChild(overlay);

        this.swipeManager = initSwipe(card, {
            onLike: () => {
                card.classList.add('swipe-right');
                const indicator = card.querySelector('.swipe-indicator');
                if (indicator) {
                    indicator.style.background = 'linear-gradient(135deg, #1dd1a1, #10ac84)';
                    indicator.textContent = 'LIKE ❤️';
                    indicator.classList.add('visible');
                }
                setTimeout(() => this.handleLike(), 300);
            },
            onDislike: () => {
                card.classList.add('swipe-left');
                const indicator = card.querySelector('.swipe-indicator');
                if (indicator) {
                    indicator.style.background = 'linear-gradient(135deg, #ff4757, #ff3838)';
                    indicator.textContent = 'DISLIKE 👎';
                    indicator.classList.add('visible');
                }
                setTimeout(() => this.handleDislike(), 300);
            }
        });
        this.cardStack.appendChild(card);

        // Preload gambar seterusnya secara senyap
        if (this.currentIndex + 1 < this.cats.length) {
            this.preloadNextImages(this.currentIndex + 1);
        }
    }

    hideLoadingOverlay() {
        if (this.loadingOverlay && this.loadingOverlay.style.display !== 'none') {
            this.loadingOverlay.classList.add('fade-out');
            setTimeout(() => {
                this.loadingOverlay.style.display = 'none';
            }, 500);
        }
    }

    handleLike() {
        if (this.isAnimating || this.currentIndex >= this.cats.length) return;
        this.isAnimating = true;
        const currentCard = this.cardStack.querySelector('.cat-card');
        currentCard?.classList.add('exit-right');
        this.animateButton(this.likeButton);
        setTimeout(() => {
            const currentCat = this.cats[this.currentIndex];
            currentCat.liked = true;
            this.likedCats.push(currentCat);
            this.moveToNextCard();
        }, 300);
    }

    handleDislike() {
        if (this.isAnimating || this.currentIndex >= this.cats.length) return;
        this.isAnimating = true;
        const currentCard = this.cardStack.querySelector('.cat-card');
        currentCard?.classList.add('exit-left');
        this.animateButton(this.dislikeButton);
        setTimeout(() => {
            this.moveToNextCard();
        }, 300);
    }

    animateButton(button) {
        button.classList.add('pulse');
        setTimeout(() => {
            button.classList.remove('pulse');
        }, 300);
    }

    moveToNextCard() {
        this.currentIndex++;
        if (this.currentIndex < this.cats.length) {
            setTimeout(() => {
                this.isAnimating = false;
                this.showCurrentCard();
            }, 400);
        } else {
            setTimeout(() => {
                this.isAnimating = false;
                this.showSummary();
            }, 400);
        }
    }

    updateProgress() {
        const progress = ((this.currentIndex + 1) / this.config.totalCats) * 100;
        this.progressBar.style.width = `${progress}%`;
        this.progressText.textContent = `${this.currentIndex + 1}/${this.config.totalCats}`;
    }

    showSummary() {
        this.cardStack.style.display = 'none';
        this.likeButton.style.display = 'none';
        this.dislikeButton.style.display = 'none';
        document.querySelector('.progress-container')?.classList.add('hidden');
        document.querySelector('.instructions')?.classList.add('hidden');
        document.querySelector('.keyboard-hint')?.classList.add('hidden');
        this.summarySection.classList.remove('hidden');
        this.summarySection.classList.add('active');
        this.summarySection.innerHTML = this.generateSummaryHTML();
        this.setupRestartButton();
    }

    generateSummaryHTML() {
        const percentage = Math.round((this.likedCats.length / this.config.totalCats) * 100);
        let message = '';
        if (percentage === 100) message = 'Purrfect! You loved them all! 🎉';
        else if (percentage >= 80) message = 'You really love cats! 😻';
        else if (percentage >= 50) message = 'You found some favorites! 🐾';
        else if (percentage >= 20) message = 'A few cats caught your eye! 👀';
        else if (percentage > 0) message = 'At least you found one you like! 😸';
        else message = 'No cats captured your heart this time... 😿';

        const gridHTML = this.likedCats.length > 0 
            ? `<div class="liked-cats-grid">
                ${this.likedCats.map(cat => `
                    <div class="liked-cat-card">
                        <div class="liked-cat-image" style="background-image: url(${cat.imageUrl})"></div>
                        <div class="liked-cat-info">Cat #${cat.id}</div>
                    </div>
                `).join('')}
               </div>`
            : `<div class="no-likes">
                <i class="fas fa-heart-broken fa-3x"></i>
                <h4>No matches yet</h4>
                <p>Maybe you're more of a dog person?</p>
               </div>`;

        return `
            <div class="summary-content fade-in-up">
                <div class="summary-header">
                    <i class="fas fa-trophy"></i>
                    <h2>Your Cat Preferences!</h2>
                    <p class="lead">You liked ${this.likedCats.length} out of ${this.config.totalCats} cats</p>
                    <p>${message}</p>
                </div>
                ${gridHTML}
                <button id="restart-btn" class="restart-button">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        `;
    }

    setupRestartButton() {
        this.restartButton = document.getElementById('restart-btn');
        this.restartButton?.addEventListener('click', () => {
            window.location.reload();
        });
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new PawsAndPreferences();
});
