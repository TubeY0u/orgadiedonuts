# Live-Sync einrichten (Supabase) — Schritt für Schritt

Damit Einträge **sofort bei allen** erscheinen, brauchst du ein kostenloses
Supabase-Projekt. Einmalig ~10 Minuten. Danach trägst du 2 Werte ein, pushst,
fertig. Bis dahin läuft das Portal im Lokal-Modus normal weiter.

---

## 1) Projekt anlegen
1. Auf **https://supabase.com** → *Start your project* → mit GitHub/E-Mail einloggen.
2. **New project**: Name z.B. `diedonuts`, ein **Datenbank-Passwort** vergeben
   (irgendwo notieren – wird hier nicht gebraucht, aber von Supabase verlangt),
   Region **Frankfurt (eu-central-1)**. *Create new project* (1–2 Min warten).

## 2) Datenbank-Tabelle + Rechte anlegen
1. Linkes Menü → **SQL Editor** → *New query*.
2. Folgendes komplett einfügen und **Run** klicken:

```sql
create table if not exists public.portal (
  key        text primary key,
  data       jsonb,
  updated_at timestamptz default now(),
  updated_by text
);

alter table public.portal enable row level security;

create policy "read for logged in"   on public.portal
  for select using (auth.uid() is not null);
create policy "insert for logged in" on public.portal
  for insert with check (auth.uid() is not null);
create policy "update for logged in" on public.portal
  for update using (auth.uid() is not null);
create policy "delete for logged in" on public.portal
  for delete using (auth.uid() is not null);

alter publication supabase_realtime add table public.portal;
```

Es muss „Success. No rows returned" erscheinen.

## 3) Login ohne E-Mail-Bestätigung (einfacher)
1. Linkes Menü → **Authentication** → **Sign In / Providers** → **Email**.
2. **„Confirm email"** ausschalten (Toggle off) → **Save**.
   (Sonst müsste jeder erst eine Bestätigungsmail anklicken.)
3. Optional, wenn nur DU Accounts vergeben willst: unter
   **Authentication → Sign In / Providers → Email** später
   **„Allow new users to sign up"** ausschalten — *erst nachdem*
   alle Team-Konten registriert sind.

## 4) Zugangsdaten ins Portal eintragen
1. Linkes Menü → **Project Settings** (Zahnrad) → **API**.
2. Du brauchst zwei Werte:
   - **Project URL** (z.B. `https://abcdxyz.supabase.co`)
   - **Project API keys** → den Schlüssel **`anon` `public`**
3. Datei **`js/supabase-config.js`** öffnen und die 2 Zeilen ausfüllen:

```js
window.SUPABASE_URL      = "https://abcdxyz.supabase.co";
window.SUPABASE_ANON_KEY = "eyJhbGciOi...DEIN_LANGER_KEY...";
```

> Der `anon`-Key darf öffentlich sein – ohne Login (Schritt 3) kommt damit
> niemand an die Daten.

## 5) Hochladen
Im Projektordner:

```
git add -A
git commit -m "Supabase Live-Sync aktiviert"
git push
```

## 6) Konten anlegen & testen
1. Seite öffnen → es erscheint der **Login-Screen**.
2. Beim ersten Mal **„Neues Konto registrieren"** (E-Mail + Passwort).
3. Jede Person im Team registriert sich einmal (oder du legst die Konten
   in Supabase unter *Authentication → Users → Add user* an).
4. Test: An einem Gerät einen Termin eintragen → erscheint auf einem
   anderen Gerät **innerhalb 1–2 Sek** automatisch.
   Unten rechts zeigt **„● Live · synchron"** den Status.

---

### Wie es funktioniert
- Jede Änderung (Termine, Strats, Roster, Stratbook-Zeichnungen …) wird
  weiterhin lokal gespeichert **und** sofort in die Cloud geschrieben.
- Alle eingeloggten Geräte bekommen Änderungen per Echtzeit-Abo.
- Kein Internet? Es wird lokal weitergearbeitet; **Export/Import** (Backup-Button)
  bleibt als zusätzliche Sicherung erhalten.
- Lokal-Modus (Platzhalter in der Config) = altes Verhalten, kein Sync.

### Häufige Fehler
- *„Invalid API key"* → falscher/halber `anon`-Key kopiert.
- Login-Fehler *„Email not confirmed"* → Schritt 3 (Confirm email aus).
- Nichts synchronisiert → in Supabase **SQL Editor** Schritt 2 erneut prüfen
  (besonders die letzte `alter publication …`-Zeile für Realtime).
