import { Phase } from "./Phase";
import { StartPhase } from "./StartPhase";
import { CardsFolderData, OpponentData } from "@game/types";
import { CardBattlePhase } from "./CardBattlePhase";

export class ChallengePhase extends CardBattlePhase implements Phase {

    async create(): Promise<void> {
        const opponent: OpponentData = await this.cardBattle.getOpponentData();
        const folders: CardsFolderData[] = await this.cardBattle.getFolders();
        this.#createChallengeWindows(opponent);
        this.#createFoldersWindow(folders);
        this.openAllWindows();
    }

    #createChallengeWindows(opponent: OpponentData): void {
        super.createTextWindowCentered('CardBattle Challenge!', {
            textAlign: 'center',
            textColor: '#ff3c3c',
            onClose: () => {
                this.openCommandWindow();
            }
        });
        const { name, description } = opponent;
        super.addTextWindow(`${name}\n${description}`);
    }

    #createFoldersWindow(folders: CardsFolderData[]): void {
        const [folder1, folder2, folder3] = folders;
        const padValue = 16;
        const folderColorsPoints1 = {
            red: folder1.redPoints,
            green: folder1.greenPoints,
            blue: folder1.bluePoints,
            black: folder1.blackPoints,
            white: folder1.whitePoints,
            orange: folder1.orangePoints
        };
        const folderColorsPoints2 = {
            red: folder2.redPoints,
            green: folder2.greenPoints,
            blue: folder2.bluePoints,
            black: folder2.blackPoints,
            white: folder2.whitePoints,
            orange: folder2.orangePoints
        };
        const folderColorsPoints3 = {
            red: folder3.redPoints,
            green: folder3.greenPoints,
            blue: folder3.bluePoints,
            black: folder3.blackPoints,
            white: folder3.whitePoints,
            orange: folder3.orangePoints
        };
        const options = [
            {
                description: `${folder1.name.padEnd(padValue)} ${Object.entries(folderColorsPoints1).map(([color, points]) => `${color}: ${points.toString().padStart(2, "0")}`).join(', ')}`,
                onSelect: async () => {
                    await this.cardBattle.setFolder(folder1.id);
                    this.changeToStartPhase();
                }
            },
            {
                description: `${folder2.name.padEnd(padValue)} ${Object.entries(folderColorsPoints2).map(([color, points]) => `${color}: ${points.toString().padStart(2, "0")}`).join(', ')}`,
                onSelect: async () => {
                    await this.cardBattle.setFolder(folder2.id);
                    this.changeToStartPhase();
                }
            },
            {
                description: `${folder3.name.padEnd(padValue)} ${Object.entries(folderColorsPoints3).map(([color, points]) => `${color}: ${points.toString().padStart(2, "0")}`).join(', ')}`,
                onSelect: async () => {
                    await this.cardBattle.setFolder(folder3.id);
                    this.changeToStartPhase();
                }
            },
        ];
        super.createCommandWindowCentered('Choose your folder', options);
    }

    update(): void {
        console.log("Updating Challenge Phase...");
    }

    changeToChallengePhase(): void {
        throw new Error("Method not implemented.");
    }
    
    changeToStartPhase(): void {
        this.scene.changePhase(new StartPhase(this.scene));
    }

    changeToDrawPhase(): void {
        throw new Error("Method not implemented.");
    }

    changeToLoadPhase(): void {
        throw new Error("Method not implemented.");
    }

    changeToTriggerPhase(): void {
        throw new Error("Method not implemented.");
    }

    changeToSummonPhase(): void {
        throw new Error("Method not implemented.");
    }

    changeToCompilePhase(): void {
        throw new Error("Method not implemented.");
    }

    changeToBattlePhase(): void {
        throw new Error("Method not implemented.");
    }

    destroy(): void {
        super.destroyAllTextWindows();
        super.destroyCommandWindow();
    }

}