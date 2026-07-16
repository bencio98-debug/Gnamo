-- Gnamo — tabelle dell'app impegni.
-- Da incollare nel SQL Editor di Supabase ed eseguire (Run).
-- Non tocca nessun'altra tabella del progetto: tutto ha il prefisso gnamo_.

-- Gli impegni.
create table if not exists gnamo_task (
  id text primary key,
  title text not null,
  time text,                                   -- "HH:MM" oppure vuoto
  urgency text not null default 'calm',        -- urgent | soon | calm
  date text not null,                          -- "AAAA-MM-GG": il giorno dell'impegno
  focus boolean not null default false,        -- "la cosa di oggi" (stellina)
  done boolean not null default false,
  rewarded boolean not null default false,     -- ha già dato il punto? (anti doppio conteggio)
  created_at bigint not null
);

-- Il registro degli obiettivi raggiunti (1 riga = 1 punto).
create table if not exists gnamo_done_log (
  id bigserial primary key,
  ts bigint not null,                          -- quando è stato completato
  important boolean not null default false,    -- aveva la stellina
  late boolean not null default false          -- era già scaduto
);

-- Accesso: app personale a utente singolo, senza login.
alter table gnamo_task enable row level security;
alter table gnamo_done_log enable row level security;

drop policy if exists gnamo_task_all on gnamo_task;
drop policy if exists gnamo_done_log_all on gnamo_done_log;

create policy gnamo_task_all on gnamo_task for all using (true) with check (true);
create policy gnamo_done_log_all on gnamo_done_log for all using (true) with check (true);
