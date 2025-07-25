import { CardPoints } from "./CardPoints";

export type UpdatePoints = {
    target: CardPoints;
    hold?: number;
    from?: number;
    to?: number;
    duration?: number;
    ease?: string;
    onComplete?: () => void;
    onUpdate?: (tween: Phaser.Tweens.Tween) => void;
}