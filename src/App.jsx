import { useEffect, useMemo, useState } from 'react'
import {
  loadTasks,
  saveTasks,
  newTask,
  sortTasks,
  todayISO,
  addDaysISO,
  dayLabel,
  loadLog,
  saveLog,
  makeEvent,
  computeStreak,
  computeGoals,
  fetchTasks,
  fetchLog,
  pushTask,
  pushTasks,
  removeTaskRemote,
  pushEvent,
  URGENCY,
  URGENCY_ORDER,
} from './store.js'
import { burst, scorePop, hype, fraseHypeACaso } from './celebrate.js'
import { addToCalendar } from './calendar.js'

function todayHeader() {
  const d = new Date()
  const s = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function App() {
  // Si parte dalla copia locale (l'app si apre subito), poi arriva quella online.
  const [tasks, setTasks] = useState(loadTasks)
  const [log, setLog] = useState(loadLog)
  const [synced, setSynced] = useState(false)
  const [pulse, setPulse] = useState(0)
  const [view, setView] = useState('oggi') // 'oggi' | 'goals'
  const [adding, setAdding] = useState(false) // il modulo si apre solo quando serve
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [urgency, setUrgency] = useState('calm')
  const [date, setDate] = useState(todayISO())

  // All'avvio scarichiamo la versione online (se c'è rete).
  useEffect(() => {
    let annullato = false
    ;(async () => {
      const [remoteTasks, remoteLog] = await Promise.all([fetchTasks(), fetchLog()])
      if (annullato) return
      if (remoteTasks) setTasks(remoteTasks)
      if (remoteLog) setLog(remoteLog)
      if (remoteTasks && remoteLog) setSynced(true)
    })()
    return () => {
      annullato = true
    }
  }, [])

  // Copia di scorta sul dispositivo, per aprire l'app anche offline.
  useEffect(() => {
    saveTasks(tasks)
  }, [tasks])

  useEffect(() => {
    saveLog(log)
  }, [log])

  const goals = useMemo(() => computeGoals(log), [log])
  const streak = useMemo(() => computeStreak(log), [log])

  const today = todayISO()

  // Divido gli impegni in: "in arrivo" (giorni futuri, non fatti) e "oggi"
  // (tutto il resto: oggi, in ritardo, e i fatti).
  const { focusTask, todayList, upcomingList } = useMemo(() => {
    const sorted = sortTasks(tasks)
    const upcoming = sorted.filter((t) => !t.done && t.date > today)
    const now = sorted.filter((t) => t.done || t.date <= today)
    const focus = now.find((t) => t.focus && !t.done) || null
    return {
      focusTask: focus,
      todayList: now.filter((t) => t.id !== (focus && focus.id)),
      upcomingList: upcoming,
    }
  }, [tasks, today])

  const remaining = todayList.filter((t) => !t.done).length + (focusTask ? 1 : 0)

  function addTask(e) {
    e.preventDefault()
    if (!title.trim()) return
    const task = newTask({ title, time, urgency, date })
    setTasks((prev) => [...prev, task])
    pushTask(task)
    setTitle('')
    setTime('')
    setUrgency('calm')
    setDate(today)
    setAdding(false) // aggiunto: il modulo si richiude e torni alla tua giornata
  }

  function update(id, patch) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
    const current = tasks.find((t) => t.id === id)
    if (current) pushTask({ ...current, ...patch })
  }

  function toggleDone(task, e) {
    const goingDone = !task.done
    update(task.id, { done: goingDone, rewarded: task.rewarded || goingDone })

    // Premio solo la prima volta che un impegno viene completato (niente farming).
    if (goingDone && !task.rewarded) {
      const event = makeEvent(task)
      setLog((prev) => [...prev, event])
      pushEvent(event)
      setPulse((p) => p + 1)

      // Ultima cosa rimasta per oggi? Festa più grande.
      const undoneToday = tasks.filter((t) => !t.done && t.date <= today).length
      const big = undoneToday <= 1

      const rect = e.currentTarget.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2
      burst(x, y, big ? 2.4 : 1)
      scorePop(x, y, '+1')
      hype(fraseHypeACaso())
    }
  }

  function toggleFocus(id) {
    // Solo una "cosa di oggi" per volta: attivandone una, spengo le altre.
    const target = tasks.find((t) => t.id === id)
    if (!target) return
    const acceso = !target.focus
    const cambiati = []
    const next = tasks.map((t) => {
      if (t.id === id) {
        const n = { ...t, focus: acceso }
        cambiati.push(n)
        return n
      }
      if (t.focus) {
        const n = { ...t, focus: false }
        cambiati.push(n)
        return n
      }
      return t
    })
    setTasks(next)
    pushTasks(cambiati)
  }

  function postpone(id) {
    update(id, { date: addDaysISO(today, 1), focus: false })
  }

  function pullToToday(id) {
    update(id, { date: today })
  }

  function removeTask(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    removeTaskRemote(id)
  }

  const itemProps = { toggleDone, toggleFocus, postpone, pullToToday, removeTask }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-row">
          <h1>Gnamo</h1>
          <div className="scoreboard" key={pulse}>
            <span className="sb-points">🏆 {goals.total}</span>
            {streak > 0 && <span className="sb-streak">🔥 {streak}</span>}
            <span className="sb-today">✅ {goals.today} oggi</span>
          </div>
        </div>
        <p className="today">
          {todayHeader()}
          <span className={'sync' + (synced ? ' sync-on' : '')}>
            {synced ? '☁️ sincronizzato' : '⏳ solo su questo dispositivo'}
          </span>
        </p>
      </header>

      <nav className="tabs">
        <button
          className={'tab' + (view === 'oggi' ? ' tab-on' : '')}
          onClick={() => setView('oggi')}
        >
          Oggi
        </button>
        <button
          className={'tab' + (view === 'goals' ? ' tab-on' : '')}
          onClick={() => setView('goals')}
        >
          🏆 Traguardi
        </button>
      </nav>

      {view === 'goals' ? (
        <GoalsView goals={goals} streak={streak} />
      ) : (
        <>
          <OggiView {...{ focusTask, todayList, upcomingList, remaining, tasks, itemProps }} />

          <button className="fab" onClick={() => setAdding(true)} aria-label="Aggiungi impegno">
            +
          </button>

          {adding && (
            <AddSheet
              {...{
                addTask,
                title,
                setTitle,
                date,
                setDate,
                time,
                setTime,
                urgency,
                setUrgency,
              }}
              onClose={() => setAdding(false)}
            />
          )}
        </>
      )}
    </div>
  )
}

// Il modulo di aggiunta: un pannello che sale dal basso, aperto solo quando serve.
function AddSheet({ addTask, title, setTitle, date, setDate, time, setTime, urgency, setUrgency, onClose }) {
  return (
    <div className="sheet-back" onClick={onClose}>
      <form className="sheet" onSubmit={addTask} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        <input
          className="add-title"
          type="text"
          placeholder="Cosa devi fare?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />

        <div className="urgency-pick" role="group" aria-label="Urgenza">
          {URGENCY_ORDER.map((key) => (
            <button
              type="button"
              key={key}
              className={'chip' + (urgency === key ? ' chip-on' : '')}
              onClick={() => setUrgency(key)}
            >
              <span className={'dot dot-' + key} />
              {URGENCY[key].label}
            </button>
          ))}
        </div>

        <div className="add-row">
          <input
            className="add-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Giorno"
          />
          <input
            className="add-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            aria-label="Ora (facoltativa)"
          />
        </div>

        <div className="sheet-actions">
          <button className="ghost-btn" type="button" onClick={onClose}>
            Annulla
          </button>
          <button className="add-btn" type="submit">
            Aggiungi
          </button>
        </div>
      </form>
    </div>
  )
}

function OggiView({ focusTask, todayList, upcomingList, remaining, tasks, itemProps }) {
  const vuoto = tasks.length === 0

  return (
    <>
      {focusTask && (
        <section className="focus-wrap">
          <p className="section-title">👉 La cosa di oggi</p>
          <TaskItem task={focusTask} {...itemProps} highlight />
        </section>
      )}

      {vuoto ? (
        <p className="empty">Niente in lista.<br />Tocca il <b>+</b> e aggiungi la prima cosa.</p>
      ) : (
        <p className="section-title">
          {remaining === 0
            ? '🎉 Oggi tutto fatto!'
            : `📋 ${remaining} ${remaining === 1 ? 'cosa' : 'cose'} per oggi`}
        </p>
      )}

      <ul className="list">
        {todayList.map((t) => (
          <TaskItem key={t.id} task={t} {...itemProps} />
        ))}
      </ul>

      {upcomingList.length > 0 && (
        <section className="upcoming">
          <p className="section-title">🗓️ In arrivo</p>
          <ul className="list">
            {upcomingList.map((t) => (
              <TaskItem key={t.id} task={t} {...itemProps} upcoming />
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

function GoalsView({ goals, streak }) {
  const judged = goals.onTime + goals.late
  const onTimePct = judged > 0 ? Math.round((goals.onTime / judged) * 100) : null
  const importantPct = goals.total > 0 ? Math.round((goals.important / goals.total) * 100) : 0

  return (
    <section className="goals">
      <div className="goal-hero">
        <span className="goal-big">{goals.total}</span>
        <span className="goal-cap">obiettivi raggiunti in tutto 💪</span>
      </div>

      <div className="goal-grid">
        <div className="goal-card">
          <b>{goals.week}</b>
          <span>questa settimana</span>
        </div>
        <div className="goal-card">
          <b>{goals.year}</b>
          <span>quest'anno</span>
        </div>
        <div className="goal-card">
          <b>⭐ {goals.important}</b>
          <span>importanti ({importantPct}%)</span>
        </div>
        <div className="goal-card">
          <b>🔥 {streak}</b>
          <span>giorni di fila</span>
        </div>
      </div>

      <div className="goal-improve">
        <p className="section-title">Puntualità — punto di miglioramento</p>
        {judged === 0 ? (
          <p className="goal-hint">Completa il primo obiettivo per vedere qui le tue statistiche.</p>
        ) : (
          <>
            <div className="ptime-bar">
              <div className="ptime-fill" style={{ width: onTimePct + '%' }} />
            </div>
            <div className="ptime-legend">
              <span className="pt-ontime">⚡ {goals.onTime} in tempo</span>
              <span className="pt-late">🐌 {goals.late} in ritardo</span>
            </div>
            <p className="goal-hint">
              {onTimePct}% fatti in tempo.{' '}
              {onTimePct >= 80
                ? 'Sei una macchina, continua così!'
                : onTimePct >= 50
                ? 'Bene, e c’è margine per anticiparsi ancora un po’.'
                : 'Proviamo a prenderne di più prima che scadano 😉'}
            </p>
          </>
        )}
      </div>
    </section>
  )
}

function TaskItem({ task: t, toggleDone, toggleFocus, postpone, pullToToday, removeTask, highlight, upcoming }) {
  const overdue = !t.done && !upcoming && t.date < todayISO()
  return (
    <li
      className={
        'item urg-' + t.urgency + (t.done ? ' done' : '') + (highlight ? ' focus-item' : '')
      }
    >
      <button
        className="check"
        onClick={(e) => toggleDone(t, e)}
        aria-label={t.done ? 'Segna da fare' : 'Segna fatto'}
      >
        {t.done ? '✓' : ''}
      </button>
      <div className="item-main">
        <span className="item-title">{t.title}</span>
        <span className="item-meta">
          {/* L'urgenza si legge dalla striscia colorata: qui basta il pallino, senza ripetere la frase */}
          <span className={'dot dot-' + t.urgency} title={URGENCY[t.urgency].label} />
          {t.time && <span className="item-time">{t.time}</span>}
          {upcoming && <span className="item-day">{dayLabel(t.date)}</span>}
          {overdue && <span className="item-late">in ritardo</span>}
        </span>
      </div>
      <div className="item-actions">
        {!t.done && t.time && (
          <button
            className="cal"
            onClick={() => addToCalendar(t)}
            aria-label="Aggiungi al calendario"
            title="Aggiungi al calendario (con sveglia)"
          >
            📅
          </button>
        )}
        {!t.done && (
          <button
            className={'star' + (t.focus ? ' star-on' : '')}
            onClick={() => toggleFocus(t.id)}
            aria-label="La cosa di oggi"
            title="La cosa di oggi"
          >
            {t.focus ? '⭐' : '☆'}
          </button>
        )}
        {!t.done && !upcoming && (
          <button className="move" onClick={() => postpone(t.id)} aria-label="Rimando a domani">
            Domani →
          </button>
        )}
        {!t.done && upcoming && (
          <button className="move" onClick={() => pullToToday(t.id)} aria-label="Riporta a oggi">
            ← Oggi
          </button>
        )}
        <button className="del" onClick={() => removeTask(t.id)} aria-label="Elimina">
          ✕
        </button>
      </div>
    </li>
  )
}
