import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import katex from 'katex'

export interface FrontMatter {
  title?: string
  author?: string
  subject?: string
  keywords?: string
  date?: string
  [key: string]: unknown
}

export function parseFrontMatter(markdown: string): { meta: FrontMatter; body: string } {
  const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n/)
  if (!match) return { meta: {}, body: markdown }

  const meta: FrontMatter = {}
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/)
    if (kv) meta[kv[1]] = kv[2].replace(/^["']|["']$/g, '')
  }
  return { meta, body: markdown.slice(match[0].length) }
}

function renderKatex(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex.trim(), {
      displayMode,
      throwOnError: false,
      errorColor: '#c00',
      trust: true,
      strict: false,
    })
  } catch {
    const delim = displayMode ? '$$' : '$'
    return `<span style="color:#c00">${delim}${latex}${delim}</span>`
  }
}

/**
 * Pre-process markdown to extract math and replace with placeholders
 * before markdown-it touches it. This prevents math $ signs from being
 * corrupted by code block processing.
 */
function extractMath(markdown: string): { text: string; replacements: Map<string, string> } {
  const replacements = new Map<string, string>()
  let counter = 0

  function placeholder(id: number): string {
    return `%%MARKZ_MATH_${id}%%`
  }

  // Block math: $$...$$ (must come before inline)
  let text = markdown.replace(/\$\$\n?([\s\S]*?)\n?\$\$/g, (_m, latex) => {
    const id = counter++
    const key = placeholder(id)
    replacements.set(key, `<div class="markz-export-math-block">${renderKatex(latex, true)}</div>`)
    return key
  })

  // Inline math: $...$ (not inside backtick code spans)
  // Split on backtick-delimited code to avoid matching inside code
  const parts = text.split(/(`[^`]*`)/g)
  text = parts.map((part, i) => {
    if (i % 2 === 1) return part // inside backticks, leave alone
    return part.replace(/(?<!\$)\$(?!\$)([^\$\n]+?)\$(?!\$)/g, (_m, latex) => {
      const id = counter++
      const key = placeholder(id)
      replacements.set(key, renderKatex(latex, false))
      return key
    })
  }).join('')

  return { text, replacements }
}

function restoreMath(html: string, replacements: Map<string, string>): string {
  for (const [key, value] of replacements) {
    html = html.replace(key, value)
  }
  return html
}

export function renderMarkdown(markdown: string): { html: string; hasMermaid: boolean } {
  let hasMermaid = false

  // Extract math before markdown-it processing
  const { text: preprocessed, replacements } = extractMath(markdown)

  const md = MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight(str: string, lang: string) {
      if (lang?.toLowerCase() === 'mermaid') {
        hasMermaid = true
        return `<div class="mermaid">${md.utils.escapeHtml(str)}</div>`
      }
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`
        } catch { /* fall through */ }
      }
      return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
    },
  })

  // ==highlight==
  md.inline.ruler.before('emphasis', 'highlight', (state, silent) => {
    if (state.src.charCodeAt(state.pos) !== 0x3D || state.src.charCodeAt(state.pos + 1) !== 0x3D) return false
    const end = state.src.indexOf('==', state.pos + 2)
    if (end < 0) return false
    if (!silent) {
      const token = state.push('mark_open', 'mark', 1)
      token.markup = '=='
      const inline = state.push('text', '', 0)
      inline.content = state.src.slice(state.pos + 2, end)
      const closeToken = state.push('mark_close', 'mark', -1)
      closeToken.markup = '=='
    }
    state.pos = end + 2
    return true
  })

  // ~subscript~
  md.inline.ruler.after('emphasis', 'subscript', (state, silent) => {
    if (state.src.charCodeAt(state.pos) !== 0x7E) return false
    if (state.src.charCodeAt(state.pos + 1) === 0x7E) return false
    const end = state.src.indexOf('~', state.pos + 1)
    if (end < 0 || end === state.pos + 1) return false
    if (!silent) {
      const token = state.push('sub_open', 'sub', 1)
      token.markup = '~'
      const inline = state.push('text', '', 0)
      inline.content = state.src.slice(state.pos + 1, end)
      const closeToken = state.push('sub_close', 'sub', -1)
      closeToken.markup = '~'
    }
    state.pos = end + 1
    return true
  })

  // ^superscript^
  md.inline.ruler.after('emphasis', 'superscript', (state, silent) => {
    if (state.src.charCodeAt(state.pos) !== 0x5E) return false
    const end = state.src.indexOf('^', state.pos + 1)
    if (end < 0 || end === state.pos + 1) return false
    if (!silent) {
      const token = state.push('sup_open', 'sup', 1)
      token.markup = '^'
      const inline = state.push('text', '', 0)
      inline.content = state.src.slice(state.pos + 1, end)
      const closeToken = state.push('sup_close', 'sup', -1)
      closeToken.markup = '^'
    }
    state.pos = end + 1
    return true
  })

  let html = md.render(preprocessed)

  // Restore rendered math from placeholders
  html = restoreMath(html, replacements)

  // GitHub alerts
  html = html.replace(
    /<blockquote>\s*<p>\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]([\s\S]*?)<\/p>\s*<\/blockquote>/gi,
    (_m, type, content) => {
      const t = type.toUpperCase()
      return `<div class="markz-alert markz-alert-${t.toLowerCase()}"><p><strong>${t}</strong></p><p>${content.trim()}</p></div>`
    }
  )

  return { html, hasMermaid }
}

export function getExportCSS(): string {
  return `
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      line-height: 1.7;
      color: #24292e;
      max-width: 800px;
      margin: 0 auto;
      padding: 2em 1em;
    }
    h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
    h3 { font-size: 1.25em; }
    h4, h5, h6 { font-size: 1em; }
    code { background: #f6f8fa; padding: 0.2em 0.4em; border-radius: 3px; font-size: 0.85em; font-family: 'SF Mono', Menlo, monospace; }
    pre.hljs { background: #f6f8fa; padding: 1em; border-radius: 6px; overflow-x: auto; }
    pre.hljs code { background: none; padding: 0; font-size: 0.85em; }
    blockquote { border-left: 4px solid #dfe2e5; padding: 0 1em; color: #6a737d; margin: 1em 0; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th, td { border: 1px solid #dfe2e5; padding: 6px 13px; }
    th { background: #f6f8fa; font-weight: 600; }
    tr:nth-child(2n) { background: #f6f8fa; }
    img { max-width: 100%; height: auto; }
    hr { border: none; border-top: 1px solid #eaecef; margin: 2em 0; }
    mark { background: #fff3b0; padding: 0.1em 0; }
    .markz-alert { border-left: 4px solid; padding: 0.5em 1em; margin: 1em 0; border-radius: 4px; }
    .markz-alert-note { border-color: #0969da; background: rgba(9,105,218,0.08); }
    .markz-alert-tip { border-color: #1a7f37; background: rgba(26,127,55,0.08); }
    .markz-alert-important { border-color: #8250df; background: rgba(130,80,223,0.08); }
    .markz-alert-warning { border-color: #bf8700; background: rgba(191,135,0,0.08); }
    .markz-alert-caution { border-color: #cf222e; background: rgba(207,34,46,0.08); }
    .markz-export-math-block { text-align: center; margin: 1em 0; }
    .mermaid { text-align: center; margin: 1em 0; }
    .mermaid svg { max-width: 100%; height: auto; }
    @media print {
      body { max-width: 100%; padding: 0; }
      pre.hljs { white-space: pre-wrap; }
    }
  `
}

export function getKaTeXCSS(): string {
  return `https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css`
}

export function getMermaidScript(): string {
  return `
    <script type="module">
      import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
      mermaid.initialize({ startOnLoad: true, theme: 'default', securityLevel: 'strict' });
      await mermaid.run();
      window.__mermaidDone = true;
    </script>
  `
}
