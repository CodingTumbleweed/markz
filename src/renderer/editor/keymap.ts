import { EditorView } from '@codemirror/view'
import { EditorSelection } from '@codemirror/state'
import { KeyBinding } from '@codemirror/view'
import {
  moveVisualLineDown,
  moveVisualLineUp,
  selectVisualLineDown,
  selectVisualLineUp,
} from './blockNavigation'

/**
 * Toggle a pair of wrapping markers around the selection (e.g. '**' for bold,
 * '*' for italic, '~~' for strikethrough, '`' for inline code).
 *
 * Toggling semantics (fixes issue #8):
 *   1. If the selection already includes the markers (e.g. selection is
 *      "**bold**"), strip them from inside the selection.
 *   2. If the markers sit immediately outside the selection (e.g. selection
 *      is "bold" and the surrounding chars are "**" and "**"), strip the
 *      outer markers so Cmd+B/Cmd+I correctly toggles OFF after wrapping.
 *   3. If the selection is empty but the cursor sits inside a marker pair on
 *      the same line (e.g. "**bo|ld**"), find the nearest surrounding pair
 *      and strip it.
 *   4. Otherwise, wrap the selection with the markers (original behavior).
 *
 * For italic ('*') the toggle-off checks must avoid matching the second
 * asterisk of a bold '**' as if it were an italic opener/closer; see
 * `isAsteriskPartOfBold`.
 */
export function wrapSelection(view: EditorView, before: string, after: string): boolean {
  const { state } = view
  const doc = state.doc
  const singleAsterisk = before === '*' && after === '*'

  const changes = state.changeByRange((range) => {
    const selected = doc.sliceString(range.from, range.to)

    // --- Case 1: the markers live inside the selection ("**bold**" selected)
    if (
      selected.length >= before.length + after.length &&
      selected.startsWith(before) &&
      selected.endsWith(after)
    ) {
      const unwrapped = selected.slice(before.length, selected.length - after.length)
      return {
        changes: { from: range.from, to: range.to, insert: unwrapped },
        range: EditorSelection.range(range.from, range.from + unwrapped.length),
      }
    }

    // --- Case 2: the markers hug the selection from outside
    const outerStart = range.from - before.length
    const outerEnd = range.to + after.length
    if (
      outerStart >= 0 &&
      outerEnd <= doc.length &&
      doc.sliceString(outerStart, range.from) === before &&
      doc.sliceString(range.to, outerEnd) === after &&
      !(singleAsterisk && isAsteriskPartOfBold(doc, outerStart, range.to))
    ) {
      return {
        changes: [
          { from: outerStart, to: range.from, insert: '' },
          { from: range.to, to: outerEnd, insert: '' },
        ],
        range: EditorSelection.range(outerStart, outerStart + selected.length),
      }
    }

    // --- Case 3: empty selection sitting inside a marker pair on the same line
    if (range.empty) {
      const pair = findSurroundingPair(doc, range.from, before, after, singleAsterisk)
      if (pair) {
        const { leftStart, rightStart } = pair
        return {
          changes: [
            { from: leftStart, to: leftStart + before.length, insert: '' },
            { from: rightStart, to: rightStart + after.length, insert: '' },
          ],
          // Keep the cursor at the same logical character position, now that
          // `before` chars to the left of it have been removed.
          range: EditorSelection.cursor(range.from - before.length),
        }
      }
    }

    // --- Default: wrap the selection
    const wrapped = before + selected + after
    return {
      changes: { from: range.from, to: range.to, insert: wrapped },
      range: EditorSelection.range(
        range.from + before.length,
        range.from + before.length + selected.length
      ),
    }
  })

  view.dispatch(changes)
  return true
}

/**
 * Returns true when the single-asterisk markers at `leftStart` and `rightStart`
 * are actually part of a longer `**` (bold) marker, which must not be stripped
 * when toggling italic.
 */
function isAsteriskPartOfBold(
  doc: EditorView['state']['doc'],
  leftStart: number,
  rightStart: number,
): boolean {
  const prev = leftStart > 0 ? doc.sliceString(leftStart - 1, leftStart) : ''
  const next = rightStart + 1 <= doc.length ? doc.sliceString(rightStart + 1, rightStart + 2) : ''
  return prev === '*' || next === '*'
}

/**
 * Find the nearest matching marker pair that surrounds `pos` on the same line.
 * Returns the absolute document offsets of the opening and closing markers,
 * or null if no valid pair is found.
 */
function findSurroundingPair(
  doc: EditorView['state']['doc'],
  pos: number,
  before: string,
  after: string,
  singleAsterisk: boolean,
): { leftStart: number; rightStart: number } | null {
  const line = doc.lineAt(pos)
  const text = line.text
  const rel = pos - line.from

  const isValidAsteriskAt = (i: number): boolean => {
    if (!singleAsterisk) return true
    const prev = i > 0 ? text[i - 1] : ''
    const next = text[i + 1] ?? ''
    return prev !== '*' && next !== '*'
  }

  let leftRel = -1
  for (let i = rel - before.length; i >= 0; i--) {
    if (text.slice(i, i + before.length) === before && isValidAsteriskAt(i)) {
      leftRel = i
      break
    }
  }
  if (leftRel < 0) return null

  let rightRel = -1
  for (let i = rel; i <= text.length - after.length; i++) {
    if (text.slice(i, i + after.length) === after && isValidAsteriskAt(i)) {
      rightRel = i
      break
    }
  }
  if (rightRel < 0) return null

  // Reject if there's nothing between the two markers (e.g. empty "**|**")
  if (leftRel + before.length > rightRel) return null

  return {
    leftStart: line.from + leftRel,
    rightStart: line.from + rightRel,
  }
}

export function setHeading(view: EditorView, level: number): boolean {
  const { state } = view
  const line = state.doc.lineAt(state.selection.main.head)
  const text = line.text
  const stripped = text.replace(/^#{1,6}\s*/, '')
  const prefix = level > 0 ? '#'.repeat(level) + ' ' : ''
  const newText = prefix + stripped

  view.dispatch({
    changes: { from: line.from, to: line.to, insert: newText },
    selection: EditorSelection.cursor(line.from + newText.length),
  })
  return true
}

function insertAtLineStart(view: EditorView, prefix: string): boolean {
  const { state } = view
  const line = state.doc.lineAt(state.selection.main.head)

  if (line.text.startsWith(prefix)) {
    view.dispatch({
      changes: { from: line.from, to: line.from + prefix.length },
    })
  } else {
    view.dispatch({
      changes: { from: line.from, insert: prefix },
    })
  }
  return true
}

function copyWholeLine(view: EditorView): boolean {
  const sel = view.state.selection.main
  if (!sel.empty) return false
  const line = view.state.doc.lineAt(sel.head)
  navigator.clipboard.writeText(line.text + '\n')
  return true
}

function cutWholeLine(view: EditorView): boolean {
  const sel = view.state.selection.main
  if (!sel.empty) return false
  const line = view.state.doc.lineAt(sel.head)
  navigator.clipboard.writeText(line.text + '\n')
  const to = line.to < view.state.doc.length ? line.to + 1 : line.to
  const from = line.from > 0 ? line.from - 1 : line.from
  view.dispatch({ changes: { from, to } })
  return true
}

function pasteAsPlain(view: EditorView): boolean {
  navigator.clipboard.readText().then((text) => {
    if (text) {
      const sel = view.state.selection.main
      view.dispatch({
        changes: { from: sel.from, to: sel.to, insert: text },
        selection: EditorSelection.cursor(sel.from + text.length),
      })
    }
  })
  return true
}

export const markzKeymap: KeyBinding[] = [
  { key: 'ArrowUp', run: moveVisualLineUp, shift: selectVisualLineUp, preventDefault: true },
  { key: 'ArrowDown', run: moveVisualLineDown, shift: selectVisualLineDown, preventDefault: true },
  { key: 'Mod-b', run: (v) => wrapSelection(v, '**', '**') },
  { key: 'Mod-i', run: (v) => wrapSelection(v, '*', '*') },
  { key: 'Mod-Shift-x', run: (v) => wrapSelection(v, '~~', '~~') },
  { key: 'Mod-Shift-`', run: (v) => wrapSelection(v, '`', '`') },
  { key: 'Mod-k', run: (v) => {
    const sel = v.state.selection.main
    const text = v.state.doc.sliceString(sel.from, sel.to)
    const insert = `[${text}](url)`
    v.dispatch({
      changes: { from: sel.from, to: sel.to, insert },
      selection: EditorSelection.range(sel.from + text.length + 3, sel.from + text.length + 6),
    })
    return true
  }},
  { key: 'Mod-1', run: (v) => setHeading(v, 1) },
  { key: 'Mod-2', run: (v) => setHeading(v, 2) },
  { key: 'Mod-3', run: (v) => setHeading(v, 3) },
  { key: 'Mod-4', run: (v) => setHeading(v, 4) },
  { key: 'Mod-5', run: (v) => setHeading(v, 5) },
  { key: 'Mod-6', run: (v) => setHeading(v, 6) },
  { key: 'Mod-0', run: (v) => setHeading(v, 0) },
  { key: 'Mod-Shift-i', run: (v) => {
    const pos = v.state.selection.main.head
    v.dispatch({
      changes: { from: pos, insert: '![alt](url)' },
      selection: EditorSelection.range(pos + 2, pos + 5),
    })
    return true
  }},
  { key: 'Mod-Shift-t', run: (v) => {
    const pos = v.state.selection.main.head
    const line = v.state.doc.lineAt(pos)
    const table = '\n| Header | Header |\n|--------|--------|\n| Cell   | Cell   |\n'
    v.dispatch({
      changes: { from: line.to, insert: table },
    })
    return true
  }},
  { key: 'Mod-Shift-c', run: (v) => {
    const pos = v.state.selection.main.head
    const line = v.state.doc.lineAt(pos)
    v.dispatch({
      changes: { from: line.to, insert: '\n```\n\n```\n' },
      selection: EditorSelection.cursor(line.to + 5),
    })
    return true
  }},
  { key: 'Mod-c', run: copyWholeLine },
  { key: 'Mod-x', run: cutWholeLine },
  { key: 'Mod-Shift-v', run: pasteAsPlain },
  // Move line/paragraph up/down
  { key: 'Alt-ArrowUp', run: (v) => moveLine(v, -1) },
  { key: 'Alt-ArrowDown', run: (v) => moveLine(v, 1) },
]

function moveLine(view: EditorView, dir: -1 | 1): boolean {
  const { state } = view
  const line = state.doc.lineAt(state.selection.main.head)
  if (dir === -1 && line.number <= 1) return true
  if (dir === 1 && line.number >= state.doc.lines) return true

  const otherLine = state.doc.line(line.number + dir)

  if (dir === -1) {
    view.dispatch({
      changes: [
        { from: otherLine.from, to: line.to, insert: line.text + '\n' + otherLine.text },
      ],
      selection: EditorSelection.cursor(otherLine.from + (state.selection.main.head - line.from)),
    })
  } else {
    view.dispatch({
      changes: [
        { from: line.from, to: otherLine.to, insert: otherLine.text + '\n' + line.text },
      ],
      selection: EditorSelection.cursor(line.from + otherLine.text.length + 1 + (state.selection.main.head - line.from)),
    })
  }
  return true
}

export function listContinuation(view: EditorView): boolean {
  const { state } = view
  const line = state.doc.lineAt(state.selection.main.head)
  const text = line.text

  const bulletMatch = text.match(/^(\s*)([-*+])\s/)
  if (bulletMatch) {
    if (text.trim() === bulletMatch[2]) {
      view.dispatch({
        changes: { from: line.from, to: line.to, insert: '' },
      })
      return true
    }
    const indent = bulletMatch[1]
    const marker = bulletMatch[2]
    view.dispatch({
      changes: { from: state.selection.main.head, insert: '\n' + indent + marker + ' ' },
    })
    return true
  }

  const orderedMatch = text.match(/^(\s*)(\d+)([.)]\s)/)
  if (orderedMatch) {
    const num = parseInt(orderedMatch[2])
    if (text.trim() === orderedMatch[2] + orderedMatch[3].charAt(0)) {
      view.dispatch({
        changes: { from: line.from, to: line.to, insert: '' },
      })
      return true
    }
    const indent = orderedMatch[1]
    const delim = orderedMatch[3]
    view.dispatch({
      changes: {
        from: state.selection.main.head,
        insert: '\n' + indent + (num + 1) + delim,
      },
    })
    return true
  }

  const blockquoteMatch = text.match(/^(\s*>\s*)/)
  if (blockquoteMatch) {
    if (text.trim() === '>') {
      view.dispatch({
        changes: { from: line.from, to: line.to, insert: '' },
      })
      return true
    }
    view.dispatch({
      changes: {
        from: state.selection.main.head,
        insert: '\n' + blockquoteMatch[1],
      },
    })
    return true
  }

  const taskMatch = text.match(/^(\s*[-*+]\s*\[[ xX]\]\s*)/)
  if (taskMatch) {
    if (text.trim().match(/^[-*+]\s*\[[ xX]\]$/)) {
      view.dispatch({
        changes: { from: line.from, to: line.to, insert: '' },
      })
      return true
    }
    view.dispatch({
      changes: {
        from: state.selection.main.head,
        insert: '\n' + text.match(/^(\s*)/)?.[1] + '- [ ] ',
      },
    })
    return true
  }

  return false
}
