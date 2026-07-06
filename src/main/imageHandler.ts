import { dialog, BrowserWindow, clipboard, nativeImage } from 'electron'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export interface ImageInsertResult {
  markdownPath: string
  absolutePath: string
}

export async function openImageDialog(win: BrowserWindow): Promise<string | null> {
  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'] },
    ],
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
}

export function copyImageToAssetsFolder(
  imagePath: string,
  documentPath: string,
  assetsFolder: string = './assets',
): ImageInsertResult {
  const docDir = path.dirname(documentPath)
  const targetDir = path.resolve(docDir, assetsFolder)

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }

  const fileName = path.basename(imagePath)
  let targetPath = path.join(targetDir, fileName)

  if (fs.existsSync(targetPath) && targetPath !== imagePath) {
    const ext = path.extname(fileName)
    const base = path.basename(fileName, ext)
    const hash = crypto.randomBytes(4).toString('hex')
    targetPath = path.join(targetDir, `${base}-${hash}${ext}`)
  }

  if (targetPath !== imagePath) {
    fs.copyFileSync(imagePath, targetPath)
  }

  const relativePath = path.relative(docDir, targetPath).split(path.sep).join('/')

  return {
    markdownPath: relativePath,
    absolutePath: targetPath,
  }
}

export function saveClipboardImage(
  documentPath: string,
  assetsFolder: string = './assets',
): ImageInsertResult | null {
  const img = clipboard.readImage()
  if (img.isEmpty()) return null

  const docDir = path.dirname(documentPath)
  const targetDir = path.resolve(docDir, assetsFolder)

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }

  const timestamp = Date.now()
  const hash = crypto.randomBytes(3).toString('hex')
  const fileName = `image-${timestamp}-${hash}.png`
  const targetPath = path.join(targetDir, fileName)

  fs.writeFileSync(targetPath, img.toPNG())

  const relativePath = path.relative(docDir, targetPath).split(path.sep).join('/')

  return {
    markdownPath: relativePath,
    absolutePath: targetPath,
  }
}

export function getRelativePath(imagePath: string, documentPath: string): string {
  const docDir = path.dirname(documentPath)
  return path.relative(docDir, imagePath).split(path.sep).join('/')
}
