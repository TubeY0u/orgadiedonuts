/* =================================================================
   DieDonuts - Cloud-Sync (Supabase) + Login
   - Echte Logins (E-Mail/Passwort) + Passwort-Reset
   - Live-Sync: jede Anderung (dnd_*) landet sofort bei allen
   - localStorage bleibt Offline-Puffer
   - Ohne ausgefullte supabase-config.js -> Lokal-Modus
   ================================================================= */
(function () {
  'use strict';

  var URL = window.SUPABASE_URL || '';
  var KEY = window.SUPABASE_ANON_KEY || '';
  var CONFIGURED = URL && KEY &&
    URL.indexOf('DEIN_') === -1 && KEY.indexOf('DEIN_') === -1 &&
    URL.indexOf('http') === 0;

  var TABLE = 'portal';
  var PREFIX = 'dnd_';

  var rawSet = localStorage.setItem.bind(localStorage);
  var rawRemove = localStorage.removeItem.bind(localStorage);

  var client = null;
  var pushEnabled = false;
  var pushTimers = {};
  var renderTimer = null;
  var userEmail = '';
  var OWNERS = (window.OWNER_EMAILS || []).map(function (e) { return String(e).toLowerCase().trim(); });

  function applyRole(email) {
    var isOwner = email && OWNERS.indexOf(String(email).toLowerCase().trim()) > -1;
    var role = isOwner ? 'owner' : 'member';
    window.PORTAL_ROLE = role;
    window.PORTAL_EMAIL = email || '';
    document.body.classList.remove('role-owner', 'role-member');
    document.body.classList.add('role-' + role);
    return role;
  }
  // Seite erst nach Auth-Check zeigen (verhindert Content-Flash)
  document.documentElement.style.visibility = 'hidden';

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

  /* -- Status-Chip ------------------------------------------- */
  function injectChrome(role) {
    var roleLabel = role === 'owner' ? 'Owner' : 'Mitglied';
    var isMobile = window.innerWidth <= 768;
    var chip = document.createElement('div');
    chip.id = 'cloud-chip';
    chip.style.cssText =
      'position:fixed;z-index:480;font-family:JetBrains Mono,monospace;font-size:11px;' +
      'display:flex;align-items:center;gap:8px;background:rgba(10,11,18,.95);' +
      'border:1px solid var(--border2);padding:7px 12px;border-radius:10px;' +
      'color:var(--muted2);backdrop-filter:blur(12px);box-shadow:0 6px 20px -6px rgba(0,0,0,0.6);' +
      (isMobile ? 'top:68px;right:12px;' : 'bottom:16px;right:16px;');
    chip.innerHTML =
      '<span id="cloud-dot" style="width:7px;height:7px;border-radius:50%;' +
        'background:var(--muted);flex-shrink:0;transition:background .4s;"></span>' +
      '<span id="cloud-txt" style="font-size:10px;">verbinde…</span>' +
      '<button id="cloud-logout" style="margin-left:4px;background:none;border:none;' +
        'color:var(--pink);font:inherit;font-size:10px;cursor:pointer;">Logout</button>';
    document.body.appendChild(chip);
    document.getElementById('cloud-logout').addEventListener('click', logout);

    var displayName = userEmail ? userEmail.split('@')[0] : 'Nutzer';
    var u = document.querySelector('.sidebar-user .user-name');
    var r = document.querySelector('.sidebar-user .user-role');
    var av = document.querySelector('.sidebar-user .user-av');
    if (u) u.textContent = displayName;
    if (r) r.textContent = roleLabel;
    if (av) av.textContent = displayName.charAt(0).toUpperCase();
  }

  function setStatus(live) {
    var d = document.getElementById('cloud-dot');
    var t = document.getElementById('cloud-txt');
    if (!d) return;
    d.style.background = live ? 'var(--green)' : 'var(--yellow)';
    t.textContent = live ? 'Live · sync' : 'sync…';
  }

  /* -- Auth-Overlay ------------------------------------------ */
  function overlay(show) {
    var o = document.getElementById('auth-overlay');
    if (!o && show) {
      o = document.createElement('div');
      o.id = 'auth-overlay';
      o.style.cssText =
        'position:fixed;inset:0;z-index:9000;display:flex;' +
        'align-items:center;justify-content:center;padding:20px;' +
        'background:radial-gradient(900px 500px at 50% -10%,rgba(255,77,141,.14),transparent 60%),' +
        '#0a0b12;';

      o.innerHTML =
        '<div style="max-width:400px;width:100%;' +
          'background:linear-gradient(160deg,#1b1f31 0%,#141725 100%);' +
          'border:1px solid #2d3454;border-radius:18px;padding:34px 32px 28px;' +
          'box-shadow:0 40px 80px -20px rgba(0,0,0,0.85);">' +
          '<div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;">' +
            '<img src="https://donuts-esports.de/assets/logo_trans.png"' +
              ' style="height:28px;filter:invert(1) drop-shadow(0 0 8px rgba(255,77,141,.4));"' +
              ' onerror="this.style.display=\'none\'">' +
            '<div style="font-family:Barlow Condensed,sans-serif;font-size:26px;font-weight:900;' +
              'text-transform:uppercase;background:linear-gradient(135deg,#ff4d8d,#ff8a3d);' +
              '-webkit-background-clip:text;background-clip:text;' +
              '-webkit-text-fill-color:transparent;">DieDonuts</div>' +
          '</div>' +
          '<div style="font-family:JetBrains Mono,monospace;font-size:10.5px;' +
            'color:#6b7190;margin-bottom:26px;">Orga-Portal &middot; Anmeldung</div>' +
          '<div style="margin-bottom:14px;">' +
            '<label style="display:block;font-family:Barlow Condensed,sans-serif;font-size:10px;' +
              'font-weight:800;letter-spacing:1.5px;text-transform:uppercase;' +
              'color:#8b91ad;margin-bottom:6px;">E-Mail</label>' +
            '<input id="au-mail" type="email" inputmode="email" autocomplete="username"' +
              ' placeholder="du@beispiel.de"' +
              ' style="width:100%;background:rgba(6,7,13,.8);border:1px solid #242a40;' +
              'color:#eef0f7;border-radius:9px;padding:12px 14px;font-size:16px;' +
              'font-family:Barlow,sans-serif;outline:none;box-sizing:border-box;">' +
          '</div>' +
          '<div style="margin-bottom:8px;">' +
            '<label style="display:block;font-family:Barlow Condensed,sans-serif;font-size:10px;' +
              'font-weight:800;letter-spacing:1.5px;text-transform:uppercase;' +
              'color:#8b91ad;margin-bottom:6px;">Passwort</label>' +
            '<input id="au-pass" type="password" autocomplete="current-password"' +
              ' placeholder="••••••••"' +
              ' style="width:100%;background:rgba(6,7,13,.8);border:1px solid #242a40;' +
              'color:#eef0f7;border-radius:9px;padding:12px 14px;font-size:16px;' +
              'font-family:Barlow,sans-serif;outline:none;box-sizing:border-box;">' +
          '</div>' +
          '<div style="text-align:right;margin-bottom:14px;">' +
            '<button id="au-reset" style="background:none;border:none;color:#6b7190;' +
              'font-size:11px;font-family:JetBrains Mono,monospace;' +
              'cursor:pointer;text-decoration:underline;padding:0;">' +
              'Passwort vergessen?</button>' +
          '</div>' +
          '<div id="au-err" style="color:#ff4d6a;font-size:12px;min-height:18px;' +
            'margin-bottom:14px;font-family:JetBrains Mono,monospace;text-align:center;"></div>' +
          '<button id="au-login" style="width:100%;margin-bottom:10px;' +
            'background:linear-gradient(135deg,#ff4d8d,#ff8a3d);color:#fff;border:none;' +
            'border-radius:10px;padding:13px;font-family:Barlow Condensed,sans-serif;' +
            'font-size:14px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;' +
            'cursor:pointer;box-shadow:0 8px 24px -6px rgba(255,77,141,.6);">Anmelden</button>' +
          '<button id="au-reg" style="width:100%;background:rgba(255,255,255,.03);' +
            'border:1px solid #2d3454;color:#c2c6d6;border-radius:10px;padding:12px;' +
            'font-family:Barlow Condensed,sans-serif;font-size:13px;font-weight:800;' +
            'letter-spacing:1px;text-transform:uppercase;cursor:pointer;">Konto erstellen</button>' +
        '</div>';

      document.body.appendChild(o);

      var mailInput = document.getElementById('au-mail');
      var passInput = document.getElementById('au-pass');

      [mailInput, passInput].forEach(function (inp) {
        inp.addEventListener('focus', function () {
          inp.style.borderColor = '#ff4d8d';
          inp.style.boxShadow = '0 0 0 3px rgba(255,77,141,.13)';
        });
        inp.addEventListener('blur', function () {
          inp.style.borderColor = '#242a40';
          inp.style.boxShadow = 'none';
        });
      });

      var doLogin = function () { auth('login'); };
      document.getElementById('au-login').addEventListener('click', doLogin);
      document.getElementById('au-reg').addEventListener('click', function () { auth('register'); });
      passInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') doLogin(); });
      document.getElementById('au-reset').addEventListener('click', authReset);
    }
    if (o) o.style.display = show ? 'flex' : 'none';
  }

  var ERR_MAP = [
    ['Invalid login credentials',  'E-Mail oder Passwort falsch.'],
    ['Email not confirmed',        'Bitte zuerst die E-Mail bestätigen.'],
    ['User already registered',    'Diese E-Mail ist bereits registriert.'],
    ['Password should be at least 6 characters', 'Passwort mind. 6 Zeichen.'],
    ['signup is disabled',         'Registrierung deaktiviert — Lukas kontaktieren.'],
    ['Email rate limit exceeded',  'Zu viele Versuche. Bitte kurz warten.']
  ];

  function authErr(m) {
    var e = document.getElementById('au-err');
    if (!e) return;
    var msg = m || '';
    ERR_MAP.forEach(function (pair) { if (msg.indexOf(pair[0]) > -1) msg = pair[1]; });
    e.style.color = '#ff4d6a';
    e.textContent = msg;
  }

  function setLoginLoading(loading) {
    var btn = document.getElementById('au-login');
    var reg = document.getElementById('au-reg');
    if (!btn) return;
    btn.disabled = loading;
    if (reg) reg.disabled = loading;
    btn.textContent = loading ? 'Anmelden…' : 'Anmelden';
    btn.style.opacity = loading ? '0.7' : '1';
  }

  function auth(mode) {
    var mail = (document.getElementById('au-mail').value || '').trim();
    var pass = document.getElementById('au-pass').value || '';
    if (!mail || !pass) { authErr('E-Mail und Passwort eingeben.'); return; }
    authErr('');
    setLoginLoading(true);
    var p = mode === 'register'
      ? client.auth.signUp({ email: mail, password: pass })
      : client.auth.signInWithPassword({ email: mail, password: pass });
    p.then(function (res) {
      setLoginLoading(false);
      if (res.error) { authErr(res.error.message); return; }
      if (mode === 'register' && !res.data.session) {
        var e = document.getElementById('au-err');
        if (e) {
          e.style.color = '#34d399';
          e.textContent = 'Konto erstellt! Bitte E-Mail bestätigen, dann anmelden.';
        }
        return;
      }
      userEmail = (res.data.user && res.data.user.email) || mail;
      overlay(false);
      connect();
      if (typeof window.toast === 'function') {
        window.toast('Willkommen, ' + userEmail.split('@')[0] + '!', 'success');
      }
    }).catch(function (err) {
      setLoginLoading(false);
      authErr(err.message || 'Verbindungsfehler.');
    });
  }

  function authReset() {
    var mail = (document.getElementById('au-mail').value || '').trim();
    if (!mail) { authErr('Zuerst E-Mail eingeben, dann auf den Link klicken.'); return; }
    authErr('');
    client.auth.resetPasswordForEmail(mail, {
      redirectTo: location.origin + location.pathname
    }).then(function (res) {
      var e = document.getElementById('au-err');
      if (res.error) { authErr(res.error.message); return; }
      if (e) {
        e.style.color = '#34d399';
        e.textContent = 'Reset-Link gesendet! Bitte E-Mail prüfen.';
      }
    });
  }

  function logout() {
    if (!confirm('Abmelden? Lokale Daten werden aus diesem Browser entfernt (Cloud bleibt erhalten).')) return;
    Object.keys(localStorage).filter(function (k) { return k.indexOf(PREFIX) === 0; })
      .forEach(function (k) { rawRemove(k); });
    client.auth.signOut().then(function () { location.reload(); });
  }

  /* -- Verbindung + Realtime ---------------------------------- */
  function connect() {
    var role = applyRole(userEmail);
    injectChrome(role);
    setStatus(false);
    client.from(TABLE).select('key,data').then(function (res) {
      if (res.error) {
        setStatus(false);
        console.error('[Cloud] Laden:', res.error.message);
        return;
      }
      var cloudKeys = {};
      (res.data || []).forEach(function (row) {
        rawSet(row.key, typeof row.data === 'string' ? row.data : JSON.stringify(row.data));
        cloudKeys[row.key] = true;
      });
      Object.keys(localStorage).filter(function (k) {
        return k.indexOf(PREFIX) === 0 && !cloudKeys[k];
      }).forEach(function (k) { schedulePush(k); });
      pushEnabled = true;
      reRender();
      setStatus(true);

      client.channel('portal-rt')
        .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, function (payload) {
          if (payload.eventType === 'DELETE') {
            if (payload.old && payload.old.key) rawRemove(payload.old.key);
          } else {
            var row = payload.new;
            if (row && row.key) {
              rawSet(row.key, typeof row.data === 'string' ? row.data : JSON.stringify(row.data));
            }
          }
          reRender();
        })
        .subscribe();
    });
  }

  /* -- Boot -------------------------------------------------- */
  var IS_LOCAL = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

  var PortalCloud = {
    configured: CONFIGURED,
    boot: function () {
      // Localhost-Bypass: kein Login nötig bei lokaler Entwicklung
      if (IS_LOCAL) {
        document.documentElement.style.visibility = '';
        userEmail = OWNERS[0] || 'local@dev';
        applyRole(userEmail);
        injectChrome(applyRole(userEmail));
        setStatus(false);
        var n = document.createElement('div');
        n.style.cssText =
          'position:fixed;right:14px;bottom:14px;z-index:480;' +
          'font-family:JetBrains Mono,monospace;font-size:11px;' +
          'background:rgba(10,11,18,.92);border:1px solid var(--border2);' +
          'border-left:3px solid var(--cyan);padding:8px 13px;border-radius:9px;' +
          'color:var(--muted2);max-width:260px;';
        n.textContent = '🛠 Dev-Modus · localhost';
        document.body.appendChild(n);
        return;
      }
      if (!CONFIGURED) {
        var n = document.createElement('div');
        n.style.cssText =
          'position:fixed;right:14px;bottom:14px;z-index:480;' +
          'font-family:JetBrains Mono,monospace;font-size:11px;' +
          'background:rgba(10,11,18,.92);border:1px solid var(--border2);' +
          'border-left:3px solid var(--yellow);padding:8px 13px;border-radius:9px;' +
          'color:var(--muted2);max-width:260px;';
        n.textContent = '⚠ Lokal-Modus · kein Live-Sync';
        document.body.appendChild(n);
        return;
      }
      if (!window.supabase || !window.supabase.createClient) {
        console.error('[Cloud] Supabase-Bibliothek nicht geladen.');
        return;
      }
      client = window.supabase.createClient(URL, KEY);
      // Fallback: nach 4s Seite sowieso zeigen (auch bei Netzwerkfehler)
      var showTimer = setTimeout(function () {
        document.documentElement.style.visibility = '';
        overlay(true);
      }, 4000);
      client.auth.getSession().then(function (res) {
        clearTimeout(showTimer);
        document.documentElement.style.visibility = '';
        var s = res.data && res.data.session;
        if (s && s.user) { userEmail = s.user.email; overlay(false); connect(); }
        else { overlay(true); }
      }).catch(function () {
        clearTimeout(showTimer);
        document.documentElement.style.visibility = '';
        overlay(true);
      });
    }
  };
  window.PortalCloud = PortalCloud;
})();
