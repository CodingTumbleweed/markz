import { build } from 'esbuild'
import { createServer } from 'vite'
import { spawn } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const esbuildCommon = {
  bundle: true,
  platform: 'node',
  target: 'node20',
  external: ['electron'],
  format: 'cjs',
  sourcemap: true,
}

await Promise.all([
  build({
    ...esbuildCommon,
    entryPoints: [resolve(root, 'src/main/index.ts')],
    outfile: resolve(root, 'dist/main/index.js'),
  }),
  build({
    ...esbuildCommon,
    entryPoints: [resolve(root, 'src/preload/index.ts')],
    outfile: resolve(root, 'dist/preload/index.js'),
  }),
])
console.log('✓ Main + preload built')

const viteServer = await createServer({
  configFile: resolve(root, 'vite.config.ts'),
})
await viteServer.listen()

const address = viteServer.httpServer.address()
const port = typeof address === 'object' ? address.port : 5173
const url = `http://localhost:${port}`
console.log(`✓ Vite dev server: ${url}`)

const electronPath = require('electron')
const env = { ...process.env, VITE_DEV_SERVER_URL: url }
delete env.ELECTRON_RUN_AS_NODE

const electronProcess = spawn(electronPath, [resolve(root, 'dist/main/index.js')], {
  stdio: 'inherit',
  env,
})

electronProcess.on('close', (code) => {
  viteServer.close()
  process.exit(code ?? 0)
})

process.on('SIGINT', () => {
  electronProcess.kill()
  viteServer.close()
  process.exit(0)
})
