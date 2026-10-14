// Generates toolbar icons from an inline SVG (run once; PNGs are committed).
import sharp from 'sharp'
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
<rect width="128" height="128" rx="28" fill="#23423a"/>
<path d="M30 22h50l18 18v66H30z" fill="#fbfaf7"/>
<path d="M80 22v18h18" fill="#d9d3c6"/>
<rect x="42" y="50" width="44" height="6" rx="3" fill="#23423a"/>
<rect x="42" y="64" width="34" height="6" rx="3" fill="#23423a"/>
<rect x="42" y="78" width="40" height="6" rx="3" fill="#b3261e"/>
<circle cx="92" cy="94" r="20" fill="#e0a54a" stroke="#23423a" stroke-width="6"/>
<rect x="89" y="82" width="6" height="14" rx="3" fill="#23423a"/><circle cx="92" cy="103" r="3.5" fill="#23423a"/>
</svg>`
for (const s of [16, 32, 48, 128]) await sharp(Buffer.from(svg)).resize(s, s).png().toFile(`src/extension/icons/icon${s}.png`)
console.log('icons written')
