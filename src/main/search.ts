import { collectAllFiles, readFile } from './fileSystem'
import type { SearchMatch } from '../shared/types'

const MAX_RESULTS = 100

export function searchWorkspace(root: string, query: string): SearchMatch[] {
  const q = query.trim()
  if (!q) return []

  const needle = q.toLowerCase()
  const files = collectAllFiles(root)
  const results: SearchMatch[] = []

  for (const filePath of files) {
    if (results.length >= MAX_RESULTS) break

    let content: string
    try {
      content = readFile(filePath)
    } catch {
      continue
    }

    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      if (results.length >= MAX_RESULTS) break

      const line = lines[i]
      const idx = line.toLowerCase().indexOf(needle)
      if (idx < 0) continue

      let offset = 0
      for (let j = 0; j < i; j++) {
        offset += lines[j].length + 1
      }
      offset += idx

      results.push({
        filePath,
        line: i + 1,
        column: idx + 1,
        preview: line.trim().slice(0, 120),
        offset,
        matchLength: q.length,
      })
    }
  }

  return results
}
