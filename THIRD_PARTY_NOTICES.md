# Third-Party Notices

Markz is distributed under the MIT License. It includes or depends on the following third-party software.

## Runtime dependencies

| Package | License | Purpose |
|---------|---------|---------|
| [Electron](https://www.electronjs.org/) | MIT | Desktop application shell |
| [CodeMirror 6](https://codemirror.net/) (@codemirror/*) | MIT | Editor core and extensions |
| [KaTeX](https://katex.org/) | MIT | Math rendering |
| [Mermaid](https://mermaid.js.org/) | MIT | Diagram rendering |
| [highlight.js](https://highlightjs.org/) | BSD-3-Clause | Syntax highlighting |
| [markdown-it](https://github.com/markdown-it/markdown-it) | MIT | Export pipeline Markdown parsing |

## Build tooling

| Package | License | Purpose |
|---------|---------|---------|
| [Vite](https://vitejs.dev/) | MIT | Renderer bundler |
| [esbuild](https://esbuild.github.io/) | MIT | Main/preload bundler |
| [TypeScript](https://www.typescriptlang.org/) | Apache-2.0 | Type checking |
| [electron-builder](https://www.electron.build/) | MIT | Application packaging |

## Full dependency tree

For a complete list of transitive licenses, run from the project root:

```bash
npm install
npx license-checker --production --summary
```

## Attribution

When redistributing Markz binaries, include this file alongside the MIT `LICENSE` and preserve copyright notices from bundled open-source components as required by their respective licenses.
