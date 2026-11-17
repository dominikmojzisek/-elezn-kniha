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
    return `<div class="card stack"><div class="ex"><div class="grow"><h3>${esc(e.n)}</h3><div class="mach">Stroj: <b>${esc(e.m)}</b></div></div>${e.custom ? '<span class="tag" style="background:var(--surface2);color:var(--muted)">vlastní</span>' : ''}<span class="tag">${esc(CATMAP[e.c])}</span></div>
      <div class="muted" style="font-size:14px">${esc(e.mu)}</div>
      <div class="num" style="font-size:14px">Doporučeno ${e.s} × ${esc(e.r)} · pauza ${e.rest} s${b.w ? ' · rekord ' + b.w + ' kg' : ''}</div>
      <div class="muted" style="font-size:14px">${esc(e.tip)}</div>
      <div class="row"><button class="btn sm" data-act="toplan" data-x="${e.id}">Přidat do plánu</button>${e.custom ? `<button class="btn sm ghost" data-act="cxedit" data-x="${e.id}">Upravit</button><button class="btn sm ghost bad" data-act="cxdel" data-x="${e.id}">Smazat</button>` : ''}${isAvail(e) ? '' : '<span class="tag" style="background:var(--surface2);color:var(--muted)">' + (curPlace() === 'home' && !HOME_OF[e.id] ? 'Jen v posilovně' : 'Chybí vybavení') + '</span>'}</div></div>`;
  }).join('');
}
function viewLib() {
  const chips = [['all', 'Vše'], ...CATS.map(c => [c.id, c.n])].map(([id, n]) => `<button class="chip" aria-pressed="${ui.cat === id}" data-act="cat" data-v="${id}">${n}</button>`).join('');
  return `<div class="top"><h1>Cviky</h1><span class="tag num">${libItems().length} cviků</span></div>
    <div class="chips" role="group" aria-label="Kde cvičíš">${gymList().map(g => `<button class="chip" aria-pressed="${curPlace() === g.id}" data-act="place" data-v="${g.id}">${esc(g.name)}</button>`).join('')}<button class="chip" aria-pressed="${curPlace() === 'home'}" data-act="place" data-v="home">Doma</button></div>
    ${curPlace() === 'home'
      ? `<div class="card row" style="justify-content:space-between"><div class="grow"><b>Domácí cvičení</b><div class="muted" style="font-size:14px">Nabízí se cviky podle vybavení, které máš doma.</div></div><button class="btn sm" data-act="heq">Vybavení</button></div>`
      : `<div class="card row" style="justify-content:space-between"><div class="grow"><b>${esc(placeName(curPlace()))}</b><div class="muted" style="font-size:14px">Cviky se filtrují podle strojů v této posilovně.</div></div><button class="btn sm" data-act="eq" data-v="${curPlace()}">Stroje</button><button class="btn sm ghost" data-act="gyms">Posilovny</button></div>`}
    <div class="chips" role="group" aria-label="Kategorie">${chips}<button class="chip" aria-pressed="${!!ui.showAll}" data-act="showall">I nedostupné</button></div>
    <label class="field"><span class="lbl">Hledat cvik, stroj nebo sval</span><input id="libq" data-f="q" type="search" value="${esc(ui.q)}" placeholder="např. leg press, biceps"></label>
    <div class="row"><button class="btn sm" data-act="cxnew">+ Vlastní cvik</button><button class="btn sm ghost" data-act="gear">Moje závaží</button></div>
    <div class="stack" id="libList">${libList()}</div>`;
}

/* ===== Deník a vývoj zátěže ===== */
const METRICS = { w: ['Nejvyšší váha', 'kg'], e1: ['Odhad maxima', 'kg'], vol: ['Objem', 'kg'], reps: ['Opakování', ''] };
function loggedExercises() {
  const set = new Set(); S.logs.forEach(l => l.items.forEach(it => set.add(it.x)));
  return [...set].sort((a, b) => exOf(a).n.localeCompare(exOf(b).n, 'cs'));
}
/* jedna hodnota za trénink: nejvyšší váha, odhad maxima na jedno opakování, objem (kg × opakování) nebo nejvíc opakování */
function progressSeries(xid, metric = 'w') {
  const pts = [];
  for (const l of S.logs) for (const it of l.items) if (it.x === xid) {
    const sets = it.sets.filter(s => s.ok !== false);
    const v = metric === 'e1' ? Math.max(0, ...sets.map(s => e1rm(s.w || 0, s.r || 0)))
      : metric === 'vol' ? sets.reduce((a, s) => a + (s.w || 0) * (s.r || 0), 0)
      : metric === 'reps' ? Math.max(0, ...sets.map(s => s.r || 0))
      : Math.max(0, ...sets.map(s => s.w || 0));
    if (v > 0) pts.push({ t: l.date, w: Math.round(v * 10) / 10 });
  }
  return pts.sort((a, b) => a.t - b.t);
}
function chartSvg(pts, unit = 'kg', label = 'Nejvyšší váha') {
  const U = unit ? ' ' + unit : '', tick = v => Math.abs(v) >= 200 ? Math.round(v) : Math.round(v * 2) / 2;
  if (pts.length < 2) return '<p class="muted" style="margin:0">Pro graf potřebuješ aspoň dva tréninky s tímto cvikem.</p>';
  const W = 360, H = 200, L = 40, R = 14, T = 24, B = 28;
  const ws = pts.map(p => p.w);
  let lo = Math.min(...ws), hi = Math.max(...ws);
  const pad = Math.max(unit ? 2.5 : 1, (hi - lo) * .15); lo = Math.max(0, lo - pad); hi += pad;
  const t0 = pts[0].t, t1 = pts[pts.length - 1].t || t0 + 1;
  const X = t => L + (t - t0) / ((t1 - t0) || 1) * (W - L - R);
  const Y = w => T + (1 - (w - lo) / (hi - lo)) * (H - T - B);
  const ticks = [0, 1, 2, 3].map(i => lo + (hi - lo) * i / 3);
  const grid = ticks.map(v => `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)" stroke-width="1"/><text x="${L - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="11" font-family="JetBrains Mono,monospace" fill="var(--muted)">${tick(v)}</text>`).join('');
  const line = pts.map((p, i) => (i ? 'L' : 'M') + X(p.t).toFixed(1) + ' ' + Y(p.w).toFixed(1)).join(' ');
  const area = line + ` L${X(t1)} ${H - B} L${X(t0)} ${H - B} Z`;
  const last = pts[pts.length - 1], first = pts[0];
  const dots = pts.map(p => `<circle cx="${X(p.t)}" cy="${Y(p.w)}" r="3" fill="var(--surface)" stroke="var(--accent)" stroke-width="2"/>`).join('');
  const xl = (p, anchor) => `<text x="${X(p.t)}" y="${H - 8}" text-anchor="${anchor}" font-size="11" font-family="JetBrains Mono,monospace" fill="var(--muted)">${new Date(p.t).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}</text>`;
  return `<div class="chartbox"><svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${label} v jednotlivých trénincích">
    ${grid}<path d="${area}" fill="var(--accent)" opacity=".12"/><path d="${line}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/>${dots}
    <circle cx="${X(last.t)}" cy="${Y(last.w)}" r="6" fill="var(--accent)"/>
    <text x="${X(last.t) - 8}" y="${Y(last.w) - 10}" text-anchor="end" font-size="13" font-weight="700" font-family="JetBrains Mono,monospace" fill="var(--fg)">${fmtKg(last.w)}${U}</text>
    ${xl(first, 'start')}${xl(last, 'end')}</svg></div>
    <div class="num muted" style="font-size:13px">Změna za sledované období: ${last.w - first.w >= 0 ? '+' : ''}${fmtKg(Math.round((last.w - first.w) * 10) / 10)}${U}</div>`;
}
const signed = (v, u) => (v > 0 ? '+' : v < 0 ? '−' : '±') + fmtKg(Math.abs(v)) + (u ? ' ' + u : '');
/* karta jednoho cviku: přepínač veličiny, čísla, graf a doporučení na příště */
function loadCard(xid) {
  const body = !progressSeries(xid, 'w').length;                       // cvik bez závaží se sleduje podle opakování
  const m = body ? 'reps' : (METRICS[ui.metric] ? ui.metric : 'w');
  const pts = progressSeries(xid, m), unit = METRICS[m][1];
  const chips = body ? '' : `<div class="chips" role="group" aria-label="Co graf ukazuje">${['w', 'e1', 'vol', 'reps'].map(k => `<button class="chip" aria-pressed="${k === m}" data-act="metric" data-v="${k}">${METRICS[k][0]}</button>`).join('')}</div>`;
  let tiles = '';
  if (pts.length) {
    const last = pts[pts.length - 1], best = Math.max(...pts.map(p => p.w));
    const old = pts.filter(p => p.t <= last.t - 28 * 864e5).pop() || pts[0];
    const u = unit ? ' ' + unit : '';
    tiles = `<div class="grid2"><div class="stat"><span class="lbl">Naposledy</span><b class="num">${fmtKg(last.w)}${u}</b><span class="muted">${fmtShort(last.t)}</span></div>
      <div class="stat"><span class="lbl">Rekord</span><b class="num">${fmtKg(best)}${u}</b><span class="muted">${METRICS[m][0].toLowerCase()}</span></div>
      <div class="stat"><span class="lbl">Za 4 týdny</span><b class="num">${pts.length > 1 ? signed(Math.round((last.w - old.w) * 10) / 10, unit) : '–'}</b><span class="muted">${pts.length} tréninků</span></div></div>`;
  }
  const sg = suggest(xid, planRepsOf(xid), 0);
  const tip = sg && sg.kind !== 'start' ? `<div class="card" style="padding:10px;font-size:14px"><span class="tag">Příště</span> ${esc(sg.text)}<div class="num muted" style="font-size:13px;margin-top:4px">${esc(sg.last)}</div></div>` : '';
  const hint = { e1: 'Odhad maxima je váha, kterou bys podle série zvládl jednou (Epleyho vzorec). Je to orientační číslo.', vol: 'Objem je součet váha × opakování za všechny série cviku v tréninku.' }[m];
  return chips + tiles + chartSvg(pts, unit, METRICS[m][0]) + (hint ? `<div class="muted" style="font-size:13px">${hint}</div>` : '') + tip;
}
/* přehled všech cviků: poslední zátěž, změna za 4 týdny a co nasadit příště */
function loadOverview() {
  const rows = loggedExercises().map(x => {
    const body = !progressSeries(x, 'w').length, pts = progressSeries(x, body ? 'reps' : 'w');
    if (!pts.length) return null;
    const last = pts[pts.length - 1], old = pts.filter(p => p.t <= last.t - 28 * 864e5).pop() || pts[0], d = Math.round((last.w - old.w) * 10) / 10;
    const sg = suggest(x, planRepsOf(x), 0), unit = body ? 'opak.' : 'kg';
    const next = !sg || sg.kind === 'start' ? '' : sg.kind === 'up' && sg.w ? `příště ${fmtKg(sg.w)} kg` : sg.kind === 'down' ? `ubrat na ${fmtKg(sg.w)} kg` : sg.kind === 'up' ? 'těžší varianta' : `cíl ${sg.r} opak.`;
    return { t: last.t, html: `<button class="pickitem" data-act="histpick" data-x="${x}"><span><b>${esc(exOf(x).n)}</b><em>${fmtKg(last.w)} ${unit} · ${pts.length > 1 ? signed(d, unit) + ' za 4 týdny' : 'první záznam'}</em></span>${next ? `<span class="tag"${sg.kind === 'down' ? ' style="background:var(--warn);color:var(--warn-fg)"' : ''}>${next}</span>` : ''}</button>` };
  }).filter(Boolean).sort((a, b) => b.t - a.t);
  return rows.length ? `<h2>Zátěž podle cviků</h2><div class="stack">${rows.map(r => r.html).join('')}</div>` : '';
}
/* detail jednoho tréninku: série, pocit, poznámka a komentář trenéra (trenér ho tady píše) */
function logDetail(l) {
  const coach = MODE === 'coach', cm = commentOf(l.id);
  const items = l.items.map(it => `<div><b>${esc(exOf(it.x).n)}</b><div class="num muted" style="font-size:14px">${it.sets.map(s => fmtKg(s.w || 0) + '×' + s.r + (s.pr ? ' rekord' : '')).join(' · ')}</div></div>`).join('');
  const feel = l.feel ? `<div style="font-size:14px"><span class="tag">Pocit</span> ${FEEL[l.feel] || ''}</div>` : '';
  const note = l.note ? `<div class="card" style="padding:10px;font-size:14px"><b>Poznámka:</b> ${esc(l.note)}</div>` : '';
  const comment = coach
    ? `<label class="field"><span class="lbl">Komentář pro klienta</span><textarea id="cm-${l.id}" rows="3" maxlength="400">${esc(cm ? cm.text : '')}</textarea></label><div><button class="btn sm pri" data-act="cmsave" data-l="${l.id}">Uložit komentář</button></div>`
    : (cm && cm.text ? `<div class="card" style="padding:10px;font-size:14px;border-color:var(--accent)"><b>Trenér:</b> ${esc(cm.text)}</div>` : '');
  const del = coach ? '' : `<div><button class="btn sm ghost bad" data-act="dellog" data-l="${l.id}">Smazat záznam</button></div>`;
  return `<div class="stack" style="margin-top:10px">${items}${feel}${note}${comment}${del}</div>`;
}
function logRow(l) {
  const open = ui.hist === l.id, sets = l.items.reduce((a, it) => a + it.sets.length, 0), cm = commentOf(l.id);
  return `<div class="card"><button class="pickitem" style="background:transparent;border:0;padding:0" data-act="openlog" data-l="${l.id}" aria-expanded="${open}"><span><b>${esc(l.dayT)}</b><em>${fmtShort(l.date)} · ${esc(l.planName)}${l.feel ? ' · ' + FEEL[l.feel].toLowerCase() : ''}${cm && cm.text ? ' · komentář trenéra' : ''}</em></span><span class="num muted" style="font-size:14px">${sets} sérií · ${Math.round(l.dur / 60)} min</span></button>${open ? logDetail(l) : ''}</div>`;
}
function viewHist() {
  const exs = loggedExercises();
  if (!S.logs.length) return `<div class="top"><h1>Deník</h1></div><div class="card muted">Tady uvidíš odcvičené tréninky a graf pokroku. Spusť první trénink na záložce Dnes.</div>`;
  if (!ui.histEx || !exs.includes(ui.histEx)) ui.histEx = exs[0];
  const opts = exs.map(x => `<option value="${x}"${x === ui.histEx ? ' selected' : ''}>${esc(exOf(x).n)}</option>`).join('');
  const rows = S.logs.slice(0, 40).map(logRow).join('');
  return `<div class="top"><h1>Deník</h1><span class="tag num">${S.logs.length} tréninků</span></div>
    <div class="card stack"><label class="field"><span class="lbl">Vývoj zátěže ve cviku</span><select id="histex" data-f="histex">${opts}</select></label>${loadCard(ui.histEx)}</div>
    ${weekHtml()}${loadOverview()}${prHtml()}
    <h2>Historie</h2>${rows}`;
}
