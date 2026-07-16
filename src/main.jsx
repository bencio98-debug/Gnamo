import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Lock, { isUnlocked } from './Lock.jsx'
import './index.css'

// Finché non si sblocca, l'app (e i suoi dati) non viene nemmeno caricata.
function Root() {
  const [unlocked, setUnlocked] = useState(isUnlocked)
  if (!unlocked) return <Lock onUnlock={() => setUnlocked(true)} />
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
