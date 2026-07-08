import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/view'
import { EditorState, Range, RangeSet } from '@codemirror/state'
import { syntaxTree } from '@codemirror/language'
import { renderInlineMath } from './widgets/math'
import { enterInlineMathWidget } from './enterBlockWidget'

class InlineMathWidget extends WidgetType {
  constructor(
    readonly latex: string,
    readonly from: number,
    readonly to: number,
  ) {
    super()
  }
  eq(other: InlineMathWidget): boolean {
    return this.latex === other.latex && this.from === other.from
  }
  toDOM(view: EditorView): HTMLElement {
    const el = renderInlineMath(this.latex)
    el.addEventListener('mousedown', (e) => {
      e.preventDefault()
      enterInlineMathWidget(view, this.from, this.to)
    })
    return el
  }
  ignoreEvent(event: Event): boolean {
    return !/^mouse|^click/.test(event.type)
  }
}

class EmojiWidget extends WidgetType {
  constructor(readonly emoji: string) { super() }
  eq(other: EmojiWidget): boolean { return this.emoji === other.emoji }
  toDOM(): HTMLElement {
    const span = document.createElement('span')
    span.className = 'markz-emoji'
    span.textContent = this.emoji
    return span
  }
}

const headingClasses = [
  '', 'markz-h1', 'markz-h2', 'markz-h3',
  'markz-h4', 'markz-h5', 'markz-h6',
]

const hiddenMark = Decoration.mark({ class: 'markz-hidden-syntax' })
const boldMark = Decoration.mark({ class: 'markz-bold' })
const italicMark = Decoration.mark({ class: 'markz-italic' })
const strikeMark = Decoration.mark({ class: 'markz-strikethrough' })
const codeMark = Decoration.mark({ class: 'markz-inline-code' })
const linkMark = Decoration.mark({ class: 'markz-link' })
const urlMark = Decoration.mark({ class: 'markz-url' })
const highlightMark = Decoration.mark({ class: 'markz-highlight' })
const subscriptMark = Decoration.mark({ class: 'markz-subscript' })
const superscriptMark = Decoration.mark({ class: 'markz-superscript' })
const footnoteMark = Decoration.mark({ class: 'markz-footnote-ref' })
const hrLine = Decoration.line({ class: 'markz-hr-line' })
const blockquoteLine = Decoration.line({ class: 'markz-blockquote' })
const listItemLine = Decoration.line({ class: 'markz-list-item' })
const taskLine = Decoration.line({ class: 'markz-task-item' })
const taskCheckedLine = Decoration.line({ class: 'markz-task-item markz-task-checked' })
const yamlLine = Decoration.line({ class: 'markz-yaml-line' })
const tocLine = Decoration.line({ class: 'markz-toc-line' })

const ALERT_TYPES: Record<string, string> = {
  NOTE: 'markz-alert-note',
  TIP: 'markz-alert-tip',
  IMPORTANT: 'markz-alert-important',
  WARNING: 'markz-alert-warning',
  CAUTION: 'markz-alert-caution',
}

const EMOJI_MAP: Record<string, string> = {
  smile: '😄', laughing: '😆', blush: '😊', heart_eyes: '😍', wink: '😉',
  thumbsup: '👍', '+1': '👍', thumbsdown: '👎', '-1': '👎',
  clap: '👏', pray: '🙏', muscle: '💪',
  heart: '❤️', star: '⭐', fire: '🔥', sparkles: '✨',
  rocket: '🚀', tada: '🎉', confetti_ball: '🎊', trophy: '🏆',
  check: '✅', x: '❌', warning: '⚠️', bulb: '💡', memo: '📝',
  bug: '🐛', wrench: '🔧', hammer: '🔨', gear: '⚙️', link: '🔗',
  lock: '🔒', key: '🔑', eyes: '👀', thinking: '🤔', wave: '👋',
  100: '💯', boom: '💥', zap: '⚡', globe_with_meridians: '🌐',
  book: '📖', pencil: '✏️', scissors: '✂️', clipboard: '📋',
  package: '📦', truck: '🚚', construction: '🚧', recycle: '♻️',
  white_check_mark: '✅', heavy_check_mark: '✔️',
  arrow_up: '⬆️', arrow_down: '⬇️', arrow_left: '⬅️', arrow_right: '➡️',
}

function getActiveLinesRange(state: EditorState): { from: number; to: number } | null {
  const sel = state.selection.main
  return {
    from: state.doc.lineAt(sel.from).from,
    to: state.doc.lineAt(sel.to).to,
  }
}

function isCursorInside(from: number, to: number, active: { from: number; to: number } | null): boolean {
  if (!active) return false
  return from < active.to && to > active.from
}

function buildDecorations(view: EditorView): DecorationSet {
  const { state } = view
  const active = getActiveLinesRange(state)
  const decos: Range<Decoration>[] = []
  const doc = state.doc

  const tree = syntaxTree(state)

  tree.iterate({
    enter(node) {
      const t = node.type.name

      // ATX Headings
      if (t.startsWith('ATXHeading')) {
        const level = parseInt(t.charAt(t.length - 1))
        if (level >= 1 && level <= 6) {
          if (isCursorInside(node.from, node.to, active)) return

          const line = doc.lineAt(node.from)
          decos.push(Decoration.line({ class: headingClasses[level] }).range(line.from))

          const text = doc.sliceString(node.from, node.to)
          const hashMatch = text.match(/^#{1,6}\s/)
          if (hashMatch) {
            decos.push(hiddenMark.range(node.from, node.from + hashMatch[0].length))
          }
        }
      }

      // Horizontal rule -- use a line decoration (not a block replace)
      if (t === 'HorizontalRule') {
        if (!isCursorInside(node.from, node.to, active)) {
          const line = doc.lineAt(node.from)
          decos.push(hrLine.range(line.from))
        }
      }

      // Strong emphasis (bold)
      if (t === 'StrongEmphasis') {
        if (isCursorInside(node.from, node.to, active)) return
        const text = doc.sliceString(node.from, node.to)
        const mLen = text.startsWith('**') ? 2 : 2
        decos.push(boldMark.range(node.from, node.to))
        decos.push(hiddenMark.range(node.from, node.from + mLen))
        decos.push(hiddenMark.range(node.to - mLen, node.to))
      }

      // Emphasis (italic)
      if (t === 'Emphasis') {
        if (isCursorInside(node.from, node.to, active)) return
        decos.push(italicMark.range(node.from, node.to))
        decos.push(hiddenMark.range(node.from, node.from + 1))
        decos.push(hiddenMark.range(node.to - 1, node.to))
      }

      // Strikethrough
      if (t === 'Strikethrough') {
        if (isCursorInside(node.from, node.to, active)) return
        decos.push(strikeMark.range(node.from, node.to))
        decos.push(hiddenMark.range(node.from, node.from + 2))
        decos.push(hiddenMark.range(node.to - 2, node.to))
      }

      // Inline code
      if (t === 'InlineCode') {
        if (isCursorInside(node.from, node.to, active)) return
        decos.push(codeMark.range(node.from, node.to))
        const text = doc.sliceString(node.from, node.to)
        const backtickLen = text.startsWith('``') ? 2 : 1
        decos.push(hiddenMark.range(node.from, node.from + backtickLen))
        decos.push(hiddenMark.range(node.to - backtickLen, node.to))
      }

      // Links [text](url)
      if (t === 'Link') {
        if (isCursorInside(node.from, node.to, active)) return

        decos.push(linkMark.range(node.from, node.to))

        const full = doc.sliceString(node.from, node.to)
        const bracketClose = full.indexOf('](')
        const parenClose = full.lastIndexOf(')')
        if (bracketClose >= 0 && parenClose >= 0) {
          decos.push(hiddenMark.range(node.from, node.from + 1))
          decos.push(
            hiddenMark.range(
              node.from + bracketClose,
              node.from + parenClose + 1
            )
          )
        }
      }

      // Autolinks / plain URLs
      if (t === 'URL') {
        if (!isCursorInside(node.from, node.to, active)) {
          decos.push(urlMark.range(node.from, node.to))
        }
      }

      // Blockquotes
      if (t === 'Blockquote') {
        if (!isCursorInside(node.from, node.to, active)) {
          for (let pos = node.from; pos < node.to;) {
            const line = doc.lineAt(pos)
            decos.push(blockquoteLine.range(line.from))
            const text = line.text
            const match = text.match(/^(\s*>\s*)/)
            if (match) {
              decos.push(hiddenMark.range(line.from, line.from + match[1].length))
            }
            pos = line.to + 1
          }
        }
      }

      // List items (bullet and ordered)
      if (t === 'ListItem') {
        if (!isCursorInside(node.from, node.to, active)) {
          const line = doc.lineAt(node.from)
          const text = line.text
          const taskMatch = text.match(/^(\s*[-*+]\s*\[)([xX ])(\]\s*)/)
          if (taskMatch) {
            const isChecked = taskMatch[2].toLowerCase() === 'x'
            decos.push((isChecked ? taskCheckedLine : taskLine).range(line.from))
            const markerEnd = taskMatch[1].length + 1 + taskMatch[3].length
            decos.push(hiddenMark.range(line.from, line.from + markerEnd))
          } else {
            decos.push(listItemLine.range(line.from))
            const bulletMatch = text.match(/^(\s*[-*+]\s)/)
            const orderedMatch = text.match(/^(\s*\d+[.)]\s)/)
            if (bulletMatch) {
              decos.push(hiddenMark.range(line.from, line.from + bulletMatch[1].length))
            } else if (orderedMatch) {
              // Keep ordered list numbers visible but style the line
            }
          }
        }
      }

      // YAML front matter
      if (t === 'FrontMatter') {
        if (!isCursorInside(node.from, node.to, active)) {
          for (let pos = node.from; pos < node.to;) {
            const line = doc.lineAt(pos)
            decos.push(yamlLine.range(line.from))
            pos = line.to + 1
          }
        }
      }
    },
  })

  // Inline math: $...$  (scan raw text since Lezer doesn't parse it)
  const text = doc.toString()
  const inlineMathRegex = /(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g
  let mathMatch: RegExpExecArray | null
  while ((mathMatch = inlineMathRegex.exec(text)) !== null) {
    const from = mathMatch.index
    const to = from + mathMatch[0].length
    if (isCursorInside(from, to, active)) continue
    decos.push(
      Decoration.replace({
        widget: new InlineMathWidget(mathMatch[1], from, to),
      }).range(from, to)
    )
  }

  // ==highlight==
  const hlRegex = /==(.+?)==/g
  let hlMatch: RegExpExecArray | null
  while ((hlMatch = hlRegex.exec(text)) !== null) {
    const from = hlMatch.index
    const to = from + hlMatch[0].length
    if (isCursorInside(from, to, active)) continue
    decos.push(highlightMark.range(from, to))
    decos.push(hiddenMark.range(from, from + 2))
    decos.push(hiddenMark.range(to - 2, to))
  }

  // ~subscript~  (single tilde, not ~~strikethrough~~)
  const subRegex = /(?<!~)~(?!~)([^~\s][^~]*)~(?!~)/g
  let subMatch: RegExpExecArray | null
  while ((subMatch = subRegex.exec(text)) !== null) {
    const from = subMatch.index
    const to = from + subMatch[0].length
    if (isCursorInside(from, to, active)) continue
    decos.push(subscriptMark.range(from, to))
    decos.push(hiddenMark.range(from, from + 1))
    decos.push(hiddenMark.range(to - 1, to))
  }

  // ^superscript^
  const supRegex = /\^([^\^\s][^\^]*)\^/g
  let supMatch: RegExpExecArray | null
  while ((supMatch = supRegex.exec(text)) !== null) {
    const from = supMatch.index
    const to = from + supMatch[0].length
    if (isCursorInside(from, to, active)) continue
    decos.push(superscriptMark.range(from, to))
    decos.push(hiddenMark.range(from, from + 1))
    decos.push(hiddenMark.range(to - 1, to))
  }

  // :emoji: shortcodes
  const emojiRegex = /:([a-z0-9_+-]+):/g
  let emojiMatch: RegExpExecArray | null
  while ((emojiMatch = emojiRegex.exec(text)) !== null) {
    const from = emojiMatch.index
    const to = from + emojiMatch[0].length
    const emoji = EMOJI_MAP[emojiMatch[1]]
    if (!emoji) continue
    if (isCursorInside(from, to, active)) continue
    decos.push(
      Decoration.replace({
        widget: new EmojiWidget(emoji),
      }).range(from, to)
    )
  }

  // [^footnote] references
  const fnRefRegex = /\[\^([^\]]+)\]/g
  let fnMatch: RegExpExecArray | null
  while ((fnMatch = fnRefRegex.exec(text)) !== null) {
    const from = fnMatch.index
    const to = from + fnMatch[0].length
    const lineText = doc.lineAt(from).text
    if (lineText.trimStart().startsWith('[^') && lineText.includes(']:')) continue
    if (isCursorInside(from, to, active)) continue
    decos.push(footnoteMark.range(from, to))
  }

  // [toc] placeholder
  const tocRegex = /^\[toc\]\s*$/gim
  let tocMatch: RegExpExecArray | null
  while ((tocMatch = tocRegex.exec(text)) !== null) {
    const from = tocMatch.index
    if (!isCursorInside(from, from + tocMatch[0].length, active)) {
      const line = doc.lineAt(from)
      decos.push(tocLine.range(line.from))
    }
  }

  // GitHub-style alerts: > [!NOTE], > [!WARNING], etc.
  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i)
    const alertMatch = line.text.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/)
    if (alertMatch) {
      const alertClass = ALERT_TYPES[alertMatch[1]]
      if (alertClass && !isCursorInside(line.from, line.to, active)) {
        decos.push(Decoration.line({ class: alertClass }).range(line.from))
        let j = i + 1
        while (j <= doc.lines) {
          const next = doc.line(j)
          if (!next.text.startsWith('>')) break
          if (!isCursorInside(next.from, next.to, active)) {
            decos.push(Decoration.line({ class: alertClass }).range(next.from))
          }
          j++
        }
      }
    }
  }

  decos.sort((a, b) => a.from - b.from || a.value.startSide - b.value.startSide)
  return RangeSet.of(decos, true)
}

export const markdownDecorations = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet
    constructor(view: EditorView) {
      this.decorations = buildDecorations(view)
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet || update.viewportChanged) {
        this.decorations = buildDecorations(update.view)
      }
    }
  },
  { decorations: (v) => v.decorations }
)
