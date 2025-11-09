# Roadmap: "Standup Kit" Obsidian Plugin

This document outlines the complete development roadmap for the "Standup Kit" Obsidian plugin. The architecture is designed for a professional workflow, focusing on writing, rehearsal, performance, and material management.

---

## 1. Core Architecture & Philosophy

Our stack choice is **Obsidian**. This is a strategic decision that grants us several core features for free, allowing us to focus on high-value, comedy-specific functionality.

* **Atomic Notes (Jokes):** Each joke will be a single `.md` file in a `/jokes/` directory. This is the core of our "content atomization" strategy.
* **Transclusion (Setlists):** Setlists, in `/sets/`, will be built by embedding joke files (`![[joke-id]]`). Obsidian's native "Reading Mode" acts as our "compiler," solving the data duplication problem and ensuring a clean `git` history for every atomic joke.
* **YAML Metadata:** Native YAML front matter is our "database." It will power all stats, timing, and generation features.
* **Local-First & Git-Friendly:** The vault is just a folder of text files. This is ideal for `git` versioning and robust, offline-first use.
* **Plugin API:** Obsidian's TypeScript API provides the necessary hooks for custom editor styling (CodeMirror), UI panes (Rehearsal Mode), and status bar items (Live Stats).

---

## 2. Data Structures (The "Database" Schema)

Consistency in our YAML is critical for all downstream features.

### 2.1. Joke File Template (`/jokes/joke-id.md`)

This schema tracks the joke's individual lifecycle.

```yaml
---
est_duration: 30s
status: idea
themes: [travel, food, observation]
run_times:
  - 2025-11-09: 42s
  - 2025-11-08: 45s
---

(Setup) I’m on a flight, and the attendant hands me...
^ (Punch) It's not a snack, it's a suggestion.
+ (Tag) I asked for another...
++ (Tag-on-a-Tag) She looked at me...
~ (Boneyard) This tag about peanuts being sad bombed. (11/8)
> (Note) [Perf: Act confused]
````

- **`est_duration` (string):** The _target_ time (e.g., "30s", "1m15s"). Used by **Phase 2**.
    
- **`status` (string):** The joke's state (e.g., `idea`, `draft`, `needs-work`, `tight`). Used by **Phase 6**.
    
- **`themes` (list):** Keywords for search and filtering. Used by **Phase 6**.
    
- **`run_times` (list):** A historical log of _actual_ performance times, appended automatically by **Phase 3**.
    

### 2.2. Setlist File Template (`/sets/setlist-id.md`)

This schema tracks the metadata for a specific event.

YAML

```
---
title: "The Laugh Pit - Open Mic"
date: 2025-11-10
duration: 5m
actual_duration: 5m 14s
---

![[opener-bit]]
![[airline-peanuts]]
![[new-closer]]
```

- **`title` (string):** Human-readable name of the event.
    
- **`date` (string):** Event date (e.g., `YYYY-MM-DD`).
    
- **`duration` (string):** The _target_ time for the set (e.g., "5m"). Used by **Phase 2**.
    
- **`actual_duration` (string):** The _actual_ final runtime, written automatically by **Phase 3**.
    

---

## 3. The Development Roadmap (Phased)

### Phase 1: The Writer's Experience (Syntax & Editing)

Goal: Create a distraction-free, "opinionated" editor that visually reinforces the structure of a joke.

Implementation: A CodeMirror 6 extension to "decorate" lines based on our syntax, plus a simple CSS snippet.

- **Features:**
    
    - **Punchline (`^`):** Style lines starting with `^` (e.g., green, bold).
        
    - **Tag (`+`):** Style lines starting with `+` (e.g., yellow, indented).
        
    - **Tag Hierarchy (`++`, `+++`):** Each additional `+` will add another level of indentation. We are _not_ implementing multi-color logic; indentation is the correct visual cue.
        
    - **Performance Note (`>`):** Style blockquotes as dim, italic text.
        
    - **Boneyard (`~`):** (See Phase 5). We will implement the styling here. Style lines starting with `~` as (e.g., dim, strikethrough).
        

### Phase 2: The Setlist Builder (Live Statistics)

Goal: Provide real-time data to the user during the setlist creation process.

Implementation: A new Status Bar item that is context-aware.

- **Features:**
    
    - When a file with `duration` in its YAML is active, the plugin scans for `![[embeds]]`.
        
    - It uses `app.metadataCache` to read the `est_duration` from each embedded joke file.
        
    - It sums the total and compares it to the setlist's `duration`.
        
    - The status bar will display: **`Set Time: 4m 15s / 5m 00s (45s under)`**
        
    - This feedback loop is critical for building a set to a specific time.
        

### Phase 3: The Rehearsal Module (The "Lab")

Goal: A data-driven tool for practicing sets and capturing actual joke timings.

Implementation: A new "Custom View" (sidebar pane or new tab) activated by a Ribbon Icon.

- **Features:**
    
    - **UI:** Simple UI with Master Timer, Lap Timer, "Current Joke" text area, and a single `[ NEXT ]` button.
        
    - **Start Workflow:** User opens a setlist file and hits "Rehearse." The plugin parses the file, finds all joke `![[embeds]]` in order, and loads the _text_ of the first joke.
        
    - **Lap Workflow:** Hitting `[ NEXT ]` stops the lap timer, records the time, and writes it to the corresponding joke's `run_times` field in its YAML. It then loads the next joke's text and restarts the lap timer.
        
    - **Finish Workflow:** On the final "lap," the plugin stops all timers and writes the _Master Timer's_ value to the _setlist file's_ `actual_duration` field.
        

### Phase 4: The "On-Stage" Mode (The "Performer")

Goal: A read-only, minimal, high-contrast UI for use on a dark stage.

Implementation: A new command (Comedy: Open On-Stage Mode) that opens the active setlist in a new, custom-rendered view.

- **Features:**
    
    - **Minimal UI:** Black background, large white/off-white text. All sidebars, headers, and UI elements are hidden.
        
    - **Scroll-by-Tap:** The view is not a standard editor. Tapping the bottom 50% of the screen scrolls down; tapping the top 50% scrolls up.
        
    - **Keyword-Only Toggle:** A toggle (pre-set before launching) to only show the _first 5 words_ of each joke/setup, acting as a "memory jog" setlist rather than a full script.
        
    - **Read-Only:** This mode _cannot_ edit files.
        

### Phase 5: The "Boneyard" (Archiving)

Goal: Allow a joke file to serve as a complete history of the joke, including failed bits, without cluttering the performance script.

Implementation: The syntax (~) will be implemented in Phase 1, but its functional logic is implemented here.

- **Features:**
    
    - **Exclusion Logic:** The plugin will be updated to _filter out_ any line starting with `~` from:
        
        - The **Rehearsal Module (Phase 3)** "Current Joke" text area.
            
        - The **On-Stage Mode (Phase 4)** display.
            
    - This makes the `~` a "comment" for the writer that is invisible to the performer.
        

### Phase 6: The "Auto-Set" Generator (The "Booker")

Goal: A powerful utility to quickly generate a viable setlist based on specific criteria.

Implementation: A new command (Comedy: Build me a set) that opens a modal prompt.

- **Modal Prompt UI:**
    
    1. **Time:** (e.g., "7m")
        
    2. **Status:** (Dropdown: `Any`, `tight`, `needs-work`)
        
    3. **Themes (Optional):** (Text input, comma-separated)
        
- **Logic:**
    
    - The plugin will scan all files in `/jokes/`.
        
    - It filters them based on the `status` and `themes` criteria.
        
    - It then uses the _most recent_ `run_times` entry (not `est_duration`!) for each joke to get its _actual_ length.
        
    - It runs a simple algorithm (e.g., a "knapsack" or "bin packing" approach) to find a combination of jokes that adds up as close as possible to the target `Time` without going over.
        
    - It creates a new, untitled setlist file pre-populated with the `![[embeds]]` for the generated set.