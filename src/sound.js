// Suono di completamento, generato al volo con la Web Audio API.
// Niente file audio da caricare: due note brevi e allegre (un "ding-dong" salendo).
//
// Nota iPhone: il suono web parte solo dentro un tocco dell'utente (qui è così,
// perché suona quando spunti un impegno) e rispetta l'interruttore Silenzioso del
// telefono — se il telefono è in silenzioso, non suona. È normale.

let ctx = null

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

export function playDing() {
  const ac = getCtx()
  if (!ac) return
  const now = ac.currentTime
  // A5 e poi C#6 (una terza maggiore sopra): suona "positivo".
  const note = [
    { freq: 880.0, at: 0 },
    { freq: 1108.73, at: 0.09 },
  ]
  for (const n of note) {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'triangle'
    osc.frequency.value = n.freq
    osc.connect(gain)
    gain.connect(ac.destination)
    const t0 = now + n.at
    gain.gain.setValueAtTime(0, t0)
    gain.gain.linearRampToValueAtTime(0.22, t0 + 0.012) // attacco morbido
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.32) // coda che sfuma
    osc.start(t0)
    osc.stop(t0 + 0.34)
  }
}

// Preferenza on/off (di default acceso), salvata sul dispositivo.
const KEY = 'gnamo_sound'
export function isSoundOn() {
  return localStorage.getItem(KEY) !== 'off'
}
export function setSoundOn(on) {
  localStorage.setItem(KEY, on ? 'on' : 'off')
}
