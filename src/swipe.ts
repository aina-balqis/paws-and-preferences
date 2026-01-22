import { SwipeOptions } from './types';

export class SwipeManager {
  private startX: number = 0;
  private currentX: number = 0;
  private isSwiping: boolean = false;
  private card: HTMLElement;

  constructor(card: HTMLElement, private options: SwipeOptions) {
    this.card = card;
    this.init();
  }

  private init(): void {
    this.addTouchEvents();
    this.addMouseEvents();
    this.preventImageDrag();
  }

  private addTouchEvents(): void {
    this.card.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.card.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.card.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  private addMouseEvents(): void {
    this.card.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  private preventImageDrag(): void {
    this.card.addEventListener('dragstart', (e) => e.preventDefault());
  }

  private handleTouchStart(e: TouchEvent): void {
    this.startX = e.touches[0].clientX;
    this.isSwiping = true;
    this.card.style.transition = 'none';
    this.updateCardFeedback(0);
  }

  private handleTouchMove(e: TouchEvent): void {
    if (!this.isSwiping) return;
    e.preventDefault();
    
    this.currentX = e.touches[0].clientX;
    const diff = this.currentX - this.startX;
    
    this.updateCardPosition(diff);
    this.updateCardFeedback(diff);
  }

  private handleTouchEnd(): void {
    if (!this.isSwiping) return;
    this.isSwiping = false;
    
    const diff = this.currentX - this.startX;
    this.handleSwipeEnd(diff);
  }

  private handleMouseDown(e: MouseEvent): void {
    this.startX = e.clientX;
    this.isSwiping = true;
    this.card.style.transition = 'none';
    this.updateCardFeedback(0);
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isSwiping) return;
    
    this.currentX = e.clientX;
    const diff = this.currentX - this.startX;
    
    this.updateCardPosition(diff);
    this.updateCardFeedback(diff);
  }

  private handleMouseUp(): void {
    if (!this.isSwiping) return;
    this.isSwiping = false;
    
    const diff = this.currentX - this.startX;
    this.handleSwipeEnd(diff);
  }

  private updateCardPosition(diff: number): void {
    const rotate = diff / 15;
    this.card.style.transform = `translateX(${diff}px) rotate(${rotate}deg)`;
    this.card.style.opacity = `${1 - Math.min(Math.abs(diff) / 300, 0.3)}`;
  }

  private updateCardFeedback(diff: number): void {
    this.card.classList.remove('swipe-like', 'swipe-dislike');
    
    if (diff > 50) {
      this.card.classList.add('swipe-like');
    } else if (diff < -50) {
      this.card.classList.add('swipe-dislike');
    }
  }

  private handleSwipeEnd(diff: number): void {
    this.card.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
    
    const THRESHOLD = 120;
    
    if (diff > THRESHOLD) {
      this.swipeRight();
    } else if (diff < -THRESHOLD) {
      this.swipeLeft();
    } else {
      this.resetCard();
    }
  }

  private swipeRight(): void {
    this.card.style.transform = 'translateX(500px) rotate(20deg)';
    this.card.style.opacity = '0';
    setTimeout(() => this.options.onLike(), 300);
  }

  private swipeLeft(): void {
    this.card.style.transform = 'translateX(-500px) rotate(-20deg)';
    this.card.style.opacity = '0';
    setTimeout(() => this.options.onDislike(), 300);
  }

  private resetCard(): void {
    this.card.style.transform = '';
    this.card.style.opacity = '1';
    this.card.classList.remove('swipe-like', 'swipe-dislike');
  }
}

export function initSwipe(card: HTMLElement, options: SwipeOptions): SwipeManager {
  return new SwipeManager(card, options);
}