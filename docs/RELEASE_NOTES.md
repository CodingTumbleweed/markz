# Markz -- Release Notes

---

## Alpha

**Release date:** 2026-03-28

### Highlights

Markz Alpha delivers a fully functional WYSIWYG Markdown editor built on Electron 41 + CodeMirror 6. Write naturally in Markdown and see your content render inline as you type -- headings scale to their proper sizes, bold/italic/strikethrough render with hidden syntax markers, code blocks highlight in 190+ languages, and math equations render beautifully via KaTeX.

### What's included

- **WYSIWYG Editor**: Cursor-aware inline rendering -- the line you're editing shows raw Markdown, everything else renders as styled output
- **Rich Markdown**: Headings (H1-H6), bold, italic, strikethrough, inline code, links, horizontal rules
- **Block Elements**: Blockquotes with styled borders, bullet/ordered lists, task lists with clickable checkboxes, YAML front matter
- **Code Blocks**: Syntax highlighting via highlight.js for 190+ languages, language label, click-to-edit
- **Tables**: Rendered HTML tables with header/body separation and column alignment
- **Math**: KaTeX rendering for block (`$$...$$`) and inline (`$...$`) math
- **Images**: Inline preview with error handling
- **File Management**: Open, save, save as, new document, auto-save with 5s debounce
- **Application Menu**: File, Edit, View, Format menus with full keyboard shortcuts
- **Status Bar**: Word/character count, line/column position, file modification indicator
- **Themes**: GitHub light and Night dark themes with auto dark mode detection
- **Export**: PDF (configurable paper size, margins, background) and HTML (with inline CSS)
- **Outline Panel**: Heading navigation with click-to-jump
- **Auto-pair**: Brackets, quotes, and backticks auto-close

### Known limitations

- Tabbed editing and file tree sidebar are scaffolded but not yet functional
- MathJax fallback for unsupported KaTeX commands not yet implemented
- Recent files list not wired to UI
- No drag-and-drop file opening
- Windows and Linux packaging not tested (macOS only in this release)

### Getting started

```bash
cd markz
npm install
npm run dev     # Launch in development mode
npm run build   # Build for production
```

---

## Beta

**Release date:** 2026-04-06  
**Version:** 0.2.0-beta.0

### Highlights

Markz Beta transforms the Alpha editor into a feature-complete daily-use writing tool. The biggest architectural change is the **widget-alongside-source** pattern, which fixes cursor navigation through rendered blocks (code, math, tables, images, diagrams). Beyond that, Beta adds a full file management sidebar, a preferences panel, Mermaid diagrams, extended Markdown syntax, a robust export pipeline with proper math and diagram rendering, image management, and three polished themes.

### What's new

- **File Management**: Full file tree sidebar with expand/collapse, file icons, workspace label. Open Folder (File > Open Folder), new/rename/delete files via right-click context menu. Open Quickly (Cmd+P) with fuzzy search across workspace. Recent files submenu. External change detection with auto-reload. Folder watching via `fs.watch`.
- **Editing UX**: Focus mode (dims non-active blocks). Typewriter mode (keeps cursor centered). Command palette (Cmd+Shift+P) with fuzzy search. Source code mode toggle (Cmd+/). System spellcheck. Enhanced status bar with line count and estimated reading time.
- **Mermaid Diagrams**: All diagram types (flowchart, sequence, gantt, class, state, pie, mindmap, timeline, etc.) render inline via the widget-alongside-source pattern. Dark mode aware. Right-click to copy/save as SVG or PNG.
- **Extended Markdown**: `==highlight==`, `~subscript~`, `^superscript^`, `:emoji:` shortcodes (40+), `[^footnote]` references, `[toc]` placeholder, GitHub-style alerts (`> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]`).
- **Export Pipeline**: PDF and HTML exports now use a server-side markdown-it rendering pipeline with highlight.js syntax highlighting, KaTeX math (server-side rendered), and Mermaid diagrams (CDN-loaded in print window). PDF supports configurable paper size, margins, headers/footers with variable substitution, and YAML front matter metadata.
- **Themes & Preferences**: Three built-in themes -- GitHub (sans-serif), Newsprint (warm serif), Minimal (ultra-clean). Dark mode: auto/light/dark. Preferences panel (Cmd+,) with live-apply for theme, font size, font family, writing width, indent size, line numbers, auto-save.
- **Image Management**: Insert images via drag-and-drop, clipboard paste, or file dialog. Images auto-copied to `./assets/` with relative paths in markdown.
- **Zoom**: Cmd+=/- and Ctrl+scroll for uniform page zoom via Electron's native zoom API.
- **Smart Punctuation**: Automatic curly quotes, em-dashes, and ellipsis while typing.
- **Move Lines**: Alt+Arrow Up/Down to reorder lines.
- **Release Engineering**: File associations for `.md`/`.markdown`/`.mdown`. CLI open (`markz file.md`). macOS Finder open-file support. Build targets for macOS (DMG/ZIP), Windows (NSIS/Portable), Linux (AppImage/DEB).

### Breaking changes from Alpha

- Export now receives raw markdown instead of pre-rendered HTML (rendering handled server-side).
- Zoom behavior changed from font-size scaling to Electron's native page zoom.
- Strikethrough shortcut changed from Cmd+Shift+S to Cmd+Shift+X (was conflicting with Save As).

### Known limitations

- Tabbed editing not yet implemented (single document per window).
- Custom theme loading from filesystem not yet available.
- Pandoc-based exports (docx, epub, LaTeX) require Pandoc installation (not bundled).
- Inline HTML rendering deferred (requires HTML sanitization).
- Auto-update and code signing require distribution infrastructure.
- Footnote definitions (content at bottom) not yet rendered -- only references are styled.

---

## V1.0

**Release date:** TBD

_To be written after V1.0 sprints are complete._
