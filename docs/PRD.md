# Markz -- Product Requirements Document

## 1. Vision

Markz is a free, open-source, cross-platform desktop Markdown editor that provides a seamless "what you see is what you mean" writing experience. It renders Markdown inline as the user types, eliminating the traditional split between source editing and preview.

## 2. Target Users

| Persona | Needs |
|---------|-------|
| **Software developers** | README files, documentation, technical notes, quick references |
| **Technical writers** | Long-form documentation with math, diagrams, and structured exports (PDF, docx) |
| **Students & academics** | Lecture notes with LaTeX math, chemistry equations, citation-friendly export |
| **Bloggers & content creators** | Distraction-free writing, image management, HTML/PDF export |
| **Note-takers** | Fast, lightweight editor with file organization and search |

## 3. Core Value Proposition

- **Seamless live rendering** -- no preview pane, no mode switching. Markdown renders inline as you type and expands to source when you place your cursor on it.
- **Rich content support** -- LaTeX math, Mermaid diagrams, 100+ syntax-highlighted languages, tables with GUI editing.
- **Free and open source** -- no license keys, no trial periods, community-driven development.
- **Fully themeable** -- CSS-based theme engine with user overrides.
- **Powerful export** -- native PDF/HTML export, plus Word, Epub, LaTeX, and more via Pandoc.

## 4. Functional Requirements

### FR-1: Editor Core

- FR-1.1: Render Markdown inline as the user types (headings, bold, italic, strikethrough, underline, highlight, links, images, blockquotes, lists, horizontal rules, code spans).
- FR-1.2: Support GitHub Flavored Markdown (GFM) as the base spec.
- FR-1.3: Support task lists with clickable checkboxes.
- FR-1.4: Support fenced code blocks with syntax highlighting for 100+ languages, with optional line numbers.
- FR-1.5: Support tables with a graphical toolbar (add/remove rows/columns, resize, align).
- FR-1.6: Support YAML front matter rendering.
- FR-1.7: Support `[toc]` for auto-generated table of contents.
- FR-1.8: Support footnotes (MultiMarkdown-style).
- FR-1.9: Support emoji via `:shortcode:` with autocomplete.
- FR-1.10: Support subscript (`~text~`), superscript (`^text^`), and highlight (`==text==`) as toggleable extensions.
- FR-1.11: Support GitHub-style alerts / callouts.
- FR-1.12: Support inline HTML rendering (e.g. `<u>`, `<video>`, `<iframe>`).

### FR-2: Math Rendering

- FR-2.1: Render block math (`$$...$$`) and inline math (`$...$`).
- FR-2.2: Support MathJax extensions: mhchem (chemistry), physics package, AMSmath.
- FR-2.3: Support auto-numbering of equations (off, AMS rules, or all).
- FR-2.4: Support cross-references (`\label`, `\ref`, `\tag`).
- FR-2.5: Support custom macros via `\def` and `\newcommand`.

### FR-3: Diagrams

- FR-3.1: Render Mermaid diagrams (flowchart, sequence, gantt, class, state, pie, mindmap, timeline, gitgraph, quadrant, sankey, XY chart, requirement, C4, ZenUML).
- FR-3.2: Render flowchart.js and js-sequence-diagrams in dedicated code blocks.
- FR-3.3: Support right-click "Save as" (SVG, PNG, JPG) and "Copy as image" on diagrams.
- FR-3.4: Support Mermaid theming via CSS variables.

### FR-4: File Management

- FR-4.1: Provide a file tree sidebar showing the folder structure.
- FR-4.2: Provide a file list sidebar (flat list of files in a folder).
- FR-4.3: Support "Open Quickly" with fuzzy filename search.
- FR-4.4: Support global search across all files in the open folder.
- FR-4.5: Maintain a list of recently opened files and folders.
- FR-4.6: Support tabbed editing for multiple open files.
- FR-4.7: Auto-save files with configurable interval.
- FR-4.8: Detect and handle external file changes.

### FR-5: Editing UX

- FR-5.1: Focus mode (dims all content except the current paragraph/sentence).
- FR-5.2: Typewriter mode (keeps the active line vertically centered).
- FR-5.3: Source code mode toggle (show raw Markdown).
- FR-5.4: Auto-pair brackets, quotes, and Markdown symbols (`*`, `_`, `` ` ``, `$`).
- FR-5.5: Smart punctuation (curly quotes, em-dashes).
- FR-5.6: Word count, character count, line count, and estimated reading time.
- FR-5.7: Find and replace with regex support.
- FR-5.8: Outline panel showing document headings for quick navigation.
- FR-5.9: Support undo/redo with full history.
- FR-5.10: Drag-and-drop reordering of list items and paragraphs.

### FR-6: Themes

- FR-6.1: Ship with at least 4 built-in themes (light default, GitHub, dark, and one serif theme).
- FR-6.2: Load custom themes from a `themes/` directory as CSS files.
- FR-6.3: Support `base.user.css` (applied to all themes) and `{theme}.user.css` (per-theme overrides).
- FR-6.4: Support light/dark mode switching, with separate theme selection for each.
- FR-6.5: Expose CSS DevTools for theme debugging.

### FR-7: Export

- FR-7.1: Export to PDF natively (via Chromium print-to-PDF) with configurable paper size, margins, headers, footers, page breaks, and metadata.
- FR-7.2: Export to HTML (with styles) and HTML (without styles).
- FR-7.3: Export to image (PNG).
- FR-7.4: Integrate with Pandoc for export to Word (.docx), OpenOffice (.odt), Epub, LaTeX, RTF, MediaWiki, reStructuredText, Textile, OPML, RevealJS.
- FR-7.5: Support custom export commands (arbitrary shell commands).
- FR-7.6: Support YAML front matter variables in export templates (`${title}`, `${author}`, `${pageNo}`, etc.).
- FR-7.7: Support "Export with Previous" to re-export with the same settings.

### FR-8: Import

- FR-8.1: Open `.md` and `.markdown` files natively.
- FR-8.2: Import `.docx`, `.rtf`, `.epub`, `.odt`, `.opml` via Pandoc.

### FR-9: Image Management

- FR-9.1: Insert images via drag-and-drop, paste from clipboard, or file dialog.
- FR-9.2: Support relative and absolute image paths.
- FR-9.3: Copy images to a configurable folder on insert.
- FR-9.4: Move, rename, and delete images from context menu.
- FR-9.5: Support `root-url` in YAML front matter for path resolution.

### FR-10: Preferences

- FR-10.1: Provide a preferences panel with sections: General, Appearance, Editor, Markdown, Export.
- FR-10.2: Persist settings in a JSON config file.
- FR-10.3: Allow configuring default code language, indentation, line break behavior, and smart features.

## 5. Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1 | **Startup time** | < 2 seconds cold start |
| NFR-2 | **Typing latency** | < 16ms input-to-render (60 fps) |
| NFR-3 | **Large file handling** | Smooth editing for files up to 100,000 lines |
| NFR-4 | **Memory usage** | < 300 MB for a typical session (5 open files) |
| NFR-5 | **Cross-platform** | macOS (Intel + ARM), Windows (x64 + ARM), Linux (x64 + ARM) |
| NFR-6 | **Accessibility** | Keyboard-navigable UI, screen reader labels on interactive elements |
| NFR-7 | **Extensibility** | Theme engine and export pipeline designed for community contributions |
| NFR-8 | **Offline** | Fully functional without network access |
| NFR-9 | **Auto-update** | Built-in update mechanism (Electron autoUpdater or similar) |
| NFR-10 | **Installable** | Distribute as .dmg (macOS), .exe/.msi (Windows), .deb/.AppImage (Linux) |

## 6. Out of Scope (V1)

The following are explicitly excluded from the first release:

- Real-time collaboration / multiplayer editing.
- Cloud sync or account system.
- Mobile apps (iOS, Android).
- Plugin / extension marketplace.
- Built-in Git integration (beyond basic export commands).
- Web-based deployment (Electron desktop only for V1).

## 7. Release Phases

| Phase | Scope | Goal |
|-------|-------|------|
| **Alpha** | Editor core (FR-1), math (FR-2), code blocks, basic file open/save, one theme, PDF export | Usable for writing a single Markdown file with rich content |
| **Beta** | File management (FR-4), editing UX (FR-5), themes (FR-6), diagrams (FR-3), full export (FR-7) | Feature-complete for daily use |
| **V1.0** | Import (FR-8), image management (FR-9), preferences (FR-10), polish, packaging, auto-update | Production-ready release |
| **Post-V1** | i18n, RTL, plugin system, community themes, performance hardening | Growth and community |

## 8. Success Criteria

- Users can open a Markdown file and edit it with seamless inline rendering of all GFM syntax, math, and diagrams.
- Exported PDFs are visually polished and production-ready for the same input file.
- Cold startup time under 2 seconds on mid-range hardware.
- Community adoption: 100+ GitHub stars within 3 months of public release.
- At least 3 community-contributed themes within 6 months.
