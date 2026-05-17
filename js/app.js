// DieDonuts Esports · Internes Portal · app.js

// ── Navigation ──
function buildNav() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  const links = [
    { href: 'index.html',     icon: '◈', label: 'Dashboard'  },
    { href: 'roster.html',    icon: '◧', label: 'Roster'     },
    { href: 'termine.html',   icon: '◫', label: 'Kalender'   },
    { href: 'cups.html',      icon: '◆', label: 'Ergebnisse' },
    { href: 'training.html',  icon: '◎', label: 'Training'   },
    { href: 'stratbook.html', icon: '◉', label: 'Stratbook'  },
  ];
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;
  nav.innerHTML = links.map(l => {
    const active = current === l.href ? ' active' : '';
    return `<a href="${l.href}" class="nav-link${active}"><span class="nav-icon">${l.icon}</span>${l.label}</a>`;
  }).join('');
}

// ── Mobile Menu ──
function initMobile() {
  // Overlay
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.id = 'sidebar-overlay';
  overlay.addEventListener('click', closeSidebar);
  document.body.appendChild(overlay);

  // Mobile-Header
  const main = document.querySelector('.main');
  if (!main) return;
  const pageTitle = document.querySelector('.page-title');
  const mobileHeader = document.createElement('div');
  mobileHeader.className = 'mobile-header';
  mobileHeader.innerHTML = `
    <button class="hamburger" id="hamburger-btn" aria-label="Menü">
      <span></span><span></span><span></span>
    </button>
    <span class="mobile-title">${pageTitle ? pageTitle.textContent : 'DieDonuts'}</span>
    <img src="https://donuts-esports.de/assets/logo_trans.png" class="mobile-logo" alt="DieDonuts">
  `;
  main.insertBefore(mobileHeader, main.firstChild);
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
  const btn = document.getElementById('hamburger-btn');
  if (btn) btn.classList.remove('is-open');
}

// ── Countdown ──
function startCountdown(targetDate, dayId, hourId, minId) {
  function update() {
    const diff = new Date(targetDate) - new Date();
    const d = document.getElementById(dayId);
    const h = document.getElementById(hourId);
    const m = document.getElementById(minId);
    if (diff <= 0) { if(d) d.textContent='0'; if(h) h.textContent='0'; if(m) m.textContent='0'; return; }
    if (d) d.textContent = Math.floor(diff / 86400000);
    if (h) h.textContent = Math.floor((diff % 86400000) / 3600000);
    if (m) m.textContent = Math.floor((diff % 3600000) / 60000);
  }
  update();
  setInterval(update, 30000);
}

// ── Team Switch ──
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

// ── Tabs ──
function initTabs(sel) {
  document.querySelectorAll(sel + ' .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const container = tab.closest(sel) || document.body;
      container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      container.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
      tab.classList.add('active');
      const panel = document.getElementById(tab.dataset.tab);
      if (panel) panel.style.display = 'block';
    });
  });
}

// ────────────────────────────────────────────
// ── TERMINE ──
// ────────────────────────────────────────────
const TERMINE_KEY = 'dnd_termine';
function getTermine() { try { return JSON.parse(localStorage.getItem(TERMINE_KEY)) || []; } catch { return []; } }
function saveTermine(list) { localStorage.setItem(TERMINE_KEY, JSON.stringify(list)); }

function deleteTermin(id) {
  if (!confirm('Termin löschen?')) return;
  saveTermine(getTermine().filter(t => t.id !== id));
  renderTermine(); renderCalendar(); updateNextEvent();
}

function renderTermine() {
  const container = document.getElementById('termine-list');
  if (!container) return;
  const list = getTermine().sort((a,b) => new Date(a.date)-new Date(b.date));
  const today = new Date(new Date().toDateString());
  const upcoming = list.filter(t => new Date(t.date) >= today);
  const past     = list.filter(t => new Date(t.date) <  today);
  if (!list.length) { container.innerHTML = '<div class="empty-hint">Noch keine Termine eingetragen.</div>'; return; }
  const typeDots  = { Training:'var(--red)', DachCS:'var(--yellow)', ESEA:'var(--yellow)', Meeting:'var(--blue)', Scrimmage:'var(--green)', Sonstiges:'var(--muted2)' };
  const typeBadge = { Training:'b-red', DachCS:'b-yellow', ESEA:'b-yellow', Meeting:'b-blue', Scrimmage:'b-green', Sonstiges:'b-muted' };
  function renderGroup(items, title) {
    if (!items.length) return '';
    let html = `<div class="list-section-label">${title}</div>`;
    items.forEach(t => {
      const dateStr = new Date(t.date).toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit'});
      html += `<div class="event-item">
        <span class="event-date">${dateStr}</span>
        <span class="event-dot" style="background:${typeDots[t.type]||'var(--muted2)'}"></span>
        <span class="event-title">${t.title}${t.time?` <span class="mono" style="font-size:11px;color:var(--muted2)"> · ${t.time} Uhr</span>`:''}${t.team&&t.team!=='Alle'?` <span class="badge b-muted" style="font-size:9px;margin-left:4px;">${t.team}</span>`:''}</span>
        ${t.notes?`<span class="event-note" title="${t.notes}">💬 ${t.notes}</span>`:''}
        <span class="badge ${typeBadge[t.type]||'b-muted'}" style="flex-shrink:0;">${t.type}</span>
        <div class="event-actions"><button class="btn btn-danger btn-sm" onclick="deleteTermin('${t.id}')">✕</button></div>
      </div>`;
    });
    return html;
  }
  container.innerHTML = renderGroup(upcoming,'Kommend') + renderGroup(past,'Vergangen');
}

function renderCalendar() {
  const cal = document.getElementById('cal-grid');
  if (!cal) return;
  const now = new Date(), year = now.getFullYear(), month = now.getMonth();
  const offset = (new Date(year,month,1).getDay()+6)%7;
  const daysInMonth = new Date(year,month+1,0).getDate();
  const byDay = {};
  getTermine().forEach(t => {
    const d = new Date(t.date);
    if (d.getFullYear()===year && d.getMonth()===month) { const k=d.getDate(); if(!byDay[k]) byDay[k]=[]; byDay[k].push(t); }
  });
  const typeClass = { Training:'ev-red', DachCS:'ev-yellow', ESEA:'ev-yellow', Meeting:'ev-blue', Scrimmage:'ev-green', Sonstiges:'ev-blue' };
  let cells = ['Mo','Di','Mi','Do','Fr','Sa','So'].map(d=>`<div class="cal-hd">${d}</div>`).join('');
  for(let i=0;i<offset;i++) cells+='<div class="cal-day empty"></div>';
  for(let d=1;d<=daysInMonth;d++) {
    const isToday = d===now.getDate();
    const events = byDay[d]||[];
    const evHtml = events.slice(0,2).map(e=>`<div class="cal-ev ${typeClass[e.type]||'ev-blue'}">${e.title}</div>`).join('');
    const more = events.length>2?`<div style="font-size:9px;color:var(--muted);margin-top:2px;">+${events.length-2}</div>`:'';
    cells+=`<div class="cal-day${isToday?' today':''}"><div class="cal-day-num">${String(d).padStart(2,'0')}</div>${evHtml}${more}</div>`;
  }
  cal.innerHTML = cells;
}

function initTermineForm() {
  const form = document.getElementById('termin-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const list = getTermine();
    list.push({ id:Date.now().toString(), title:form.querySelector('[name=title]').value.trim(), date:form.querySelector('[name=date]').value, time:form.querySelector('[name=time]').value, type:form.querySelector('[name=type]').value, team:form.querySelector('[name=team]').value, notes:form.querySelector('[name=notes]').value.trim() });
    saveTermine(list); form.reset(); renderTermine(); renderCalendar(); updateNextEvent();
    showSaved(form.querySelector('[type=submit]'));
  });
}

function updateNextEvent() {
  const titleEl = document.getElementById('next-event-title');
  const metaEl  = document.getElementById('next-event-meta');
  if (!titleEl) return;
  const today = new Date(new Date().toDateString());
  const upcoming = getTermine().filter(t=>new Date(t.date)>=today).sort((a,b)=>new Date(a.date)-new Date(b.date));
  if (upcoming.length > 0) {
    const next = upcoming[0];
    titleEl.textContent = next.title;
    if (metaEl) { const parts=[]; if(next.team&&next.team!=='Alle') parts.push(next.team); parts.push(next.type); if(next.time) parts.push(next.time+' Uhr'); metaEl.textContent=parts.join(' · '); }
    startCountdown(next.date+(next.time?'T'+next.time+':00':'T18:00:00'),'cd-d','cd-h','cd-m');
  }
}

// ────────────────────────────────────────────
// ── TRAINING ──
// ────────────────────────────────────────────
const TRAINING_KEY = 'dnd_training';
function getTraining() { try { return JSON.parse(localStorage.getItem(TRAINING_KEY)) || []; } catch { return []; } }
function saveTraining(list) { localStorage.setItem(TRAINING_KEY, JSON.stringify(list)); }

function deleteTraining(id) {
  if (!confirm('Trainingsidee löschen?')) return;
  saveTraining(getTraining().filter(t=>t.id!==id));
  renderTraining();
}

function renderTraining() {
  const container = document.getElementById('training-list');
  if (!container) return;
  const list = getTraining();
  if (!list.length) { container.innerHTML='<div class="empty-hint">Noch keine Ideen eingetragen.</div>'; return; }
  const catBadge = { Aim:'b-red', Utility:'b-yellow', Strategie:'b-blue', Demo:'b-muted', Kommunikation:'b-green', Sonstiges:'b-muted' };
  container.innerHTML = list.map(t => `
    <div class="list-item">
      <span class="badge ${catBadge[t.cat]||'b-muted'}" style="flex-shrink:0;margin-top:2px;">${t.cat}</span>
      <div style="flex:1;">
        <div class="list-item-title">${t.title}</div>
        ${t.desc?`<div class="list-item-sub">${t.desc}</div>`:''}
        <div class="list-item-meta">${t.dauer?t.dauer+' Min':''}${t.dauer&&t.von?' · ':''}${t.von?'von '+t.von:''}</div>
      </div>
      <button class="btn btn-danger btn-sm" onclick="deleteTraining('${t.id}')">✕</button>
    </div>`).join('');
}

function initTrainingForm() {
  const form = document.getElementById('training-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const list = getTraining();
    list.push({ id:Date.now().toString(), title:form.querySelector('[name=title]').value.trim(), cat:form.querySelector('[name=cat]').value, desc:form.querySelector('[name=desc]').value.trim(), dauer:form.querySelector('[name=dauer]').value, von:form.querySelector('[name=von]').value.trim() });
    saveTraining(list); form.reset(); renderTraining();
    showSaved(form.querySelector('[type=submit]'));
  });
}

// ────────────────────────────────────────────
// ── CUPS ──
// ────────────────────────────────────────────
const CUPS_KEY = 'dnd_cups';
function getCups() { try { return JSON.parse(localStorage.getItem(CUPS_KEY)) || []; } catch { return []; } }
function saveCups(list) { localStorage.setItem(CUPS_KEY, JSON.stringify(list)); }

function deleteCup(id) {
  if (!confirm('Ergebnis löschen?')) return;
  saveCups(getCups().filter(c=>c.id!==id));
  renderCups();
}

function renderCups() {
  const container = document.getElementById('cups-list');
  if (!container) return;
  const list = getCups().sort((a,b)=>new Date(b.date)-new Date(a.date));
  if (!list.length) { container.innerHTML='<div class="empty-hint">Noch keine Ergebnisse eingetragen.</div>'; return; }
  const ligaBadge = { DachCS:'b-yellow', ESEA:'b-yellow', Scrim:'b-blue', Cup:'b-red', Sonstiges:'b-muted' };
  const wlBadge   = { W:'b-green', L:'b-red', D:'b-muted' };
  const wlLabel   = { W:'SIEG', L:'NIEDERLAGE', D:'UNENTSCHIEDEN' };
  container.innerHTML = list.map(c => {
    const dateStr = new Date(c.date).toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',year:'2-digit'});
    return `<div class="event-item">
      <span class="event-date">${dateStr}</span>
      <span class="badge ${wlBadge[c.ergebnis]||'b-muted'}" style="flex-shrink:0;min-width:100px;text-align:center;">${wlLabel[c.ergebnis]||c.ergebnis}</span>
      <span class="event-title"><strong>vs. ${c.gegner}</strong>${c.score?` <span class="mono" style="font-size:12px;color:var(--muted2)"> ${c.score}</span>`:''}${c.maps?` <span style="font-size:11px;color:var(--muted)"> · ${c.maps}</span>`:''}</span>
      ${c.notes?`<span class="event-note" title="${c.notes}">💬 ${c.notes}</span>`:''}
      <span class="badge ${ligaBadge[c.liga]||'b-muted'}" style="flex-shrink:0;">${c.liga}</span>
      <span class="badge b-muted" style="flex-shrink:0;">${c.team}</span>
      <div class="event-actions"><button class="btn btn-danger btn-sm" onclick="deleteCup('${c.id}')">✕</button></div>
    </div>`;
  }).join('');
  const all = getCups();
  const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
  set('stat-total',all.length); set('stat-w',all.filter(c=>c.ergebnis==='W').length);
  set('stat-l',all.filter(c=>c.ergebnis==='L').length); set('stat-d',all.filter(c=>c.ergebnis==='D').length);
}

function initCupsForm() {
  const form = document.getElementById('cups-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const list = getCups();
    list.push({ id:Date.now().toString(), team:form.querySelector('[name=team]').value, date:form.querySelector('[name=date]').value, liga:form.querySelector('[name=liga]').value, gegner:form.querySelector('[name=gegner]').value.trim(), ergebnis:form.querySelector('[name=ergebnis]').value, score:form.querySelector('[name=score]').value.trim(), maps:form.querySelector('[name=maps]').value.trim(), notes:form.querySelector('[name=notes]').value.trim() });
    saveCups(list); form.reset(); renderCups();
    showSaved(form.querySelector('[type=submit]'));
  });
}

// ────────────────────────────────────────────
// ── HELPER ──
// ────────────────────────────────────────────
function showSaved(btn) {
  if (!btn) return;
  const orig = btn.textContent;
  btn.textContent = '✓ Gespeichert';
  btn.style.cssText += 'background:var(--green)!important;color:#000!important;';
  setTimeout(()=>{ btn.textContent=orig; btn.style.cssText=''; }, 1800);
}

// ────────────────────────────────────────────
// ── INIT ──
// ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildNav();
  initMobile();
  initTeamSwitch();
  initTabs('.tabs-container');
  renderTermine();
  renderCalendar();
  initTermineForm();
  renderTraining();
  initTrainingForm();
  renderCups();
  initCupsForm();
  updateNextEvent();
  const label = document.getElementById('cal-month-label');
  if (label) label.textContent = new Date().toLocaleDateString('de-DE',{month:'long',year:'numeric'});
});
