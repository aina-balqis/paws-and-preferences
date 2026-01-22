export interface Cat {
  id: number;
  imageUrl: string;
  liked: boolean;
}

export interface SwipeOptions {
  onLike: () => void;
  onDislike: () => void;
}

export interface AppConfig {
  totalCats: number;
  swipeThreshold: number;
  apiBaseUrl: string;
}