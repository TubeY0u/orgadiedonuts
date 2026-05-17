/* ═══════════════════════════════════════════════════════════════
   DieDonuts · Cloud-Sync (Supabase) + Login
   - Echte Logins (E-Mail/Passwort)
   - Live-Sync: jede Änderung (dnd_*) landet sofort bei allen
   - localStorage bleibt Offline-Puffer, Export/Import bleibt Backup
   - Ohne ausgefüllte supabase-config.js → automatischer Lokal-Modus
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var URL = window.SUPABASE_URL || '';
  var KEY = window.SUPABASE_ANON_KEY || '';
  var CONFIGURED = URL && KEY &&
    URL.indexOf('DEIN_') === -1 && KEY.indexOf('DEIN_') === -1 &&
    URL.indexOf('http') === 0;

  var TABLE = 'portal';
  var PREFIX = 'dnd_';

  // Original-Setter merken (für Remote-Anwenden ohne Re-Push)
  var rawSet = localStorage.setItem.bind(localStorage);
  var rawRemove = localStorage.removeItem.bind(localStorage);

  var client = null;
  var pushEnabled = false;
  var pushTimers = {};
  var renderTimer = null;
  var userEmail = '';
  var OWNERS = (window.OWNER_EMAILS || []).map(function (e) { return String(e).toLowerCase().trim(); });

  function applyRole(email) {
    var isOwner = !email || OWNERS.indexOf(String(email).toLowerCase().trim()) > -1;
    var role = isOwner ? 'owner' : 'member';
    window.PORTAL_ROLE = role;
    window.PORTAL_EMAIL = email || '';
    document.body.classList.remove('role-owner', 'role-member');
    document.body.classList.add('role-' + role);
    return role;
  }
  // Standard bis Login geklärt: voll (z.B. Lokal-Modus = Owner)
  applyRole('');

  /* ── localStorage-Hook: dnd_* Schreibzugriffe abfangen ───── */
  localStorage.setItem = function (k, v) {
    rawSet(k, v);
    if (CONFIGURED && pushEnabled && k.indexOf(PREFIX) === 0) schedulePush(k);
  };
  localStorage.removeItem = function (k) {
    rawRemove(k);
    if (CONFIGURED && pushEnabled && k.indexOf(PREFIX) === 0) scheduleDelete(k);
  };

  function schedulePush(key) {
    clearTimeout(pushTimers[key]);
    pushTimers[key] = setTimeout(function () {
      var raw = localStorage.getItem(key);
      if (raw === null) return;
      var val; try { val = JSON.parse(raw); } catch (e) { val = raw; }
      client.from(TABLE).upsert({
        key: key, data: val,
        updated_at: new Date().toISOString(),
        updated_by: userEmail
      }).then(function (r) {
        if (r.error) console.warn('[Cloud] Push fehlgeschlagen:', key, r.error.message);
        setStatus(true);
      });
    }, 350);
  }
  function scheduleDelete(key) {
    clearTimeout(pushTimers[key]);
    pushTimers[key] = setTimeout(function () {
      client.from(TABLE).delete().eq('key', key).then(function () { setStatus(true); });
    }, 350);
  }

  function reRender() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(function () {
      if (typeof window.renderAll === 'function') window.renderAll();
    }, 80);
  }

  /* ── Status-Chip + Userleiste ────────────────────────────── */
  function injectChrome(role) {
    var roleLabel = role === 'owner' ? 'Owner · volle Rechte' : 'Mitglied · ansehen & eintragen';
    var chip = document.createElement('div');
    chip.id = 'cloud-chip';
    chip.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:480;' +
      'font-family:JetBrains Mono,monospace;font-size:11px;display:flex;' +
      'align-items:center;gap:7px;background:rgba(10,11,18,.92);' +
      'border:1px solid var(--border2);padding:7px 12px;border-radius:9px;' +
      'color:var(--muted2);backdrop-filter:blur(8px);';
    chip.innerHTML = '<span id="cloud-dot" style="width:8px;height:8px;border-radius:50%;background:var(--muted);"></span>' +
      '<span id="cloud-txt">verbinde…</span>' +
      '<button id="cloud-logout" style="margin-left:6px;background:none;border:none;' +
      'color:var(--pink);font:inherit;cursor:pointer;text-decoration:underline;">Logout</button>';
    document.body.appendChild(chip);
    document.getElementById('cloud-logout').addEventListener('click', logout);
    var u = document.querySelector('.sidebar-user .user-name');
    var r = document.querySelector('.sidebar-user .user-role');
    if (u && userEmail) u.textContent = userEmail.split('@')[0];
    if (r) r.textContent = roleLabel;
    var av = document.querySelector('.sidebar-user .user-av');
    if (av && userEmail) av.textContent = userEmail.charAt(0).toUpperCase();
  }
  function setStatus(live) {
    var d = document.getElementById('cloud-dot'), t = document.getElementById('cloud-txt');
    if (!d) return;
    d.style.background = live ? 'var(--green)' : 'var(--yellow)';
    t.textContent = live ? 'Live · synchron' : 'sync…';
  }

  /* ── Auth-Overlay ────────────────────────────────────────── */
  function overlay(show) {
    var o = document.getElementById('auth-overlay');
    if (!o && show) {
      o = document.createElement('div');
      o.id = 'auth-overlay';
      o.style.cssText = 'position:fixed;inset:0;z-index:600;display:flex;' +
        'align-items:center;justify-content:center;padding:20px;' +
        'background:radial-gradient(800px 500px at 50% 0%,rgba(255,77,141,.12),transparent),#0a0b12;';
      o.innerHTML =
        '<div style="max-width:380px;width:100%;background:linear-gradient(160deg,#1b1f31,#151826);' +
        'border:1px solid #313a57;border-radius:14px;padding:30px;box-shadow:0 30px 80px -20px #000;">' +
        '<div style="font-family:Barlow Condensed,sans-serif;font-size:26px;font-weight:900;' +
        'text-transform:uppercase;letter-spacing:.5px;background:linear-gradient(135deg,#ff4d8d,#ff8a3d);' +
        '-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;">DieDonuts</div>' +
        '<div style="font-family:JetBrains Mono,monospace;font-size:11px;color:#8b91ad;margin-bottom:22px;">Orga-Portal · Anmeldung</div>' +
        '<div class="fg"><label>E-Mail</label><input id="au-mail" type="email" autocomplete="username" placeholder="du@beispiel.de"></div>' +
        '<div class="fg"><label>Passwort</label><input id="au-pass" type="password" autocomplete="current-password" placeholder="••••••••"></div>' +
        '<div id="au-err" style="color:#ff4d6a;font-size:12px;min-height:18px;margin:4px 0 12px;"></div>' +
        '<button class="btn btn-primary" id="au-login" style="width:100%;margin-bottom:9px;">Anmelden</button>' +
        '<button class="btn btn-ghost" id="au-reg" style="width:100%;">Neues Konto registrieren</button>' +
        '</div>';
      document.body.appendChild(o);
      var doLogin = function () { auth('login'); };
      document.getElementById('au-login').addEventListener('click', doLogin);
      document.getElementById('au-reg').addEventListener('click', function () { auth('register'); });
      document.getElementById('au-pass').addEventListener('keydown', function (e) { if (e.key === 'Enter') doLogin(); });
    }
    if (o) o.style.display = show ? 'flex' : 'none';
  }
  function authErr(m) { var e = document.getElementById('au-err'); if (e) e.textContent = m || ''; }

  function auth(mode) {
    var mail = (document.getElementById('au-mail').value || '').trim();
    var pass = document.getElementById('au-pass').value || '';
    if (!mail || !pass) { authErr('E-Mail und Passwort eingeben.'); return; }
    authErr('…');
    var p = mode === 'register'
      ? client.auth.signUp({ email: mail, password: pass })
      : client.auth.signInWithPassword({ email: mail, password: pass });
    p.then(function (res) {
      if (res.error) { authErr(res.error.message); return; }
      if (mode === 'register' && !res.data.session) {
        authErr('Konto erstellt. Bitte ggf. E-Mail bestätigen, dann anmelden.');
        return;
      }
      userEmail = (res.data.user && res.data.user.email) || mail;
      overlay(false);
      connect();
    });
  }

  function logout() {
    if (!confirm('Abmelden? Lokale Daten werden aus diesem Browser entfernt (Cloud bleibt erhalten).')) return;
    Object.keys(localStorage).filter(function (k) { return k.indexOf(PREFIX) === 0; })
      .forEach(function (k) { rawRemove(k); });
    client.auth.signOut().then(function () { location.reload(); });
  }

  /* ── Verbindung + Realtime ───────────────────────────────── */
  function connect() {
    var role = applyRole(userEmail);
    injectChrome(role);
    setStatus(false);
    client.from(TABLE).select('key,data').then(function (res) {
      if (res.error) { setStatus(false); console.error('[Cloud] Laden:', res.error.message); return; }
      // Cloud ist Quelle der Wahrheit beim Start
      Object.keys(localStorage).filter(function (k) { return k.indexOf(PREFIX) === 0; })
        .forEach(function (k) { rawRemove(k); });
      (res.data || []).forEach(function (row) {
        rawSet(row.key, typeof row.data === 'string' ? row.data : JSON.stringify(row.data));
      });
      pushEnabled = true;
      reRender();
      setStatus(true);

      client.channel('portal-rt')
        .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, function (payload) {
          if (payload.eventType === 'DELETE') {
            if (payload.old && payload.old.key) rawRemove(payload.old.key);
          } else {
            var row = payload.new;
            if (row && row.key) rawSet(row.key, typeof row.data === 'string' ? row.data : JSON.stringify(row.data));
          }
          reRender();
        })
        .subscribe();
    });
  }

  /* ── Boot (von app.js nach erstem Render gerufen) ────────── */
  var PortalCloud = {
    configured: CONFIGURED,
    boot: function () {
      if (!CONFIGURED) {
        // Lokal-Modus: dezenter Hinweis, Portal läuft normal weiter
        var n = document.createElement('div');
        n.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:480;' +
          'font-family:JetBrains Mono,monospace;font-size:11px;background:rgba(10,11,18,.92);' +
          'border:1px solid var(--border2);border-left:3px solid var(--yellow);' +
          'padding:8px 13px;border-radius:9px;color:var(--muted2);max-width:260px;';
        n.innerHTML = '⚠ Lokal-Modus · kein Live-Sync<br><span style="color:var(--muted);">js/supabase-config.js ausfüllen</span>';
        document.body.appendChild(n);
        return;
      }
      if (!window.supabase || !window.supabase.createClient) {
        console.error('[Cloud] Supabase-Bibliothek nicht geladen.');
        return;
      }
      client = window.supabase.createClient(URL, KEY);
      client.auth.getSession().then(function (res) {
        var s = res.data && res.data.session;
        if (s && s.user) { userEmail = s.user.email; overlay(false); connect(); }
        else { overlay(true); }
      });
    }
  };
  window.PortalCloud = PortalCloud;
})();
