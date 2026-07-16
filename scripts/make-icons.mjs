// Genera le icone PNG dell'app da scripts/icon.svg.
// Uso: node scripts/make-icons.mjs
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const SIZES = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 180, name: 'apple-touch-icon.png' }, // quella che usa iPhone sulla Home
]

mkdirSync('public/icons', { recursive: true })

for (const { size, name } of SIZES) {
  await sharp('scripts/icon.svg').resize(size, size).png().toFile(`public/icons/${name}`)
  console.log('creata', name, size + 'x' + size)
}
