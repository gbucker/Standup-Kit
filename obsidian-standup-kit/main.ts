import { Plugin, TFile, moment } from 'obsidian';
import { jokeSyntaxDecoration } from './editor-extension';
import { Extension } from '@codemirror/state';
import { RehearsalView, REHEARSAL_VIEW_TYPE } from './rehearsal-view';

export default class StandupKitPlugin extends Plugin {
    private editorExtension: Extension[] = [];
    private statusBarItemEl: HTMLElement;

    async onload() {
        console.log('Loading Standup Kit Plugin');
        this.registerEditorExtension(this.editorExtension);
        this.updateEditorExtension();

        this.statusBarItemEl = this.addStatusBarItem();
        this.registerEvent(this.app.workspace.on('file-open', this.updateStatus.bind(this)));
        this.registerEvent(this.app.metadataCache.on('changed', this.updateStatus.bind(this)));

        this.registerView(REHEARSAL_VIEW_TYPE, (leaf) => new RehearsalView(leaf));

        this.addRibbonIcon("microphone", "Rehearse Set", () => {
            this.activateView();
        });
    }

    onunload() {
        console.log('Unloading Standup Kit Plugin');
    }

    updateEditorExtension() {
        this.editorExtension.length = 0;
        this.editorExtension.push(jokeSyntaxDecoration());
        this.app.workspace.updateOptions();
    }

    async activateView() {
        this.app.workspace.detachLeavesOfType(REHEARSAL_VIEW_TYPE);

        const rightLeaf = this.app.workspace.getRightLeaf(false);
        if (rightLeaf) {
            await rightLeaf.setViewState({
                type: REHEARSAL_VIEW_TYPE,
                active: true,
            });
        }

        this.app.workspace.revealLeaf(
            this.app.workspace.getLeavesOfType(REHEARSAL_VIEW_TYPE)[0]
        );
    }

    async updateStatus() {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile) {
            const fileCache = this.app.metadataCache.getFileCache(activeFile);
            if (fileCache && fileCache.frontmatter && fileCache.frontmatter.duration) {
                const targetDuration = moment.duration(fileCache.frontmatter.duration).asSeconds();
                let totalDuration = 0;

                if (fileCache.embeds) {
                    for (const embed of fileCache.embeds) {
                        const jokeFile = this.app.metadataCache.getFirstLinkpathDest(embed.link, activeFile.path);
                        if (jokeFile instanceof TFile) {
                            const jokeCache = this.app.metadataCache.getFileCache(jokeFile);
                            if (jokeCache && jokeCache.frontmatter && jokeCache.frontmatter.est_duration) {
                                totalDuration += moment.duration(jokeCache.frontmatter.est_duration).asSeconds();
                            }
                        }
                    }
                }

                const difference = totalDuration - targetDuration;
                const underOver = difference > 0 ? "over" : "under";
                const diffText = moment.utc(Math.abs(difference) * 1000).format('m[m] ss[s]');
                const totalText = moment.utc(totalDuration * 1000).format('m[m] ss[s]');
                const targetText = moment.utc(targetDuration * 1000).format('m[m] ss[s]');

                this.statusBarItemEl.setText(`Set Time: ${totalText} / ${targetText} (${diffText} ${underOver})`);
            } else {
                this.statusBarItemEl.setText('');
            }
        } else {
            this.statusBarItemEl.setText('');
        }
    }
}
