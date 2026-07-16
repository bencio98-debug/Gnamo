import { createClient } from '@supabase/supabase-js'

// URL e chiave arrivano dal file .env (protetto da .gitignore).
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_KEY

// Se mancano le chiavi l'app continua a funzionare solo sul dispositivo.
export const supabase = url && key ? createClient(url, key) : null
export const online = !!supabase
