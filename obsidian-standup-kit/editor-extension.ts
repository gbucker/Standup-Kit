import { ViewPlugin, Decoration, DecorationSet, ViewUpdate, EditorView } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { Range } from "@codemirror/state";

export function jokeSyntaxDecoration() {
    return ViewPlugin.fromClass(class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
            this.decorations = this.buildDecorations(view);
        }

        update(update: ViewUpdate) {
            if (update.docChanged || update.viewportChanged) {
                this.decorations = this.buildDecorations(update.view);
            }
        }

        buildDecorations(view: EditorView): DecorationSet {
            const builder: Range<Decoration>[] = [];
            for (const { from, to } of view.visibleRanges) {
                syntaxTree(view.state).iterate({
                    from,
                    to,
                    enter: (node) => {
                        const text = view.state.doc.sliceString(node.from, node.to);
                        if (node.name === "line") {
                            if (text.startsWith("^")) {
                                builder.push(Decoration.line({ class: "cm-joke-punchline" }).range(node.from));
                            } else if (text.startsWith("+++")) {
                                builder.push(Decoration.line({ class: "cm-joke-tag cm-joke-tag-3" }).range(node.from));
                            } else if (text.startsWith("++")) {
                                builder.push(Decoration.line({ class: "cm-joke-tag cm-joke-tag-2" }).range(node.from));
                            } else if (text.startsWith("+")) {
                                builder.push(Decoration.line({ class: "cm-joke-tag" }).range(node.from));
                            } else if (text.startsWith(">")) {
                                builder.push(Decoration.line({ class: "cm-performance-note" }).range(node.from));
                            } else if (text.startsWith("~")) {
                                builder.push(Decoration.line({ class: "cm-joke-boneyard" }).range(node.from));
                            }
                        }
                    },
                });
            }
            return Decoration.set(builder);
        }
    }, {
        decorations: v => v.decorations,
    });
}
