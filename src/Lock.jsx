import { useState } from 'react'

// Codice d'accesso dell'app. Per cambiarlo basta modificare questa riga.
// NOTA: non è una vera password — viaggia dentro l'app, quindi non usare
// un codice che usi anche altrove. Serve a tenere fuori i curiosi, non gli esperti.
const ACCESS_CODE = '150698'

const OK_KEY = 'gnamo_ok'

export function isUnlocked() {
  return localStorage.getItem(OK_KEY) === '1'
}

export default function Lock({ onUnlock }) {
  const [code, setCode] = useState('')
  const [wrong, setWrong] = useState(false)

  function submit(e) {
    e.preventDefault()
    if (code === ACCESS_CODE) {
      localStorage.setItem(OK_KEY, '1')
      onUnlock()
    } else {
      setWrong(true)
      setCode('')
      setTimeout(() => setWrong(false), 600)
    }
  }

  return (
    <div className="lock">
      <form className={'lock-card' + (wrong ? ' shake' : '')} onSubmit={submit}>
        <img className="lock-logo" src="/logo.png" alt="Gnamo" width="150" height="150" />
        <p className="lock-sub">Inserisci il codice</p>
        <input
          className="lock-input"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          aria-label="Codice"
          autoFocus
        />
        <button className="lock-btn" type="submit">
          Entra
        </button>
        {wrong && <p className="lock-err">Codice sbagliato</p>}
      </form>
    </div>
  )
}
