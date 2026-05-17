/* ═══════════════════════════════════════════════════════════════
   DieDonuts · Orga-Portal · app.js
   Zentraler Store + Backup (Export/Import) + alle Seiten-Renderer.
   localStorage-Keys bleiben kompatibel: dnd_*  (NIE umbenennen!)
   ═══════════════════════════════════════════════════════════════ */

/* ─── STORE ───────────────────────────────────────────────── */
const Store = {
  PREFIX: 'dnd_',
  VERSION: 2,
  keys: ['roster','termine','training','cups','strats','tasks',
         'availability','lineups','demos','scouting','notes'],

  get(k, fb) {
    if (fb === undefined) fb = [];
    try { const v = JSON.parse(localStorage.getItem(this.PREFIX + k)); return (v === null || v === undefined) ? fb : v; }
    catch { return fb; }
  },
  set(k, v) { localStorage.setItem(this.PREFIX + k, JSON.stringify(v)); },

  // Alle dnd_* Keys (inkl. dynamische dnd_map_* & dnd_drawings vom Stratbook)
  allKeys() {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.indexOf(this.PREFIX) === 0) out.push(key);
    }
    return out;
  },

  exportAll() {
    const data = {};
    this.allKeys().forEach(full => {
      try { data[full] = JSON.parse(localStorage.getItem(full)); }
      catch { data[full] = localStorage.getItem(full); }
    });
    const payload = {
      app: 'DieDonuts-Orga-Portal',
      version: this.VERSION,
      exportedAt: new Date().toISOString(),
      data
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = 'diedonuts-backup-' + stamp + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  },

  importAll(text) {
    let parsed;
    try { parsed = JSON.parse(text); }
    catch { alert('❌ Datei ist kein gültiges JSON-Backup.'); return false; }
    if (!parsed || parsed.app !== 'DieDonuts-Orga-Portal' || !parsed.data) {
      alert('❌ Das ist kein DieDonuts-Backup.'); return false;
    }
    if (parsed.version > this.VERSION) {
      if (!confirm('⚠️ Dieses Backup stammt aus einer neueren Portal-Version (' +
        parsed.version + '). Trotzdem importieren?')) return false;
    }
    const count = Object.keys(parsed.data).length;
    if (!confirm('⚠️ Import überschreibt ALLE aktuellen Daten in diesem Browser ('
      + count + ' Datensätze).\n\nVorher ggf. ein Backup exportieren!\n\nFortfahren?')) return false;

    // Bestehende dnd_* löschen, dann Backup einspielen
    this.allKeys().forEach(k => localStorage.removeItem(k));
    Object.keys(parsed.data).forEach(full => {
      const v = parsed.data[full];
      localStorage.setItem(full, typeof v === 'string' ? v : JSON.stringify(v));
    });
    alert('✅ Import erfolgreich. Die Seite wird neu geladen.');
    location.reload();
    return true;
  }
};

/* ─── DEFAULT ROSTER (einmalige Vorbefüllung) ─────────────── */
const DEFAULT_ROSTER = {
  teams: [
    {
      id: 'main', name: 'Donuts Main', tag: '🍩 Main', tone: 'info',
      info: 'DachCS S5 SPK4 · ESEA S56 Open10 · IGL: hALFY',
      players: [
        { id: 'p_halfy',   name: 'hALFY',   role: 'IGL · Team Captain',     lvl: '🇩🇪 LVL 10', captain: true,  faceit: 'hALFY' },
        { id: 'p_chrizzw', name: 'chrizzW', role: 'Veteran · Anchor',       lvl: '🇩🇪 LVL 10', captain: false, faceit: 'chrizzW' },
        { id: 'p_tubeyou', name: 'TubeYou', role: 'Entry · Pressesprecher', lvl: '🇩🇪 Owner',  captain: false, faceit: 'TubeYou' }
      ],
      open: 2,
      standins: [{ id: 's_dolan', name: 'dolan' }, { id: 's_ibra', name: 'ibrakadabras' }, { id: 's_reda', name: 'reda' }]
    },
    {
      id: 'nxt', name: 'Donuts Nxt', tag: 'Nxt', tone: 'info',
      info: 'Academy Roster · 5 Spieler · Captain: -_-Calli',
      players: [
        { id: 'p_calli',  name: '-_-Calli', role: 'Team Captain',  lvl: '🇩🇪 LVL 4', captain: true,  faceit: '-_-Calli' },
        { id: 'p_tomac',  name: 'Tomac-',   role: 'Star Fragger',  lvl: '🇳🇱 LVL 8', captain: false, faceit: 'Tomac-' },
        { id: 'p_kristin',name: 'Kristin',  role: 'Rifler',        lvl: '🇩🇪 LVL 6', captain: false, faceit: 'Kristin' },
        { id: 'p_illiw',  name: 'illiw29',  role: 'Support',       lvl: '🇩🇪 LVL 4', captain: false, faceit: 'illiw29' },
        { id: 'p_def4',   name: 'def4ult',  role: 'Entry Fragger', lvl: '🇩🇪 LVL 6', captain: false, faceit: 'def4ult' }
      ],
      open: 0,
      standins: [{ id: 's_chenko', name: 'chenko' }]
    },
    {
      id: 'dns', name: 'Donuts DNS', tag: 'DNS', tone: 'warn',
      info: 'In Aufbau · 3/5 Spieler · IGL: DNS-Olof',
      players: [
        { id: 'p_olof',  name: 'DNS-Olof',     role: 'Captain · IGL',     lvl: '🇩🇪 LVL 7', captain: true,  faceit: 'Olof' },
        { id: 'p_lilli', name: 'LilliFee1987', role: 'Rifler · Entry',    lvl: '🇩🇪 LVL 8', captain: false, faceit: 'LilliFee1987' },
        { id: 'p_alex',  name: 'lAL3Xl',       role: 'Rifler · Support',  lvl: '🇩🇪 LVL 5', captain: false, faceit: 'alex' }
      ],
      open: 2,
      standins: []
    }
  ]
};
function getRoster() {
  let r = Store.get('roster', null);
  if (!r || !r.teams) { r = DEFAULT_ROSTER; Store.set('roster', r); }
  return r;
}
function allPlayers() {
  const out = [];
  getRoster().teams.forEach(t => {
    (t.players || []).forEach(p => out.push({ id: p.id, name: p.name, team: t.tag }));
    (t.standins || []).forEach(s => out.push({ id: s.id, name: s.name + ' (Standin)', team: t.tag }));
  });
  return out;
}
function playerOptions(selected) {
  return '<option value="">— wählen —</option>' + allPlayers().map(p =>
    `<option value="${p.id}"${selected === p.id ? ' selected' : ''}>${esc(p.name)} · ${p.team}</option>`).join('');
}

/* ─── HELPER ──────────────────────────────────────────────── */
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function deDate(d, opts) { try { return new Date(d).toLocaleDateString('de-DE', opts || { weekday: 'short', day: '2-digit', month: '2-digit' }); } catch { return d; } }
function notifyDiscord(text) {
  var url = window.DISCORD_WEBHOOK;
  if (!url || url.indexOf('http') !== 0) return;
  var who = window.PORTAL_EMAIL ? (' · ' + String(window.PORTAL_EMAIL).split('@')[0]) : '';
  try {
    fetch(url, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'DieDonuts Orga', content: text + who })
    });
  } catch (e) {}
}
function showSaved(btn) {
  if (!btn) return;
  const orig = btn.textContent;
  btn.textContent = '✓ Gespeichert';
  btn.style.cssText += 'background:var(--green)!important;color:#04140d!important;';
  setTimeout(() => { btn.textContent = orig; btn.style.cssText = ''; }, 1700);
}

/* ─── NAVIGATION ──────────────────────────────────────────── */
function buildNav() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  const groups = [
    { label: 'Übersicht', links: [{ href: 'index.html', icon: '◆', label: 'Dashboard' }] },
    { label: 'Team', links: [
      { href: 'roster.html', icon: '◧', label: 'Roster' },
      { href: 'scouting.html', icon: '◎', label: 'Scouting' }
    ]},
    { label: 'Planung', links: [
      { href: 'termine.html', icon: '▦', label: 'Kalender' },
      { href: 'planer.html', icon: '☰', label: 'Planer' }
    ]},
    { label: 'Spielbetrieb', links: [
      { href: 'lineups.html', icon: '◫', label: 'Lineups' },
      { href: 'cups.html', icon: '◈', label: 'Ergebnisse' },
      { href: 'stratbook.html', icon: '◉', label: 'Stratbook' },
      { href: 'demos.html', icon: '▶', label: 'Demos / VODs' },
      { href: 'training.html', icon: '◍', label: 'Training' }
    ]}
  ];
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;
  nav.innerHTML = groups.map(g =>
    `<div class="nav-group">${g.label}</div>` +
    g.links.map(l => {
      const active = current === l.href ? ' active' : '';
      return `<a href="${l.href}" class="nav-link${active}"><span class="nav-icon">${l.icon}</span>${l.label}</a>`;
    }).join('')
  ).join('');
}

/* ─── BACKUP MODAL ────────────────────────────────────────── */
function initBackup() {
  const header = document.querySelector('.page-header');
  if (header && !header.querySelector('.header-actions')) {
    const wrap = document.createElement('div');
    wrap.className = 'header-actions';
    wrap.innerHTML = '<button class="btn btn-ghost" id="backup-btn" title="Daten sichern / übertragen">⤓ Backup</button>';
    // bestehenden Header-Button (z.B. + Termin) übernehmen
    const existing = header.querySelector(':scope > a.btn, :scope > button.btn');
    if (existing) wrap.insertBefore(existing, wrap.firstChild);
    header.appendChild(wrap);
  }
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'backup-modal';
  modal.innerHTML =
    '<div class="modal">' +
      '<button class="modal-close" id="backup-close">×</button>' +
      '<div class="modal-title">Backup & Übertragung</div>' +
      '<div class="modal-sub">Alle Portal-Daten als Datei sichern oder einspielen</div>' +
      '<p style="font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:18px;">' +
        'Daten liegen lokal in <b>diesem</b> Browser. Mit <b>Export</b> lädst du ein ' +
        'Backup herunter und kannst es z.B. via Discord teilen. Mit <b>Import</b> ' +
        'spielt jemand anderes dieselben Daten ein.</p>' +
      '<div class="modal-row">' +
        '<button class="btn btn-primary" id="backup-export">⤓ Export (Download)</button>' +
        '<button class="btn btn-ghost" id="backup-import">⤒ Import (Datei)</button>' +
      '</div>' +
      '<input type="file" id="backup-file" accept="application/json,.json" style="display:none;">' +
    '</div>';
  document.body.appendChild(modal);

  const open = () => modal.classList.add('active');
  const close = () => modal.classList.remove('active');
  const btn = document.getElementById('backup-btn');
  if (btn) btn.addEventListener('click', open);
  document.getElementById('backup-close').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.getElementById('backup-export').addEventListener('click', () => Store.exportAll());
  document.getElementById('backup-import').addEventListener('click', () => document.getElementById('backup-file').click());
  document.getElementById('backup-file').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => Store.importAll(ev.target.result);
    reader.readAsText(f);
  });
}

/* ─── MOBILE MENU ─────────────────────────────────────────── */
function initMobile() {
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.id = 'sidebar-overlay';
  overlay.addEventListener('click', closeSidebar);
  document.body.appendChild(overlay);

  const main = document.querySelector('.main');
  if (!main) return;
  const pageTitle = document.querySelector('.page-title');
  const mh = document.createElement('div');
  mh.className = 'mobile-header';
  mh.innerHTML =
    '<button class="hamburger" id="hamburger-btn" aria-label="Menü"><span></span><span></span><span></span></button>' +
    '<span class="mobile-title">' + (pageTitle ? pageTitle.textContent : 'DieDonuts') + '</span>' +
    '<img src="https://donuts-esports.de/assets/logo_trans.png" class="mobile-logo" alt="DieDonuts" ' +
    'onerror="this.outerHTML=\'<span style=&quot;margin-left:auto;font-family:Barlow Condensed;font-weight:900;color:var(--pink);&quot;>DIEDONUTS</span>\'">';
  main.insertBefore(mh, main.firstChild);
  document.getElementById('hamburger-btn').addEventListener('click', openSidebar);
}
function openSidebar() {
  document.querySelector('.sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('active');
  document.getElementById('hamburger-btn').classList.add('is-open');
}
function closeSidebar() {
  document.querySelector('.sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('active');
  const b = document.getElementById('hamburger-btn');
  if (b) b.classList.remove('is-open');
}

/* ─── COUNTDOWN ───────────────────────────────────────────── */
function startCountdown(target, dId, hId, mId) {
  function upd() {
    const diff = new Date(target) - new Date();
    const d = document.getElementById(dId), h = document.getElementById(hId), m = document.getElementById(mId);
    if (diff <= 0) { if (d) d.textContent = '0'; if (h) h.textContent = '0'; if (m) m.textContent = '0'; return; }
    if (d) d.textContent = Math.floor(diff / 86400000);
    if (h) h.textContent = Math.floor((diff % 86400000) / 3600000);
    if (m) m.textContent = Math.floor((diff % 3600000) / 60000);
  }
  upd(); setInterval(upd, 30000);
}

/* ─── GENERIC TABS / TEAM SWITCH ──────────────────────────── */
function initTeamSwitch() {
  document.querySelectorAll('.team-sw-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.team-sw-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.team-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.getElementById(btn.dataset.team);
      if (panel) panel.classList.add('active');
    });
  });
}
function initSimpleTabs() {
  document.querySelectorAll('[data-tabgroup]').forEach(tab => {
    tab.addEventListener('click', () => {
      const grp = tab.dataset.tabgroup;
      document.querySelectorAll(`[data-tabgroup="${grp}"]`).forEach(t => t.classList.remove('active'));
      document.querySelectorAll(`[data-tabpanel="${grp}"]`).forEach(p => p.style.display = 'none');
      tab.classList.add('active');
      const panel = document.querySelector(`[data-tabpanel="${grp}"]#${tab.dataset.tabtarget}`);
      if (panel) panel.style.display = 'block';
    });
  });
}

/* ─── TERMINE ─────────────────────────────────────────────── */
// Kalender-Ansicht (pro Team / Orga-Gesamt). Reine UI-Präferenz pro
// Browser → bewusst OHNE dnd_-Prefix (wird nicht gesynct/exportiert).
function getCalView() { try { return localStorage.getItem('cal_view') || 'ALL'; } catch { return 'ALL'; } }
function setCalView(v) { try { localStorage.setItem('cal_view', v); } catch (e) {} }
function eventInView(t) {
  const v = getCalView();
  if (v === 'ALL') return true;
  const team = t.team || 'Alle';
  return team === v || team === 'Alle'; // Team-Termine + Orga-weite ("Alle")
}
function initCalSwitch() {
  const box = document.getElementById('cal-switch'); if (!box) return;
  const cur = getCalView();
  box.querySelectorAll('.cal-sw-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.calview === cur);
    b.addEventListener('click', () => {
      setCalView(b.dataset.calview);
      box.querySelectorAll('.cal-sw-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      renderTermine(); renderCalendar();
    });
  });
}
function deleteTermin(id) {
  if (!confirm('Termin löschen?')) return;
  Store.set('termine', Store.get('termine').filter(t => t.id !== id));
  renderTermine(); renderCalendar(); updateNextEvent();
}
function renderTermine() {
  const c = document.getElementById('termine-list'); if (!c) return;
  const list = Store.get('termine').filter(eventInView).sort((a, b) => new Date(a.date) - new Date(b.date));
  const today = new Date(new Date().toDateString());
  const up = list.filter(t => new Date(t.date) >= today);
  const past = list.filter(t => new Date(t.date) < today);
  if (!list.length) { c.innerHTML = '<div class="empty-hint">Noch keine Termine eingetragen.</div>'; return; }
  const dots = { Training: 'var(--pink)', DachCS: 'var(--yellow)', ESEA: 'var(--yellow)', Meeting: 'var(--blue)', Scrimmage: 'var(--green)', Sonstiges: 'var(--muted2)' };
  const bg = { Training: 'b-red', DachCS: 'b-yellow', ESEA: 'b-yellow', Meeting: 'b-blue', Scrimmage: 'b-green', Sonstiges: 'b-muted' };
  const grp = (items, title) => {
    if (!items.length) return '';
    return `<div class="list-section-label">${title}</div>` + items.map(t =>
      `<div class="event-item">
        <span class="event-date">${deDate(t.date)}</span>
        <span class="event-dot" style="background:${dots[t.type] || 'var(--muted2)'}"></span>
        <span class="event-title">${esc(t.title)}${t.time ? ` <span class="mono" style="font-size:11px;color:var(--muted2)"> · ${esc(t.time)} Uhr</span>` : ''}${t.team && t.team !== 'Alle' ? ` <span class="badge b-muted" style="font-size:9px;margin-left:4px;">${esc(t.team)}</span>` : ''}</span>
        ${t.notes ? `<span class="event-note" title="${esc(t.notes)}">💬 ${esc(t.notes)}</span>` : ''}
        <span class="badge ${bg[t.type] || 'b-muted'}">${esc(t.type)}</span>
        <div class="event-actions"><button class="btn btn-danger btn-sm" onclick="deleteTermin('${t.id}')">✕</button></div>
      </div>`).join('');
  };
  c.innerHTML = grp(up, 'Kommend') + grp(past, 'Vergangen');
}
let CAL_OFFSET = 0; // 0 = aktueller Monat, -1 = Vormonat, +1 = Folgemonat
const TEAM_COLORS = { Main: 'var(--pink)', Nxt: 'var(--cyan)', DNS: 'var(--amber)', Alle: 'var(--muted2)' };
function renderCalendar() {
  const cal = document.getElementById('cal-grid'); if (!cal) return;
  const base = new Date();
  const view = new Date(base.getFullYear(), base.getMonth() + CAL_OFFSET, 1);
  const y = view.getFullYear(), mo = view.getMonth();
  const isCurMonth = (y === base.getFullYear() && mo === base.getMonth());
  const lbl = document.getElementById('cal-month-label');
  if (lbl) lbl.textContent = view.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  const offset = (new Date(y, mo, 1).getDay() + 6) % 7;
  const dim = new Date(y, mo + 1, 0).getDate();
  const byDay = {};
  Store.get('termine').filter(eventInView).forEach(t => {
    const d = new Date(t.date);
    if (d.getFullYear() === y && d.getMonth() === mo) { const k = d.getDate(); (byDay[k] = byDay[k] || []).push(t); }
  });
  const cls = { Training: 'ev-red', DachCS: 'ev-yellow', ESEA: 'ev-yellow', Meeting: 'ev-blue', Scrimmage: 'ev-green', Sonstiges: 'ev-blue' };
  let cells = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => `<div class="cal-hd">${d}</div>`).join('');
  for (let i = 0; i < offset; i++) cells += '<div class="cal-day empty"></div>';
  for (let d = 1; d <= dim; d++) {
    const isT = isCurMonth && d === base.getDate();
    const ev = byDay[d] || [];
    const evH = ev.slice(0, 2).map(e =>
      `<div class="cal-ev ${cls[e.type] || 'ev-blue'}" style="border-left:3px solid ${TEAM_COLORS[e.team] || 'var(--muted2)'}" title="${esc(e.title)} · ${esc(e.team || 'Alle')}">${esc(e.title)}</div>`).join('');
    const more = ev.length > 2 ? `<div style="font-size:9px;color:var(--muted);margin-top:2px;">+${ev.length - 2}</div>` : '';
    cells += `<div class="cal-day${isT ? ' today' : ''}"><div class="cal-day-num">${String(d).padStart(2, '0')}</div>${evH}${more}</div>`;
  }
  cal.innerHTML = cells;
}
function pad2(n) { return String(n).padStart(2, '0'); }
function exportICS() {
  const list = Store.get('termine').filter(eventInView);
  if (!list.length) { alert('Keine Termine in dieser Ansicht zum Exportieren.'); return; }
  let ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//DieDonuts//Orga//DE', 'CALSCALE:GREGORIAN'];
  list.forEach(t => {
    const d = (t.date || '').replace(/-/g, '');
    if (!d) return;
    ics.push('BEGIN:VEVENT');
    ics.push('UID:' + t.id + '@diedonuts');
    ics.push('DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z');
    if (t.time) {
      const hm = t.time.replace(':', '') + '00';
      ics.push('DTSTART:' + d + 'T' + hm);
      const eh = pad2((parseInt(t.time.split(':')[0], 10) + 1) % 24);
      ics.push('DTEND:' + d + 'T' + eh + t.time.split(':')[1] + '00');
    } else {
      ics.push('DTSTART;VALUE=DATE:' + d);
    }
    ics.push('SUMMARY:' + (t.team && t.team !== 'Alle' ? '[' + t.team + '] ' : '') + (t.type ? t.type + ': ' : '') + (t.title || '').replace(/[\r\n,;]/g, ' '));
    if (t.notes) ics.push('DESCRIPTION:' + String(t.notes).replace(/[\r\n,;]/g, ' '));
    ics.push('END:VEVENT');
  });
  ics.push('END:VCALENDAR');
  const blob = new Blob([ics.join('\r\n')], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'diedonuts-kalender.ics';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
function initCalNav() {
  const p = document.getElementById('cal-prev'), n = document.getElementById('cal-next'),
    h = document.getElementById('cal-today'), i = document.getElementById('cal-ics');
  if (p) p.addEventListener('click', () => { CAL_OFFSET--; renderCalendar(); });
  if (n) n.addEventListener('click', () => { CAL_OFFSET++; renderCalendar(); });
  if (h) h.addEventListener('click', () => { CAL_OFFSET = 0; renderCalendar(); });
  if (i) i.addEventListener('click', exportICS);
}
function initTermineForm() {
  const form = document.getElementById('termin-form'); if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const list = Store.get('termine');
    list.push({ id: uid(), title: form.title.value.trim(), date: form.date.value, time: form.time.value, type: form.type.value, team: form.team.value, notes: form.notes.value.trim() });
    const tn = list[list.length - 1];
    Store.set('termine', list); form.reset();
    renderTermine(); renderCalendar(); updateNextEvent();
    notifyDiscord('📅 **Neuer Termin:** ' + tn.title + ' — ' + tn.date +
      (tn.time ? ' ' + tn.time + ' Uhr' : '') +
      ' (' + (tn.team || 'Alle') + ' · ' + tn.type + ')');
    showSaved(form.querySelector('[type=submit]'));
  });
}
function updateNextEvent() {
  const tEl = document.getElementById('next-event-title'); if (!tEl) return;
  const mEl = document.getElementById('next-event-meta');
  const today = new Date(new Date().toDateString());
  const up = Store.get('termine').filter(t => new Date(t.date) >= today).sort((a, b) => new Date(a.date) - new Date(b.date));
  if (up.length) {
    const n = up[0];
    tEl.textContent = n.title;
    if (mEl) { const p = []; if (n.team && n.team !== 'Alle') p.push(n.team); p.push(n.type); if (n.time) p.push(n.time + ' Uhr'); mEl.textContent = p.join(' · '); }
    startCountdown(n.date + (n.time ? 'T' + n.time + ':00' : 'T18:00:00'), 'cd-d', 'cd-h', 'cd-m');
  }
}

/* ─── TRAINING ────────────────────────────────────────────── */
function deleteTraining(id) {
  if (!confirm('Trainingsidee löschen?')) return;
  Store.set('training', Store.get('training').filter(t => t.id !== id));
  renderTraining();
}
function renderTraining() {
  const c = document.getElementById('training-list'); if (!c) return;
  const list = Store.get('training');
  if (!list.length) { c.innerHTML = '<div class="empty-hint">Noch keine Ideen eingetragen.</div>'; return; }
  const cb = { Aim: 'b-red', Utility: 'b-yellow', Strategie: 'b-blue', Demo: 'b-muted', Kommunikation: 'b-green', Sonstiges: 'b-muted' };
  c.innerHTML = list.map(t => `
    <div class="list-item">
      <span class="badge ${cb[t.cat] || 'b-muted'}" style="flex-shrink:0;margin-top:2px;">${esc(t.cat)}</span>
      <div style="flex:1;">
        <div class="list-item-title">${esc(t.title)}</div>
        ${t.desc ? `<div class="list-item-sub">${esc(t.desc)}</div>` : ''}
        <div class="list-item-meta">${t.dauer ? esc(t.dauer) + ' Min' : ''}${t.dauer && t.von ? ' · ' : ''}${t.von ? 'von ' + esc(t.von) : ''}</div>
      </div>
      <button class="btn btn-danger btn-sm" onclick="deleteTraining('${t.id}')">✕</button>
    </div>`).join('');
}
function initTrainingForm() {
  const form = document.getElementById('training-form'); if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const list = Store.get('training');
    list.push({ id: uid(), title: form.title.value.trim(), cat: form.cat.value, desc: form.desc.value.trim(), dauer: form.dauer.value, von: form.von.value.trim() });
    Store.set('training', list); form.reset(); renderTraining();
    showSaved(form.querySelector('[type=submit]'));
  });
}

/* ─── CUPS / ERGEBNISSE ───────────────────────────────────── */
function deleteCup(id) {
  if (!confirm('Ergebnis löschen?')) return;
  Store.set('cups', Store.get('cups').filter(c => c.id !== id));
  renderCups();
}
function renderCups() {
  const c = document.getElementById('cups-list'); if (!c) return;
  const list = Store.get('cups').sort((a, b) => new Date(b.date) - new Date(a.date));
  if (!list.length) { c.innerHTML = '<div class="empty-hint">Noch keine Ergebnisse eingetragen.</div>'; }
  else {
    const lb = { DachCS: 'b-yellow', ESEA: 'b-yellow', Scrim: 'b-blue', Cup: 'b-red', Sonstiges: 'b-muted' };
    const wb = { W: 'b-green', L: 'b-red', D: 'b-muted' };
    const wl = { W: 'SIEG', L: 'NIEDERLAGE', D: 'UNENTSCHIEDEN' };
    c.innerHTML = list.map(x => `
      <div class="event-item">
        <span class="event-date">${deDate(x.date, { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
        <span class="badge ${wb[x.ergebnis] || 'b-muted'}" style="flex-shrink:0;min-width:104px;text-align:center;">${wl[x.ergebnis] || esc(x.ergebnis)}</span>
        <span class="event-title"><strong>vs. ${esc(x.gegner)}</strong>${x.score ? ` <span class="mono" style="font-size:12px;color:var(--muted2)"> ${esc(x.score)}</span>` : ''}${x.maps ? ` <span style="font-size:11px;color:var(--muted)"> · ${esc(x.maps)}</span>` : ''}</span>
        ${x.notes ? `<span class="event-note" title="${esc(x.notes)}">💬 ${esc(x.notes)}</span>` : ''}
        <span class="badge ${lb[x.liga] || 'b-muted'}">${esc(x.liga)}</span>
        <span class="badge b-muted">${esc(x.team)}</span>
        <div class="event-actions"><button class="btn btn-danger btn-sm" onclick="deleteCup('${x.id}')">✕</button></div>
      </div>`).join('');
  }
  const all = Store.get('cups');
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  const w = all.filter(c => c.ergebnis === 'W').length;
  const l = all.filter(c => c.ergebnis === 'L').length;
  const dr = all.filter(c => c.ergebnis === 'D').length;
  set('stat-total', all.length); set('stat-w', w); set('stat-l', l); set('stat-d', dr);
  renderCupsStats(all, w, l, dr);
}
function renderCupsStats(all, w, l, dr) {
  const host = document.getElementById('cups-stats'); if (!host) return;
  if (!all.length) { host.innerHTML = '<div class="empty-hint">Noch keine Daten für Statistiken.</div>'; return; }
  const dec = w + l;
  const wr = dec ? Math.round((w / dec) * 100) : 0;
  const byDate = all.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  // Aktuelle Serie (nur W oder L, ab letztem Spiel)
  let streak = 0, sChar = byDate[0] ? byDate[0].ergebnis : '';
  for (const c of byDate) { if (c.ergebnis === sChar && sChar !== 'D') streak++; else break; }
  const streakTxt = streak ? streak + (sChar === 'W' ? ' Siege' : ' Niederlagen') + ' in Folge' : '–';
  // Letzte 5
  const last5 = byDate.slice(0, 5).reverse().map(c => {
    const m = { W: 'b-green', L: 'b-red', D: 'b-muted' };
    return `<span class="badge ${m[c.ergebnis] || 'b-muted'}" style="min-width:24px;text-align:center;">${esc(c.ergebnis)}</span>`;
  }).join(' ');
  // je Liga
  const ligas = {};
  all.forEach(c => { const k = c.liga || 'Sonstiges'; (ligas[k] = ligas[k] || { w: 0, l: 0, d: 0 }); if (c.ergebnis === 'W') ligas[k].w++; else if (c.ergebnis === 'L') ligas[k].l++; else ligas[k].d++; });
  // Top-Gegner
  const opp = {};
  all.forEach(c => { const k = c.gegner || '?'; (opp[k] = opp[k] || { n: 0, w: 0, l: 0, d: 0 }); opp[k].n++; if (c.ergebnis === 'W') opp[k].w++; else if (c.ergebnis === 'L') opp[k].l++; else opp[k].d++; });
  const topOpp = Object.keys(opp).sort((a, b) => opp[b].n - opp[a].n).slice(0, 5);
  const bar = `<div style="height:8px;border-radius:4px;overflow:hidden;display:flex;background:var(--bg3);margin:8px 0 4px;">
      <div style="width:${dec ? (w / dec * 100) : 0}%;background:var(--green);"></div>
      <div style="width:${dec ? (l / dec * 100) : 0}%;background:var(--red);"></div>
    </div>`;
  host.innerHTML = `
    <div class="g3" style="margin-bottom:14px;">
      <div class="tile" style="margin:0;"><div class="tile-val" style="color:var(--green);">${wr}%</div><div class="tile-label">Winrate (W/L)</div><div class="tile-sub">${w}–${l}${dr ? ' · ' + dr + ' U' : ''}</div></div>
      <div class="tile" style="margin:0;"><div class="tile-val" style="color:${sChar === 'W' ? 'var(--green)' : sChar === 'L' ? 'var(--red)' : 'var(--text)'};">${streak || '–'}</div><div class="tile-label">Aktuelle Serie</div><div class="tile-sub">${esc(streakTxt)}</div></div>
      <div class="tile" style="margin:0;"><div class="tile-label" style="margin-bottom:6px;">Letzte 5</div><div style="display:flex;gap:4px;flex-wrap:wrap;">${last5 || '–'}</div></div>
    </div>
    ${bar}
    <div class="g2" style="margin:14px 0 0;">
      <div>
        <div class="list-section-label">Bilanz je Liga</div>
        ${Object.keys(ligas).map(k => `<div class="info-row"><span class="info-label">${esc(k)}</span><span class="info-val">${ligas[k].w}–${ligas[k].l}${ligas[k].d ? '–' + ligas[k].d : ''}</span></div>`).join('')}
      </div>
      <div>
        <div class="list-section-label">Häufigste Gegner</div>
        ${topOpp.map(k => `<div class="info-row"><span class="info-label">${esc(k)}</span><span class="info-val">${opp[k].w}–${opp[k].l}${opp[k].d ? '–' + opp[k].d : ''} <span style="color:var(--muted);font-weight:600;">(${opp[k].n})</span></span></div>`).join('')}
      </div>
    </div>`;
}
function initCupsForm() {
  const form = document.getElementById('cups-form'); if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const list = Store.get('cups');
    list.push({ id: uid(), team: form.team.value, date: form.date.value, liga: form.liga.value, gegner: form.gegner.value.trim(), ergebnis: form.ergebnis.value, score: form.score.value.trim(), maps: form.maps.value.trim(), notes: form.notes.value.trim() });
    const cn = list[list.length - 1];
    Store.set('cups', list); form.reset(); renderCups();
    const wl = { W: 'Sieg', L: 'Niederlage', D: 'Unentschieden' }[cn.ergebnis] || cn.ergebnis;
    notifyDiscord('🏆 **Ergebnis (' + cn.team + '):** ' + wl + ' vs. ' + cn.gegner +
      (cn.score ? ' ' + cn.score : '') + ' · ' + cn.liga);
    showSaved(form.querySelector('[type=submit]'));
  });
}

/* ─── ROSTER (datengetrieben + Editor) ────────────────────── */
const TONE = { info: 'info', warn: 'warn' };
let ROSTER_EDIT = false;
function teamById(id) { return getRoster().teams.find(t => t.id === id); }
function saveRoster(r) { Store.set('roster', r); renderRoster(); }
function addPlayer(tid) {
  const name = prompt('Name des Spielers / IGN:'); if (!name) return;
  const r = getRoster(); const t = r.teams.find(x => x.id === tid); if (!t) return;
  const role = prompt('Rolle (z.B. Rifler · Entry):', '') || '';
  const lvl = prompt('FACEIT Level (z.B. 🇩🇪 LVL 7):', '🇩🇪 LVL ') || '';
  (t.players = t.players || []).push({ id: 'p_' + uid(), name: name.trim(), role: role.trim(), lvl: lvl.trim(), captain: false, faceit: name.trim() });
  saveRoster(r);
}
function removePlayer(tid, pid) {
  if (!confirm('Spieler entfernen?')) return;
  const r = getRoster(); const t = r.teams.find(x => x.id === tid); if (!t) return;
  t.players = (t.players || []).filter(p => p.id !== pid); saveRoster(r);
}
function addStandin(tid) {
  const name = prompt('Name des Standins:'); if (!name) return;
  const r = getRoster(); const t = r.teams.find(x => x.id === tid); if (!t) return;
  (t.standins = t.standins || []).push({ id: 's_' + uid(), name: name.trim() }); saveRoster(r);
}
function removeStandin(tid, sid) {
  const r = getRoster(); const t = r.teams.find(x => x.id === tid); if (!t) return;
  t.standins = (t.standins || []).filter(s => s.id !== sid); saveRoster(r);
}
function changeOpen(tid, d) {
  const r = getRoster(); const t = r.teams.find(x => x.id === tid); if (!t) return;
  t.open = Math.max(0, (t.open || 0) + d); saveRoster(r);
}
function toggleRosterEdit() {
  ROSTER_EDIT = !ROSTER_EDIT;
  const b = document.getElementById('roster-edit-btn');
  if (b) b.textContent = ROSTER_EDIT ? '✓ Fertig' : '✎ Bearbeiten';
  renderRoster();
}
function renderRoster() {
  const host = document.getElementById('roster-host'); if (!host) return;
  const r = getRoster();
  const activeId = (document.querySelector('.team-sw-btn.active') || {}).dataset
    ? document.querySelector('.team-sw-btn.active').dataset.team : null;
  const sw = '<div class="team-sw">' + r.teams.map((t, i) =>
    `<button class="team-sw-btn${('t-' + t.id === activeId) || (!activeId && i === 0) ? ' active' : ''}" data-team="t-${t.id}">${esc(t.tag)}</button>`).join('') + '</div>';
  const panels = r.teams.map((t, i) => {
    const isActive = ('t-' + t.id === activeId) || (!activeId && i === 0);
    const cards = (t.players || []).map(p => `
      <div class="player-card">
        <div class="player-photo">
          <div class="player-photo-placeholder">${esc(p.name.slice(0, 2))}</div>
          ${p.captain ? '<div class="player-cap-badge">Captain · IGL</div>' : ''}
          ${p.lvl ? `<div class="player-lvl">${esc(p.lvl)}</div>` : ''}
          ${ROSTER_EDIT ? `<button class="btn btn-danger btn-sm" style="position:absolute;top:8px;right:8px;" onclick="removePlayer('${t.id}','${p.id}')">✕</button>` : ''}
        </div>
        <div class="player-info">
          <div class="player-name">${esc(p.name)}</div>
          <div class="player-role">${esc(p.role || '')}</div>
          ${p.faceit ? `<div class="player-flag"><a href="https://www.faceit.com/de/players/${encodeURIComponent(p.faceit)}" target="_blank" style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--cyan);">FACEIT →</a></div>` : ''}
        </div>
      </div>`).join('');
    let openCards = '';
    for (let k = 0; k < (t.open || 0); k++) openCards += `
      <div class="player-open">
        <div style="font-size:26px;color:var(--muted);">+</div>
        <div class="player-open-label">Spot offen</div>
        <a href="https://discord.gg/GEPrazXBrJ" target="_blank" style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--cyan);">Discord → Tryout</a>
      </div>`;
    const editBar = ROSTER_EDIT ? `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
        <button class="btn btn-ghost btn-sm" onclick="addPlayer('${t.id}')">+ Spieler</button>
        <button class="btn btn-ghost btn-sm" onclick="addStandin('${t.id}')">+ Standin</button>
        <button class="btn btn-ghost btn-sm" onclick="changeOpen('${t.id}',1)">+ offener Spot</button>
        <button class="btn btn-ghost btn-sm" onclick="changeOpen('${t.id}',-1)">– offener Spot</button>
      </div>` : '';
    const standins = (t.standins && t.standins.length) ? `
      <hr><div class="card-title">Standins · ${esc(t.name)}</div>
      <div class="standin-row">${t.standins.map(s => `
        <div class="standin-chip"><div class="standin-chip-av">${esc(s.name.slice(0, 2))}</div>
        <div><div class="standin-name">${esc(s.name)}</div><div class="standin-sub">Standin · bereit</div></div>
        ${ROSTER_EDIT ? `<button class="btn btn-danger btn-sm" onclick="removeStandin('${t.id}','${s.id}')">✕</button>` : ''}</div>`).join('')}</div>` : '';
    return `<div class="team-panel${isActive ? ' active' : ''}" id="t-${t.id}">
      <div class="notice ${TONE[t.tone] || 'info'}" style="margin-bottom:18px;">
        <span>${t.tone === 'warn' ? '⚠️' : 'ℹ️'}</span>
        <span><strong>${esc(t.name)}</strong> — ${esc(t.info || '')}</span>
      </div>
      ${editBar}
      <div class="player-grid">${cards}${openCards}</div>${standins}
    </div>`;
  }).join('');
  host.innerHTML = sw + panels;
  initTeamSwitch();
}

/* ─── PLANER · AUFGABEN (Kanban) ──────────────────────────── */
const TASK_COLS = [{ k: 'todo', t: 'Offen', c: 's-todo' }, { k: 'doing', t: 'In Arbeit', c: 's-doing' }, { k: 'done', t: 'Erledigt', c: 's-done' }];
function deleteTask(id) { if (!confirm('Aufgabe löschen?')) return; Store.set('tasks', Store.get('tasks').filter(t => t.id !== id)); renderTasks(); }
function moveTask(id, dir) {
  const list = Store.get('tasks'); const t = list.find(x => x.id === id); if (!t) return;
  const order = ['todo', 'doing', 'done']; let i = order.indexOf(t.status || 'todo');
  i = Math.max(0, Math.min(2, i + dir)); t.status = order[i];
  Store.set('tasks', list); renderTasks();
}
function renderTasks() {
  const host = document.getElementById('kanban'); if (!host) return;
  const list = Store.get('tasks');
  const pname = id => { const p = allPlayers().find(x => x.id === id); return p ? p.name : ''; };
  host.innerHTML = TASK_COLS.map(col => {
    const items = list.filter(t => (t.status || 'todo') === col.k);
    return `<div class="kanban-col">
      <div class="kanban-col-title"><span>${col.t}</span><span class="kanban-count">${items.length}</span></div>
      ${items.length ? items.map(t => {
        const overdue = t.due && (t.status !== 'done') && new Date(t.due) < new Date(new Date().toDateString());
        return `<div class="task-card ${col.c}">
          <div class="task-title">${esc(t.title)}</div>
          ${t.desc ? `<div style="font-size:12px;color:var(--muted2);line-height:1.5;">${esc(t.desc)}</div>` : ''}
          <div class="task-meta">
            ${t.assignee ? `<span class="badge b-blue" style="font-size:9px;">${esc(pname(t.assignee) || t.assignee)}</span>` : ''}
            ${t.due ? `<span style="color:${overdue ? 'var(--red)' : 'var(--muted2)'}">📅 ${deDate(t.due)}</span>` : ''}
          </div>
          <div class="task-actions">
            ${col.k !== 'todo' ? `<button class="btn btn-ghost btn-sm" onclick="moveTask('${t.id}',-1)">←</button>` : ''}
            ${col.k !== 'done' ? `<button class="btn btn-ghost btn-sm" onclick="moveTask('${t.id}',1)">→</button>` : ''}
            <button class="btn btn-danger btn-sm" onclick="deleteTask('${t.id}')">✕</button>
          </div>
        </div>`;
      }).join('') : '<div class="empty-hint" style="padding:18px;">—</div>'}
    </div>`;
  }).join('');
}
function initTaskForm() {
  const form = document.getElementById('task-form'); if (!form) return;
  const sel = form.querySelector('[name=assignee]'); if (sel) sel.innerHTML = playerOptions();
  form.addEventListener('submit', e => {
    e.preventDefault();
    const list = Store.get('tasks');
    list.push({ id: uid(), title: form.title.value.trim(), desc: form.desc.value.trim(), assignee: form.assignee.value, due: form.due.value, status: 'todo' });
    Store.set('tasks', list); form.reset(); renderTasks();
    showSaved(form.querySelector('[type=submit]'));
  });
}

/* ─── PLANER · VERFÜGBARKEIT ──────────────────────────────── */
const AV_DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const AV_CYCLE = { '': 'yes', yes: 'maybe', maybe: 'no', no: '' };
const AV_LABEL = { '': '–', yes: '✓', maybe: '~', no: '✕' };
function cycleAvail(pid, day) {
  const a = Store.get('availability', {}); if (!a[pid]) a[pid] = {};
  a[pid][day] = AV_CYCLE[a[pid][day] || ''];
  Store.set('availability', a); renderAvail();
}
function renderAvail() {
  const host = document.getElementById('avail-host'); if (!host) return;
  const players = allPlayers().filter(p => p.name.indexOf('(Standin)') === -1);
  const a = Store.get('availability', {});
  if (!players.length) { host.innerHTML = '<div class="empty-hint">Keine Spieler im Roster.</div>'; return; }
  host.innerHTML = `<div class="table-wrap"><table class="avail-table">
    <tr><th class="avail-name">Spieler</th>${AV_DAYS.map(d => `<th>${d}</th>`).join('')}</tr>
    ${players.map(p => `<tr>
      <td class="avail-name">${esc(p.name)}<span style="color:var(--muted);font-weight:600;"> · ${esc(p.team)}</span></td>
      ${AV_DAYS.map(d => {
        const v = (a[p.id] && a[p.id][d]) || '';
        return `<td><button class="avail-cell ${v}" onclick="cycleAvail('${p.id}','${d}')" title="Klicken zum Wechseln">${AV_LABEL[v]}</button></td>`;
      }).join('')}
    </tr>`).join('')}
  </table></div>
  <div class="map-legend" style="margin-top:16px;">
    <div class="legend-item"><span class="badge b-green">✓ Verfügbar</span></div>
    <div class="legend-item"><span class="badge b-yellow">~ Vielleicht</span></div>
    <div class="legend-item"><span class="badge b-red">✕ Nicht</span></div>
    <div class="legend-item" style="color:var(--muted);">Zelle klicken zum Durchschalten</div>
  </div>`;
}

/* ─── LINEUPS / ANWESENHEIT ───────────────────────────────── */
function deleteLineup(id) { if (!confirm('Lineup löschen?')) return; Store.set('lineups', Store.get('lineups').filter(l => l.id !== id)); renderLineups(); }
function renderLineups() {
  const c = document.getElementById('lineup-list'); if (!c) return;
  const list = Store.get('lineups').sort((a, b) => new Date(b.date) - new Date(a.date));
  if (!list.length) { c.innerHTML = '<div class="empty-hint">Noch keine Lineups eingetragen.</div>'; return; }
  const pname = id => { const p = allPlayers().find(x => x.id === id); return p ? p.name : id; };
  c.innerHTML = list.map(l => `
    <div class="card" style="margin-bottom:12px;">
      <div class="strat-card-header" style="margin-bottom:10px;">
        <span class="event-date">${deDate(l.date)}</span>
        <span class="strat-card-name">vs. ${esc(l.gegner || '—')}</span>
        <span class="badge b-muted">${esc(l.team)}</span>
        ${l.typ ? `<span class="badge b-blue">${esc(l.typ)}</span>` : ''}
        <button class="btn btn-danger btn-sm" onclick="deleteLineup('${l.id}')">✕</button>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${(l.starters || []).map(id => `<span class="badge b-green">✓ ${esc(pname(id))}</span>`).join('')}
        ${(l.standins || []).map(id => `<span class="badge b-yellow">↻ ${esc(pname(id))}</span>`).join('')}
        ${(l.out || []).map(id => `<span class="badge b-red">✕ ${esc(pname(id))}</span>`).join('')}
      </div>
      ${l.notes ? `<div class="list-item-sub" style="margin-top:10px;">${esc(l.notes)}</div>` : ''}
    </div>`).join('');
}
function initLineupForm() {
  const form = document.getElementById('lineup-form'); if (!form) return;
  const box = document.getElementById('lineup-players');
  function rebuild() {
    box.innerHTML = allPlayers().filter(p => p.name.indexOf('(Standin)') === -1).map(p => `
      <div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border);">
        <span style="flex:1;font-weight:600;">${esc(p.name)} <span style="color:var(--muted);font-size:11px;">· ${esc(p.team)}</span></span>
        <select name="st_${p.id}" class="filter-select" style="width:130px;">
          <option value="">— nicht dabei —</option>
          <option value="start">✓ Startet</option>
          <option value="stand">↻ Standin</option>
          <option value="out">✕ Fehlt</option>
        </select>
      </div>`).join('') || '<div class="empty-hint">Keine Spieler im Roster.</div>';
  }
  rebuild();
  form.addEventListener('submit', e => {
    e.preventDefault();
    const starters = [], standins = [], out = [];
    allPlayers().forEach(p => {
      const s = form.querySelector(`[name="st_${p.id}"]`); if (!s) return;
      if (s.value === 'start') starters.push(p.id);
      else if (s.value === 'stand') standins.push(p.id);
      else if (s.value === 'out') out.push(p.id);
    });
    const list = Store.get('lineups');
    list.push({ id: uid(), date: form.date.value, gegner: form.gegner.value.trim(), team: form.team.value, typ: form.typ.value, starters, standins, out, notes: form.notes.value.trim() });
    Store.set('lineups', list); form.reset(); rebuild(); renderLineups();
    showSaved(form.querySelector('[type=submit]'));
  });
}

/* ─── DEMOS / VODs ────────────────────────────────────────── */
function deleteDemo(id) { if (!confirm('Demo löschen?')) return; Store.set('demos', Store.get('demos').filter(d => d.id !== id)); renderDemos(); }
function renderDemos() {
  const c = document.getElementById('demo-list'); if (!c) return;
  let list = Store.get('demos').sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  const fEl = document.getElementById('demo-filter');
  if (fEl && fEl.value) list = list.filter(d => d.map === fEl.value);
  if (!list.length) { c.innerHTML = '<div class="empty-hint">Noch keine Demos / VODs gesammelt.</div>'; return; }
  c.innerHTML = list.map(d => `
    <div class="list-item">
      <span class="badge b-blue" style="flex-shrink:0;margin-top:2px;">${esc(d.map || '—')}</span>
      <div style="flex:1;">
        <div class="list-item-title">${esc(d.title)}${d.gegner ? ` <span style="color:var(--muted2);font-size:12px;">vs. ${esc(d.gegner)}</span>` : ''}</div>
        ${d.notes ? `<div class="list-item-sub">${esc(d.notes)}</div>` : ''}
        <div class="list-item-meta">${d.date ? deDate(d.date) : ''} ${d.url ? `· <a href="${esc(d.url)}" target="_blank" class="info-link">Demo / VOD öffnen →</a>` : ''}</div>
      </div>
      <button class="btn btn-danger btn-sm" onclick="deleteDemo('${d.id}')">✕</button>
    </div>`).join('');
}
function initDemoForm() {
  const form = document.getElementById('demo-form'); if (!form) return;
  const f = document.getElementById('demo-filter'); if (f) f.addEventListener('change', renderDemos);
  form.addEventListener('submit', e => {
    e.preventDefault();
    const list = Store.get('demos');
    list.push({ id: uid(), title: form.title.value.trim(), url: form.url.value.trim(), map: form.map.value, gegner: form.gegner.value.trim(), date: form.date.value, notes: form.notes.value.trim() });
    Store.set('demos', list); form.reset(); renderDemos();
    showSaved(form.querySelector('[type=submit]'));
  });
}

/* ─── SCOUTING ────────────────────────────────────────────── */
function deleteScout(id) { if (!confirm('Scouting-Eintrag löschen?')) return; Store.set('scouting', Store.get('scouting').filter(s => s.id !== id)); renderScout(); }
function toggleScout(id) { const el = document.getElementById('sct-' + id); if (el) el.classList.toggle('expanded'); }
function renderScout() {
  const c = document.getElementById('scout-list'); if (!c) return;
  const list = Store.get('scouting').sort((a, b) => esc(a.gegner).localeCompare(esc(b.gegner)));
  if (!list.length) { c.innerHTML = '<div class="empty-hint">Noch keine Gegner gescoutet.</div>'; return; }
  c.innerHTML = list.map(s => `
    <div class="strat-card" id="sct-${s.id}" onclick="toggleScout('${s.id}')">
      <div class="strat-card-header">
        <span style="width:10px;height:10px;border-radius:50%;background:var(--amber);flex-shrink:0;display:inline-block;"></span>
        <span class="strat-card-name">${esc(s.gegner)}</span>
        ${s.maps ? `<span class="badge b-blue" style="font-size:9px;">${esc(s.maps)}</span>` : ''}
        <span class="strat-arrow" style="color:var(--muted);font-size:16px;margin-left:auto;">▾</span>
        <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteScout('${s.id}')">✕</button>
      </div>
      <div class="strat-body">
        ${s.tendenzen ? `<div style="margin-bottom:12px;"><div class="card-title">Tendenzen</div><div class="list-item-sub">${esc(s.tendenzen)}</div></div>` : ''}
        ${s.spieler ? `<div style="margin-bottom:12px;"><div class="card-title">Schlüsselspieler</div><div class="list-item-sub">${esc(s.spieler)}</div></div>` : ''}
        <div class="list-item-meta">${s.date ? 'Stand: ' + deDate(s.date) : ''}</div>
      </div>
    </div>`).join('');
}
function initScoutForm() {
  const form = document.getElementById('scout-form'); if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const list = Store.get('scouting');
    list.push({ id: uid(), gegner: form.gegner.value.trim(), maps: form.maps.value.trim(), tendenzen: form.tendenzen.value.trim(), spieler: form.spieler.value.trim(), date: form.date.value });
    Store.set('scouting', list); form.reset(); renderScout();
    showSaved(form.querySelector('[type=submit]'));
  });
}

/* ─── SCHWARZES BRETT (Notes) ─────────────────────────────── */
function deleteNote(id) { if (!confirm('Eintrag löschen?')) return; Store.set('notes', Store.get('notes').filter(n => n.id !== id)); renderNotes(); }
function pinNote(id) {
  const list = Store.get('notes'); const n = list.find(x => x.id === id); if (n) n.pinned = !n.pinned;
  Store.set('notes', list); renderNotes();
}
function renderNotes() {
  const c = document.getElementById('notes-list'); if (!c) return;
  const list = Store.get('notes').slice().sort((a, b) =>
    (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.date || 0) - new Date(a.date || 0));
  if (!list.length) { c.innerHTML = '<div class="empty-hint">Schwarzes Brett ist leer.</div>'; return; }
  c.innerHTML = list.map(n => `
    <div class="note-card${n.pinned ? ' pin' : ''}">
      <div class="note-head">
        ${n.pinned ? '<span title="Angepinnt">📌</span>' : ''}
        <span class="note-title">${esc(n.title)}</span>
        <button class="btn btn-ghost btn-sm" onclick="pinNote('${n.id}')">${n.pinned ? 'Lösen' : 'Pin'}</button>
        <button class="btn btn-danger btn-sm" onclick="deleteNote('${n.id}')">✕</button>
      </div>
      <div class="note-body">${esc(n.body)}</div>
      <div class="note-meta">${n.author ? esc(n.author) + ' · ' : ''}${n.date ? deDate(n.date, { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}</div>
    </div>`).join('');
}
function initNoteForm() {
  const form = document.getElementById('note-form'); if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const list = Store.get('notes');
    list.push({ id: uid(), title: form.title.value.trim(), body: form.body.value.trim(), author: form.author.value.trim(), pinned: false, date: new Date().toISOString().slice(0, 10) });
    const nn = list[list.length - 1];
    Store.set('notes', list); form.reset(); renderNotes();
    notifyDiscord('📢 **Schwarzes Brett:** ' + nn.title + '\n' +
      (nn.body || '').slice(0, 280));
    showSaved(form.querySelector('[type=submit]'));
  });
}

/* ─── DASHBOARD-WIDGETS ───────────────────────────────────── */
function renderDashboard() {
  const host = document.getElementById('dash-widgets'); if (!host) return;
  const today = new Date(new Date().toDateString());
  const in7 = new Date(today.getTime() + 7 * 86400000);
  const week = Store.get('termine')
    .filter(t => { const d = new Date(t.date); return d >= today && d < in7; })
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const tasks = Store.get('tasks').filter(t => (t.status || 'todo') !== 'done');
  const av = Store.get('availability', {});
  const dayKey = AV_DAYS[(new Date().getDay() + 6) % 7];
  const players = allPlayers().filter(p => p.name.indexOf('(Standin)') === -1);
  const yes = players.filter(p => av[p.id] && av[p.id][dayKey] === 'yes');
  const maybe = players.filter(p => av[p.id] && av[p.id][dayKey] === 'maybe');
  const pname = id => { const p = allPlayers().find(x => x.id === id); return p ? p.name : ''; };

  host.innerHTML = `
    <div class="card" style="margin:0;">
      <div class="card-title">Diese Woche</div>
      ${week.length ? week.slice(0, 5).map(t => `
        <div class="event-item" style="padding:9px 0;">
          <span class="event-date">${deDate(t.date)}</span>
          <span class="event-dot" style="background:${TEAM_COLORS[t.team] || 'var(--muted2)'}"></span>
          <span class="event-title">${esc(t.title)}${t.time ? ` <span class="mono" style="font-size:11px;color:var(--muted2)">· ${esc(t.time)}</span>` : ''}</span>
          <span class="badge b-muted" style="font-size:9px;">${esc(t.team || 'Alle')}</span>
        </div>`).join('') : '<div class="empty-hint" style="padding:18px;">Nichts in den nächsten 7 Tagen.</div>'}
      <a href="termine.html" class="info-link" style="display:inline-block;margin-top:10px;">Zum Kalender →</a>
    </div>
    <div class="card" style="margin:0;">
      <div class="card-title">Offene Aufgaben · ${tasks.length}</div>
      ${tasks.length ? tasks.slice(0, 5).map(t => `
        <div class="event-item" style="padding:9px 0;">
          <span class="event-title">${esc(t.title)}</span>
          ${t.assignee ? `<span class="badge b-blue" style="font-size:9px;">${esc(pname(t.assignee) || t.assignee)}</span>` : ''}
          ${t.due ? `<span class="mono" style="font-size:10px;color:${new Date(t.due) < today ? 'var(--red)' : 'var(--muted2)'};">${deDate(t.due)}</span>` : ''}
        </div>`).join('') : '<div class="empty-hint" style="padding:18px;">Keine offenen Aufgaben.</div>'}
      <a href="planer.html" class="info-link" style="display:inline-block;margin-top:10px;">Zum Planer →</a>
    </div>
    <div class="card" style="margin:0;">
      <div class="card-title">Verfügbar heute (${dayKey})</div>
      <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:10px;">
        <span style="font-family:'Barlow Condensed',sans-serif;font-size:34px;font-weight:900;color:var(--green);line-height:1;">${yes.length}</span>
        <span style="color:var(--muted2);font-size:12px;">von ${players.length}${maybe.length ? ` · ${maybe.length} vielleicht` : ''}</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        ${yes.map(p => `<span class="badge b-green" style="font-size:9px;">${esc(p.name)}</span>`).join('')}
        ${maybe.map(p => `<span class="badge b-yellow" style="font-size:9px;">${esc(p.name)}</span>`).join('')}
        ${(!yes.length && !maybe.length) ? '<span style="color:var(--muted);font-size:12px;">Noch nichts eingetragen.</span>' : ''}
      </div>
      <a href="planer.html" class="info-link" style="display:inline-block;margin-top:10px;">Verfügbarkeit →</a>
    </div>`;
}

/* ─── INIT ────────────────────────────────────────────────── */
// Einmalig: Nav, Listener, Formulare (NICHT bei jedem Re-Render!)
function initOnce() {
  buildNav();
  initMobile();
  initBackup();
  initTeamSwitch();
  initSimpleTabs();
  initCalSwitch();
  initCalNav();
  initTermineForm();
  initTrainingForm();
  initCupsForm();
  const reb = document.getElementById('roster-edit-btn');
  if (reb) reb.addEventListener('click', toggleRosterEdit);
  initTaskForm();
  initLineupForm();
  initDemoForm();
  initScoutForm();
  initNoteForm();
}
// Bei jedem Datenstand neu zeichnen (lokal & nach Cloud-Update)
function renderAll() {
  renderTermine(); renderCalendar(); updateNextEvent();
  renderTraining();
  renderCups();
  renderRoster();
  renderTasks(); renderAvail();
  renderLineups();
  renderDemos();
  renderScout();
  renderNotes();
  renderDashboard();
  // Stratbook (eigenes Inline-Script) mitziehen, falls vorhanden
  try { if (typeof renderStrats === 'function') renderStrats(); } catch (e) {}
  try { if (typeof renderDrawings === 'function') renderDrawings(); } catch (e) {}
  try { if (window.mapCanvas && mapCanvas.load) { mapCanvas.load(); mapCanvas.draw(); } } catch (e) {}
}
window.renderAll = renderAll;

document.addEventListener('DOMContentLoaded', () => {
  initOnce();
  renderAll(); // sofortiger Erst-Render aus lokalem Cache
  // Cloud-Sync übernimmt ab jetzt (falls konfiguriert) — siehe cloud.js
  if (window.PortalCloud && typeof PortalCloud.boot === 'function') {
    PortalCloud.boot();
  }
});
