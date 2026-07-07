# Changelog

All notable changes to **Markz** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Added

- Navigation regression harness (`npm run test:nav`) for block widget cursor movement.

### Fixed

- Arrow Up/Down now moves between visual navigation stops instead of skipping entire code, math, Mermaid, table, and image blocks in one keypress ([#2](https://github.com/CodingTumbleweed/markz/issues/2)).

---

## [Alpha] -- 2026-03-28

_Sprints 0-7 consolidated._

### Added

- Electron 41 + Vite + esbuild + TypeScript project scaffold
- CodeMirror 6 WYSIWYG Markdown editor with cursor-aware inline rendering
- Inline decorations: headings (H1-H6), bold, italic, strikethrough, inline code, links, URLs, horizontal rules
- Block elements: blockquotes, unordered/ordered lists, task lists, YAML front matter
- Code block widgets with highlight.js syntax highlighting (190+ languages)
- Table widgets with alignment support
- Image widgets with inline preview
- KaTeX math rendering: block (`$$...$$`) and inline (`$...$`)
- File operations: open, save, save as, new, auto-save (5s debounce)
- Application menu: File, Edit, View, Format with keyboard shortcuts
- Status bar: word count, character count, line/column, file name, modification indicator
- Keyboard shortcuts: Cmd+B/I/K, Cmd+1-6, Cmd+Shift+S/`/I/T/C
- List auto-continuation on Enter
- Auto-pair brackets and quotes
- Theme engine with GitHub light and Night dark themes
- Dark mode detection (auto/light/dark)
- PDF export with configurable paper size and margins
- HTML export with inline CSS
- Outline panel for heading navigation
- Config store at ~/.markz/config.json
- macOS .app packaging via electron-builder

---

## [Beta] -- 2026-04-06

_Sprints 8-18 consolidated._

### Added

- Widget-alongside-source rendering pattern for block elements (code, math, tables, images, diagrams)
- File tree sidebar with expand/collapse, file icons, workspace label
- Open Folder dialog with `fs.watch` recursive folder watching
- File CRUD from sidebar: new file, rename (inline input), delete to trash
- Open Quickly modal (Cmd+P) with fuzzy search across workspace files
- Recent files submenu (File > Open Recent) with up to 10 entries and clear option
- External change detection via mtime polling with auto-reload for unmodified buffers
- Focus mode: dims all blocks except the one containing the cursor
- Typewriter mode: keeps active line vertically centered
- Command palette (Cmd+Shift+P) with fuzzy search across all registered actions
- System spellcheck integration via Electron `session.setSpellCheckerLanguages`
- Enhanced status bar: line count, estimated reading time
- Mermaid diagram rendering for all diagram types (flowchart, sequence, gantt, class, state, pie, mindmap, timeline, etc.)
- Mermaid dark mode awareness and right-click save/copy as SVG/PNG
- Extended Markdown: `==highlight==`, `~subscript~`, `^superscript^`, `:emoji:` shortcodes, `[^footnote]` references, `[toc]` placeholder
- GitHub-style alerts: `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]`
- Server-side markdown-it export pipeline with highlight.js, KaTeX, and Mermaid support
- PDF export: YAML front matter metadata, header/footer with variable substitution (`${title}`, `${author}`, `${today}`)
- HTML export: KaTeX CDN auto-render, Mermaid CDN script, document metadata
- Theme engine with CSS custom properties and `data-theme` attribute
- Three built-in themes: GitHub (sans-serif), Newsprint (warm serif), Minimal (ultra-clean)
- Dark mode selection: Auto (follows OS), Light, Dark with real-time OS change detection
- Preferences panel (Cmd+,) with live-apply: theme, dark mode, font size/family, writing width, indent size, line numbers, auto-save
- Image insertion via drag-and-drop, clipboard paste, and file dialog
- Auto copy-to-assets folder with relative paths and collision detection
- Zoom via Electron's native `webContents.setZoomLevel()` (Cmd+=/-, Ctrl+scroll)
- Move line up/down with Alt+Arrow Up/Down
- Smart punctuation: curly quotes, em-dashes, ellipsis
- File associations for `.md`, `.markdown`, `.mdown`
- CLI open: `markz file.md` from command line
- macOS `open-file` event handling for Finder double-click
- electron-builder config: macOS (DMG/ZIP), Windows (NSIS/Portable), Linux (AppImage/DEB)

### Changed

- Block decorations refactored from `Decoration.replace({ block: true })` to widget-alongside-source pattern
- Export pipeline receives raw markdown instead of pre-rendered HTML
- Strikethrough shortcut changed from Cmd+Shift+S to Cmd+Shift+X (conflict with Save As)
- CSP updated for `blob:` img-src and `unsafe-eval` script-src (required by Mermaid)
- Version bumped to 0.2.0-beta.0

### Fixed

- Arrow key navigation through block elements (code, math, tables, images)
- Click-to-edit on rendered block widgets
- Preferences panel not opening with Cmd+, (added fallback keydown listener)
- Math and diagrams not rendering in PDF export (server-side KaTeX, temp file loading)
- Code blocks corrupted in PDF export (math extraction before markdown-it processing)
- Zoom Cmd+=/- intercepted by Electron's built-in roles (replaced with custom IPC menu items)
- Zoom causing layout drift (replaced font-size scaling with native page zoom)
- Status bar not shifting when sidebar visible
- Format menu actions inserting raw text instead of wrapping selection
- `EditorView.dispatch` TypeScript type error in custom wrapper

### Removed

- `Decoration.replace({ block: true })` usage (replaced by widget-alongside-source)
- Font-size-based zoom implementation (replaced by Electron native zoom)

---

## [V1.0] -- TBD

_To be written after V1.0 sprints are complete._

### Added

### Changed

### Fixed

### Removed
