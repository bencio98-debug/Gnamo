// Piccola festa di dopamina: coriandoli + numeretto "+punti" che sale.
// Tutto fatto a mano, nessuna libreria.

const COLORS = ['#ff5a6e', '#ffc24b', '#33d69f', '#6c7bff', '#b98bff', '#8b97ff']

// Esplosione di coriandoli dal punto (x, y) in pixel dello schermo.
// power > 1 = festa più grande (es. ultima cosa della giornata).
export function burst(x, y, power = 1) {
  const n = Math.round(22 * power)
  const layer = document.createElement('div')
  layer.className = 'confetti-layer'
  document.body.appendChild(layer)

  const pieces = []
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div')
    el.className = 'confetti-piece'
    el.style.background = COLORS[i % COLORS.length]
    layer.appendChild(el)
    const angle = Math.random() * Math.PI * 2
    const speed = 4 + Math.random() * 6 * power
    pieces.push({
      el,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6,
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 24,
      life: 0,
    })
  }

  const gravity = 0.35
  let frame = 0
  function step() {
    frame++
    let alive = false
    for (const p of pieces) {
      p.vy += gravity
      p.x += p.vx
      p.y += p.vy
      p.rot += p.vr
      p.life++
      const opacity = Math.max(0, 1 - p.life / 64)
      if (opacity > 0) alive = true
      p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg)`
      p.el.style.opacity = opacity
    }
    if (alive && frame < 90) requestAnimationFrame(step)
    else layer.remove()
  }
  requestAnimationFrame(step)
}

// Scritta gigante al centro dello schermo: incoraggiamento in stampatello.
export function hype(text) {
  const el = document.createElement('div')
  el.className = 'hype'
  el.textContent = text
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 1300)
}

// Numeretto "+15" che sale e svanisce partendo da (x, y).
export function scorePop(x, y, text) {
  const el = document.createElement('div')
  el.className = 'score-pop'
  el.textContent = text
  el.style.left = x + 'px'
  el.style.top = y + 'px'
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 1000)
}
