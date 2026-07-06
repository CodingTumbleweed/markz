# Markz

A seamless, distraction-free WYSIWYG Markdown editor for desktop.

Markz removes the split between "editing" and "previewing". You write Markdown, and it renders inline as you type -- what you see is what you mean.

**Status:** Planning phase. The app is not yet implemented; the documents below define what we're building and how.

## Documentation

| Document | Description |
|----------|-------------|
| [Product Requirements (PRD)](docs/PRD.md) | Vision, target users, functional and non-functional requirements, scope |
| [Technical Design](docs/DESIGN.md) | Architecture, tech stack, data flows, key subsystem designs |
| [Feature Specification](docs/FEATURE_SPEC.md) | Exhaustive, prioritized feature list organized by category |
| [Execution Plan](docs/EXECUTION_PLAN.md) | Phased sprint plan from scaffolding to V1.0 |
| [Sprint Progress](docs/PROGRESS.md) | Sprint-by-sprint status tracker |
| [Changelog](CHANGELOG.md) | All notable changes, per [Keep a Changelog](https://keepachangelog.com/) |
| [Release Notes](docs/RELEASE_NOTES.md) | User-facing highlights for each phase release |

## Key Goals

- **WYSIWYG Markdown editing** -- live inline rendering without a separate preview pane.
- **Cross-platform** -- macOS, Windows, and Linux via Electron.
- **Rich content** -- LaTeX math, Mermaid diagrams, syntax-highlighted code blocks, tables with GUI editing.
- **Themeable** -- CSS-based themes with user override support.
- **Powerful export** -- PDF, HTML, Word, Epub, LaTeX, and more via Pandoc integration.
- **Open source** -- free alternative to commercial editors.
