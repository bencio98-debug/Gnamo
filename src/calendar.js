// Genera un evento per il calendario (formato .ics standard) con una sveglia.
// Su iPhone, toccando il file, si apre il Calendario Apple che propone di aggiungerlo;
// la sveglia (VALARM) fa scattare la notifica nativa del telefono.

const REMINDER_MINUTES = 10 // sveglia 10 minuti prima

function pad(n) {
  return String(n).padStart(2, '0')
}

// "2026-07-15" + "15:00" -> "20260715T150000" (ora locale, "floating": la interpreta
// il calendario del dispositivo come ora locale).
function toStamp(y, m, d, hh, mm) {
  return `${y}${pad(m)}${pad(d)}T${pad(hh)}${pad(mm)}00`
}

function startStamp(dateISO, timeHHMM) {
  const [y, m, d] = dateISO.split('-').map(Number)
  const [hh, mm] = timeHHMM.split(':').map(Number)
  return toStamp(y, m, d, hh, mm)
}

function endStamp(dateISO, timeHHMM, durationMin = 30) {
  const [y, m, d] = dateISO.split('-').map(Number)
  const [hh, mm] = timeHHMM.split(':').map(Number)
  const dt = new Date(y, m - 1, d, hh, mm)
  dt.setMinutes(dt.getMinutes() + durationMin)
  return toStamp(dt.getFullYear(), dt.getMonth() + 1, dt.getDate(), dt.getHours(), dt.getMinutes())
}

// Momento attuale in UTC (obbligatorio nel formato .ics come DTSTAMP).
function nowUTCStamp() {
  const d = new Date()
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  )
}

// Caratteri speciali da proteggere nel testo secondo lo standard .ics.
function esc(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

export function buildICS(task) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Gnamo//Impegni//IT',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    'UID:' + task.id + '@gnamo',
    'DTSTAMP:' + nowUTCStamp(),
    'DTSTART:' + startStamp(task.date, task.time),
    'DTEND:' + endStamp(task.date, task.time),
    'SUMMARY:' + esc(task.title),
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:' + esc(task.title),
    'TRIGGER:-PT' + REMINDER_MINUTES + 'M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  // Lo standard vuole le righe separate da CRLF.
  return lines.join('\r\n')
}

// Consegna l'evento al calendario del dispositivo. Va chiamata dentro un tocco
// dell'utente (così iOS mostra la schermata "Aggiungi al calendario").
export function addToCalendar(task) {
  const ics = buildICS(task)
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = (task.title || 'impegno').replace(/[^\w-]+/g, '_').slice(0, 40) + '.ics'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
