import { Card } from "../../Card/Card";
import { Cardset } from "../Cardset";
import { CardsetEvents } from "../types/CardsetEvents";
import { CardsetState } from "./CardsetState";
import { ColorsPoints } from "../../../types/ColorsPoints";
import StaticState from "./StaticState";

export type SelectStateConfig = {
    events: CardsetEvents;
    colorPoints?: ColorsPoints | null;
    selectNumber?: number;
    startIndex?: number;
};

export default class SelectState implements CardsetState {
    #index: number;
    #selectNumber: number;
    #events: CardsetEvents;
    #colorsPoints: ColorsPoints | null = null;
    #selectIndexes: number[] = [];
    #disabledIndexes: number[] = [];

    constructor(readonly cardset: Cardset) {}

    create(config: SelectStateConfig): void {
        this.#events = config.events;
        this.#colorsPoints = config.colorPoints || null;
        this.#index = config.startIndex || 0;
        this.#selectNumber = config.selectNumber || 0;
        this.enable();
    }

    getSelectIndexes(): number[] {
        return this.#selectIndexes.slice();
    }

    disableBattleCards(): void {
        const cards = this.cardset.getCards();
        cards.forEach((card: Card, index: number) => {
            if (card.isBattleCard()) {
                this.#disableCardByIndex(index);
                this.#disabledIndexes.push(index);
            }
        });
    }

    disablePowerCards(): void {
        const cards = this.cardset.getCards();
        cards.forEach((card: Card, index: number) => {
            if (card.isPowerCard()) {
                this.#disableCardByIndex(index);
                this.#disabledIndexes.push(index);
            }
        });
    }

    removeSelectLastIndex(): void {
        if (this.#selectIndexes.length === 0) return;
        const lastIndex = this.#selectIndexes.pop();
        if (lastIndex === undefined) return;
        this.#unmarkCard(this.#getCardByIndex(lastIndex));
        this.#creditPoints(lastIndex);
        this.#removeDisabledIndex(lastIndex);
    }

    resetCardsState(): void {
        this.#sendCardsToBack(this.cardset.getCardsTotal() - 1);
        this.#deselectAll();
        this.#unmarkAll();
        this.#unhighlightAll();
        this.#enableAll();
    }

    selectMode() {
        throw new Error('SelectState: selectMode should not be called directly.');
    }

    staticMode() {
        this.cardset.changeState(new StaticState(this.cardset));
    }

    enable() {
        this.#addAllKeyboardListeners();
        this.resetCardsState();
        this.#updateCardsState();
        this.#updateCursor(this.#getCurrentIndex());
    }

    #addAllKeyboardListeners() {
        this.#addOnKeydownRightListener();
        this.#addOnKeydownLeftListener();       
        this.#addOnKeydownEnterListener();
        this.#addOnKeydownEscListener();
    }

    #addOnKeydownRightListener(): void {
        const keyboard = this.#getKeyboard();
        const onKeydownRight = () => {
            const newIndex = this.#index + 1;
            this.#updateCursor(newIndex);
        };
        keyboard.on('keydown-RIGHT', onKeydownRight);
    }

    #addOnKeydownLeftListener(): void {
        const keyboard = this.#getKeyboard();
        const onKeydownLeft = () => {
            const newIndex = this.#index - 1;
            this.#updateCursor(newIndex);
        };
        keyboard.on('keydown-LEFT', onKeydownLeft);
    }

    #addOnKeydownEnterListener(): void {
        const keyboard = this.#getKeyboard();
        const onKeydownEnter = () => {
            const currentIndex = this.#getCurrentIndex();
            if (!this.#isAvaliableCardByIndex(currentIndex)) return;
            if (this.#isIndexSelected(currentIndex)) {
                this.#removeIndex(currentIndex);
                this.#creditPoints(currentIndex);
                this.#unmarkCard(this.#getCardByIndex(currentIndex));
                return;
            }
            this.#selectIndex(currentIndex);
            this.#discountPoints(currentIndex);
            if (this.#selectNumber !== 1) this.#markCard(this.#getCardByIndex(currentIndex));
            if (this.#events.onMarked) this.#events.onMarked(currentIndex);
            if (this.#isSelectLimitReached() || this.#isSelectAll() || this.#isNoHasMoreColorsPoints()) {
                this.#disable();
                this.staticMode();
                if (this.#events.onCompleted) this.#events.onCompleted(this.getSelectIndexes());
            }
        };
        keyboard.on('keydown-ENTER', onKeydownEnter);
    }

    #addOnKeydownEscListener(): void {
        const keyboard = this.#getKeyboard();
        const onKeydownEsc = () => {
            this.#disable();
            this.staticMode();
            if (this.getSelectIndexes().length > 0) {
                if (this.#events.onCompleted) this.#events.onCompleted(this.getSelectIndexes());
                return;
            }
            if (this.#events.onLeave) this.#events.onLeave();
        }
        keyboard.on('keydown-ESC', onKeydownEsc);
    }

    #updateCardsState(): void {
        this.cardset.getCards().forEach((card: Card, index: number) => {
            if (this.#isCardNoHasMorePoints(card) && !this.#disabledIndexes.includes(index)) {
                this.#disabledIndexes.push(index);
            }
            if (this.#disabledIndexes.includes(index)) {
                this.#disableCardByIndex(index);
            }
            if (this.#selectIndexes.includes(index)) {
                this.#markCard(this.#getCardByIndex(index));
            }
        });
    }

    #getCardByIndex(index: number): Card {
        return this.cardset.getCardByIndex(index)
    }  

    #updateCursor(newIndex: number): void {
        if (!this.cardset.isValidIndex(newIndex)) return;
        const lastIndex = this.#getCurrentIndex();
        this.#sendCardsToBack(lastIndex);
        this.#deselectCard(this.#getCardByIndex(lastIndex));
        this.#updateIndex(newIndex);
        const currentIndex = this.#getCurrentIndex();
        this.#selectCard(this.#getCardByIndex(currentIndex));
        if (this.#events.onChangeIndex) this.#events.onChangeIndex(this.#getCurrentIndex());
    }

    #getCurrentIndex(): number {
        return this.#index;
    }

    #disable() {
        this.#removeAllKeyboardListeners();
        this.resetCardsState();
    }

    #isAvaliableCardByIndex(index: number): boolean {
        if (!this.cardset.isValidIndex(index)) return false;
        return !this.#disabledIndexes.includes(index) || this.#selectIndexes.includes(index);
    }

    #getKeyboard(): Phaser.Input.Keyboard.KeyboardPlugin {
        if (!this.cardset.scene.input.keyboard) {
            throw new Error('Keyboard input is not available in this scene.');
        }
        return this.cardset.scene.input.keyboard;
    }

    #sendCardsToBack(index: number): void {
        const cards = this.cardset.getCardsByFromTo(0, index);
        cards.reverse().forEach((card: Card) => {
            this.cardset.sendToBack(card.getUi());
        });
    }

    #deselectCard(card: Card): void {
        this.cardset.deselectCard(card);
        card.moveFromTo({
            xFrom: card.getX(), 
            yFrom: card.getY(), 
            xTo: card.getX(), 
            yTo: 0,
            duration: 10
        });
    }

    #updateIndex(index: number): void {
        const totalIndex = this.cardset.getCardsTotal() - 1;
        if (index < 0) {
            this.#index = 0;
        } else if (index >= totalIndex) {
            this.#index = totalIndex;
        } else {
            this.#index = index;
        }
    }

    #selectCard(card: Card): void {
        this.cardset.selectCard(card);
        card.moveFromTo({
            xFrom: card.getX(), 
            yFrom: card.getY(), 
            xTo: card.getX(), 
            yTo: -12,
            duration: 10
        });
    }

    #isIndexSelected(index: number): boolean {
        return this.#selectIndexes.includes(index);
    }

    #removeIndex(index: number): void {
        this.#removeSelectIndex(index);
        this.#removeDisabledIndex(index);
    }

    #removeSelectIndex(index: number): void {
        this.#selectIndexes = this.#selectIndexes.filter(i => i !== index);
    }

    #removeDisabledIndex(index: number): void {
        this.#disabledIndexes = this.#disabledIndexes.filter(i => i !== index);
    }

    #creditPoints(index: number): void {
        if (!this.#colorsPoints) return;
        const card = this.#getCardByIndex(index);
        const cardColor = card.getColor();
        const cardCost = card.getCost();
        this.#colorsPoints[cardColor] += cardCost;
    }

    #unmarkCard(card: Card): void {
        this.cardset.unmarkCard(card);
        card.enable();
    }

    #selectIndex(index: number): void {
        this.#selectIndexes.push(index);
        this.#disabledIndexes.push(index);
    }

    #discountPoints(index: number): void {
        if (!this.#colorsPoints) return;
        const card = this.#getCardByIndex(index);
        const cardColor = card.getColor();
        const cardCost = card.getCost();
        this.#colorsPoints[cardColor] -= cardCost;
    }

    #markCard(card: Card): void {
        this.cardset.markCard(card);
        card.disable();
    }

    #isSelectLimitReached(): boolean {
        return (this.#selectNumber > 0) && (this.#selectIndexes.length >= this.#selectNumber);
    }

    #isSelectAll(): boolean {
        return this.#selectIndexes.length === (this.cardset.getCardsTotal() - this.#disabledIndexes.length);
    }

    #isNoHasMoreColorsPoints(): boolean {
        if (!this.#colorsPoints) return false;
        const allIndexes = this.cardset.getIndexesToArray();
        const avaliableIndexes = allIndexes.filter((index: number) => !this.#selectIndexes.includes(index));
        const avaliableCards = this.cardset.getCardsByIndexes(avaliableIndexes);
        return avaliableCards.some((card: Card) => {
            return this.#isCardNoHasMorePoints(card);
        });
    }

    #isCardNoHasMorePoints(card: Card): boolean {
        if (!this.#colorsPoints) return false;
        const cardColor = card.getColor();
        const cardCost = card.getCost();
        return this.#colorsPoints[cardColor] < cardCost;
    }

    #removeAllKeyboardListeners() {
        const keyboard = this.#getKeyboard();
        keyboard.removeAllListeners();
    }

    #unmarkAll(): void {
        this.cardset.getCards().forEach((card: Card) => {
            this.#unmarkCard(card);
        });
    }

    #deselectAll(): void {
        this.cardset.getCards().forEach((card: Card) => {
            this.#deselectCard(card);
        });
    }

    #unhighlightAll(): void {
        this.cardset.getCards().forEach((card: Card) => {
            this.#unhighlightCard(card);
        });
    }

    #unhighlightCard(card: Card): void {
        this.cardset.unhighlightCard(card);
    }

    #enableAll(): void {
        this.cardset.getCards().forEach((card: Card) => {
            card.enable();
        });
    }

    #disableCardByIndex(index: number): void {
        const card = this.#getCardByIndex(index);
        card.disable();
    }
}