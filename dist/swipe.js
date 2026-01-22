export class SwipeManager {
    constructor(card, options) {
        this.options = options;
        this.startX = 0;
        this.currentX = 0;
        this.isSwiping = false;
        this.card = card;
        this.init();
    }
    init() {
        this.addTouchEvents();
        this.addMouseEvents();
        this.preventImageDrag();
    }
    addTouchEvents() {
        this.card.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.card.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.card.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }
    addMouseEvents() {
        this.card.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }
    preventImageDrag() {
        this.card.addEventListener('dragstart', (e) => e.preventDefault());
    }
    handleTouchStart(e) {
        this.startX = e.touches[0].clientX;
        this.isSwiping = true;
        this.card.style.transition = 'none';
        this.updateCardFeedback(0);
    }
    handleTouchMove(e) {
        if (!this.isSwiping)
            return;
        e.preventDefault();
        this.currentX = e.touches[0].clientX;
        const diff = this.currentX - this.startX;
        this.updateCardPosition(diff);
        this.updateCardFeedback(diff);
    }
    handleTouchEnd() {
        if (!this.isSwiping)
            return;
        this.isSwiping = false;
        const diff = this.currentX - this.startX;
        this.handleSwipeEnd(diff);
    }
    handleMouseDown(e) {
        this.startX = e.clientX;
        this.isSwiping = true;
        this.card.style.transition = 'none';
        this.updateCardFeedback(0);
    }
    handleMouseMove(e) {
        if (!this.isSwiping)
            return;
        this.currentX = e.clientX;
        const diff = this.currentX - this.startX;
        this.updateCardPosition(diff);
        this.updateCardFeedback(diff);
    }
    handleMouseUp() {
        if (!this.isSwiping)
            return;
        this.isSwiping = false;
        const diff = this.currentX - this.startX;
        this.handleSwipeEnd(diff);
    }
    updateCardPosition(diff) {
        const rotate = diff / 15;
        this.card.style.transform = `translateX(${diff}px) rotate(${rotate}deg)`;
        this.card.style.opacity = `${1 - Math.min(Math.abs(diff) / 300, 0.3)}`;
    }
    updateCardFeedback(diff) {
        this.card.classList.remove('swipe-like', 'swipe-dislike');
        if (diff > 50) {
            this.card.classList.add('swipe-like');
        }
        else if (diff < -50) {
            this.card.classList.add('swipe-dislike');
        }
    }
    handleSwipeEnd(diff) {
        this.card.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
        const THRESHOLD = 120;
        if (diff > THRESHOLD) {
            this.swipeRight();
        }
        else if (diff < -THRESHOLD) {
            this.swipeLeft();
        }
        else {
            this.resetCard();
        }
    }
    swipeRight() {
        this.card.style.transform = 'translateX(500px) rotate(20deg)';
        this.card.style.opacity = '0';
        setTimeout(() => this.options.onLike(), 300);
    }
    swipeLeft() {
        this.card.style.transform = 'translateX(-500px) rotate(-20deg)';
        this.card.style.opacity = '0';
        setTimeout(() => this.options.onDislike(), 300);
    }
    resetCard() {
        this.card.style.transform = '';
        this.card.style.opacity = '1';
        this.card.classList.remove('swipe-like', 'swipe-dislike');
    }
}
export function initSwipe(card, options) {
    return new SwipeManager(card, options);
}
