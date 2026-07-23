// I dati stanno su Supabase (sincronizzati fra telefono e computer).
// Il salvataggio locale resta come copia di scorta: se sei offline vedi comunque
// l'ultima versione, e l'app si apre subito senza aspettare la rete.

import { supabase } from './supabase.js'

const KEY = 'gnamo_tasks'

// Livelli di urgenza, dal più al meno urgente. L'ordine qui definisce anche
// l'ordinamento nella lista.
export const URGENCY = {
  urgent: { label: 'Alza il culo e fallo ora', emoji: '🔴', rank: 0 },
  soon: { label: 'Appena hai un buco fallo', emoji: '🟡', rank: 1 },
  calm: { label: 'Così me lo ricordo', emoji: '⚪', rank: 2 },
}
export const URGENCY_ORDER = ['urgent', 'soon', 'calm']

// --- Date (in formato "AAAA-MM-GG", ora locale) ---
export function todayISO() {
  return toISO(new Date())
}

function toISO(d) {
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

export function addDaysISO(iso, n) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return toISO(d)
}

// Etichetta amichevole per un giorno: "Oggi", "Domani", "Ieri", oppure "Gio 16 lug".
export function dayLabel(iso) {
  const t = todayISO()
  if (iso === t) return 'Oggi'
  if (iso === addDaysISO(t, 1)) return 'Domani'
  if (iso === addDaysISO(t, -1)) return 'Ieri'
  const d = new Date(iso + 'T00:00:00')
  const s = d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function loadTasks() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const list = JSON.parse(raw)
    if (!Array.isArray(list)) return []
    // Backfill: gli impegni salvati prima della Fetta 2 non hanno giorno/focus.
    const t = todayISO()
    return list.map((task) => ({
      focus: false,
      date: t,
      ...task,
    }))
  } catch {
    return []
  }
}

export function saveTasks(tasks) {
  localStorage.setItem(KEY, JSON.stringify(tasks))
}

export function newTask({ title, time, urgency, date }) {
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    time: time || null, // formato "HH:MM" oppure null
    urgency: urgency || 'calm',
    date: date || todayISO(), // giorno a cui appartiene l'impegno
    focus: false, // "la cosa di oggi"
    done: false,
    createdAt: Date.now(),
  }
}

// --- Registro dei completamenti (1 obiettivo = 1 voce) ---
const LOG_KEY = 'gnamo_done_log'

export function loadLog() {
  try {
    const raw = localStorage.getItem(LOG_KEY)
    if (!raw) return []
    const l = JSON.parse(raw)
    return Array.isArray(l) ? l : []
  } catch {
    return []
  }
}

export function saveLog(log) {
  localStorage.setItem(LOG_KEY, JSON.stringify(log))
}

// Crea la voce di registro per un obiettivo raggiunto.
// Ogni voce: { ts, important (aveva la stellina?), late (era già scaduto?) }.
export function makeEvent(task) {
  return {
    ts: Date.now(),
    important: !!task.focus,
    late: task.date < todayISO(), // completato quando era già scaduto
  }
}

// Giorno (AAAA-MM-GG) di un momento registrato.
function isoFromTs(ts) {
  return toISO(new Date(ts))
}

// Striscia di giorni di fila con almeno un obiettivo: calcolata dal registro,
// così non c'è un dato separato da tenere allineato.
export function computeStreak(log) {
  if (!log.length) return 0
  const days = new Set(log.map((e) => isoFromTs(e.ts)))
  const today = todayISO()
  const yesterday = addDaysISO(today, -1)

  let day
  if (days.has(today)) day = today
  else if (days.has(yesterday)) day = yesterday
  else return 0 // striscia spezzata

  let n = 0
  while (days.has(day)) {
    n++
    day = addDaysISO(day, -1)
  }
  return n
}

function startOfDayTs() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}
function startOfWeekTs() {
  const d = new Date()
  const dow = (d.getDay() + 6) % 7 // 0 = lunedì
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - dow)
  return d.getTime()
}
function startOfYearTs() {
  return new Date(new Date().getFullYear(), 0, 1).getTime()
}

// Statistiche per la sezione Traguardi.
export function computeGoals(log) {
  const dy = startOfDayTs()
  const wk = startOfWeekTs()
  const yr = startOfYearTs()
  let total = log.length
  let today = 0
  let week = 0
  let year = 0
  let important = 0
  let onTime = 0
  let late = 0
  for (const e of log) {
    if (e.ts >= dy) today++
    if (e.ts >= wk) week++
    if (e.ts >= yr) year++
    if (e.important) important++
    if (e.late) late++
    else onTime++
  }
  return { total, today, week, year, important, onTime, late }
}

// --- Sincronizzazione con Supabase ---
// Ogni funzione è "morbida": se la rete manca o Supabase non risponde, non fa
// esplodere l'app — restituisce null e si continua con la copia locale.

// Dal formato del database a quello dell'app.
function taskFromRow(r) {
  return {
    id: r.id,
    title: r.title,
    time: r.time || null,
    urgency: r.urgency,
    date: r.date,
    focus: !!r.focus,
    done: !!r.done,
    rewarded: !!r.rewarded,
    createdAt: Number(r.created_at),
  }
}

// Dal formato dell'app a quello del database.
function taskToRow(t) {
  return {
    id: t.id,
    title: t.title,
    time: t.time,
    urgency: t.urgency,
    date: t.date,
    focus: !!t.focus,
    done: !!t.done,
    rewarded: !!t.rewarded,
    created_at: t.createdAt,
  }
}

export async function fetchTasks() {
  if (!supabase) return null
  const { data, error } = await supabase.from('gnamo_task').select('*')
  if (error) {
    console.warn('Gnamo: impegni non scaricati', error.message)
    return null
  }
  return data.map(taskFromRow)
}

export async function fetchLog() {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('gnamo_done_log')
    .select('ts, important, late')
    .order('ts', { ascending: true })
  if (error) {
    console.warn('Gnamo: registro non scaricato', error.message)
    return null
  }
  return data.map((r) => ({ ts: Number(r.ts), important: !!r.important, late: !!r.late }))
}

export async function pushTask(task) {
  if (!supabase) return
  const { error } = await supabase.from('gnamo_task').upsert(taskToRow(task))
  if (error) console.warn('Gnamo: impegno non salvato online', error.message)
}

export async function pushTasks(tasks) {
  if (!supabase || !tasks.length) return
  const { error } = await supabase.from('gnamo_task').upsert(tasks.map(taskToRow))
  if (error) console.warn('Gnamo: impegni non salvati online', error.message)
}

export async function removeTaskRemote(id) {
  if (!supabase) return
  const { error } = await supabase.from('gnamo_task').delete().eq('id', id)
  if (error) console.warn('Gnamo: impegno non eliminato online', error.message)
}

export async function pushEvent(event) {
  if (!supabase) return
  const { error } = await supabase.from('gnamo_done_log').insert(event)
  if (error) console.warn('Gnamo: punto non salvato online', error.message)
}

// Carica online più voci del registro insieme (usato per l'auto-riparazione).
export async function pushEvents(events) {
  if (!supabase || !events.length) return
  const righe = events.map((e) => ({ ts: e.ts, important: !!e.important, late: !!e.late }))
  const { error } = await supabase.from('gnamo_done_log').insert(righe)
  if (error) console.warn('Gnamo: registro non ripristinato online', error.message)
}

// Ordina: prima i non fatti, poi per urgenza, poi per orario, poi per data di creazione.
export function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    const ru = URGENCY[a.urgency].rank - URGENCY[b.urgency].rank
    if (ru !== 0) return ru
    if (a.time && b.time && a.time !== b.time) return a.time < b.time ? -1 : 1
    if (a.time && !b.time) return -1
    if (!a.time && b.time) return 1
    return a.createdAt - b.createdAt
  })
}
