import { BrowserWindow, dialog } from 'electron'
import fs from 'fs'
import { renderMarkdown, parseFrontMatter, getExportCSS, getKaTeXCSS, getMermaidScript } from './render'

export interface HTMLExportOptions {
  includeStyles?: boolean
  includeKaTeX?: boolean
}

export async function exportToHTML(
  parentWindow: BrowserWindow,
  markdown: string,
  _css: string,
  _title?: string,
  options: HTMLExportOptions = {},
): Promise<string | null> {
  const { meta, body } = parseFrontMatter(markdown)
  const title = (meta.title as string) || _title || 'Document'
  const { html: htmlContent, hasMermaid } = renderMarkdown(body)

  const result = await dialog.showSaveDialog(parentWindow, {
    defaultPath: `${title}.html`,
    filters: [{ name: 'HTML', extensions: ['html', 'htm'] }],
  })

  if (result.canceled || !result.filePath) return null

  const includeStyles = options.includeStyles !== false
  const css = includeStyles ? getExportCSS() : ''
  const katexCssUrl = getKaTeXCSS()
  const mermaidScript = hasMermaid ? getMermaidScript() : ''

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  ${meta.author ? `<meta name="author" content="${escapeHtml(meta.author as string)}">` : ''}
  ${meta.keywords ? `<meta name="keywords" content="${escapeHtml(meta.keywords as string)}">` : ''}
  ${meta.subject ? `<meta name="description" content="${escapeHtml(meta.subject as string)}">` : ''}
  <link rel="stylesheet" href="${katexCssUrl}">
  ${includeStyles ? `<style>${css}</style>` : ''}
</head>
<body>
  <article class="markz-export">
    ${htmlContent}
  </article>
  ${mermaidScript}
</body>
</html>`

  fs.writeFileSync(result.filePath, fullHtml, 'utf-8')
  return result.filePath
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
