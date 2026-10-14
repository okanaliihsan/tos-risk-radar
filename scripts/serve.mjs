// Minimal static server for dist-harness/ (used by Cypress and the DOM tests).
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist-harness')
const port = Number(process.env.PORT ?? 4173)
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.map': 'application/json' }

export function startServer(p = port) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://x')
    let file = path.normalize(path.join(root, decodeURIComponent(url.pathname)))
    if (!file.startsWith(root)) {
      res.writeHead(403).end()
      return
    }
    if (url.pathname.endsWith('/')) file = path.join(file, 'index.html')
    try {
      const body = await readFile(file)
      res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' }).end(body)
    } catch {
      res.writeHead(404).end('not found')
    }
  })
  return new Promise((resolve) => server.listen(p, '127.0.0.1', () => resolve(server)))
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  await startServer()
  console.log(`harness: http://127.0.0.1:${port}/`)
}
