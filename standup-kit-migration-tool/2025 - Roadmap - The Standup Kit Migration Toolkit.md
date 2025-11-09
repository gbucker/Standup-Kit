## Roadmap: The "Standup Kit" Migration Toolkit

**Project Mission:** To build a one-time, command-line application that performs an ETL (Extract, Transform, Load) operation. It will **(E)**xtract legacy joke files, **(T)**ransform them using a GenAI agent (LangGraph) into the new "Standup Kit" schema, and **(L)**oad them into a new, chronologically-accurate Git repository.

**Core Technology Stack:**

- **Python:** For scripting, file I/O, and Git operations.
    
- **LangGraph:** To build a robust, multi-step AI agent for content transformation.
    
- **GitPython:** A Python library to programmatically control Git (init, add, commit, and backdate).
    
- **Typer/Click (Recommended):** To create a clean command-line interface (CLI).
    

---

### **Phase 1: Project Setup & "Extract" (The File Manifest)**

**Goal:** To set up the project and safely scan the user's legacy files in a read-only pass. We _must not_ modify any original files.

1. **Project Scaffolding:**
    
    - Set up a standard Python project (`pyproject.toml`, `.venv`).
        
    - Install core dependencies: `langchain`, `langgraph`, `gitpython`, `typer`, `python-dotenv` (for API keys).
        
2. **CLI Interface (Initial):**
    
    - Create a main script (e.g., `migrate.py`).
        
    - Implement the first command: `python migrate.py scan --source "/path/to/legacy/jokes" --output "manifest.json"`.
        
3. **File System Scanner ("Extract"):**
    
    - This `scan` command recursively walks the `--source` directory.
        
    - For _every_ file, it extracts:
        
        1. `source_path`: The full, original path.
            
        2. `file_content`: The raw text content of the file.
            
        3. `last_modified_date`: The OS-level "last modified" timestamp (e.g., from `os.path.getmtime`). This is the _key_ to the Git Time Machine.
            
        4. `created_date`: The OS-level "created" timestamp.
            
    - **Output:** A single `manifest.json` file, which is an array of the objects created above. This manifest is the "queue" of work for our AI.
        

---

### **Phase 2: "Transform" (The LangGraph Migration Agent)**

**Goal:** To build the AI "brain" that takes one manifest item, processes it, and outputs a structured "Migration Plan." This is where the core logic lives.

1. **Graph Definition:** We will build a LangGraph agent with several nodes.
    
    - **Input:** A single JSON object from the `manifest.json`.
        
    - **Output:** A "Migration Plan" JSON object.
        
2. **Node 1: `classify_file` (Router Node)**
    
    - **Task:** An LLM call to read the `file_content` and classify its type.
        
    - **Logic:** "Based on the content, is this: `(A) a single_joke`, `(B) a mixed_setlist` (i.e., multiple jokes written inline, our most common case), `(C) a reference_setlist` (i.e., just a list of titles), or `(D) garbage`?"
        
    - This node uses conditional routing to decide where to go next.
        
3. **Node 2: `chunk_file` (Conditional Node)**
    
    - **Runs if:** `classify_file` -> `mixed_setlist`.
        
    - **Task:** An LLM call to split the `file_content` into a list of "raw joke chunks."
        
    - **Prompting:** "Split the following text into a list of individual jokes. Use the `^` symbol as a primary signal for a new joke's punchline. Each item in the list should contain the _full text_ of one joke (setup, punchline, and tags)."
        
    - **Output:** A list of strings: `[ "joke text 1...", "joke text 2..." ]`.
        
4. **Node 3: `structure_joke` (The "Worker" Node)**
    
    - **Runs on:** Each "raw joke chunk" (or on the full content if `single_joke`).
        
    - **Task:** The main LLM call. This formats the raw text into our final schema.
        
    - **System Prompt:** "You are an expert comedy formatter for the 'Standup Kit' app. Take the raw joke text and format it.
        
        1. The user _may_ have already used `^` for the main punchline. Ensure it is present.
            
        2. Identify all follow-up punchlines and format them as `+ (Tag)`.
            
        3. Identify tag-on-a-tags and format them as `++ (Tag-on-a-tag)`.
            
        4. Identify any performance notes (e.g., "[pause]") and format them as `> (Note) [pause]`.
            
        5. Identify any old, discarded ideas and format them as `~ (Boneyard) ...`.
            
        6. Generate a unique, kebab-case `id` for this joke (e.g., `airline-peanuts`).
            
        7. Generate the YAML: `est_duration` (an estimate), `status` (default to 'draft'), `themes` (a list of 1-3 inferred themes)."
            
    - **Output:** A structured JSON object for _one_ joke.
        
5. **Node 4: `assemble_plan` (Collector Node)**
    
    - **Task:** Gathers all the structured jokes and assembles the final "Migration Plan."
        
    - **Output (The Plan):**
        
        JSON
        
        ```
        {
          "original_source_path": "/path/to/setlist-1.txt",
          "commit_date": "2024-10-05T14:30:00Z", // The original last_modified_date
          "jokes_to_create": [
            { 
              "id": "airline-peanuts", 
              "yaml": "---...---", 
              "content": "(Setup)...^..."
            } 
          ],
          "setlists_to_create": [
            { 
              "id": "2024-10-05-migrated-set", 
              "yaml": "---...---", 
              "content": "![[airline-peanuts]]"
            }
          ]
        }
        ```
        

---

### **Phase 3: "Load" (The Git Time Machine)**

**Goal:** To execute the "Migration Plans," creating the new vault and, most importantly, the backdated Git history.

1. **CLI Interface (Final):**
    
    - Implement the main command: `python migrate.py run --plan "/path/to/plans.json" --target "/path/to/new-comedy-vault"`.
        
2. **"Time Machine" Processor:**
    
    - **Step 1: Init:** Creates the `--target` directory, runs `git init`, and creates the `/jokes` and `/sets` subfolders.
        
    - **Step 2: Sort:** Reads all "Migration Plans" and **sorts them by `commit_date`, oldest to newest.** This is the _most critical step_ for a chronological history.
        
    - Step 3: Loop & Commit: The script iterates through the sorted plans. For each plan:
        
        a. It writes the new joke/setlist files to their respective folders (/jokes/id.md).
        
        b. It runs git add . (or adds files individually).
        
        c. It uses GitPython to create the commit with a forged date.
        
        ```python
        
        # (Conceptual code)
        
        from git import Repo
        
        repo = Repo("/path/to/new-comedy-vault")
        
        commit_date_str = plan['commit_date']
        
        ```
          repo.index.commit(
              message=f"MIGRATE: Add joke '{id}'",
              author_date=commit_date_str,
              commit_date=commit_date_str
          )
          ```
        ```
        
    - This loop builds the entire Git history, one commit (or one plan) at a time, from the past to the present.
        

---

### **Phase 4: Review & Finalization**

**Goal:** To acknowledge that the AI is not perfect and provide the user with a final report.

1. **Generate Summary Report:**
    
    - After the "Load" phase, the script will create a `MIGRATION_SUMMARY.md` file in the root of the new vault.
        
2. **Report Contents:**
    
    - "Migration completed on [Current Date]."
        
    - "Processed: X legacy files."
        
    - "Created: Y new joke files and Z new setlist files."
        
    - "**Manual Review Required:**" A list of any files that the agent classified as `garbage` or had low confidence on.
        
3. **Final Step (Manual):** The roadmap is complete when the user opens the new vault, reads the summary, and manually reviews/cleans up any files the AI flagged.