import { ItemView, WorkspaceLeaf, TFile, moment } from "obsidian";

export const REHEARSAL_VIEW_TYPE = "rehearsal-view";

export class RehearsalView extends ItemView {
    private masterTimer: number;
    private lapTimer: number;
    private jokes: TFile[] = [];
    private currentJokeIndex: number = -1;
    private masterTimerInterval: any;
    private lapTimerInterval: any;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType() {
        return REHEARSAL_VIEW_TYPE;
    }

    getDisplayText() {
        return "Rehearsal";
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.createEl("h4", { text: "Rehearsal" });

        const masterTimeEl = container.createEl("div", { text: "Master Time: 0s" });
        const lapTimeEl = container.createEl("div", { text: "Lap Time: 0s" });
        const currentJokeEl = container.createEl("div");
        const nextButton = container.createEl("button", { text: "Start" });

        nextButton.onClickEvent(async () => {
            if (this.currentJokeIndex === -1) {
                // Start
                this.startRehearsal();
                nextButton.setText("Next");
            } else if (this.currentJokeIndex < this.jokes.length - 1) {
                // Next
                this.nextJoke();
            } else {
                // Finish
                this.finishRehearsal();
                nextButton.setText("Start");
            }
        });

        this.masterTimerInterval = setInterval(() => {
            if (this.masterTimer) {
                this.masterTimer++;
                masterTimeEl.setText(`Master Time: ${this.masterTimer}s`);
            }
        }, 1000);

        this.lapTimerInterval = setInterval(() => {
            if (this.lapTimer) {
                this.lapTimer++;
                lapTimeEl.setText(`Lap Time: ${this.lapTimer}s`);
            }
        }, 1000);
    }

    async onClose() {
        clearInterval(this.masterTimerInterval);
        clearInterval(this.lapTimerInterval);
    }

    async startRehearsal() {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile) {
            const fileCache = this.app.metadataCache.getFileCache(activeFile);
            if (fileCache && fileCache.embeds) {
                for (const embed of fileCache.embeds) {
                    const jokeFile = this.app.metadataCache.getFirstLinkpathDest(embed.link, activeFile.path);
                    if (jokeFile instanceof TFile) {
                        this.jokes.push(jokeFile);
                    }
                }
            }
        }

        this.masterTimer = 0;
        this.lapTimer = 0;
        this.currentJokeIndex = 0;
        this.loadJoke();
    }

    async nextJoke() {
        this.recordLap();
        this.lapTimer = 0;
        this.currentJokeIndex++;
        this.loadJoke();
    }

    async finishRehearsal() {
        this.recordLap();
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile) {
            await this.app.fileManager.processFrontMatter(activeFile, (frontmatter) => {
                frontmatter.actual_duration = moment.utc(this.masterTimer * 1000).format('m[m] ss[s]');
            });
        }
        this.currentJokeIndex = -1;
        this.masterTimer = 0;
        this.lapTimer = 0;
    }

    async loadJoke() {
        const jokeFile = this.jokes[this.currentJokeIndex];
        const content = await this.app.vault.read(jokeFile);
        const jokeText = content.split("---").slice(2).join("---").trim();
        const currentJokeEl = this.containerEl.querySelector("div:nth-child(3)");
        if (currentJokeEl) {
            currentJokeEl.setText(jokeText);
        }
    }

    async recordLap() {
        const jokeFile = this.jokes[this.currentJokeIndex];
        await this.app.fileManager.processFrontMatter(jokeFile, (frontmatter) => {
            if (!frontmatter.run_times) {
                frontmatter.run_times = [];
            }
            frontmatter.run_times.push({
                [moment().format("YYYY-MM-DD")]: `${this.lapTimer}s`
            });
        });
    }
}
