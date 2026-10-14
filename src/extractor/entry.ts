// IIFE entry injected with chrome.scripting.executeScript({ files: ['extractor.js'] }).
// In the extension it runs in the ISOLATED world, so page scripts cannot replace it.
import { extractPage } from './extract'

;(globalThis as unknown as { __tosRadarExtract: typeof extractPage }).__tosRadarExtract = extractPage
