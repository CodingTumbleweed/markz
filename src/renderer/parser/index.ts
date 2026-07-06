import MarkdownIt from 'markdown-it'

const md = MarkdownIt({
  html: true,
  linkify: true,
  typographer: false,
})

export { md }

export interface MarkdownToken {
  type: string
  tag: string
  nesting: number
  content: string
  markup: string
  children: MarkdownToken[] | null
  map: [number, number] | null
  level: number
}

export function parseMarkdown(src: string): MarkdownToken[] {
  return md.parse(src, {}) as MarkdownToken[]
}
