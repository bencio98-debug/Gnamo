// Genera le icone dell'app dal logo (scripts/logo.png).
// Uso: node scripts/make-icons.mjs
//
// Scelte fatte, e perche':
// 1) Nell'icona va SOLO il disegno (campanella + lista + spunta), senza la scritta
//    "GNAMO": a 60 px sarebbe illeggibile e ruberebbe meta' spazio al disegno.
//    iOS scrive gia' "Gnamo" sotto l'icona.
// 2) Il logo originale ha angoli arrotondati su fondo bianco. iOS arrotonda da solo:
//    quindi si ritaglia un quadrato DENTRO il logo, lontano dagli angoli bianchi.
//    Ritagliare (invece di rimontare il disegno su uno sfondo nuovo) tiene la
//    sfumatura originale continua, senza il riquadro visibile della toppa.
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const SORGENTE = 'scripts/logo.png' // 1254x1254

// Quadrato scelto sulle misure reali dei pixel:
// - il disegno sta in x 342..1048, y 129..784  -> ci sta dentro con margine
// - la scritta "GNAMO" parte da y=845          -> restiamo sopra
// - gli angoli sono stati verificati: viola pieno, niente bianco
const RITAGLIO = { left: 310, top: 60, width: 770, height: 770 }

const master = await sharp(SORGENTE).extract(RITAGLIO).png().toBuffer()

const MISURE = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 180, name: 'apple-touch-icon.png' }, // quella che usa iPhone sulla Home
]

mkdirSync('public/icons', { recursive: true })
for (const { size, name } of MISURE) {
  await sharp(master).resize(size, size).png().toFile(`public/icons/${name}`)
  console.log('creata', name, size + 'x' + size)
}

// Logo intero (con la scritta) per usarlo DENTRO l'app, dove c'e' spazio.
await sharp(SORGENTE).resize(512, 512).png().toFile('public/logo.png')
console.log('creato', 'public/logo.png', '512x512 (logo intero con scritta)')
