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
        
        this.initializeDOM();
        this.initializeCats();
        this.setupEventListeners();
        
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
        this.swipedCount = document.getElementById('swiped-count'); // TAMBAH INI
        this.catCount = document.getElementById('cat-count'); // TAMBAH INI
    }

    initializeCats() {
        this.cats = Array.from({ length: this.config.totalCats }, (_, index) => ({
            id: index + 1,
            imageUrl: `${this.config.apiBaseUrl}?width=350&height=450&random=${Date.now() + index}`,
            liked: false,
            viewed: false
        }));
        
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
        
        // Meow button
        const meowBtn = document.getElementById('meow-btn');
        if (meowBtn) {
            meowBtn.addEventListener('click', () => this.playMeowSound());
        }
        
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
        
        // Update swiped count
        if (this.swipedCount) {
            this.swipedCount.textContent = this.currentIndex;
        }
        
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
        // Debug log
        console.log("🎉 Showing summary!");
        console.log("Liked cats:", this.likedCats.length);
        
        // Hide main interface
        this.cardStack.style.display = 'none';
        this.likeButton.style.display = 'none';
        this.dislikeButton.style.display = 'none';
        
        // Hide instruction sections - FIX: Use correct selectors
        const elementsToHide = [
            '.progress-container',
            '.instructions', 
            '.keyboard-hint'
        ];
        
        elementsToHide.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.classList.add('hidden');
            }
        });
        
        // Show summary - FIX: Remove 'active' class yang tak perlu
        this.summarySection.classList.remove('hidden');
        
        // Generate and display summary content
        this.summarySection.innerHTML = this.generateSummaryHTML();
        
        // Setup event listeners for summary buttons
        this.setupSummaryButtons();
        
        // Add confetti effect
        this.createConfetti();
        
        // Scroll to summary
        setTimeout(() => {
            this.summarySection.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }

    generateSummaryHTML() {
        const totalLikes = this.likedCats.length;
        const percentage = Math.round((totalLikes / this.config.totalCats) * 100);
        
        // Determine cat personality
        let personality = '';
        if (percentage === 100) personality = 'The Ultimate Cat Lover 😻';
        else if (percentage >= 80) personality = 'Cat Enthusiast 🐱';
        else if (percentage >= 50) personality = 'Cat Admirer 🐾';
        else if (percentage >= 20) personality = 'Selective Cat Friend 😼';
        else if (percentage > 0) personality = 'Casual Cat Observer 👀';
        else personality = 'Mysterious Cat Watcher 🐈‍⬛';
        
        // Determine message
        let message = '';
        if (percentage === 100) message = 'Purrfect! You loved every single kitty! 🎉';
        else if (percentage >= 80) message = 'Wow! You really adore cats! 😻';
        else if (percentage >= 50) message = 'You found some purrfect matches! 🐾';
        else if (percentage >= 20) message = 'A few kitties caught your eye! 👀';
        else if (percentage > 0) message = 'At least one kitty stole your heart! 😸';
        else message = 'No cats captured your heart this time... 😿';
        
        // Generate cat names for liked cats
        const catNames = [
            "Whiskers", "Luna", "Simba", "Bella", "Oliver", "Chloe", 
            "Leo", "Lily", "Milo", "Coco", "Max", "Lucy"
        ];
        
        // Generate tags for each cat
        const allTags = ["Fluffy", "Playful", "Cuddly", "Adventurous", "Gentle", 
                        "Curious", "Sweet", "Energetic", "Calm", "Loving"];

        const gridHTML = totalLikes > 0 
            ? `<div class="liked-cats-grid">
                ${this.likedCats.map((cat, index) => {
                    const catName = catNames[index % catNames.length];
                    const tags = [allTags[index % allTags.length], allTags[(index + 2) % allTags.length]];
                    
                    return `
                    <div class="liked-cat-card">
                        <div class="liked-cat-image" style="background-image: url(${cat.imageUrl})">
                            <div class="cat-number">${index + 1}</div>
                        </div>
                        <div class="liked-cat-info">
                            <h5>${catName}</h5>
                            <div class="liked-cat-tags">
                                ${tags.map(tag => `<span class="liked-cat-tag">${tag}</span>`).join('')}
                            </div>
                            <p class="cat-age">Cat #${cat.id}</p>
                        </div>
                    </div>
                    `;
                }).join('')}
               </div>`
            : `<div class="no-likes">
                <div class="sad-cat">
                    <i class="fas fa-cat fa-3x"></i>
                    <i class="fas fa-heart-broken fa-2x"></i>
                </div>
                <h4>No kitties caught your heart? 😿</h4>
                <p>Don't worry! Maybe these kitties were too shy. Try again!</p>
                <div class="cat-advice">
                    <p><i class="fas fa-lightbulb"></i> <strong>Tip:</strong> Be more open to different types of cats!</p>
                </div>
               </div>`;

        return `
            <div class="summary-content">
                <div class="summary-header">
                    <div class="summary-icon">
                        <i class="fas fa-trophy"></i>
                        <div class="confetti-effect"></div>
                    </div>
                    <h2>Meow-tastic! 🎉</h2>
                    <p class="lead">You are: <span class="highlight">${personality}</span></p>
                    <p>${message}</p>
                    
                    <div class="match-score">
                        <div class="score-card">
                            <i class="fas fa-heart"></i>
                            <h3>${totalLikes}</h3>
                            <p>Loved Kitties</p>
                        </div>
                        <div class="score-card">
                            <i class="fas fa-paw"></i>
                            <h3>${this.config.totalCats}</h3>
                            <p>Total Kitties</p>
                        </div>
                        <div class="score-card">
                            <i class="fas fa-chart-line"></i>
                            <h3>${percentage}%</h3>
                            <p>Match Rate</p>
                        </div>
                    </div>
                </div>
                
                <div class="summary-body">
                    <h4><i class="fas fa-cat"></i> Your Favorite Kitties (${totalLikes})</h4>
                    ${gridHTML}
                    
                    <div class="summary-actions">
                        <button id="restart-btn" class="btn-restart">
                            <i class="fas fa-redo"></i>
                            Play Again with New Kitties!
                        </button>
                        <button id="share-btn" class="btn-share">
                            <i class="fas fa-share-alt"></i>
                            Share My Results
                        </button>
                    </div>
                    
                    <div class="fun-facts">
                        <h5><i class="fas fa-lightbulb"></i> Fun Cat Facts</h5>
                        <div class="facts-container">
                            <div class="fact">
                                <i class="fas fa-paw"></i>
                                <p>Cats sleep 12-16 hours a day!</p>
                            </div>
                            <div class="fact">
                                <i class="fas fa-heart"></i>
                                <p>A cat's heart beats twice as fast as a human's!</p>
                            </div>
                            <div class="fact">
                                <i class="fas fa-brain"></i>
                                <p>Cats have 32 muscles in each ear!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupSummaryButtons() {
        const restartBtn = document.getElementById('restart-btn');
        const shareBtn = document.getElementById('share-btn');
        
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restartApp());
        }
        
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareResults());
        }
    }

    restartApp() {
        // Hide summary
        this.summarySection.classList.add('hidden');
        this.summarySection.innerHTML = '';
        
        // Show main interface
        this.cardStack.style.display = '';
        this.likeButton.style.display = '';
        this.dislikeButton.style.display = '';
        
        // Show instruction sections
        const elementsToShow = [
            '.progress-container',
            '.instructions', 
            '.keyboard-hint'
        ];
        
        elementsToShow.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.classList.remove('hidden');
            }
        });
        
        // Reset game state
        this.currentIndex = 0;
        this.likedCats = [];
        this.isAnimating = false;
        
        // Reset swiped count
        if (this.swipedCount) {
            this.swipedCount.textContent = '0';
        }
        
        // Reset progress
        this.updateProgress();
        
        // Generate new cats
        this.initializeCats();
        
        // Show first card
        setTimeout(() => {
            this.showCurrentCard();
            
            // Scroll back to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 300);
    }

    shareResults() {
        const totalLikes = this.likedCats.length;
        const catNames = this.likedCats.slice(0, 3).map((cat, index) => {
            const names = ["Whiskers", "Luna", "Simba", "Bella", "Oliver", "Chloe"];
            return names[index % names.length];
        }).join(', ');
        
        const shareText = `🐱 I found ${totalLikes} purrfect cats on MeowMatch! ` +
                         `${totalLikes > 0 ? `My favorites: ${catNames}${totalLikes > 3 ? ' and more!' : ''}` : ''} ` +
                         `Try it at: ${window.location.href}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'My MeowMatch Results',
                text: shareText,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(shareText);
            alert('Results copied to clipboard! 📋');
        }
    }

    createConfetti() {
        const container = document.getElementById('confetti-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        const colors = ['#FF69B4', '#9370DB', '#FFD700', '#ADD8E6'];
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = `${Math.random() * 100}vw`;
            confetti.style.top = '-10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.width = `${Math.random() * 10 + 5}px`;
            confetti.style.height = confetti.style.width;
            confetti.style.opacity = '0.8';
            confetti.style.animation = `floatBubble ${Math.random() * 3 + 2}s linear forwards`;
            
            container.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, 5000);
        }
    }

    playMeowSound() {
        try {
            // Create simple meow sound using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            
            // Visual feedback
            const meowBtn = document.getElementById('meow-btn');
            if (meowBtn) {
                meowBtn.classList.add('pulse');
                setTimeout(() => meowBtn.classList.remove('pulse'), 300);
            }
        } catch (e) {
            console.log("Meow sound failed:", e);
            // Fallback: just visual feedback
            const meowBtn = document.getElementById('meow-btn');
            if (meowBtn) {
                meowBtn.classList.add('pulse');
                setTimeout(() => meowBtn.classList.remove('pulse'), 300);
            }
        }
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new PawsAndPreferences();
});
