import { Card } from "../Card";
import { CardState, StaticState } from "./CardState";
import { Move } from "../types/Move";

export type FlipConfig = {
    delay?: number,
    onComplete?: (card?: Card) => void
};

export type OpenConfig = {
    delay?: number, 
    duration?: number, 
    onCanStart?: () => boolean, 
    onComplete?: (card?: Card) => void
}

export type CloseConfig = {
    delay: number, 
    duration?: number, 
    onCanStart?: () => boolean, 
    onComplete?: (card?: Card) => void
}

export type MoveConfig = {
    xTo: number, 
    yTo: number, 
    xFrom?: number, 
    yFrom?: number, 
    delay?: number, 
    duration?: number,
    onStart?: (card?: Card) => void,
    onComplete?: (card?: Card) => void
}

export default class MovingState implements CardState {
    #movesArray: Move[][] = [];
    #tweens: Phaser.Tweens.TweenChain[] = [];
    
    constructor(readonly card: Card) {}

    static createFromToMove(config: MoveConfig): Move[] {
        const moves: Move[] = [
            { 
                x: config.xFrom || 0, 
                y: config.yFrom || 0, 
                delay: 0,
                duration: 0 
            },
            {
                x: config.xTo, 
                y: config.yTo,
                delay: config.delay,
                duration: config.duration,
                onStart: config.onStart,
                onComplete: config.onComplete
            }
        ];
        return moves;
    }

    static createCloseMove(card: Card, config: CloseConfig): Move[] {
        const moves: Move[] = [
            {
                x: card.getX() + (card.getWidth() / 2),
                scaleX: 0,
                ease: 'Linear',
                canStart: () => {
                    return card.isOpened() && (!config.onCanStart || config.onCanStart());
                },
                onComplete: config.onComplete,
                delay: config.delay,
                duration: config.duration,
            },
        ];
        return moves;
    }

    static createOpenMove(card: Card, config: OpenConfig): Move[] {
        const moves: Move[] = [
            {
                x: card.getOriginX(),
                scaleX: 1,
                ease: 'Linear',
                canStart: () => {
                    return card.isClosed() && (!config.onCanStart || config.onCanStart());
                },
                onComplete: config.onComplete, 
                delay: config.delay,
                duration: config.duration,
            }
        ];
        return moves;
    }

    create(moves: Move[]): void {
        this.addTweens(moves);
    }

    addTweens(moves: Move[]): void {
        this.#pushMoves(moves);
    }

    static() {
        this.card.changeState(new StaticState(this.card));
    }

    moving() {
        throw new Error('cannot call moving() from MovingState.');
    }

    updating() {
        throw new Error('cannot call updating() from MovingState.');
    }

    flash() {
        throw new Error('cannot call flash() from MovingState.');
    }
    
    preUpdate() {
        if (this.#isPlaying()) return;
        if (this.#hasMoves()) this.#createTweens();
        if (this.#hasTweens()) return;
        this.static();
    }

    #pushMoves(moves: Move[]) {
        this.#movesArray.push(moves);
    }

    #isPlaying(): boolean {
        return this.#tweens.some(tween => tween.isPlaying()) ?? false;
    }

    #hasMoves(): boolean {
        return this.#movesArray.length > 0;
    }

    #createTweens() {
        const moves = this.#movesArray.shift()!.filter((m: Move) => m.canStart ? m.canStart() : true);
        if (!moves || moves.length === 0) return;
        const tweens = this.card.scene.tweens.chain({ 
            targets: this.card.getUi(), 
            tweens: moves,
            onComplete: () => {
                this.#tweens = this.#tweens.filter(t => t !== tweens);
            },
        });
        this.#tweens.push(tweens);
    }

    #hasTweens(): boolean {
        return this.#hasMoves() || this.#tweens.length > 0;
    }
}
