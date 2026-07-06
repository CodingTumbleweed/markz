# Markz -- Sprint Progress Tracker

This document tracks sprint-by-sprint progress. Updated after each sprint is completed.

---

## Phase 1: Alpha

Goal: Usable for writing a single Markdown file with rich content.

### Sprint 0: Project Scaffolding

| | |
|---|---|
| **Status** | Complete |
| **Dates** | 2026-03-28 |
| **Deliverable** | Electron window with blank CodeMirror 6 editor, HMR dev server, runnable build |

**Features delivered:** Electron 41 + Vite + esbuild + TypeScript strict + CodeMirror 6 editor scaffold. Main/preload/renderer process split with typed IPC bridge, context isolation, base CSS with clean writing-focused layout.

**Metrics:**

| Metric | Target | Actual |
|--------|--------|--------|
| `npm run dev` launches app | Yes | Yes |
| `npm run build` produces binary | Yes | Yes |

**Blockers:** --

**Notes:** `ELECTRON_RUN_AS_NODE` must be unset before spawning Electron (Cursor IDE sets it globally). Dev script handles this automatically.

---

### Sprint 1: Markdown Parsing + Inline Decorations

| | |
|---|---|
| **Status** | Complete |
| **Dates** | 2026-03-28 |
| **Deliverable** | Headings, bold, italic, strikethrough, links, inline code, horizontal rules render inline with cursor-aware toggling |

**Features delivered:** Decoration engine using CodeMirror 6 ViewPlugin with syntax tree traversal. Cursor-aware rendering: active line shows raw markdown, all other lines show styled output. Headings (H1-H6) with scaled font sizes, bold/italic/strikethrough with hidden syntax markers, inline code with background, links with hidden URL syntax, horizontal rules via line decoration, auto-linked URLs.

| ID | Feature | Done |
|----|---------|------|
| B-1 | Paragraphs separated by blank lines | |
| B-2 | Single line break via Shift+Return | |
| B-4 | ATX headings | |
| B-36 | Horizontal rules | |
| S-1 | Bold | |
| S-2 | Italic | |
| S-3 | Strikethrough | |
| S-5 | Inline code | |
| S-6 | Inline links | |
| S-7 | Reference links | |
| S-8 | Internal links | |
| S-9 | Auto-linked URLs | |

**Metrics:**

| Metric | Target | Actual |
|--------|--------|--------|
| Typing latency (1K line doc) | < 16ms | TBD |

**Blockers:** --

**Notes:** Block-level replace decorations (widget with `block: true`) cannot be used in ViewPlugins per CodeMirror 6 API. Used line decorations for horizontal rules instead.

---

### Sprint 2: Block Elements

| | |
|---|---|
| **Status** | Complete |
| **Dates** | 2026-03-28 |
| **Deliverable** | Lists, blockquotes, task lists, YAML front matter render inline |

**Features delivered:** Blockquote line decorations with styled left border, bullet/ordered list rendering, task list checkboxes (checked/unchecked) with visual markers, YAML front matter styled block, keyboard shortcuts (Cmd+B/I/1-6/K, Shift+Enter), list auto-continuation on Enter for bullets, ordered lists, blockquotes, and task lists.

| ID | Feature | Done |
|----|---------|------|
| B-7 | Blockquotes | |
| B-8 | Nested blockquotes | |
| B-9 | Auto-insert `>` on new line | |
| B-10 | Unordered lists | |
| B-11 | Ordered lists | |
| B-12 | Nested lists with Tab/Shift+Tab | |
| B-13 | Task lists with clickable checkbox | |
| B-15 | Auto-continue list on Enter | |
| B-37 | YAML front matter | |
| K-1 | Standard formatting shortcuts | |
| K-2 | Heading level shortcuts | |
| K-3 | Insert shortcuts | |

**Blockers:** --

**Notes:** --

---

### Sprint 3: Block Widgets

| | |
|---|---|
| **Status** | Complete |
| **Dates** | 2026-03-28 |
| **Deliverable** | Code blocks with syntax highlighting, inline images, tables with GUI toolbar |

**Features delivered:** Code block widget with highlight.js syntax highlighting (190+ languages), click-to-edit pattern. Image widget with inline preview, error handling. Table widget rendering HTML table with alignment support. All block widgets use StateField with widget-alongside-source pattern (source lines hidden via line decorations, widgets inserted alongside).

| ID | Feature | Done |
|----|---------|------|
| B-16 | Fenced code blocks | |
| B-17 | Language identifier | |
| B-18 | Syntax highlighting (100+ languages) | |
| B-26 | GFM tables | |
| B-27 | Graphical table toolbar | |
| B-30 | Context menu for table operations | |
| B-31 | Inline formatting in table cells | |
| S-10 | Images with inline preview | |
| IM-1 | Insert image via drag-and-drop | |
| IM-2 | Insert image via paste from clipboard | |
| IM-3 | Insert image via file dialog | |
| IM-4 | Relative path for local images | |

**Blockers:** --

**Notes:** --

---

### Sprint 4: Math Rendering

| | |
|---|---|
| **Status** | Complete |
| **Dates** | 2026-03-28 |
| **Deliverable** | Block and inline math via KaTeX with MathJax fallback |

**Features delivered:** KaTeX integration for block math (`$$...$$`) and inline math (`$...$`). Block math renders as centered display math with click-to-edit. Inline math renders as inline KaTeX output. Custom regex-based scanners for math delimiters (not parsed by Lezer). MathJax fallback deferred to later sprint -- KaTeX covers the vast majority of LaTeX math. CSP updated for KaTeX fonts.

| ID | Feature | Done |
|----|---------|------|
| M-1 | Block math (`$$...$$`) | |
| M-2 | Inline math (`$...$`) | |
| M-3 | KaTeX rendering (primary) | |
| M-4 | MathJax fallback | |
| M-7 | AMSmath environments | |
| B-23 | Block math with `$$` | |
| B-24 | Click-to-edit math | |
| B-25 | Keyboard nav to finish editing | |
| S-11 | Inline math | |

**Blockers:** --

**Notes:** --

---

### Sprint 5: File Operations + Menu

| | |
|---|---|
| **Status** | Complete |
| **Dates** | 2026-03-28 |
| **Deliverable** | Open, save, create files. Application menu. Auto-save. Status bar with word count. Find/replace. |

**Features delivered:** File open/save/save-as via IPC with native dialogs. Application menu (File, Edit, View, Format) with keyboard shortcuts. Auto-save with 5s debounce. Config store at ~/.markz/config.json. Status bar with word count, character count, line/column position. Recent files tracking. File modification indicator in status bar.

| ID | Feature | Done |
|----|---------|------|
| I-1 | Open .md files natively | |
| F-13 | Auto-save | |
| F-15 | Create new file | |
| E-3 | Source code mode toggle | |
| E-8 | Word count | |
| E-12 | Find | |
| E-13 | Find and replace | |
| E-19 | Undo / redo | |
| E-4 | Auto-pair brackets | |
| E-5 | Auto-pair quotes | |
| H-1 | `<u>` underline | |
| S-4 | Underline | |
| P-7 | Persist settings in JSON config | |
| K-4 | Navigation shortcuts | |

**Blockers:** --

**Notes:** --

---

### Sprint 6: Theme Engine + PDF Export

| | |
|---|---|
| **Status** | Complete |
| **Dates** | 2026-03-28 |
| **Deliverable** | Light and dark themes. PDF and HTML export. |

**Features delivered:** Theme loader with runtime CSS swapping. GitHub light theme and Night dark theme. Dark mode detection (auto/light/dark). Font size configuration. PDF export via hidden BrowserWindow + printToPDF with configurable paper size, margins, and background printing. HTML export with inline CSS. Export menu items with keyboard shortcuts.

| ID | Feature | Done |
|----|---------|------|
| T-1 | Built-in light theme (GitHub-style) | |
| T-2 | Built-in dark theme | |
| T-9 | Dark mode: auto / light / dark | |
| T-13 | Customizable font size | |
| X-1 | Export to PDF | |
| X-2 | PDF: configurable paper size | |
| X-3 | PDF: configurable margins | |
| X-4 | PDF: print background | |
| X-11 | Export to HTML (with styles) | |

**Blockers:** --

**Notes:** --

---

### Sprint 7: Alpha Polish + Packaging

| | |
|---|---|
| **Status** | Complete |
| **Dates** | 2026-03-28 |
| **Deliverable** | Downloadable Alpha release (.dmg, .exe, .deb) with all P0 features |

**Features delivered:** Auto-pair brackets/quotes (closeBrackets extension). Outline panel for heading navigation. Sidebar shell for file tree. electron-builder packaging for macOS (.app). GitHub light and Night dark themes. Full application menu. Status bar with word/char/line/col counts.

| ID | Feature | Done |
|----|---------|------|
| E-16 | Outline panel | |
| F-1 | File tree sidebar | |
| F-6 | Recent files list | |
| F-12 | Tabbed editing | |
| F-18 | Open folder as workspace | |
| SY-1 | macOS .dmg installer | |
| SY-2 | Windows .exe installer | |
| SY-3 | Linux .deb package | |

**Metrics:**

| Metric | Target | Actual |
|--------|--------|--------|
| Cold startup time | < 2s | ~1.5s |
| Typing latency (1K line doc) | < 16ms | TBD |
| Bundle size (macOS .app) | -- | 281 MB |
| P0 feature coverage | 100% | ~85% |

**Blockers:** --

**Notes:** Tabbed editing and file tree sidebar are stubbed but not fully functional. Recent files UI not yet wired. These can be completed in Beta phase.

---

## Phase 2: Beta

Goal: Feature-complete for daily use.

### Sprint 8: Widget-Alongside-Source Refactor

| | |
|---|---|
| **Status** | Complete |
| **Dates** | 2026-03-28 |
| **Deliverable** | Refactored block rendering to widget-alongside-source pattern for correct arrow key navigation and click behavior |

**Features delivered:** Replaced all `Decoration.replace({ block: true })` usages with widget-alongside-source pattern. Source lines hidden via `Decoration.line({ class: 'markz-source-hidden' })`, rendered widgets inserted via `Decoration.widget({ block: true, side: -1 })`. Cursor-aware toggling: clicking a widget or navigating into a block reveals raw source; moving away re-renders the widget. Fixed decoration sort with `startSide` tiebreaker. Extracted `addBlockWidget` and `hideSourceLines` helpers for consistent application across all block types (code blocks, tables, images, block math).

| ID | Feature | Done |
|----|---------|------|
| -- | Replace `Decoration.replace` with widget-alongside-source | Yes |
| -- | Arrow key navigation through block elements | Yes |
| -- | Click-to-edit on rendered widgets | Yes |
| -- | Source hidden CSS (zero-height lines) | Yes |
| -- | Decoration sort fix (startSide tiebreaker) | Yes |

**Blockers:** --

**Notes:** This refactor was triggered by fundamental limitations of `Decoration.replace({ block: true })` in CodeMirror 6 -- replaced lines are removed from CM's internal line map, breaking arrow key navigation. The widget-alongside-source pattern keeps source lines in the DOM (hidden via CSS) so CM can navigate through them natively.

---

### Sprint 9: File Management

| | |
|---|---|
| **Status** | Complete |
| **Dates** | 2026-03-28 – 2026-04-06 |
| **Deliverable** | Full file tree CRUD, Open Quickly, recent files UI, external change detection, menu gap fixes |

**Features delivered:** File tree sidebar with expand/collapse directories, file icons, active file highlighting, and workspace label. Open Folder dialog via IPC with `fs.watch` auto-refresh. File CRUD: new file button, right-click context menu with rename (inline input) and delete-to-trash. Open Quickly modal (Cmd+P) with fuzzy search across workspace files. Open Recent submenu in File menu (up to 10 items, clear option). External change detection via 3s mtime polling with auto-reload for unmodified buffers. Menu gap fixes: Find/Replace via CodeMirror search panel, Format actions (bold/italic/strikethrough/headings) using proper wrap/heading logic, Toggle Sidebar (Cmd+\\), Toggle Outline (Cmd+Shift+O). Sidebar layout: editor and status bar shift when sidebar is visible.

| ID | Feature | Done |
|----|---------|------|
| F-1 | File tree sidebar | Yes |
| F-3 | Open Quickly (Cmd+P) | Yes |
| F-6 | Recent files list | Yes |
| F-14 | Detect external file changes | Yes |
| F-15 | Create new file from sidebar | Yes |
| F-16 | Rename file from sidebar | Yes |
| F-17 | Delete file from sidebar | Yes |
| F-18 | Open folder as workspace | Yes |

**Blockers:** --

**Notes:** Strikethrough accelerator changed from Cmd+Shift+S (collided with Save As) to Cmd+Shift+X. File tree filters hidden files (dotfiles). Delete moves to OS trash via `shell.trashItem`. Folder watcher uses recursive `fs.watch`. Open Quickly indexes all non-hidden, non-node_modules files recursively.

---

### Sprint 10: Editing UX

| | |
|---|---|
| **Status** | Complete |
| **Dates** | 2026-04-06 |
| **Deliverable** | Focus mode, typewriter mode, command palette, source mode toggle, spellcheck, enhanced status bar, editing shortcuts |

**Features delivered:** Focus mode (dims all blocks except the one the cursor is in) via StateField + line decorations with CSS transition. Typewriter mode (keeps active line vertically centered) via ViewPlugin + scrollDOM offset. Command palette (Cmd+Shift+P) with fuzzy search across all registered actions. Source code mode toggle (Cmd+/) hides all widget rendering and shows raw Markdown via body class + CSS overrides. System spellcheck integration via Electron's `session.setSpellCheckerLanguages`. Enhanced status bar with line count, estimated reading time (~N min read), word/char counts. Copy/cut whole line when no selection (Cmd+C/X). Paste as plain Markdown (Cmd+Shift+V). Strikethrough shortcut fixed from Cmd+Shift+S (conflicted with Save As) to Cmd+Shift+X. Format menu actions now properly wrap selection using the shared `wrapSelection`/`setHeading` functions.

| ID | Feature | Done |
|----|---------|------|
| E-1 | Focus mode | Yes |
| E-2 | Typewriter mode | Yes |
| E-3 | Source code mode toggle | Yes |
| E-9 | Character count | Yes |
| E-10 | Line count | Yes |
| E-11 | Estimated reading time | Yes |
| E-20 | Copy/cut whole line | Yes |
| E-22 | Command palette | Yes |
| E-23 | Spellcheck | Yes |
| E-28 | Paste as plain Markdown | Yes |

**Blockers:** --

**Notes:** Zoom handled in Sprint 16. Regex find is supported natively by CodeMirror's search panel. Auto-pair brackets/quotes already enabled via `closeBrackets` extension from Alpha Sprint 7.

---

### Sprint 11: Diagrams

| | |
|---|---|
| **Status** | Complete |
| **Dates** | 2026-04-06 |
| **Deliverable** | Mermaid diagrams with all P1 types, right-click save/copy as SVG/PNG |

**Features delivered:** Mermaid integration via `mermaid` npm package. MermaidWidget renders ` ```mermaid ` fenced code blocks as SVG diagrams using the widget-alongside-source pattern. Supports all Mermaid diagram types (flowchart, sequence, gantt, class, state, pie, mindmap, timeline, etc.). Theme-aware initialization (auto-detects dark mode). Right-click context menu on rendered diagrams with: Copy as SVG, Copy as PNG, Save as SVG, Save as PNG. Diagram errors shown inline with styled error message. CSP updated for mermaid's eval and blob requirements.

| ID | Feature | Done |
|----|---------|------|
| D-1 | Mermaid: Flowchart | Yes |
| D-2 | Mermaid: Sequence diagram | Yes |
| D-3 | Mermaid: Gantt chart | Yes |
| D-4 | Mermaid: Class diagram | Yes |
| D-5 | Mermaid: State diagram | Yes |
| D-6 | Mermaid: Pie chart | Yes |
| D-24 | Mermaid theme via dark mode | Yes |
| D-29 | Right-click save diagram as SVG/PNG | Yes |
| D-30 | Right-click copy diagram as image | Yes |

**Blockers:** --

**Notes:** All Mermaid types are supported since the mermaid library handles all of them natively. Save as PNG uses canvas-based SVG-to-PNG conversion at 2x scale.

---

### Sprint 12: Extended Markdown

| | |
|---|---|
| **Status** | Complete |
| **Dates** | 2026-04-06 |
| **Deliverable** | Footnotes, TOC, GitHub alerts, emoji, highlight/subscript/superscript |

**Features delivered:** All extended markdown features implemented as inline decorations in the ViewPlugin. `==highlight==` renders with yellow background. `~subscript~` and `^superscript^` render with proper vertical alignment and reduced font size. `:emoji:` shortcodes replaced with Unicode emoji (40+ common shortcodes). `[^footnote]` references styled as superscript links. `[toc]` placeholder styled distinctively. GitHub-style alerts (`> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]`) rendered with colored left borders and tinted backgrounds. All decorations reveal source syntax when cursor enters the decorated range.

**Blockers:** --

**Notes:** Inline HTML rendering deferred to later sprint (requires HTML sanitization and CSP considerations). Footnote definition rendering (the footnote content at the bottom) not yet connected — only the reference is styled.

---

### Sprint 13: Full Export + Import

| | |
|---|---|
| **Status** | Complete |
| **Dates** | 2026-04-06 |
| **Deliverable** | Enhanced native PDF/HTML export with markdown-it rendering, YAML front matter, KaTeX math, syntax highlighting |

**Features delivered:** Created `render.ts` export module with full markdown-it pipeline: syntax highlighting (highlight.js), `==highlight==`, `~subscript~`, `^superscript^` via custom inline rules, block/inline math converted to KaTeX delimiters (`\[...\]`/`\(...\)`), GitHub alerts. YAML front matter parser extracts `title`, `author`, `subject`, `keywords`, `date` for metadata injection. PDF export now renders markdown properly with configurable paper size (A4/A5/Letter/Legal), margins, header/footer templates with variable substitution (`${title}`, `${author}`, `${today}`). HTML export includes KaTeX CDN auto-render script, document metadata from YAML, styled output. Both exports use a clean GitHub-style CSS theme.

| ID | Feature | Done |
|----|---------|------|
| X-1 | Export to PDF | Yes |
| X-2 | PDF: configurable paper size | Yes |
| X-3 | PDF: configurable margins | Yes |
| X-4 | PDF: print background | Yes |
| X-5 | PDF: header/footer with variable substitution | Yes |
| X-7 | PDF: metadata from YAML | Yes |
| X-11 | Export to HTML (with styles) | Yes |
| X-12 | Export to HTML (without styles) | Yes (via options) |

**Blockers:** Pandoc-based exports (docx, epub, LaTeX) require Pandoc to be installed on the user's system. This will be addressed in a future sprint with auto-detection and path configuration.

**Notes:** Export pipeline now receives raw markdown and handles all rendering server-side via markdown-it. KaTeX in HTML export uses CDN auto-render (requires internet for math in exported HTML).

---

### Sprint 14: Theme Engine + Preferences Panel

| | |
|---|---|
| **Status** | Complete |
| **Dates** | 2026-04-06 |
| **Deliverable** | 3 built-in themes, theme engine with CSS variables, full preferences panel |

**Features delivered:** Theme engine with CSS custom properties (`data-theme` attribute on `<html>`). Three built-in themes: **GitHub** (default sans-serif), **Newsprint** (warm serif), **Minimal** (ultra-clean monochrome). Each theme has light and dark variants. Dark mode selection: Auto (follow OS via `prefers-color-scheme`), Light, Dark. OS dark mode changes detected in real-time. Preferences panel (`Cmd+,` or menu) with live-apply: theme selection, dark mode, font size (10–32), font family (custom or system default), writing area width (400–1600), indent size, line numbers toggle, auto-save toggle. All settings persisted to `~/.markz/config.json` and applied on startup. Config model extended with `fontFamily`, `writingWidth`, `lineNumbers`.

| ID | Feature | Done |
|----|---------|------|
| T-1 | Built-in light theme (GitHub) | Yes |
| T-2 | Built-in dark theme | Yes |
| T-3 | Built-in serif theme (Newsprint) | Yes |
| T-4 | Built-in minimal theme | Yes |
| T-9 | Dark mode: auto/light/dark | Yes |
| T-12 | Customizable font family | Yes |
| T-13 | Customizable font size | Yes |
| T-14 | Customizable writing area width | Yes |
| P-1 | General section (auto-save) | Yes |
| P-2 | Appearance section (theme, dark mode, font, width) | Yes |
| P-3 | Editor section (indent, line numbers) | Yes |
| P-6 | Apply changes without restart | Yes |
| P-7 | Persist settings in JSON config file | Yes |

**Blockers:** --

**Notes:** Custom theme loading from filesystem (T-5/T-6/T-7) deferred to post-Beta. Preferences panel uses native-looking form elements styled with theme variables.

---

## Phase 3: V1.0

Goal: Production-ready release.

### Sprint 15: Image Management

| | |
|---|---|
| **Status** | Complete |
| **Dates** | 2026-04-06 |
| **Deliverable** | Image insertion via drag-drop, paste, file dialog; auto copy-to-assets; relative paths |

**Features delivered:** Full image insertion pipeline. **Drag-and-drop**: drop image files onto the editor to auto-copy to `./assets/` folder and insert `![alt](path)` markdown. **Clipboard paste**: paste images from clipboard (screenshots, copied images) — saved as PNG to `./assets/` with timestamped filenames. **File dialog**: Insert Image command available via Format menu and Command Palette, opens native file picker. All inserted images are automatically copied to an `./assets/` subfolder relative to the document, with relative paths used in markdown. Collision detection for duplicate filenames (appends random hash). IPC handlers: `image:open-dialog`, `image:copy-to-assets`, `image:paste-clipboard`, `image:relative-path`. EditorView DOM event handlers for drop and paste events.

| ID | Feature | Done |
|----|---------|------|
| IM-1 | Insert image via drag-and-drop | Yes |
| IM-2 | Insert image via paste from clipboard | Yes |
| IM-3 | Insert image via file dialog | Yes |
| IM-4 | Relative path for local images | Yes |
| IM-5 | Copy image to configurable folder on insert | Yes (./assets/) |

**Blockers:** --

**Notes:** Image context menu operations (move/rename/delete from rendered widget) deferred to post-Beta. The assets folder location can be configured in the future via preferences.

---

### Sprint 16: Advanced Features

| | |
|---|---|
| **Status** | Complete |
| **Dates** | 2026-04-06 |
| **Deliverable** | Zoom support, move line up/down, auto-pair improvements |

**Features delivered:** **Zoom**: Cmd+=/- to zoom in/out, Ctrl+Scroll wheel zoom, using Electron's native `webContents.setZoomLevel()` for uniform page scaling. **Move line up/down**: Alt+Arrow Up/Down to reorder lines, cursor follows the moved line. **Auto-pair**: CodeMirror's built-in `closeBrackets` already handles `()`, `[]`, `{}`, `""`, `''`. All Mermaid diagram types already supported natively via the mermaid library (Sprint 11).

| ID | Feature | Done |
|----|---------|------|
| E-21 | Move row/paragraph up/down with Alt+Arrow | Yes |
| E-25 | Zoom (Cmd/Ctrl++/-) | Yes |
| E-26 | Zoom with mouse wheel (Ctrl+scroll) | Yes |

**Blockers:** --

**Notes:** Zoom was initially implemented via root font-size scaling, which caused layout drift (content shifting position instead of scaling uniformly). Replaced with Electron's native `webContents.setZoomLevel()` / `webFrame.setZoomLevel()` for true uniform page zoom. Math auto-numbering (M-9), mhchem (M-5), and physics (M-6) deferred — require KaTeX extensions and configuration UI. flowchart.js and js-sequence-diagrams (D-21/D-22) deferred — require additional npm packages and are P2.

---

### Sprint 17: Polish

| | |
|---|---|
| **Status** | Complete |
| **Dates** | 2026-04-06 |
| **Deliverable** | Smart punctuation, accessibility, welcome doc update, performance groundwork |

**Features delivered:** **Smart punctuation**: Automatic curly quotes (`"` → `""`/`""`), smart single quotes (`'` → `'`/`'`), em-dash (`--` → `—`), ellipsis (`...` → `…`). Implemented as `EditorView.inputHandler` for seamless typing. **Accessibility**: Added `role="main"` and `aria-label` to editor root. **Welcome document update**: Added extended syntax examples (highlight, subscript, superscript, emoji, GitHub alerts) and a mermaid diagram to the default welcome document. Updated shortcuts reference with preferences shortcut. **Move line up/down** already added in Sprint 16.

| ID | Feature | Done |
|----|---------|------|
| E-7 | Smart punctuation (curly quotes, em-dashes) | Yes |
| E-4 | Auto-pair brackets | Yes (closeBrackets) |
| E-5 | Auto-pair quotes | Yes (closeBrackets) |

**Blockers:** --

**Notes:** i18n infrastructure deferred to post-Beta. Performance is adequate for typical document sizes; large file optimization (viewport-only decoration) can be added if needed.

---

### Sprint 18: Release Engineering

| | |
|---|---|
| **Status** | Complete |
| **Dates** | 2026-04-06 |
| **Deliverable** | Beta release config, file associations, CLI open, build targets |

**Features delivered:** Bumped version to `0.2.0-beta.0`. **electron-builder config**: Full build configuration in package.json with app ID (`com.markz.editor`), product name, platform targets (macOS DMG/ZIP, Windows NSIS/Portable, Linux AppImage/DEB). **File associations**: `.md`, `.markdown`, `.mdown` registered as Markz file types with proper MIME type, role, and description. **CLI file open**: `markz file.md` from command line opens the file on launch. **macOS `open-file`**: Handles Finder double-click on associated files — opens in existing window or queues for window creation. **NSIS installer**: Configurable install directory, per-user install by default.

| ID | Feature | Done |
|----|---------|------|
| I-1 | Open .md and .markdown files natively | Yes |
| I-7 | Open from command line (`markz file.md`) | Yes |

**Blockers:** --

**Notes:** Auto-update (electron-updater) and code signing require distribution infrastructure (GitHub Releases, Apple Developer cert, Windows cert). These are set up when publishing. AppImage target configured for Linux.

---

### Post-Sprint Bug Fixes

|| |
|---|---|
| **Status** | Complete |
| **Dates** | 2026-04-06 |
| **Deliverable** | Fixes for preferences, PDF export, and zoom reported during user testing |

**Fixes delivered:**

| Issue | Fix |
|-------|-----|
| Preferences panel not opening with Cmd+, | Added fallback `keydown` listener in renderer; added "Preferences…" to Edit menu for non-macOS |
| Math and diagrams not rendering in PDF export | Server-side KaTeX rendering, Mermaid CDN injection, temporary file loading instead of `data:` URL |
| Code blocks corrupted in PDF export (`<span>` tags visible) | Pre-extract math from raw markdown before `markdown-it` processing to avoid `$` matching inside code |
| Zoom Cmd+=/- not working (menu bar worked) | Replaced Electron's built-in `role: 'zoomIn'/'zoomOut'` with custom IPC menu items |
| Zoom causing layout drift (content shifting position) | Replaced font-size-based zoom with Electron's native `webContents.setZoomLevel()` for uniform page scaling |

---

## Phase 2 Summary

**Beta phase is complete.** All 11 sprints (8-18) have been delivered, plus post-sprint bug fixes, covering:

- Widget-alongside-source architectural refactor for proper WYSIWYG navigation
- File management (sidebar, tree, CRUD, watch, recent files, Open Quickly)
- Editing UX (focus mode, typewriter mode, command palette, source mode, spellcheck)
- Mermaid diagrams with all types + save/copy as SVG/PNG
- Extended Markdown (highlight, subscript, superscript, emoji, footnotes, TOC, GitHub alerts)
- Full export pipeline (PDF with YAML metadata, HTML with KaTeX)
- Theme engine (3 themes, dark mode auto/manual, preferences panel)
- Image management (drag-drop, paste, file dialog, auto copy-to-assets)
- Advanced features (zoom, move line, smart punctuation)
- Release engineering (file associations, CLI open, build targets)
- Bug fixes: preferences shortcut, PDF export rendering, zoom behavior
