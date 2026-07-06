import { EditorView } from '@codemirror/view'

const IMAGE_EXTENSIONS = /\.(png|jpg|jpeg|gif|webp|svg|bmp|ico|jfif)$/i

type GetCurrentFile = () => string | null

let getCurrentFile: GetCurrentFile = () => null

export function setImageInsertFileGetter(fn: GetCurrentFile) {
  getCurrentFile = fn
}

function insertImageMarkdown(view: EditorView, altText: string, src: string) {
  const cursor = view.state.selection.main.head
  const md = `![${altText}](${src})`
  view.dispatch({
    changes: { from: cursor, insert: md },
    selection: { anchor: cursor + md.length },
  })
}

export async function handleImageDrop(view: EditorView, event: DragEvent): Promise<boolean> {
  const files = event.dataTransfer?.files
  if (!files || files.length === 0) return false

  const imageFiles = Array.from(files).filter((f) => IMAGE_EXTENSIONS.test(f.name))
  if (imageFiles.length === 0) return false

  event.preventDefault()

  const docPath = getCurrentFile()
  if (!docPath) {
    alert('Please save the document first to enable image insertion.')
    return true
  }

  for (const file of imageFiles) {
    const filePath = (file as any).path as string
    if (!filePath) continue

    try {
      const result = await window.electronAPI.copyImageToAssets(filePath, docPath)
      const alt = file.name.replace(/\.[^.]+$/, '')
      insertImageMarkdown(view, alt, result.markdownPath)
    } catch (err) {
      console.error('Failed to insert dropped image:', err)
    }
  }

  return true
}

export async function handleImagePaste(view: EditorView): Promise<boolean> {
  const docPath = getCurrentFile()
  if (!docPath) return false

  try {
    const result = await window.electronAPI.pasteClipboardImage(docPath)
    if (result) {
      insertImageMarkdown(view, 'image', result.markdownPath)
      return true
    }
  } catch (err) {
    console.error('Failed to paste image:', err)
  }

  return false
}

export async function insertImageFromDialog(view: EditorView): Promise<void> {
  const docPath = getCurrentFile()
  const imagePath = await window.electronAPI.openImageDialog()
  if (!imagePath) return

  if (docPath) {
    try {
      const result = await window.electronAPI.copyImageToAssets(imagePath, docPath)
      const alt = imagePath.split('/').pop()?.replace(/\.[^.]+$/, '') || 'image'
      insertImageMarkdown(view, alt, result.markdownPath)
    } catch (err) {
      console.error('Failed to insert image:', err)
    }
  } else {
    const alt = imagePath.split('/').pop()?.replace(/\.[^.]+$/, '') || 'image'
    insertImageMarkdown(view, alt, imagePath)
  }
}
