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
window.SUPABASE_URL      = "https://phyvbcapszuhpyiqpojs.supabase.co";
window.SUPABASE_ANON_KEY = "sb_publishable_C2cbt1pyhZS_NjiLlWCiVg_fo2B1kcY";

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
