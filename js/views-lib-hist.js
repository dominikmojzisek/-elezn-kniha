/* ===== Knihovna cviků ===== */
function libItems() {
  const q = ui.q.trim().toLowerCase();
  return EX.filter(e => (ui.cat === 'all' || e.c === ui.cat) && (ui.showAll || isAvail(e)) &&
    (!q || (e.n + ' ' + e.m + ' ' + e.mu).toLowerCase().includes(q)));
}
function libList() {
  const items = libItems();
  if (!items.length) return '<div class="card muted">Nic nenalezeno. Zkus jiné slovo nebo jinou kategorii.</div>';
  return items.map(e => {
    const b = bestOf(e.id);
    return `<div class="card stack"><div class="ex"><div class="grow"><h3>${esc(e.n)}</h3><div class="mach">Stroj: <b>${esc(e.m)}</b></div></div><span class="tag">${esc(CATMAP[e.c])}</span></div>
      <div class="muted" style="font-size:14px">${esc(e.mu)}</div>
      <div class="num" style="font-size:14px">Doporučeno ${e.s} × ${esc(e.r)} · pauza ${e.rest} s${b.w ? ' · rekord ' + b.w + ' kg' : ''}</div>
      <div class="muted" style="font-size:14px">${esc(e.tip)}</div>
      <div class="row"><button class="btn sm" data-act="toplan" data-x="${e.id}">Přidat do plánu</button>${isAvail(e) ? '' : '<span class="tag" style="background:var(--surface2);color:var(--muted)">' + (curPlace() === 'home' && !HOME_OF[e.id] ? 'Jen v posilovně' : 'Chybí vybavení') + '</span>'}</div></div>`;
  }).join('');
}
function viewLib() {
  const chips = [['all', 'Vše'], ...CATS.map(c => [c.id, c.n])].map(([id, n]) => `<button class="chip" aria-pressed="${ui.cat === id}" data-act="cat" data-v="${id}">${n}</button>`).join('');
  return `<div class="top"><h1>Cviky</h1><span class="tag num">${libItems().length} cviků</span></div>
    <div class="chips" role="group" aria-label="Kde cvičíš"><button class="chip" aria-pressed="${curPlace() === 'gym'}" data-act="place" data-v="gym">Posilovna</button><button class="chip" aria-pressed="${curPlace() === 'home'}" data-act="place" data-v="home">Doma</button></div>
    ${curPlace() === 'home'
      ? `<div class="card row" style="justify-content:space-between"><div class="grow"><b>Domácí cvičení</b><div class="muted" style="font-size:14px">Nabízí se cviky podle vybavení, které máš doma.</div></div><button class="btn sm" data-act="heq">Vybavení</button></div>`
      : `<div class="card row" style="justify-content:space-between"><div class="grow"><b>${esc(GYM_NAME)}</b><div class="muted" style="font-size:14px">Cviky se filtrují podle vybavení klubu.</div></div><button class="btn sm" data-act="eq">Vybavení</button></div>`}
    <div class="chips" role="group" aria-label="Kategorie">${chips}<button class="chip" aria-pressed="${!!ui.showAll}" data-act="showall">I nedostupné</button></div>
    <label class="field"><span class="lbl">Hledat cvik, stroj nebo sval</span><input id="libq" data-f="q" type="search" value="${esc(ui.q)}" placeholder="např. leg press, biceps"></label>
    <div class="stack" id="libList">${libList()}</div>`;
}

/* ===== Deník a pokrok ===== */
function loggedExercises() {
  const set = new Set(); S.logs.forEach(l => l.items.forEach(it => set.add(it.x)));
  return [...set].sort((a, b) => exOf(a).n.localeCompare(exOf(b).n, 'cs'));
}
function progressSeries(xid) {
  const pts = [];
  for (const l of S.logs) for (const it of l.items) if (it.x === xid) {
    const w = Math.max(0, ...it.sets.map(s => s.w || 0));
    if (w > 0) pts.push({ t: l.date, w });
  }
  return pts.sort((a, b) => a.t - b.t);
}
function chartSvg(pts) {
  if (pts.length < 2) return '<p class="muted" style="margin:0">Pro graf potřebuješ aspoň dva tréninky s tímto cvikem.</p>';
  const W = 560, H = 190, L = 44, R = 14, T = 14, B = 28;
  const ws = pts.map(p => p.w);
  let lo = Math.min(...ws), hi = Math.max(...ws);
  const pad = Math.max(2.5, (hi - lo) * .15); lo = Math.max(0, lo - pad); hi += pad;
  const t0 = pts[0].t, t1 = pts[pts.length - 1].t || t0 + 1;
  const X = t => L + (t - t0) / ((t1 - t0) || 1) * (W - L - R);
  const Y = w => T + (1 - (w - lo) / (hi - lo)) * (H - T - B);
  const ticks = [0, 1, 2, 3].map(i => lo + (hi - lo) * i / 3);
  const grid = ticks.map(v => `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)" stroke-width="1"/><text x="${L - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="11" font-family="JetBrains Mono,monospace" fill="var(--muted)">${Math.round(v * 2) / 2}</text>`).join('');
  const line = pts.map((p, i) => (i ? 'L' : 'M') + X(p.t).toFixed(1) + ' ' + Y(p.w).toFixed(1)).join(' ');
  const area = line + ` L${X(t1)} ${H - B} L${X(t0)} ${H - B} Z`;
  const last = pts[pts.length - 1], first = pts[0];
  const dots = pts.map(p => `<circle cx="${X(p.t)}" cy="${Y(p.w)}" r="3" fill="var(--surface)" stroke="var(--accent)" stroke-width="2"/>`).join('');
  const xl = (p, anchor) => `<text x="${X(p.t)}" y="${H - 8}" text-anchor="${anchor}" font-size="11" font-family="JetBrains Mono,monospace" fill="var(--muted)">${new Date(p.t).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}</text>`;
  return `<div class="chartbox"><svg viewBox="0 0 ${W} ${H}" width="100%" style="min-width:420px" role="img" aria-label="Nejvyšší váha v jednotlivých trénincích">
    ${grid}<path d="${area}" fill="var(--accent)" opacity=".12"/><path d="${line}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/>${dots}
    <circle cx="${X(last.t)}" cy="${Y(last.w)}" r="6" fill="var(--accent)"/>
    <text x="${X(last.t) - 8}" y="${Y(last.w) - 10}" text-anchor="end" font-size="13" font-weight="700" font-family="JetBrains Mono,monospace" fill="var(--fg)">${last.w} kg</text>
    ${xl(first, 'start')}${xl(last, 'end')}</svg></div>
    <div class="num muted" style="font-size:13px">Změna za sledované období: ${last.w - first.w >= 0 ? '+' : ''}${Math.round((last.w - first.w) * 10) / 10} kg</div>`;
}
function viewHist() {
  const exs = loggedExercises();
  if (!S.logs.length) return `<div class="top"><h1>Deník</h1></div><div class="card muted">Tady uvidíš odcvičené tréninky a graf pokroku. Spusť první trénink na záložce Dnes.</div>`;
  if (!ui.histEx || !exs.includes(ui.histEx)) ui.histEx = exs[0];
  const opts = exs.map(x => `<option value="${x}"${x === ui.histEx ? ' selected' : ''}>${esc(exOf(x).n)}</option>`).join('');
  const rows = S.logs.slice(0, 40).map(l => {
    const open = ui.hist === l.id;
    const sets = l.items.reduce((a, it) => a + it.sets.length, 0);
    const detail = open ? '<div class="stack" style="margin-top:10px">' + l.items.map(it => `<div><b>${esc(exOf(it.x).n)}</b><div class="num muted" style="font-size:14px">${it.sets.map(s => (s.w || 0) + '×' + s.r).join(' · ')}</div></div>`).join('') + `<div><button class="btn sm ghost bad" data-act="dellog" data-l="${l.id}">Smazat záznam</button></div></div>` : '';
    return `<div class="card"><button class="pickitem" style="background:transparent;border:0;padding:0" data-act="openlog" data-l="${l.id}" aria-expanded="${open}"><span><b>${esc(l.dayT)}</b><em>${fmtShort(l.date)} · ${esc(l.planName)}</em></span><span class="num muted" style="font-size:14px">${sets} sérií · ${Math.round(l.dur / 60)} min</span></button>${detail}</div>`;
  }).join('');
  return `<div class="top"><h1>Deník</h1><span class="tag num">${S.logs.length} tréninků</span></div>
    <div class="card stack"><label class="field"><span class="lbl">Pokrok ve cviku</span><select id="histex" data-f="histex">${opts}</select></label>${chartSvg(progressSeries(ui.histEx))}</div>
    <h2>Historie</h2>${rows}`;
}
