/* ===== Vykreslení: společné části, Dnes, Trénink ===== */
const TABS = [['home', 'Dnes'], ['plans', 'Plány'], ['lib', 'Cviky'], ['hist', 'Deník']];

function render() {
  const coach = MODE === 'coach', tabs = coach ? COACH_TABS : TABS, cur = coach ? ui.ctab : ui.tab;
  const view = coach ? viewCoach() : { home: viewHome, plans: viewPlans, lib: viewLib, hist: viewHist }[ui.tab]();
  const nav = tabs.map(([id, n]) => `<button data-act="${coach ? 'ctab' : 'tab'}" data-v="${id}"${cur === id ? ' aria-current="page"' : ''}>${n}</button>`).join('');
  $('#app').innerHTML = `<div class="wrap">${view}</div><nav class="nav" style="grid-template-columns:repeat(${tabs.length},1fr)" aria-label="Hlavní navigace">${nav}</nav>`;
  if (S.sess && !tick) startTick();
}

function setVolume(logs) {
  let v = 0; for (const l of logs) for (const it of l.items) for (const s of it.sets) v += (s.w || 0) * (s.r || 0);
  return v;
}

function nextDayFor(p) {
  const last = S.logs.find(l => l.planId === p.id);
  if (!last) return 0;
  const i = p.days.findIndex(d => d.t === last.dayT);
  return i < 0 ? 0 : (i + 1) % p.days.length;
}

function viewHome() {
  if (S.sess) return viewSession();
  const week = S.logs.filter(l => Date.now() - l.date < 7 * 864e5);
  const stats = `<div class="grid2">
    <div class="stat"><span class="lbl">Za 7 dní</span><b class="num">${week.length}×</b><span class="muted">tréninků</span></div>
    <div class="stat"><span class="lbl">Objem 7 dní</span><b class="num">${Math.round(setVolume(week) / 1000 * 10) / 10} t</b><span class="muted">kg × opakování</span></div>
    <div class="stat"><span class="lbl">Celkem</span><b class="num">${S.logs.length}</b><span class="muted">uložených tréninků</span></div>
  </div>`;
  let body;
  if (!S.plans.length) {
    body = `<div class="card stack"><h2>Začni plánem</h2>
      <p class="muted" style="margin:0">Nech si sestavit rozpis podle cíle a úrovně, nebo si poskládej vlastní z ${EX.length} cviků na konkrétních strojích.</p>
      <div class="row"><button class="btn pri" data-act="gen">Vygenerovat plán</button><button class="btn" data-act="newplan">Prázdný plán</button></div></div>`;
  } else {
    body = S.plans.map(p => {
      const ni = nextDayFor(p);
      const days = p.days.map((d, i) => `<button class="btn${i === ni ? ' pri' : ''}" data-act="start" data-p="${p.id}" data-d="${i}">${esc(d.t)}${d.ex.some(i => i.chg) ? ' <span class="tag chg">změna</span>' : ''}<br><small class="num" style="opacity:.8">${d.ex.length} cviků · ${d.ex.reduce((a, b) => a + b.s, 0)} sérií</small></button>`).join('');
      return `<div class="card stack"><div class="row" style="justify-content:space-between"><h2>${esc(p.name)}</h2>${p.days.length > 1 ? '<span class="tag">Na řadě: ' + esc(p.days[ni].t) + '</span>' : ''}</div><div class="grid2">${days}</div></div>`;
    }).join('');
  }
  return `<div class="top"><div><small>${new Date().toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' })}</small><h1>Železná kniha</h1></div><button class="btn sm ghost" data-act="settings">Připojení</button></div>${connHint()}${coachSlot()}${stats}${body}`;
}

function viewSession() {
  const s = S.sess;
  const total = s.items.reduce((a, it) => a + it.sets.length, 0);
  const done = s.items.reduce((a, it) => a + it.sets.filter(z => z.ok).length, 0);
  const timer = s.rest
    ? `<div class="timer" id="restBox"><div><span class="lbl" style="color:inherit;opacity:.7">Pauza</span><div class="t" id="restT">${mmss((s.rest.end - Date.now()) / 1000)}</div></div><div class="row"><button class="btn sm" data-act="rest+">+30 s</button><button class="btn sm" data-act="rest0">Přeskočit</button></div></div>`
    : `<div class="timer"><div><span class="lbl" style="color:inherit;opacity:.7">Čas tréninku</span><div class="t" id="sessClock">${mmss((Date.now() - s.start) / 1000)}</div></div><span class="num">${done}/${total} sérií</span></div>`;
  const items = s.items.map((it, i) => {
    const e = exOf(it.x), best = bestOf(it.x);
    const sets = it.sets.map((z, j) => `<div class="set${z.ok ? ' ok' : ''}"><span class="n">${j + 1}</span>
      <input inputmode="decimal" aria-label="Váha v kg, série ${j + 1}" data-f="w" data-i="${i}" data-j="${j}" value="${z.w || ''}" placeholder="kg">
      <input inputmode="numeric" aria-label="Opakování, série ${j + 1}" data-f="r" data-i="${i}" data-j="${j}" value="${z.r || ''}" placeholder="opak.">
      <button class="done" aria-label="Série ${j + 1} hotová" data-act="done" data-i="${i}" data-j="${j}">${z.ok ? '✓' : ''}</button></div>`).join('');
    return `<div class="card stack"><div class="ex"><div class="grow"><h3>${esc(e.n)}</h3><div class="mach">Stroj: <b>${esc(e.m)}</b></div></div><span class="tag num">${it.sets.length} × ${esc(it.plan)}</span></div>
      ${it.chg ? '<div><span class="tag chg">Změna od trenéra</span> <span style="font-size:14px">' + esc(it.chg) + '</span></div>' : ''}${it.note ? '<div class="card" style="padding:10px;font-size:14px"><b>Trenér:</b> ' + esc(it.note) + '</div>' : ''}
      <div class="muted" style="font-size:14px">${esc(e.tip)}${best.w ? ` <span class="num">· rekord ${best.w} kg</span>` : ''}</div>
      <div class="sets"><div class="set" style="font-size:11px"><span></span><span class="lbl" style="text-align:center">kg</span><span class="lbl" style="text-align:center">opakování</span><span></span></div>${sets}</div>
      <div class="row"><button class="btn sm ghost" data-act="addset" data-i="${i}">+ Série</button><button class="btn sm ghost" data-act="delset" data-i="${i}">− Série</button></div></div>`;
  }).join('');
  const awake = 'wakeLock' in navigator ? `<div class="chips"><button class="chip" aria-pressed="${S.settings.keepAwake !== false}" data-act="awake">Displej zůstane zapnutý</button></div>` : '';
  return `<div class="top"><div><small>${esc(s.planName)}</small><h1>${esc(s.dayT)}</h1></div></div>${timer}${awake}
    <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}"><i style="width:${total ? done / total * 100 : 0}%"></i></div>${items}
    <div class="row"><button class="btn grow" data-act="sessadd">+ Přidat cvik</button></div>
    <div class="row"><button class="btn pri grow" data-act="finish">Dokončit trénink</button><button class="btn bad" data-act="discard">Zahodit</button></div>`;
}
