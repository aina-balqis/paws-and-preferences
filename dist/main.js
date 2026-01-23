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
        this.superLikedCats = []; // Tambah untuk super like
        this.currentIndex = 0;
        this.isAnimating = false;
        this.swipeManager = null;
        
        this.initializeDOM();
        this.initializeCats();
        this.setupEventListeners();
        
        // Terus tunjuk kad pertama tanpa tunggu semua preloading selesai
        this.showCurrentCard();
        
        // Add CSS animations for summary
        this.ensureSummaryAnimations();
    }

    initializeDOM() {
        this.cardStack = document.getElementById('card-stack');
        this.summarySection = document.getElementById('summary');
        this.likeButton = document.getElementById('like-btn');
        this.dislikeButton = document.getElementById('dislike-btn');
        this.superLikeButton = document.getElementById('super-like-btn'); // Tambah button super like
        this.progressBar = document.getElementById('progress-bar');
        this.progressText = document.getElementById('progress-text');
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.swipedCount = document.getElementById('swiped-count');
        this.catCount = document.getElementById('cat-count');
    }

    initializeCats() {
        // Generate cat names yang comel
        const catNames = [
            "Whiskers", "Luna", "Simba", "Bella", "Oliver", "Chloe", "Leo", "Lily", 
            "Milo", "Coco", "Max", "Lucy", "Charlie", "Daisy", "Jack", "Zoe",
            "Oscar", "Molly", "Buddy", "Sophie", "Tiger", "Cleo", "Smokey", "Nala"
        ];
        
        // Generate cat tags yang comel
        const catTags = [
            "Fluffy", "Playful", "Cuddly", "Adventurous", "Gentle", "Curious",
            "Sweet", "Energetic", "Calm", "Loving", "Smart", "Funny",
            "Brave", "Quiet", "Social", "Independent", "Affectionate", "Mischievous"
        ];
        
        // Generate ages
        const ages = ["Kitten", "Young", "Adult", "Senior"];
        
        this.cats = Array.from({ length: this.config.totalCats }, (_, index) => ({
            id: index + 1,
            name: catNames[index % catNames.length],
            imageUrl: `${this.config.apiBaseUrl}?width=400&height=500&random=${Date.now() + index}&type=sq`,
            liked: false,
            superLiked: false,
            viewed: false,
            age: ages[Math.floor(Math.random() * ages.length)],
            tags: Array.from({ length: 3 }, () => 
                catTags[Math.floor(Math.random() * catTags.length)]
            ).filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
        }));
        
        // Update cat count
        this.catCount.textContent = this.config.totalCats;
        
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
        
        // Tambah event listener untuk super like button jika ada
        if (this.superLikeButton) {
            this.superLikeButton.addEventListener('click', () => this.handleSuperLike());
        }
        
        document.addEventListener('keydown', (e) => {
            if (this.isAnimating || this.currentIndex >= this.cats.length) return;
            switch (e.key.toLowerCase()) {
                case 'arrowright':
                case 'd':
                    e.preventDefault();
                    this.handleLike();
                    break;
                case 'arrowleft':
                case 'a':
                    e.preventDefault();
                    this.handleDislike();
                    break;
                case 's':
                    e.preventDefault();
                    this.handleSuperLike();
                    break;
                case 'enter':
                    e.preventDefault();
                    if (this.currentIndex >= this.cats.length) {
                        this.restartApp();
                    }
                    break;
            }
        });

        this.cardStack.addEventListener('touchmove', (e) => {
            if (this.isAnimating) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Add meow button event
        const meowBtn = document.getElementById('meow-btn');
        if (meowBtn) {
            meowBtn.addEventListener('click', () => this.playMeowSound());
        }
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
                <div class="error-state" style="text-align: center; padding: 2rem; color: #9370DB;">
                    <i class="fas fa-cat fa-4x mb-3" style="color: #FF69B4;"></i>
                    <h3>${cat.name}</h3>
                    <p>This cat is camera shy! 📷</p>
                    <small>Try swiping anyway!</small>
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
                <h3>${cat.name}</h3>
                <p>${cat.age} • ${cat.tags.join(', ')}</p>
                <div class="card-tags">
                    ${cat.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <div class="swipe-hint">
                    <span class="hint-left">👎 Nah</span>
                    <span class="hint-right">Love! 👍</span>
                </div>
            </div>
        `;
        card.appendChild(overlay);

        this.swipeManager = initSwipe(card, {
            onLike: () => {
                card.classList.add('swipe-right');
                const indicator = card.querySelector('.swipe-indicator');
                if (indicator) {
                    indicator.style.background = 'linear-gradient(135deg, #FF69B4, #FF1493)';
                    indicator.textContent = 'LOVE! ❤️';
                    indicator.classList.add('visible');
                }
                setTimeout(() => this.handleLike(), 300);
            },
            onDislike: () => {
                card.classList.add('swipe-left');
                const indicator = card.querySelector('.swipe-indicator');
                if (indicator) {
                    indicator.style.background = 'linear-gradient(135deg, #A9A9A9, #808080)';
                    indicator.textContent = 'NAH 👎';
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

    handleSuperLike() {
        if (this.isAnimating || this.currentIndex >= this.cats.length) return;
        this.isAnimating = true;
        const currentCard = this.cardStack.querySelector('.cat-card');
        
        // Add special super like animation
        currentCard?.classList.add('exit-right');
        const indicator = currentCard?.querySelector('.swipe-indicator');
        if (indicator) {
            indicator.style.background = 'linear-gradient(135deg, #FFD700, #FFA500)';
            indicator.textContent = 'PURRFECT! ⭐';
            indicator.classList.add('visible');
        }
        
        this.animateButton(this.superLikeButton || this.likeButton);
        setTimeout(() => {
            const currentCat = this.cats[this.currentIndex];
            currentCat.liked = true;
            currentCat.superLiked = true;
            this.superLikedCats.push(currentCat);
            this.likedCats.push(currentCat);
            this.moveToNextCard();
        }, 300);
    }

    animateButton(button) {
        if (!button) return;
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
        
        // Update progress paw position
        const progressPaw = document.querySelector('.progress-paw');
        if (progressPaw) {
            progressPaw.style.left = `calc(${progress}% - 15px)`;
        }
    }

    showSummary() {
        // Hide main interface
        this.cardStack.style.display = 'none';
        this.likeButton.style.display = 'none';
        this.dislikeButton.style.display = 'none';
        if (this.superLikeButton) this.superLikeButton.style.display = 'none';
        document.querySelector('.progress-container')?.classList.add('hidden');
        document.querySelector('.instructions')?.classList.add('hidden');
        document.querySelector('.keyboard-hint')?.classList.add('hidden');
        
        // Show summary
        this.summarySection.classList.remove('hidden');
        this.generateSummaryHTML();
        
        // Add confetti effect
        this.createConfetti();
        
        // Setup event listeners for summary buttons
        this.setupSummaryButtons();
        
        // Scroll to summary
        setTimeout(() => {
            this.summarySection.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }

    generateSummaryHTML() {
        const totalLikes = this.likedCats.length;
        const totalSuperLikes = this.superLikedCats.length;
        const progressPercentage = Math.min(Math.round((this.currentIndex / this.config.totalCats) * 100), 100);
        const matchRate = Math.round((totalLikes / this.config.totalCats) * 100);
        
        let message = '';
        if (matchRate === 100) message = 'Purrfect! You loved them all! 😻🎉';
        else if (matchRate >= 80) message = 'You really love cats! So many matches! 😻';
        else if (matchRate >= 50) message = 'You found some purrfect favorites! 🐾';
        else if (matchRate >= 20) message = 'A few kitties caught your eye! 👀';
        else if (matchRate > 0) message = 'At least you found one you like! 😸';
        else message = 'No cats captured your heart this time... 😿';
        
        // Determine cat personality based on choices
        let personality = '';
        if (totalSuperLikes > 5) personality = 'The Cat Enthusiast 🐱❤️';
        else if (totalLikes > 8) personality = 'The Cat Lover 😻';
        else if (totalLikes > 4) personality = 'The Cat Appreciator 🐾';
        else if (totalLikes > 0) personality = 'The Selective Cat Friend 😼';
        else personality = 'The Mysterious Cat Observer 🐈‍⬛';

        const summaryHTML = `
            <div class="summary-content">
                <div class="summary-header">
                    <div class="summary-icon">
                        <i class="fas fa-trophy"></i>
                        <div class="confetti-effect"></div>
                    </div>
                    <h2>Meow-tastic! You've Met All The Kitties! 🎉</h2>
                    <p class="lead">You are: <span class="highlight">${personality}</span></p>
                    <p class="lead">You swiped through <span class="highlight">${this.config.totalCats}</span> adorable kitties!</p>
                    <p style="color: #9370DB; margin-bottom: 25px;">${message}</p>

                    <div class="match-score">
                        <div class="score-card">
                            <i class="fas fa-heart"></i>
                            <h3 id="like-count">${totalLikes}</h3>
                            <p>Loved Kitties</p>
                        </div>
                        <div class="score-card">
                            <i class="fas fa-star"></i>
                            <h3 id="super-like-count">${totalSuperLikes}</h3>
                            <p>Purrfect Matches</p>
                        </div>
                        <div class="score-card">
                            <i class="fas fa-paw"></i>
                            <h3 id="match-score">${matchRate}%</h3>
                            <p>Match Rate</p>
                        </div>
                    </div>
                </div>

                <div class="summary-body">
                    <h4><i class="fas fa-cat"></i> Your Purrfect Matches (${totalLikes})</h4>
                    
                    ${totalLikes === 0 ? `
                    <div class="no-likes">
                        <div class="sad-cat">
                            <i class="fas fa-cat fa-3x"></i>
                            <i class="fas fa-heart-broken fa-2x"></i>
                        </div>
                        <h4>No kitties caught your heart? 😿</h4>
                        <p>Don't worry! Maybe these kitties were too shy. Try again!</p>
                        <div class="cat-advice">
                            <p><i class="fas fa-lightbulb"></i> <strong>Tip:</strong> Try being more open to different types of cats next time!</p>
                        </div>
                    </div>
                    ` : `
                    <div class="liked-cats-grid" id="liked-cats-grid">
                        ${this.likedCats.map((cat, index) => `
                            <div class="liked-cat-card">
                                <div class="liked-cat-image" style="background-image: url('${cat.imageUrl}')">
                                    <div class="cat-number">${index + 1}</div>
                                    ${cat.superLiked ? `
                                    <div class="liked-cat-rating super-like" title="Purrfect Match!">
                                        ⭐
                                    </div>
                                    ` : `
                                    <div class="liked-cat-rating like" title="Loved!">
                                        ❤️
                                    </div>
                                    `}
                                </div>
                                <div class="liked-cat-info">
                                    <h5>${cat.name}</h5>
                                    <div class="liked-cat-tags">
                                        ${cat.tags.map(tag => 
                                            `<span class="liked-cat-tag">${tag}</span>`
                                        ).join('')}
                                    </div>
                                    <p class="cat-age">${cat.age}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    `}

                    <div class="summary-actions">
                        <button id="restart-btn" class="btn-restart">
                            <i class="fas fa-redo"></i>
                            Play Again with New Kitties!
                        </button>
                        <button id="share-btn" class="btn-share">
                            <i class="fas fa-share-alt"></i>
                            Share My Cat Picks
                        </button>
                    </div>

                    <div class="fun-facts">
                        <h5><i class="fas fa-lightbulb"></i> Did You Know? Fun Cat Facts</h5>
                        <div class="facts-container">
                            <div class="fact">
                                <i class="fas fa-paw"></i>
                                <p>Cats have 230 bones (humans have 206)!</p>
                            </div>
                            <div class="fact">
                                <i class="fas fa-brain"></i>
                                <p>Cat brains are 90% similar to human brains!</p>
                            </div>
                            <div class="fact">
                                <i class="fas fa-heart"></i>
                                <p>A cat's heartbeat is 140-220 bpm (humans: 60-100)!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.summarySection.innerHTML = summaryHTML;
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
        // Reset semua state
        this.currentIndex = 0;
        this.likedCats = [];
        this.superLikedCats = [];
        this.isAnimating = false;
        
        // Reset UI
        this.summarySection.classList.add('hidden');
        this.summarySection.innerHTML = '';
        
        this.cardStack.style.display = '';
        this.likeButton.style.display = '';
        this.dislikeButton.style.display = '';
        if (this.superLikeButton) this.superLikeButton.style.display = '';
        
        document.querySelector('.progress-container')?.classList.remove('hidden');
        document.querySelector('.instructions')?.classList.remove('hidden');
        document.querySelector('.keyboard-hint')?.classList.remove('hidden');
        
        // Generate kucing baru
        this.initializeCats();
        
        // Tunjukkan kad pertama
        setTimeout(() => {
            this.showCurrentCard();
            // Scroll back to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 300);
    }

    shareResults() {
        const totalLikes = this.likedCats.length;
        const catNames = this.likedCats.slice(0, 3).map(cat => cat.name).join(', ');
        
        const shareText = `🐱 I found ${totalLikes} purrfect cats on MeowMatch! ` +
                         `${totalLikes > 0 ? `My favorites: ${catNames}${totalLikes > 3 ? ' and more!' : ''}` : ''} ` +
                         `Find your purrfect match at: ${window.location.href}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'My MeowMatch Results',
                text: shareText,
                url: window.location.href
            }).catch(err => {
                this.copyToClipboard(shareText);
            });
        } else {
            this.copyToClipboard(shareText);
        }
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification('Results copied to clipboard! 📋 Share with your friends!');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            // Fallback untuk browser lama
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification('Results copied! 📋');
        });
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #FF69B4, #9370DB);
            color: white;
            padding: 12px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
            font-weight: 600;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease reverse forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    createConfetti() {
        const container = document.getElementById('confetti-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        const colors = ['#FF69B4', '#9370DB', '#FFD700', '#ADD8E6', '#98FB98'];
        const confettiCount = 80;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 10 + 5;
            const startX = Math.random() * 100;
            const duration = Math.random() * 3 + 2;
            
            confetti.style.cssText = `
                position: fixed;
                width: ${size}px;
                height: ${size}px;
                background-color: ${color};
                border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
                top: -10px;
                left: ${startX}vw;
                opacity: 0.8;
                z-index: 9998;
                animation: floatBubble ${duration}s linear forwards;
            `;
            
            container.appendChild(confetti);
            
            // Remove after animation
            setTimeout(() => {
                confetti.remove();
            }, duration * 1000);
        }
    }

    playMeowSound() {
        // Create array of meow sounds (base64 encoded or URL)
        const meowSounds = [
            'https://assets.mixkit.co/sfx/preview/mixkit-cat-meow-117.mp3',
            'https://assets.mixkit.co/sfx/preview/mixkit-cat-meowing-118.mp3',
            'https://assets.mixkit.co/sfx/preview/mixkit-cat-purring-119.mp3'
        ];
        
        const randomMeow = meowSounds[Math.floor(Math.random() * meowSounds.length)];
        const audio = new Audio(randomMeow);
        audio.volume = 0.3;
        audio.play().catch(e => console.log("Meow sound failed to play: ", e));
        
        // Add visual feedback
        const meowBtn = document.getElementById('meow-btn');
        if (meowBtn) {
            meowBtn.classList.add('pulse');
            setTimeout(() => meowBtn.classList.remove('pulse'), 300);
        }
    }

    ensureSummaryAnimations() {
        // Add necessary CSS animations jika belum ada
        if (!document.getElementById('summary-animations')) {
            const style = document.createElement('style');
            style.id = 'summary-animations';
            style.textContent = `
                @keyframes floatBubble {
                    0% { transform: translateY(0) rotate(0deg); opacity: 0.8; }
                    100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
                }
                .notification {
                    animation: slideInRight 0.3s ease;
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new PawsAndPreferences();
});

// Export untuk testing atau module lain
export { PawsAndPreferences };
