/* ===== Plány: seznam a editor ===== */
function dayMinutes(d) { return Math.round(d.ex.reduce((a, it) => a + it.s * (40 + it.rest), 0) / 60); }

function viewPlans() {
  const p = S.plans.find(x => x.id === ui.openPlan);
  if (p) return viewEditor(p);
  const list = S.plans.map(p => `<div class="card stack">
    <div class="row" style="justify-content:space-between"><h2 class="grow">${esc(p.name)}</h2>${p.place === 'home' ? '<span class="tag">doma</span>' : ''}${p.days.some(d => d.ex.some(i => i.chg)) ? '<span class="tag chg">změna</span>' : ''}<span class="tag num">${p.days.length} dnů</span></div>
    <div class="muted" style="font-size:14px">${p.days.map(d => esc(d.t) + ' (' + d.ex.length + ')').join(' · ')}</div>
    <div class="row"><button class="btn pri" data-act="openplan" data-p="${p.id}">Upravit</button><button class="btn ghost bad" data-act="delplan" data-p="${p.id}">Smazat</button></div></div>`).join('');
  return `<div class="top"><h1>Plány</h1></div>${coachSlot()}<div class="card" id="coachCard">${coachCardHtml()}</div>
    <div class="row"><button class="btn pri" data-act="gen">Vygenerovat plán</button><button class="btn" data-act="newplan">Prázdný plán</button><button class="btn ghost" data-act="eq">Vybavení klubu</button></div>
    ${list || '<div class="card muted">Zatím tu nic není. Vygeneruj si plán podle cíle, nebo si poskládej vlastní.</div>'}`;
}

function viewEditor(p) {
  const coach = MODE === 'coach', dis = coach && coachLocked() ? ' disabled' : '';
  if (ui.editDay >= p.days.length) ui.editDay = 0;
  const d = p.days[ui.editDay];
  const chips = p.days.map((x, i) => `<button class="chip" aria-pressed="${i === ui.editDay}" data-act="editday" data-d="${i}">${esc(x.t)}</button>`).join('') +
    (coach ? '' : '<button class="chip" data-act="addday">+ Den</button>');
  const byCat = {};
  d.ex.forEach(it => { const c = exOf(it.x).c; byCat[c] = (byCat[c] || 0) + it.s; });
  const split = Object.entries(byCat).map(([c, n]) => `${CATMAP[c]} ${n}`).join(' · ');
  const items = d.ex.map((it, k) => {
    const e = exOf(it.x);
    const flag = it.chg ? `<div><span class="tag chg">Změna</span> <span style="font-size:14px">${esc(it.chg.text)}</span></div>` : '';
    const note = coach
      ? `<label class="field"><span class="lbl">Poznámka pro klienta</span><input id="pf-note-${k}" data-pf="note" data-k="${k}" maxlength="200" value="${esc(it.note || '')}"${dis}></label>`
      : (it.note ? `<div class="card" style="padding:10px;font-size:14px"><b>Trenér:</b> ${esc(it.note)}</div>` : '');
    return `<div class="card stack"><div class="ex"><div class="grow"><h3>${esc(e.n)}</h3><div class="mach">Stroj: <b>${esc(e.m)}</b></div><div class="mach">${esc(e.mu)}</div></div>
      <div class="row" style="flex-wrap:nowrap"><button class="btn sm ghost" aria-label="Nahoru" data-act="mvup" data-k="${k}"${k === 0 || dis ? ' disabled' : ''}>↑</button><button class="btn sm ghost" aria-label="Dolů" data-act="mvdn" data-k="${k}"${k === d.ex.length - 1 || dis ? ' disabled' : ''}>↓</button><button class="btn sm ghost bad" aria-label="Odebrat" data-act="rmex" data-k="${k}"${dis}>✕</button></div></div>
      ${flag}
      <div class="grid2" style="grid-template-columns:repeat(4,minmax(0,1fr))">
        ${[['s', 'Série', it.s, 'numeric'], ['r', 'Opak.', it.r, 'text'], ['rest', 'Pauza s', it.rest, 'numeric'], ['w', 'Váha kg', it.w || '', 'decimal']].map(([f, l, v, m]) =>
          `<label class="field"><span class="lbl">${l}</span><input inputmode="${m}" data-pf="${f}" data-k="${k}" value="${esc(v)}" id="pf-${f}-${k}"${dis}></label>`).join('')}
      </div>${note}</div>`;
  }).join('');
  const bottom = coach
    ? `<div class="row"><button class="btn pri grow" data-act="pickex"${dis}>+ Přidat cvik</button></div>`
    : `<div class="row"><button class="btn pri grow" data-act="pickex">+ Přidat cvik</button></div>
    <div class="row"><button class="btn grow" data-act="start" data-p="${p.id}" data-d="${ui.editDay}"${d.ex.length ? '' : ' disabled'}>Spustit tento den</button><button class="btn ghost bad" data-act="delday">Smazat den</button></div>`;
  return `<div class="top"><button class="btn sm ghost" data-act="back">← Plány</button><span class="tag num">${d.ex.reduce((a, b) => a + b.s, 0)} sérií · ~${dayMinutes(d)} min</span></div>
    <label class="field"><span class="lbl">Název plánu</span><input id="pname" data-f="pname" value="${esc(p.name)}"${coach ? ' readonly' : ''}></label>
    <div class="chips" role="group" aria-label="Tréninkové dny">${chips}</div>
    <label class="field"><span class="lbl">Název dne</span><input id="dname" data-f="dname" value="${esc(d.t)}"${coach ? ' readonly' : ''}></label>
    ${split ? `<div class="muted num" style="font-size:13px">Série podle partií: ${split}</div>` : ''}
    ${items || '<div class="card muted">Den je prázdný. Přidej první cvik.</div>'}
    ${bottom}`;
}
