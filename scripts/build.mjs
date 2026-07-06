import { build as esbuild } from 'esbuild'
import { build as viteBuild } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const esbuildCommon = {
  bundle: true,
  platform: 'node',
  target: 'node20',
  external: ['electron'],
  format: 'cjs',
  sourcemap: false,
  minify: true,
}

console.log('Building main process...')
await esbuild({
  ...esbuildCommon,
  entryPoints: [resolve(root, 'src/main/index.ts')],
  outfile: resolve(root, 'dist/main/index.js'),
})

console.log('Building preload...')
await esbuild({
  ...esbuildCommon,
  entryPoints: [resolve(root, 'src/preload/index.ts')],
  outfile: resolve(root, 'dist/preload/index.js'),
})

console.log('Building renderer...')
await viteBuild({
  configFile: resolve(root, 'vite.config.ts'),
})

console.log('✓ Build complete')
