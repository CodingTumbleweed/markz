import { BrowserWindow, dialog, app } from 'electron'
import fs from 'fs'
import path from 'path'
import { renderMarkdown, parseFrontMatter, getExportCSS, getKaTeXCSS, getMermaidScript } from './render'

export interface PDFOptions {
  paperSize?: 'A4' | 'A5' | 'Letter' | 'Legal'
  margins?: { top: number; bottom: number; left: number; right: number }
  printBackground?: boolean
  landscape?: boolean
  header?: string
  footer?: string
}

const PAPER_SIZES: Record<string, { width: number; height: number }> = {
  A4: { width: 8.27, height: 11.69 },
  A5: { width: 5.83, height: 8.27 },
  Letter: { width: 8.5, height: 11 },
  Legal: { width: 8.5, height: 14 },
}

function substituteVars(template: string, vars: Record<string, string>): string {
  return template.replace(/\$\{(\w+)\}/g, (_m, key) => vars[key] || '')
}

export async function exportToPDF(
  parentWindow: BrowserWindow,
  markdown: string,
  _css: string,
  options: PDFOptions = {},
): Promise<string | null> {
  const { meta, body } = parseFrontMatter(markdown)
  const { html: htmlContent, hasMermaid } = renderMarkdown(body)
  const title = (meta.title as string) || 'document'

  const result = await dialog.showSaveDialog(parentWindow, {
    defaultPath: `${title}.pdf`,
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  })

  if (result.canceled || !result.filePath) return null

  const printWin = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  })

  const css = getExportCSS()
  const katexCssUrl = getKaTeXCSS()
  const mermaidScript = hasMermaid ? getMermaidScript() : ''

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="${katexCssUrl}">
  <style>${css}</style>
</head>
<body>
  <article>${htmlContent}</article>
  ${mermaidScript}
</body>
</html>`

  // Write to temp file so external resources (KaTeX CSS, mermaid CDN) can load
  const tmpFile = path.join(app.getPath('temp'), `markz-export-${Date.now()}.html`)
  fs.writeFileSync(tmpFile, fullHtml, 'utf-8')
  await printWin.loadFile(tmpFile)

  // Wait for mermaid diagrams to finish rendering
  if (hasMermaid) {
    await printWin.webContents.executeJavaScript(`
      new Promise(resolve => {
        let attempts = 0;
        const check = () => {
          if (window.__mermaidDone || attempts > 50) resolve(true);
          else { attempts++; setTimeout(check, 200); }
        };
        setTimeout(check, 500);
      })
    `)
  } else {
    // Small delay for KaTeX CSS to load
    await new Promise((r) => setTimeout(r, 500))
  }

  const paper = PAPER_SIZES[options.paperSize || 'A4']
  const margins = options.margins || { top: 0.75, bottom: 0.75, left: 0.75, right: 0.75 }

  const templateVars: Record<string, string> = {
    title: (meta.title as string) || '',
    author: (meta.author as string) || '',
    today: new Date().toLocaleDateString(),
  }

  const printOptions: Electron.PrintToPDFOptions = {
    pageSize: { width: paper.width, height: paper.height },
    margins: {
      marginType: 'custom',
      top: margins.top,
      bottom: margins.bottom,
      left: margins.left,
      right: margins.right,
    },
    printBackground: options.printBackground !== false,
    landscape: options.landscape || false,
  }

  if (options.header) {
    (printOptions as any).headerTemplate = substituteVars(options.header, templateVars)
    ;(printOptions as any).displayHeaderFooter = true
  }
  if (options.footer) {
    (printOptions as any).footerTemplate = substituteVars(options.footer, templateVars)
    ;(printOptions as any).displayHeaderFooter = true
  }

  const pdfData = await printWin.webContents.printToPDF(printOptions)
  fs.writeFileSync(result.filePath, pdfData)
  printWin.close()

  try { fs.unlinkSync(tmpFile) } catch { /* ignore */ }

  return result.filePath
}
