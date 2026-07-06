# Markz -- Feature Specification

This document provides an exhaustive, prioritized list of every feature Markz will support.

**Priority levels:**
- **P0** -- Must have for Alpha / first usable release.
- **P1** -- Must have for Beta / feature-complete release.
- **P2** -- Must have for V1.0 GA release.
- **P3** -- Post-V1 / nice to have.

---

## 1. Markdown Syntax -- Block Elements

### 1.1 Paragraphs & Line Breaks (P0)

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| B-1 | Paragraphs separated by blank lines | P0 | Single Return creates new paragraph |
| B-2 | Single line break via Shift+Return | P0 | Inserts `<br>` or two trailing spaces |
| B-3 | Configurable line break behavior (preserve whitespace, ignore single line break) | P1 | Separate setting for editing vs export |

### 1.2 Headings (P0)

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| B-4 | ATX headings (`#` through `######`) | P0 | Levels 1-6 |
| B-5 | Shortcut keys Cmd/Ctrl+1 through Cmd/Ctrl+6 | P0 | |
| B-6 | Auto-numbering headings via CSS | P2 | User opt-in via custom CSS |

### 1.3 Blockquotes (P0)

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| B-7 | Blockquotes with `>` | P0 | |
| B-8 | Nested blockquotes | P0 | |
| B-9 | Auto-insert `>` on new line within blockquote | P0 | |

### 1.4 Lists (P0)

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| B-10 | Unordered lists (`*`, `-`, `+`) | P0 | |
| B-11 | Ordered lists (`1.`, `2.`, ...) | P0 | |
| B-12 | Nested lists with Tab/Shift+Tab indent/outdent | P0 | |
| B-13 | Task lists with `- [ ]` and `- [x]` | P0 | Clickable checkbox |
| B-14 | Change list type from context menu or shortcut | P1 | Cycle between ordered, unordered, task |
| B-15 | Auto-continue list on Enter | P0 | |

### 1.5 Code Blocks (P0)

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| B-16 | Fenced code blocks with ``` and ~~~ | P0 | |
| B-17 | Language identifier after opening fence | P0 | |
| B-18 | Syntax highlighting for 100+ languages | P0 | Via highlight.js or Lezer |
| B-19 | Line numbers toggle | P1 | Configurable in preferences |
| B-20 | Default code language setting | P1 | From preferences |
| B-21 | Shift+Tab outdent in code blocks | P1 | |
| B-22 | URL syntax mode for code blocks | P3 | Highlights protocol, host, port, query, hash |

### 1.6 Math Blocks (P0)

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| B-23 | Block math with `$$` | P0 | |
| B-24 | Click-to-edit: renders math, click reveals source | P0 | |
| B-25 | Up/Down arrow or Cmd/Ctrl+Return to finish editing | P0 | |

### 1.7 Tables (P0)

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| B-26 | GFM tables with `|` pipes | P0 | |
| B-27 | Graphical table toolbar (add/delete rows/cols, align) | P0 | |
| B-28 | Column resize via mouse drag | P1 | |
| B-29 | Select multiple columns and batch-align | P1 | |
| B-30 | Context menu for table operations | P0 | |
| B-31 | Inline formatting within table cells | P0 | Bold, italic, code, links |
| B-32 | Increase max column count in table edit UI | P2 | |

### 1.8 Footnotes (P1)

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| B-33 | Reference footnotes `[^fn1]` with definition | P1 | MultiMarkdown style |
| B-34 | Hover to preview footnote content | P1 | |
| B-35 | Click footnote to jump to definition | P1 | |

### 1.9 Horizontal Rules (P0)

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| B-36 | `---`, `***`, `___` render as horizontal rule | P0 | |

### 1.10 YAML Front Matter (P0)

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| B-37 | YAML block between `---` delimiters at top of file | P0 | |
| B-38 | Insert front matter from menu | P1 | |
| B-39 | Use YAML variables in export templates | P1 | |

### 1.11 Table of Contents (P1)

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| B-40 | `[toc]` generates auto-updated table of contents | P1 | |
| B-41 | Configurable TOC depth levels | P2 | |

### 1.12 GitHub-Style Alerts / Callouts (P1)

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| B-42 | `> [!NOTE]`, `> [!WARNING]`, etc. | P1 | |
| B-43 | Toggle alert from menu/shortcut | P1 | |

---

## 2. Markdown Syntax -- Inline (Span) Elements

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| S-1 | Bold (`**text**`) | P0 | |
| S-2 | Italic (`*text*`) | P0 | |
| S-3 | Strikethrough (`~~text~~`) | P0 | GFM |
| S-4 | Underline (`<u>text</u>`) | P0 | HTML tag |
| S-5 | Inline code (`` `code` ``) | P0 | |
| S-6 | Inline links `[text](url "title")` | P0 | |
| S-7 | Reference links `[text][id]` | P0 | |
| S-8 | Internal links `[text](#heading-id)` | P0 | Cmd/Ctrl+Click to jump |
| S-9 | Auto-linked URLs | P0 | |
| S-10 | Images `![alt](src)` | P0 | Inline preview |
| S-11 | Inline math `$...$` | P0 | Requires opt-in in preferences |
| S-12 | Emoji `:shortcode:` with autocomplete | P1 | |
| S-13 | Emoji via OS emoji picker | P1 | Edit > Emoji & Symbols |
| S-14 | Subscript `~text~` | P1 | Opt-in in preferences |
| S-15 | Superscript `^text^` | P1 | Opt-in in preferences |
| S-16 | Highlight `==text==` | P1 | Opt-in in preferences |
| S-17 | Inline HTML tags | P1 | `<span>`, `<kbd>`, etc. |

---

## 3. Math

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| M-1 | Block math (`$$...$$`) | P0 | |
| M-2 | Inline math (`$...$`) | P0 | |
| M-3 | KaTeX rendering (primary) | P0 | Synchronous, fast |
| M-4 | MathJax fallback for unsupported commands | P0 | |
| M-5 | mhchem extension for chemistry (`\ce{}`) | P1 | |
| M-6 | Physics package | P1 | Opt-in; controls `\div`, `\Re` redefinition |
| M-7 | AMSmath environments (`align`, `gather`, etc.) | P0 | |
| M-8 | Custom macros with `\def` and `\newcommand` | P1 | |
| M-9 | Auto-numbering: off / AMS / all | P1 | |
| M-10 | Cross-references with `\label`, `\ref`, `\tag` | P1 | |
| M-11 | `\displaylines{}` for line breaks in math | P1 | |
| M-12 | Option: auto-apply `displaylines` on `\\` | P1 | |
| M-13 | Force refresh for math rendering (Edit > Math Tools) | P2 | |
| M-14 | LaTeX delimiter support: `\(...\)` inline, `\[...\]` block | P2 | |

---

## 4. Diagrams

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| D-1 | Mermaid: Flowchart | P1 | |
| D-2 | Mermaid: Sequence diagram | P1 | |
| D-3 | Mermaid: Gantt chart | P1 | |
| D-4 | Mermaid: Class diagram | P1 | |
| D-5 | Mermaid: State diagram | P1 | |
| D-6 | Mermaid: Pie chart | P1 | |
| D-7 | Mermaid: Mindmap | P2 | |
| D-8 | Mermaid: Timeline | P2 | |
| D-9 | Mermaid: Gitgraph | P2 | |
| D-10 | Mermaid: Quadrant chart | P2 | |
| D-11 | Mermaid: Sankey diagram | P2 | |
| D-12 | Mermaid: XY Chart | P2 | |
| D-13 | Mermaid: Requirement diagram | P3 | |
| D-14 | Mermaid: C4 diagram (plantUML compatible) | P3 | |
| D-15 | Mermaid: ZenUML | P3 | |
| D-16 | Mermaid: Radar chart | P3 | radar-beta |
| D-17 | Mermaid: Treemap | P3 | treemap-beta |
| D-18 | Mermaid: Block diagram | P3 | |
| D-19 | Mermaid: Packet diagram | P3 | |
| D-20 | Mermaid: Architecture diagram | P3 | |
| D-21 | flowchart.js diagrams | P2 | `flow` code block |
| D-22 | js-sequence-diagrams | P2 | `sequence` code block |
| D-23 | Sequence diagram theme: simple / hand | P2 | Via CSS variable |
| D-24 | Mermaid theme via CSS variable (`--mermaid-theme`) | P1 | default, dark, forest, neutral, night |
| D-25 | Mermaid auto-numbering for sequences | P2 | `--mermaid-sequence-numbers` |
| D-26 | Mermaid flowchart curve style | P2 | linear, basis, natural, step |
| D-27 | Mermaid Gantt padding config | P3 | |
| D-28 | Inline Mermaid config `%%{init: ...}%%` | P2 | |
| D-29 | Right-click save diagram as SVG/PNG/JPG | P1 | |
| D-30 | Right-click copy diagram as image | P1 | |
| D-31 | Diagram alignment via CSS | P2 | Default centered, user can left-align |

---

## 5. File Management

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| F-1 | File tree sidebar (folder structure) | P0 | |
| F-2 | File list sidebar (flat list) | P1 | |
| F-3 | Open Quickly / fuzzy file search (Cmd/Ctrl+P) | P0 | |
| F-4 | Global search across all files (Cmd/Ctrl+Shift+F) | P1 | |
| F-5 | Global search with regex support | P2 | |
| F-6 | Recent files list | P0 | |
| F-7 | Recent folders list | P1 | |
| F-8 | Pin/remove recent folders | P2 | |
| F-9 | Sort file tree by name, date, creation time | P1 | |
| F-10 | Natural sort order for filenames | P2 | |
| F-11 | Mix files and folders when sorting | P2 | |
| F-12 | Tabbed editing | P0 | |
| F-13 | Auto-save with configurable interval | P0 | |
| F-14 | Detect external file changes and prompt reload | P1 | |
| F-15 | Create new file from sidebar | P0 | |
| F-16 | Rename file from sidebar or title bar | P1 | |
| F-17 | Delete file from sidebar | P1 | |
| F-18 | Open folder as workspace | P0 | |
| F-19 | Launch behavior: restore previous / new file / open folder | P1 | |
| F-20 | Show .mdx files in sidebar | P3 | |

---

## 6. Editing UX

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| E-1 | Focus mode (dim all except current block) | P1 | |
| E-2 | Typewriter mode (keep active line centered) | P1 | |
| E-3 | Source code mode toggle (Cmd/Ctrl+/) | P0 | Show raw Markdown |
| E-4 | Auto-pair brackets `()`, `[]`, `{}` | P0 | |
| E-5 | Auto-pair quotes `""`, `''` | P0 | |
| E-6 | Auto-pair Markdown symbols `*`, `_`, `` ` ``, `$` | P1 | |
| E-7 | Smart punctuation (curly quotes, em-dashes) | P1 | |
| E-8 | Word count | P0 | |
| E-9 | Character count | P1 | |
| E-10 | Line count | P1 | |
| E-11 | Estimated reading time | P1 | |
| E-12 | Find (Cmd/Ctrl+F) | P0 | |
| E-13 | Find and replace (Cmd/Ctrl+H) | P0 | |
| E-14 | Find with regex | P1 | |
| E-15 | Show total match count | P1 | |
| E-16 | Outline panel (heading navigation) | P0 | |
| E-17 | Collapsible vs flat outline | P1 | |
| E-18 | Outline filter/search | P2 | |
| E-19 | Undo / redo with full history | P0 | |
| E-20 | Copy/cut whole line when no selection | P1 | |
| E-21 | Move row/paragraph up/down with Alt+Arrow | P2 | |
| E-22 | Command palette (Cmd/Ctrl+Shift+P) | P1 | |
| E-23 | Spellcheck | P1 | System spellcheck integration |
| E-24 | Custom spellcheck dictionary (learned words) | P2 | |
| E-25 | Zoom (Cmd/Ctrl++/-) | P1 | |
| E-26 | Zoom with mouse wheel (Ctrl+scroll) | P2 | |
| E-27 | Preserve zoom setting across restarts | P2 | |
| E-28 | Paste as plain Markdown (Cmd/Ctrl+Shift+V) | P1 | |
| E-29 | Improve paste from Google Docs, Apple Notes | P2 | |

---

## 7. Themes & Appearance

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| T-1 | Built-in light theme (GitHub-style) | P0 | |
| T-2 | Built-in dark theme | P0 | |
| T-3 | Built-in serif theme (Newsprint-style) | P1 | |
| T-4 | Built-in minimal theme (Whitey-style) | P1 | |
| T-5 | Load custom themes from themes directory | P1 | |
| T-6 | `base.user.css` applied to all themes | P1 | |
| T-7 | `{theme}.user.css` per-theme overrides | P1 | |
| T-8 | "Open Theme Folder" button in preferences | P1 | |
| T-9 | Dark mode: auto (follow OS), light, dark | P0 | |
| T-10 | Separate theme selection for light and dark mode | P1 | |
| T-11 | CSS DevTools for theme debugging | P2 | Help > Enable Debug > Inspect Element |
| T-12 | Customizable font family | P1 | |
| T-13 | Customizable font size | P0 | |
| T-14 | Customizable writing area width | P1 | |
| T-15 | Custom CSS for focus mode styling | P2 | |

---

## 8. Export

### 8.1 Native Export

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| X-1 | Export to PDF | P0 | Via Chromium print-to-PDF |
| X-2 | PDF: configurable paper size (A4, A5, Letter, custom) | P0 | |
| X-3 | PDF: configurable margins | P0 | |
| X-4 | PDF: print background | P0 | |
| X-5 | PDF: header and footer with variable substitution | P1 | `${title}`, `${author}`, `${pageNo}`, `${pageCount}`, `${today}` |
| X-6 | PDF: page break between top headings | P1 | |
| X-7 | PDF: metadata (title, author, subject, keywords) from YAML | P1 | |
| X-8 | PDF: custom theme for export | P1 | |
| X-9 | PDF: cover page via appended HTML/JS | P2 | |
| X-10 | PDF: bookmarks from heading structure | P2 | |
| X-11 | Export to HTML (with styles) | P0 | |
| X-12 | Export to HTML (without styles) | P1 | |
| X-13 | HTML: include outline sidebar | P2 | |
| X-14 | HTML: append custom content in `<head>` and `<body>` | P2 | |
| X-15 | HTML: YAML variable substitution in appended content | P2 | |
| X-16 | HTML: custom theme for export | P1 | |
| X-17 | Export to image (PNG) | P1 | |
| X-18 | Image: configurable width and font size | P2 | |
| X-19 | Image: quality settings (auto, medium, high, best) | P2 | |

### 8.2 Pandoc Export

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| X-20 | Export to Word (.docx) | P1 | |
| X-21 | Word: style reference document | P2 | |
| X-22 | Export to OpenOffice (.odt) | P2 | |
| X-23 | Export to Epub | P1 | |
| X-24 | Epub: custom CSS, cover image, metadata | P2 | |
| X-25 | Export to LaTeX | P1 | |
| X-26 | LaTeX: metadata and header includes from YAML | P2 | |
| X-27 | Export to RTF | P2 | |
| X-28 | Export to MediaWiki | P2 | |
| X-29 | Export to reStructuredText | P2 | |
| X-30 | Export to Textile | P3 | |
| X-31 | Export to OPML | P3 | |
| X-32 | Export to RevealJS presentations | P3 | |
| X-33 | PDF via LaTeX/Pandoc (alternative PDF engine) | P2 | pdflatex, xelatex, etc. |

### 8.3 Export Management

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| X-34 | Custom export commands (arbitrary shell commands) | P2 | |
| X-35 | Reorder, rename, add, remove export items in preferences | P2 | |
| X-36 | "Export with Previous" (re-export same settings) | P1 | |
| X-37 | "Export and Overwrite with Previous" | P2 | |
| X-38 | Configurable default export folder | P1 | |
| X-39 | After-export actions: notification, open file, open folder | P1 | |
| X-40 | Per-document export config via YAML front matter | P2 | |
| X-41 | Extra Pandoc arguments field | P2 | |
| X-42 | Auto-detect Pandoc path with manual override | P1 | |

---

## 9. Import

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| I-1 | Open .md and .markdown files natively | P0 | |
| I-2 | Import .docx via Pandoc | P1 | |
| I-3 | Import .rtf via Pandoc | P2 | |
| I-4 | Import .epub via Pandoc | P2 | |
| I-5 | Import .odt via Pandoc | P2 | |
| I-6 | Import .opml via Pandoc | P3 | |
| I-7 | Open from command line (`markz file.md`) | P1 | |
| I-8 | Create file when opening non-existent path from CLI | P2 | |
| I-9 | Open file with anchor position (`file.md#heading`) | P2 | |

---

## 10. Image Management

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| IM-1 | Insert image via drag-and-drop | P0 | |
| IM-2 | Insert image via paste from clipboard | P0 | |
| IM-3 | Insert image via file dialog | P0 | |
| IM-4 | Relative path for local images | P0 | |
| IM-5 | Copy image to configurable folder on insert | P1 | Same dir, `./assets/`, custom |
| IM-6 | Move image file from context menu | P2 | |
| IM-7 | Rename image file from context menu | P2 | |
| IM-8 | Delete image file from context menu | P2 | |
| IM-9 | Download/copy/move all images in document | P2 | |
| IM-10 | Auto-move image folder when renaming document | P3 | |
| IM-11 | Upload image via custom uploader (PicGo, PicList, iPic) | P3 | |
| IM-12 | Support `root-url` front matter for path resolution | P2 | |
| IM-13 | Resize images via `<img>` tag with custom size/zoom | P1 | |
| IM-14 | Support srcset and image formats (jfif, webp, etc.) | P2 | |
| IM-15 | Always add `./` prefix option for relative paths | P3 | |

---

## 11. Preferences Panel

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| P-1 | General section: language, auto-save, launch behavior | P1 | |
| P-2 | Appearance section: theme, dark mode, font, sidebar | P1 | |
| P-3 | Editor section: indent, line numbers, auto-pair, smart features | P1 | |
| P-4 | Markdown section: inline math, subscript, superscript, highlight, diagrams, math numbering, physics | P1 | |
| P-5 | Export section: PDF settings, Pandoc path, export item management | P1 | |
| P-6 | Apply changes without restart | P1 | |
| P-7 | Persist settings in JSON config file | P0 | |

---

## 12. Keyboard Shortcuts

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| K-1 | Standard formatting shortcuts (Bold, Italic, etc.) | P0 | |
| K-2 | Heading level shortcuts (Cmd/Ctrl+1..6) | P0 | |
| K-3 | Insert shortcuts (link, image, table, code block, math) | P0 | |
| K-4 | Navigation shortcuts (find, replace, open quickly) | P0 | |
| K-5 | View shortcuts (sidebar, outline, source mode, zoom) | P1 | |
| K-6 | Custom shortcut key binding | P2 | |
| K-7 | Touch Bar support (macOS) | P3 | |

---

## 13. Internationalization (i18n)

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| L-1 | English (default) | P0 | |
| L-2 | Chinese (Simplified and Traditional) | P2 | |
| L-3 | Japanese | P2 | |
| L-4 | Korean | P2 | |
| L-5 | French, German, Spanish, Portuguese | P2 | |
| L-6 | 15+ additional languages | P3 | Community-contributed |
| L-7 | RTL text direction support | P3 | Arabic, Hebrew, Uyghur |
| L-8 | CJK charset support for bold/italic rendering | P2 | |

---

## 14. Platform & System Integration

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| SY-1 | macOS: .dmg installer | P0 | |
| SY-2 | Windows: .exe installer (64-bit) | P0 | |
| SY-3 | Linux: .deb package | P0 | |
| SY-4 | Linux: .AppImage | P1 | |
| SY-5 | Windows: 32-bit and ARM builds | P2 | |
| SY-6 | Linux: ARM build | P2 | |
| SY-7 | Linux: Snap package | P3 | |
| SY-8 | Auto-update mechanism | P1 | electron-updater |
| SY-9 | File association for .md files | P1 | |
| SY-10 | "New Markdown" in Windows Explorer context menu | P2 | |
| SY-11 | macOS Services integration (insert content) | P3 | |
| SY-12 | Linux Wayland compatibility | P2 | |
| SY-13 | Signed executables (Windows) | P2 | |
| SY-14 | Notarized app bundle (macOS) | P2 | |

---

## 15. Inline HTML Support

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| H-1 | `<u>` underline | P0 | |
| H-2 | `<span>` with inline styles | P1 | |
| H-3 | `<kbd>` keyboard keys | P1 | |
| H-4 | `<iframe>` embeds | P2 | |
| H-5 | `<video>` with controls | P2 | |
| H-6 | `<audio>` | P3 | |
| H-7 | `<track>` element inside video (respects relative paths) | P3 | |
| H-8 | `<details>` and `<summary>` | P2 | |

---

## 16. TextBundle Support

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| TB-1 | Open .textbundle files | P3 | |
| TB-2 | Save as .textbundle | P3 | |
| TB-3 | Convert to TextBundle when inserting images | P3 | |

---

## Feature Count Summary

| Priority | Count | Phase |
|----------|-------|-------|
| P0 | ~65 | Alpha |
| P1 | ~70 | Beta |
| P2 | ~55 | V1.0 |
| P3 | ~25 | Post-V1 |
| **Total** | **~215** | |
