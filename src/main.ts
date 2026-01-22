import { initSwipe } from './swipe';
import { Cat, AppConfig } from './types';

class PawsAndPreferences {
  private config: AppConfig = {
    totalCats: 12,
    swipeThreshold: 120,
    apiBaseUrl: 'https://cataas.com/cat'
  };

  private cats: Cat[] = [];
  private likedCats: Cat[] = [];
  private currentIndex: number = 0;
  private isAnimating: boolean = false;
  private swipeManager: any = null;

  // DOM Elements
  private cardStack!: HTMLElement;
  private summarySection!: HTMLElement;
  private likeButton!: HTMLElement;
  private dislikeButton!: HTMLElement;
  private progressBar!: HTMLElement;
  private progressText!: HTMLElement;
  private restartButton: HTMLElement | null = null;
  private loadingOverlay!: HTMLElement;

  constructor() {
    this.initializeDOM();
    this.initializeCats();
    this.setupEventListeners();
    this.showCurrentCard();
  }

  private initializeDOM(): void {
    this.cardStack = document.getElementById('card-stack') as HTMLElement;
    this.summarySection = document.getElementById('summary') as HTMLElement;
    this.likeButton = document.getElementById('like-btn') as HTMLElement;
    this.dislikeButton = document.getElementById('dislike-btn') as HTMLElement;
    this.progressBar = document.getElementById('progress-bar') as HTMLElement;
    this.progressText = document.getElementById('progress-text') as HTMLElement;
    this.loadingOverlay = document.getElementById('loading-overlay') as HTMLElement;
  }

  private initializeCats(): void {
    this.cats = Array.from({ length: this.config.totalCats }, (_, index) => ({
      id: index + 1,
      imageUrl: `${this.config.apiBaseUrl}?width=400&height=500&random=${Date.now() + index}`,
      liked: false,
      viewed: false
    })) as (Cat & { viewed: boolean })[];

    // Preload first few images untuk better UX
    this.preloadImages(this.cats.slice(0, 3).map(cat => cat.imageUrl));
  }

  private async preloadImages(urls: string[]): Promise<void> {
    const promises = urls.map(url => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = url;
      });
    });
    await Promise.all(promises);
  }

  private setupEventListeners(): void {
    this.likeButton.addEventListener('click', () => this.handleLike());
    this.dislikeButton.addEventListener('click', () => this.handleDislike());

    // Keyboard support
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
        case 'Enter':
          if (this.currentIndex >= this.cats.length) {
            this.restartButton?.click();
          }
          break;
      }
    });

    // Prevent default touch behavior
    this.cardStack.addEventListener('touchmove', (e) => {
      if (this.isAnimating) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  private showCurrentCard(): void {
    if (this.currentIndex >= this.cats.length) {
      this.showSummary();
      return;
    }

    const currentCat = this.cats[this.currentIndex] as Cat & { viewed: boolean };
    currentCat.viewed = true;
    this.createCard(currentCat);
    this.updateProgress();
  }

  private createCard(cat: Cat): void {
    this.cardStack.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'cat-card card-enter';
    card.dataset.id = cat.id.toString();

    // Add counter
    const counter = document.createElement('div');
    counter.className = 'card-counter';
    counter.textContent = `${this.currentIndex + 1}/${this.config.totalCats}`;
    card.appendChild(counter);

    // Create image dengan loading state
    const img = new Image();
    img.onload = () => {
      card.style.backgroundImage = `url(${cat.imageUrl})`;
      card.classList.remove('loading');
      
      // Add swipe indicator
      const indicator = document.createElement('div');
      indicator.className = 'swipe-indicator';
      card.appendChild(indicator);
      
      // Hide loading overlay setelah image loaded
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
    
    // Show loading state
    card.classList.add('loading');
    img.src = cat.imageUrl;

    // Add overlay dengan SCSS classes
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
    
    // Initialize swipe dengan visual feedback
    this.swipeManager = initSwipe(card, {
      onLike: () => {
        card.classList.add('swipe-right');
        const indicator = card.querySelector('.swipe-indicator') as HTMLElement;
        if (indicator) {
          indicator.style.background = 'linear-gradient(135deg, #1dd1a1, #10ac84)';
          indicator.textContent = 'LIKE ❤️';
          indicator.classList.add('visible');
        }
        setTimeout(() => this.handleLike(), 300);
      },
      onDislike: () => {
        card.classList.add('swipe-left');
        const indicator = card.querySelector('.swipe-indicator') as HTMLElement;
        if (indicator) {
          indicator.style.background = 'linear-gradient(135deg, #ff4757, #ff3838)';
          indicator.textContent = 'DISLIKE 👎';
          indicator.classList.add('visible');
        }
        setTimeout(() => this.handleDislike(), 300);
      }
    });

    this.cardStack.appendChild(card);
    
    // Preload next image
    if (this.currentIndex + 1 < this.cats.length) {
      this.preloadImages([this.cats[this.currentIndex + 1].imageUrl]);
    }
  }

  private hideLoadingOverlay(): void {
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.add('fade-out');
      setTimeout(() => {
        this.loadingOverlay.style.display = 'none';
      }, 500);
    }
  }

  private handleLike(): void {
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

  private handleDislike(): void {
    if (this.isAnimating || this.currentIndex >= this.cats.length) return;
    
    this.isAnimating = true;
    const currentCard = this.cardStack.querySelector('.cat-card');
    currentCard?.classList.add('exit-left');
    
    this.animateButton(this.dislikeButton);
    
    setTimeout(() => {
      this.moveToNextCard();
    }, 300);
  }

  private animateButton(button: HTMLElement): void {
    button.classList.add('pulse');
    setTimeout(() => {
      button.classList.remove('pulse');
    }, 300);
  }

  private moveToNextCard(): void {
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

  private updateProgress(): void {
    const progress = ((this.currentIndex + 1) / this.config.totalCats) * 100;
    this.progressBar.style.width = `${progress}%`;
    this.progressText.textContent = `${this.currentIndex + 1}/${this.config.totalCats}`;
    
    // Update percentage text
    const percentageElement = this.progressText.querySelector('.progress-percentage') as HTMLElement;
    if (percentageElement) {
      percentageElement.textContent = `${Math.round(progress)}%`;
    }
  }

  private showSummary(): void {
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

  private generateSummaryHTML(): string {
    const percentage = Math.round((this.likedCats.length / this.config.totalCats) * 100);
    let message = '';
    
    if (percentage === 100) {
      message = 'Purrfect! You loved them all! 🎉';
    } else if (percentage >= 80) {
      message = 'You really love cats! 😻';
    } else if (percentage >= 50) {
      message = 'You found some favorites! 🐾';
    } else if (percentage >= 20) {
      message = 'A few cats caught your eye! 👀';
    } else if (percentage > 0) {
      message = 'At least you found one you like! 😸';
    } else {
      message = 'No cats captured your heart this time... 😿';
    }

    return `
      <div class="summary-content fade-in-up">
        <div class="summary-header">
          <i class="fas fa-trophy"></i>
          <h2>Your Cat Preferences!</h2>
          <p class="lead">You liked ${this.likedCats.length} out of ${this.config.totalCats} cats</p>
          <div class="match-percentage">
            <div class="percentage-circle">
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="#f0f0f0" stroke-width="12"/>
                <circle cx="60" cy="60" r="54" fill="none" stroke="url(#gradient)" 
                        stroke-width="12" stroke-linecap="round"
                        stroke-dasharray="${percentage * 3.4} ${340 - (percentage * 3.4)}"
                        stroke-dashoffset="85" transform="rotate(-90 60 60)"/>
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#ff6b6b"/>
                    <stop offset="100%" stop-color="#ff4757"/>
                  </linearGradient>
                </defs>
              </svg>
              <div class="percentage-text">${percentage}%</div>
            </div>
            <p class="match-message">${message}</p>
          </div>
        </div>
        
        ${this.likedCats.length > 0 ? `
          <div class="liked-cats-section">
            <h4><i class="fas fa-heart"></i> Your Liked Cats</h4>
            <div class="liked-cats-grid">
              ${this.likedCats.map(cat => `
                <div class="liked-cat-card">
                  <div class="liked-cat-image" style="background-image: url('${cat.imageUrl}')">
                    <div class="liked-overlay">
                      <i class="fas fa-heart"></i>
                      <span>Cat #${cat.id}</span>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : `
          <div class="no-likes">
            <i class="fas fa-cat fa-4x mb-3"></i>
            <h4>No cats liked this time</h4>
            <p class="text-muted">Don't worry, there are plenty more cats to discover!</p>
          </div>
        `}
        
        <button id="restart-btn" class="restart-button">
          <i class="fas fa-redo"></i> Start Over with New Cats
        </button>
        
        <div class="summary-footer">
          <small class="text-muted">
            <i class="fas fa-clock"></i> Session: ${new Date().toLocaleDateString()}
            • <i class="fas fa-swipe"></i> ${this.config.totalCats} cats reviewed
          </small>
        </div>
      </div>
    `;
  }

  private setupRestartButton(): void {
    setTimeout(() => {
      this.restartButton = document.getElementById('restart-btn');
      this.restartButton?.addEventListener('click', () => this.restart());
    }, 100);
  }

  private restart(): void {
    this.currentIndex = 0;
    this.likedCats = [];
    this.cats.forEach(cat => {
      cat.liked = false;
      (cat as Cat & { viewed: boolean }).viewed = false;
    });
    
    // Reinitialize dengan new random images
    this.initializeCats();
    
    // Reset UI
    this.cardStack.style.display = '';
    this.likeButton.style.display = '';
    this.dislikeButton.style.display = '';
    document.querySelector('.progress-container')?.classList.remove('hidden');
    document.querySelector('.instructions')?.classList.remove('hidden');
    document.querySelector('.keyboard-hint')?.classList.remove('hidden');
    this.summarySection.classList.remove('active');
    this.summarySection.classList.add('hidden');
    
    // Show loading overlay again
    this.loadingOverlay.style.display = 'flex';
    this.loadingOverlay.classList.remove('fade-out');
    
    // Show first card
    setTimeout(() => {
      this.showCurrentCard();
    }, 500);
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Add some basic error handling
  try {
    new PawsAndPreferences();
    console.log('🐱 Paws & Preferences app initialized successfully!');
  } catch (error) {
    console.error('Failed to initialize app:', error);
    
    // Show error message to user
    const container = document.querySelector('.container');
    if (container) {
      container.innerHTML = `
        <div class="error-container text-center py-5">
          <i class="fas fa-exclamation-triangle fa-4x text-danger mb-3"></i>
          <h3>Oops! Something went wrong</h3>
          <p class="text-muted">We couldn't load the cat matching app.</p>
          <button onclick="location.reload()" class="btn btn-primary mt-3">
            <i class="fas fa-redo"></i> Try Again
          </button>
        </div>
      `;
    }
  }
});

// Global error handler untuk uncaught errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

// Register service worker jika supported
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('ServiceWorker registered:', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed:', error);
      });
  });
}