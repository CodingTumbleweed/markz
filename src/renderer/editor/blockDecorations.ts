import { StateField, EditorState, Range } from '@codemirror/state'
import { Decoration, DecorationSet, EditorView } from '@codemirror/view'
import { syntaxTree } from '@codemirror/language'
import { CodeBlockWidget } from './widgets/codeBlock'
import { ImageWidget } from './widgets/image'
import { TableWidget, parseTableRow, parseAlignments } from './widgets/table'
import { BlockMathWidget } from './widgets/math'
import { MermaidWidget } from './widgets/mermaid'

const sourceHidden = Decoration.line({ class: 'markz-source-hidden' })

function getActiveLinesRange(state: EditorState): { from: number; to: number } | null {
  const sel = state.selection.main
  return {
    from: state.doc.lineAt(sel.from).from,
    to: state.doc.lineAt(sel.to).to,
  }
}

function overlaps(aFrom: number, aTo: number, bFrom: number, bTo: number): boolean {
  return aFrom < bTo && aTo > bFrom
}

function hideSourceLines(
  doc: EditorState['doc'],
  from: number,
  to: number,
  decos: Range<Decoration>[],
) {
  for (let pos = from; pos <= to;) {
    const line = doc.lineAt(pos)
    decos.push(sourceHidden.range(line.from))
    if (line.to >= to) break
    pos = line.to + 1
  }
}

function addBlockWidget(
  doc: EditorState['doc'],
  from: number,
  to: number,
  widget: import('@codemirror/view').WidgetType,
  decos: Range<Decoration>[],
) {
  hideSourceLines(doc, from, to, decos)
  decos.push(
    Decoration.widget({
      widget,
      block: true,
      side: -1,
    }).range(doc.lineAt(from).from)
  )
}

function buildBlockDecorations(state: EditorState): DecorationSet {
  const active = getActiveLinesRange(state)
  const decos: Range<Decoration>[] = []
  const doc = state.doc
  const tree = syntaxTree(state)

  tree.iterate({
    enter(node) {
      const t = node.type.name

      if (t === 'FencedCode') {
        const text = doc.sliceString(node.from, node.to)
        const firstLine = text.split('\n')[0] || ''

        if (firstLine.match(/^[`~]{3,}\s*mermaid\s*$/i)) {
          if (active && overlaps(node.from, node.to, active.from, active.to)) return
          const lines = text.split('\n')
          const source = lines.slice(1, -1).join('\n')
          addBlockWidget(doc, node.from, node.to,
            new MermaidWidget(source, node.from, node.to), decos)
          return
        }

        if (firstLine.match(/^[`~]{3,}\s*math\s*$/i)) {
          if (active && overlaps(node.from, node.to, active.from, active.to)) return
          const lines = text.split('\n')
          const latex = lines.slice(1, -1).join('\n')
          addBlockWidget(doc, node.from, node.to,
            new BlockMathWidget(latex, node.from, node.to), decos)
          return
        }

        if (active && overlaps(node.from, node.to, active.from, active.to)) return
        const lines = text.split('\n')
        const langMatch = firstLine.match(/^[`~]{3,}\s*(\S*)/)
        const language = langMatch?.[1] || ''
        const code = lines.slice(1, -1).join('\n')
        addBlockWidget(doc, node.from, node.to,
          new CodeBlockWidget(code, language, node.from, node.to), decos)
      }

      if (t === 'Image') {
        if (active && overlaps(node.from, node.to, active.from, active.to)) return
        const text = doc.sliceString(node.from, node.to)
        const match = text.match(/^!\[([^\]]*)\]\(([^)]+)\)/)
        if (match) {
          addBlockWidget(doc, node.from, node.to,
            new ImageWidget(match[2], match[1], node.from), decos)
        }
      }

      if (t === 'Table') {
        if (active && overlaps(node.from, node.to, active.from, active.to)) return
        const text = doc.sliceString(node.from, node.to)
        const lines = text.split('\n').filter((l) => l.trim())

        if (lines.length >= 2) {
          const headerCells = parseTableRow(lines[0])
          const alignments = parseAlignments(lines[1])
          const dataRows: string[][] = [headerCells]
          for (let i = 2; i < lines.length; i++) {
            dataRows.push(parseTableRow(lines[i]))
          }
          addBlockWidget(doc, node.from, node.to,
            new TableWidget(dataRows, alignments, node.from, node.to), decos)
        }
      }
    },
  })

  // $$...$$ block math (not captured by Lezer)
  const text = doc.toString()
  const mathBlockRegex = /^\$\$[^\S\n]*\n([\s\S]*?)\n\$\$[^\S\n]*$/gm
  let match: RegExpExecArray | null
  while ((match = mathBlockRegex.exec(text)) !== null) {
    const from = match.index
    const to = from + match[0].length
    if (active && overlaps(from, to, active.from, active.to)) continue
    const alreadyCovered = decos.some(
      (d) => d.from <= from && d.to >= to
    )
    if (!alreadyCovered) {
      addBlockWidget(doc, from, to,
        new BlockMathWidget(match[1], from, to), decos)
    }
  }

  decos.sort((a, b) => a.from - b.from || a.value.startSide - b.value.startSide)
  return Decoration.set(decos, true)
}

export const blockDecorations = StateField.define<DecorationSet>({
  create(state) {
    return buildBlockDecorations(state)
  },
  update(decos, tr) {
    if (tr.docChanged || tr.selection) {
      return buildBlockDecorations(tr.state)
    }
    return decos
  },
  provide(field) {
    return EditorView.decorations.from(field)
  },
})
