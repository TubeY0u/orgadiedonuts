/* ═══════════════════════════════════════════════════════════════
   Supabase-Zugangsdaten — HIER die 2 Werte aus deinem Projekt eintragen.
   Findest du in Supabase unter:  Project Settings → API
     • Project URL      → SUPABASE_URL
     • Project API keys → "anon" "public"  → SUPABASE_ANON_KEY
   Der anon-Key ist absichtlich öffentlich (durch Login/RLS geschützt).
   Nach dem Eintragen Datei speichern und per git push hochladen.
   Solange hier die Platzhalter stehen, läuft das Portal im
   Lokal-Modus (nur dieser Browser, kein Live-Sync).
   ═══════════════════════════════════════════════════════════════ */
window.SUPABASE_URL      = "https://jsofqqcpyjmivehxxora.supabase.co";
window.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzb2ZxcWNweWptaXZlaHh4b3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMzE5NDgsImV4cCI6MjA5NDYwNzk0OH0.hygylZaG4eEU3KvlGof1XL4L7r9Xe5ElO7KPVZDwfxc";

/* ─── Owner / Admin ────────────────────────────────────────────
   Diese E-Mails haben volle Rechte (löschen, Roster bearbeiten,
   Rollen). Alle anderen eingeloggten = Mitglied (ansehen + eintragen
   + bearbeiten, aber NICHT löschen / Roster ändern).
   Weitere Owner: einfach mit Komma ergänzen, speichern, git push. */
window.OWNER_EMAILS = [
  "tubeyoutv23@gmail.com",
  "staudinger.l@icloud.com"
];

/* ─── Discord-Benachrichtigungen (optional) ────────────────────
   Webhook-URL aus Discord: Server-Einstellungen → Integrationen →
   Webhooks → Neuer Webhook → Webhook-URL kopieren. Leer lassen = aus.
   Dann werden neue Termine / Ergebnisse / Ankündigungen automatisch
   in den gewählten Discord-Channel gepostet. */
window.DISCORD_WEBHOOK = "";
