/* ═══════════════════════════════════════════════════════════════
   DieDonuts · Faceit Live Integration
   KRCUP CS 24 Swiss Round
   ═══════════════════════════════════════════════════════════════ */

const FACEIT_CFG = {
  apiKey:    window.FACEIT_API_KEY || '',
  teamId:    '46c77ad9-8098-4c9c-a674-00a6a79a303e',
  champId:   'dc9775e3-8ba8-4c23-ac48-b41a990f3a9f',
  cupName:   'KRCUP CS 24 · Swiss Round',
  cupUrl:    'https://www.faceit.com/de/championship/dc9775e3-8ba8-4c23-ac48-b41a990f3a9f/KRCUP%20CS%2024%20Swiss%20Round',
  base:      'https://open.faceit.com/data/v4'
};

const MAP_LABELS = {
  de_dust2:'Dust2', de_mirage:'Mirage', de_nuke:'Nuke', de_overpass:'Overpass',
  de_ancient:'Ancient', de_inferno:'Inferno', de_anubis:'Anubis',
  de_vertigo:'Vertigo', de_cache:'Cache', de_train:'Train'
};

/* ─── API ──────────────────────────────────────────────────── */
async function faceitGet(path) {
  const r = await fetch(FACEIT_CFG.base + path, {
    headers: { Authorization: 'Bearer ' + FACEIT_CFG.apiKey }
  });
  if (!r.ok) throw new Error('Faceit API ' + r.status);
  return r.json();
}

async function fetchCupMatchType(type, limit) {
  const d = await faceitGet(
    '/championships/' + FACEIT_CFG.champId +
    '/matches?type=' + type + '&offset=0&limit=' + (limit || 20)
  );
  return (d.items || []).filter(m => {
    const f1 = m.teams?.faction1?.faction_id;
    const f2 = m.teams?.faction2?.faction_id;
    return f1 === FACEIT_CFG.teamId || f2 === FACEIT_CFG.teamId;
  });
}

async function fetchAllOurMatches() {
  const [past, ongoing, upcoming] = await Promise.all([
    fetchCupMatchType('past', 30),
    fetchCupMatchType('ongoing', 10),
    fetchCupMatchType('upcoming', 10)
  ]);
  return { past, ongoing, upcoming };
}

/* ─── PARSER ───────────────────────────────────────────────── */
function parseMatch(m) {
  const isF1  = m.teams?.faction1?.faction_id === FACEIT_CFG.teamId;
  const usKey = isF1 ? 'faction1' : 'faction2';
  const thKey = isF1 ? 'faction2' : 'faction1';
  const us    = m.teams?.[usKey] || {};
  const them  = m.teams?.[thKey] || {};

  const score  = m.results?.score;
  const winner = m.results?.winner;
  const usScore   = score ? score[usKey]   : null;
  const themScore = score ? score[thKey]   : null;
  const won = winner ? winner === usKey : null;

  const maps = (m.voting?.map?.pick || []).map(id => MAP_LABELS[id] || id);
  const mapScores = (m.detailed_results || []).map((r, i) => ({
    map:    maps[i] || 'Map ' + (i + 1),
    us:     r.factions?.[usKey]?.score,
    them:   r.factions?.[thKey]?.score,
    wonMap: r.winner === usKey
  }));

  return {
    id:             m.match_id,
    status:         m.status,
    opponent:       them.name || them.nickname || '?',
    opponentAvatar: them.avatar || '',
    scheduled:      m.scheduled_at ? new Date(m.scheduled_at * 1000) : null,
    usScore, themScore, won, maps, mapScores,
    bestOf: m.best_of,
    round:  m.round,
    url:    (m.faceit_url || '').replace('{lang}', 'de')
  };
}

/* ─── KLEINE HELPER ────────────────────────────────────────── */
function fEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g,
    c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
}

function resultBadge(won) {
  if (won === true)  return '<span class="badge b-green" style="font-size:10px;padding:1px 6px;">W</span>';
  if (won === false) return '<span class="badge b-red"   style="font-size:10px;padding:1px 6px;">L</span>';
  return '<span class="badge b-muted" style="font-size:10px;padding:1px 6px;">?</span>';
}

function avatarImg(url, size) {
  if (!url) return '';
  return '<img src="' + url + '" style="width:' + size + 'px;height:' + size + 'px;' +
    'border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.style.display=\'none\'">';
}

function mapLine(mapScores) {
  if (!mapScores.length) return '';
  return '<div style="display:flex;gap:5px;margin-top:5px;flex-wrap:wrap;">' +
    mapScores.map(ms =>
      '<span class="mono" style="font-size:9px;padding:2px 5px;background:var(--bg3);border-radius:3px;' +
      'color:' + (ms.wonMap ? 'var(--green)' : 'var(--red)') + ';">' +
      fEsc(ms.map) + ' ' + ms.us + ':' + ms.them + '</span>'
    ).join('') + '</div>';
}

/* ─── HAUPT-WIDGET ─────────────────────────────────────────── */
function renderFaceitWidget(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML =
    '<div style="padding:18px 0;text-align:center;color:var(--muted2);font-size:12px;">' +
    '<div style="margin-bottom:6px;opacity:.5;">⟳</div>Lade Faceit-Daten…</div>';

  fetchAllOurMatches().then(function(result) {
    const past     = result.past;
    const ongoing  = result.ongoing;
    const upcoming = result.upcoming;

    const ongoingM  = ongoing.map(parseMatch);
    const upcomingM = upcoming.map(parseMatch);
    const pastM     = past.slice(0, 5).map(parseMatch);

    var html =
      '<div style="display:flex;align-items:center;justify-content:space-between;' +
      'margin-bottom:14px;flex-wrap:wrap;gap:8px;">' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<img src="https://distribution.faceit-cdn.net/images/d4a0cb70-1581-4889-a322-261157f447b5.jpg"' +
          ' style="width:32px;height:32px;border-radius:6px;object-fit:cover;" onerror="this.style.display=\'none\'">' +
          '<div>' +
            '<div style="font-size:13px;font-weight:800;letter-spacing:.5px;">' + fEsc(FACEIT_CFG.cupName) + '</div>' +
            '<div style="font-size:10px;color:var(--muted2);">FACEIT Championship · CS2</div>' +
          '</div>' +
        '</div>' +
        '<a href="' + FACEIT_CFG.cupUrl + '" target="_blank" class="btn btn-ghost btn-sm">' +
        'Auf Faceit →</a>' +
      '</div>';

    /* LIVE */
    if (ongoingM.length) {
      var m = ongoingM[0];
      html +=
        '<div style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;' +
        'padding:12px 16px;margin-bottom:12px;border-left:3px solid var(--green);">' +
          '<div style="font-size:9px;font-family:\'JetBrains Mono\',monospace;text-transform:uppercase;' +
          'letter-spacing:1.5px;color:var(--green);margin-bottom:8px;">⬤ LIVE · Gerade im Gange</div>' +
          '<div style="display:flex;align-items:center;gap:10px;">' +
            avatarImg(m.opponentAvatar, 32) +
            '<div style="flex:1;">' +
              '<div style="font-size:14px;font-weight:700;">DIEDONUTS vs ' + fEsc(m.opponent) + '</div>' +
              '<div style="font-size:11px;color:var(--muted2);">Round ' + (m.round || '?') +
              ' · BO' + (m.bestOf || '?') + '</div>' +
            '</div>' +
            '<a href="' + m.url + '" target="_blank" class="btn btn-primary btn-sm">Zuschauen →</a>' +
          '</div>' +
        '</div>';
    }

    /* NÄCHSTES MATCH */
    if (upcomingM.length) {
      var mu = upcomingM[0];
      var when = mu.scheduled
        ? mu.scheduled.toLocaleString('de-DE', { weekday:'short', day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
        : '–';
      html +=
        '<div style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;' +
        'padding:12px 16px;margin-bottom:12px;border-left:3px solid var(--yellow);">' +
          '<div style="font-size:9px;font-family:\'JetBrains Mono\',monospace;text-transform:uppercase;' +
          'letter-spacing:1.5px;color:var(--yellow);margin-bottom:8px;">▶ NÄCHSTES MATCH</div>' +
          '<div style="display:flex;align-items:center;gap:10px;">' +
            avatarImg(mu.opponentAvatar, 32) +
            '<div style="flex:1;">' +
              '<div style="font-size:14px;font-weight:700;">DIEDONUTS vs ' + fEsc(mu.opponent) + '</div>' +
              '<div style="font-size:11px;color:var(--muted2);">' + fEsc(when) +
              ' · Round ' + (mu.round || '?') + ' · BO' + (mu.bestOf || '?') + '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
    }

    /* LETZTE MATCHES */
    if (pastM.length) {
      html +=
        '<div style="font-size:9px;font-family:\'JetBrains Mono\',monospace;text-transform:uppercase;' +
        'letter-spacing:1.5px;color:var(--muted2);margin-bottom:8px;">Letzte Matches</div>';
      html += pastM.map(function(m) {
        var day = m.scheduled
          ? m.scheduled.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit' })
          : '';
        return (
          '<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);">' +
            resultBadge(m.won) +
            avatarImg(m.opponentAvatar, 24) +
            '<span style="flex:1;font-size:12px;font-weight:600;">vs ' + fEsc(m.opponent) + '</span>' +
            (m.usScore !== null
              ? '<span style="font-size:12px;font-weight:700;color:' +
                (m.won ? 'var(--green)' : 'var(--red)') + ';">' +
                m.usScore + ':' + m.themScore + '</span>'
              : '') +
            '<div style="flex:1;">' + mapLine(m.mapScores) + '</div>' +
            (day ? '<span style="font-size:10px;color:var(--muted2);">' + day + '</span>' : '') +
            '<a href="' + m.url + '" target="_blank" style="font-size:11px;color:var(--muted2);' +
            'text-decoration:none;" title="Match öffnen">↗</a>' +
          '</div>'
        );
      }).join('');
    } else if (!ongoingM.length && !upcomingM.length) {
      html +=
        '<div style="color:var(--muted2);font-size:12px;padding:12px 0;text-align:center;">' +
        'Noch keine Matches gespielt.</div>';
    }

    el.innerHTML = html;
  }).catch(function(err) {
    el.innerHTML =
      '<div style="color:var(--red);font-size:12px;padding:8px;">⚠ Faceit-Daten nicht verfügbar: ' +
      fEsc(err.message) + '</div>';
  });
}

/* ─── ROSTER STATS ─────────────────────────────────────────── */
async function fetchPlayerStats(playerId) {
  const [info, stats] = await Promise.all([
    faceitGet('/players/' + playerId),
    faceitGet('/players/' + playerId + '/stats/cs2')
  ]);
  const lvl = info.games && info.games.cs2 ? info.games.cs2.skill_level : '?';
  const elo = info.games && info.games.cs2 ? info.games.cs2.faceit_elo  : '?';
  const lt  = (stats && stats.lifetime) || {};
  return {
    lvl, elo,
    kd:      lt['Average K/D Ratio']   || '?',
    hs:      lt['Average Headshots %'] || '?',
    wr:      lt['Win Rate %']          || '?',
    matches: lt['Matches']             || '?'
  };
}

function injectRosterStats() {
  if (typeof getRoster !== 'function') return;
  const players = getRoster().teams.flatMap(function(t) { return t.players || []; });
  players.forEach(function(p) {
    if (!p.faceit_id) return;
    var el = document.getElementById('fstats-' + p.faceit_id);
    if (!el) return;
    fetchPlayerStats(p.faceit_id).then(function(s) {
      el.innerHTML =
        '<span title="Faceit Level" style="color:var(--orange,#ff6b00);">LVL ' + s.lvl + '</span>' +
        '<span style="color:var(--border2);padding:0 2px;">·</span>' +
        '<span title="ELO">' + s.elo + ' ELO</span>' +
        '<span style="color:var(--border2);padding:0 2px;">·</span>' +
        '<span title="K/D Ratio">K/D ' + s.kd + '</span>' +
        '<span style="color:var(--border2);padding:0 2px;">·</span>' +
        '<span title="Headshot %">HS ' + s.hs + '%</span>' +
        '<span style="color:var(--border2);padding:0 2px;">·</span>' +
        '<span title="Win Rate">WR ' + s.wr + '%</span>';
    }).catch(function() {
      el.innerHTML = '<span style="color:var(--red);">Stats n/a</span>';
    });
  });
}

/* ─── DASHBOARD-BANNER UPDATE ──────────────────────────────── */
async function updateFaceitBanner() {
  const titleEl = document.getElementById('next-event-title');
  if (!titleEl) return;

  try {
    const [ongoing, upcoming] = await Promise.all([
      fetchCupMatchType('ongoing', 10),
      fetchCupMatchType('upcoming', 10)
    ]);

    const banner = document.getElementById('next-banner');
    const metaEl = document.getElementById('next-event-meta');

    if (ongoing.length) {
      const m = parseMatch(ongoing[0]);
      titleEl.textContent = '🔴 LIVE — DIEDONUTS vs ' + m.opponent;
      if (metaEl) metaEl.textContent = FACEIT_CFG.cupName + ' · Round ' + (m.round || '?') + ' · Jetzt zuschauen';
      if (banner) banner.style.borderLeftColor = 'var(--green)';
      // Link auf Match setzen
      banner.style.cursor = 'pointer';
      banner.onclick = function() { window.open(m.url, '_blank'); };
      ['cd-d','cd-h','cd-m'].forEach(function(id) {
        var e = document.getElementById(id);
        if (e) e.textContent = '—';
      });

    } else if (upcoming.length) {
      const m = parseMatch(upcoming[0]);
      titleEl.textContent = 'DIEDONUTS vs ' + m.opponent;
      var when = m.scheduled
        ? m.scheduled.toLocaleString('de-DE', { weekday:'short', day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
        : '';
      if (metaEl) metaEl.textContent = FACEIT_CFG.cupName + ' · Round ' + (m.round || '?') + (when ? ' · ' + when : '');
      if (banner) banner.style.borderLeftColor = 'var(--yellow)';
      if (m.scheduled) {
        startCountdown(m.scheduled.toISOString(), 'cd-d', 'cd-h', 'cd-m');
      }
    }
    // Falls weder ongoing noch upcoming → normaler Kalender bleibt
  } catch(e) {}
}
