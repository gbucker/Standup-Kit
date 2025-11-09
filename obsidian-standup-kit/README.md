# Standup Kit Obsidian Plugin

**Standup Kit** is an Obsidian plugin designed to provide a comprehensive workflow for comedians, enabling them to write, rehearse, perform, and manage their material directly within Obsidian.

## Features

This plugin is being developed in phases. The currently implemented features include:

*   **Phase 1: The Writer's Experience:** A specialized editor with custom syntax highlighting for joke writing, including punchlines, tags, performance notes, and a "boneyard" for retired material.
*   **Phase 2: The Setlist Builder:** A live-updating status bar item that shows the total estimated time of a setlist and compares it to the target duration.
*   **Phase 3: The Rehearsal Module:** A custom "Rehearsal View" with a master timer and lap timer to practice sets and record actual joke timings.

For more details on the planned features, see the [Roadmap](2025%20-%20Roadmap%20-%20Standup%20Kit%20Obsidian%20Plugin.md).

## How to Use

1.  **Installation:**
    *   Clone this repository.
    *   Run `npm install` to install the dependencies.
    *   Run `npm run build` to create the `main.js` file.
    *   Copy the `main.js`, `manifest.json`, and `styles.css` files to your Obsidian vault's `.obsidian/plugins/standup-kit` directory.
2.  **Enable the Plugin:**
    *   In Obsidian, go to `Settings` > `Community plugins`.
    *   Make sure "Restricted mode" is turned off.
    *   Find "Standup Kit" in the list of installed plugins and enable it.

## Development

To contribute to the development of this plugin:

1.  Clone the repository.
2.  Install the dependencies with `npm install`.
3.  Run `npm run dev` to start the development server, which will automatically rebuild the plugin when you make changes.
4.  The `main.js` file will be created in the root of the repository. You will need to manually move it to your vault's plugin directory to test your changes.

## License

This project is licensed under the MIT License.
