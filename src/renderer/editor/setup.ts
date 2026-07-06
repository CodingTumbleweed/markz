import { EditorState } from '@codemirror/state'
import {
  EditorView,
  keymap,
  highlightActiveLine,
  drawSelection,
  dropCursor,
} from '@codemirror/view'
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
  indentOnInput,
} from '@codemirror/language'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { markdownDecorations } from './decorations'
import { blockDecorations } from './blockDecorations'
import { markzKeymap, listContinuation } from './keymap'
import { statusBarPlugin } from '../components/statusBar'
import { outlinePlugin } from '../components/outlinePanel'
import { focusModeState, focusModeDecorations } from './focusMode'
import { typewriterModeState, typewriterPlugin } from './typewriterMode'
import { handleImageDrop, handleImagePaste } from './imageInsert'
import { smartPunctuationInputHandler } from './smartPunctuation'

const welcomeDoc = `---
title: Welcome to Markz
author: You
---

# Welcome to Markz

A seamless **Markdown** editor for desktop. Type *naturally* and watch your content render inline.

## Inline Formatting

- **Bold text** and *italic text* and ~~strikethrough~~
- Inline \`code spans\` with background highlighting
- [Links](https://markz.dev) that render cleanly

## Block Elements

> Blockquotes render with a styled left border.
> They can span multiple lines.

### Lists

- Unordered list item one
- Unordered list item two
  - Nested item

1. Ordered list item
2. Another ordered item

### Task Lists

- [ ] An unchecked task
- [x] A completed task
- [ ] Another pending task

---

### Getting Started

Just start typing. The line you're editing shows raw Markdown; everything else renders as styled output. Move your cursor to reveal the syntax.

## Code Blocks

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`
}

console.log(greet('Markz'))
\`\`\`

## Tables

| Feature | Status |
|---------|--------|
| Bold | Done |
| Italic | Done |
| Code blocks | Done |

## Math

Inline math: $E = mc^2$ and $\\int_0^\\infty e^{-x} dx = 1$

Block math:

$$
\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

## Extended Syntax

==Highlighted text== and ~subscript~ and ^superscript^

Emoji shortcodes: :rocket: :fire: :tada: :star:

> [!NOTE]
> This is a GitHub-style alert callout.

## Diagrams

\`\`\`mermaid
graph LR
  A[Open File] --> B{Parse Markdown}
  B --> C[Render WYSIWYG]
  B --> D[Syntax Highlight]
  C --> E[Export]
\`\`\`

**Shortcuts:** Cmd+B (bold), Cmd+I (italic), Cmd+1-6 (headings), Cmd+K (link), Cmd+, (preferences)
`

export function createEditor(parent: HTMLElement): EditorView {
  const state = EditorState.create({
    doc: welcomeDoc,
    extensions: [
      history(),
      drawSelection(),
      dropCursor(),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      bracketMatching(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      closeBrackets(),
      keymap.of([
        ...closeBracketsKeymap,
        ...markzKeymap,
        { key: 'Enter', run: listContinuation },
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
        indentWithTab,
      ]),
      markdown({ base: markdownLanguage }),
      markdownDecorations,
      blockDecorations,
      focusModeState,
      focusModeDecorations,
      typewriterModeState,
      typewriterPlugin,
      statusBarPlugin,
      outlinePlugin,
      EditorView.domEventHandlers({
        drop(event, view) {
          handleImageDrop(view, event)
          return false
        },
        paste(event, view) {
          const hasImage = event.clipboardData?.types.includes('Files')
            && Array.from(event.clipboardData.files).some((f) => f.type.startsWith('image/'))
          if (hasImage) {
            event.preventDefault()
            handleImagePaste(view)
            return true
          }
          return false
        },
      }),
      smartPunctuationInputHandler,
      EditorView.lineWrapping,
    ],
  })

  return new EditorView({ state, parent })
}
