/* ===== Dialogy ===== */
let dlg;
function openDlg(html) { dlg.innerHTML = `<div class="dlg">${html}</div>`; if (!dlg.open) dlg.showModal(); }
function closeDlg() { if (dlg.open) dlg.close(); }
function askDlg(msg, act, attrs = '') {
  openDlg(`<h3>${esc(msg)}</h3><div class="row"><button class="btn bad grow" data-act="${act}" ${attrs}>Ano</button><button class="btn grow" data-act="close">Zrušit</button></div>`);
}
const sel = (id, opts) => `<label class="field"><span class="lbl">${opts.l}</span><select id="${id}">${opts.o.map(([v, n]) => `<option value="${v}"${v == opts.v ? ' selected' : ''}>${n}</option>`).join('')}</select></label>`;

function genDialog() {
  openDlg(`<h2>Vygenerovat plán</h2>
    ${sel('g-split', { l: 'Rozpis', o: Object.entries(SPLITS).map(([k, v]) => [k, v.n]), v: 'ul4' })}
    ${sel('g-goal', { l: 'Cíl', o: Object.entries(GOALS).map(([k, v]) => [k, v.n]), v: 'objem' })}
    ${sel('g-lvl', { l: 'Zkušenost', o: [[1, 'Začátečník (stroje, 3 série)'], [2, 'Pokročilý'], [3, 'Zkušený (volné činky)']], v: S.settings.level || 1 })}
    <p class="muted" style="margin:0;font-size:14px">Plán pak můžeš upravit: přidat, odebrat nebo přesunout cviky, změnit série, opakování a pauzy.</p>
    <div class="row"><button class="btn pri grow" data-act="dogen">Vytvořit plán</button><button class="btn" data-act="close">Zrušit</button></div>`);
}
function eqDialog() {
  const eq = S.settings.eq;
  const groups = EQLIST.map(g => `<div class="stack"><div class="lbl">${g.g}</div>` + g.items.map(([t, n, web]) =>
    `<label class="pickitem" style="cursor:pointer"><span><b>${esc(n)}</b>${web ? '<em>potvrzeno na webu klubu</em>' : ''}</span><input type="checkbox" data-eq="${t}" ${eq[t] === false ? '' : 'checked'} style="width:24px;height:24px"></label>`).join('') + '</div>').join('');
  openDlg(`<h2>Vybavení klubu</h2><p class="muted" style="margin:0;font-size:14px">${esc(GYM_NAME)}: web uvádí stroje Panatta, Precor a Glute Builder, volné váhy a functional zónu. Konkrétní seznam strojů neuvádí, takže odškrtni, co v klubu nenajdeš. Generátor i knihovna cviků se podle toho přizpůsobí.</p>
    <div class="row"><button class="btn sm" data-act="eqall">Vše zapnout</button><button class="btn sm" data-act="eqfree">Jen volné váhy a functional</button></div>${groups}<button class="btn pri" data-act="close">Hotovo</button>`);
}
let pc = 'all', pq = '', pickMode = 'day', pickX = null;
function pickList() {
  const q = pq.trim().toLowerCase();
  const items = EX.filter(e => isAvail(e) && (pc === 'all' || e.c === pc) && (!q || (e.n + ' ' + e.m + ' ' + e.mu).toLowerCase().includes(q)));
  return items.map(e => `<button class="pickitem" data-act="addex" data-x="${e.id}"><span><b>${esc(e.n)}</b><em>${esc(e.m)}</em></span><span class="tag">${esc(CATMAP[e.c])}</span></button>`).join('') || '<p class="muted">Nic nenalezeno.</p>';
}
function pickDialog() {
  const chips = [['all', 'Vše'], ...CATS.map(c => [c.id, c.n])].map(([id, n]) => `<button class="chip" aria-pressed="${pc === id}" data-act="pcat" data-v="${id}">${n}</button>`).join('');
  openDlg(`<h2>Přidat cvik</h2><div class="chips">${chips}</div>
    <label class="field"><span class="lbl">Hledat</span><input id="pickq" data-f="pickq" type="search" value="${esc(pq)}"></label>
    <div class="pick" id="pickList">${pickList()}</div><button class="btn" data-act="close">Hotovo</button>`);
}
function toPlanDialog(x) {
  pickX = x;
  const rows = S.plans.flatMap(p => p.days.map((d, i) => `<button class="pickitem" data-act="addto" data-p="${p.id}" data-d="${i}"><span><b>${esc(d.t)}</b><em>${esc(p.name)}</em></span><span class="muted">+</span></button>`)).join('');
  openDlg(`<h2>${esc(exOf(x).n)}</h2><div class="lbl">Přidat do dne</div><div class="pick">${rows || '<p class="muted">Nemáš žádný plán.</p>'}</div>
    <button class="btn" data-act="addtonew">Nový plán s tímto cvikem</button><button class="btn ghost" data-act="close">Zrušit</button>`);
}

/* ===== Akce ===== */
const curPlan = () => S.plans.find(x => x.id === ui.openPlan);
const curDay = () => { const p = curPlan(); return p && p.days[ui.editDay]; };

const ACTIONS = {
  awake: () => { S.settings.keepAwake = (S.settings.keepAwake === false); if (S.settings.keepAwake) holdScreen(); else releaseScreen(); persist(); render(); },
  eq: () => eqDialog(),
  eqall: () => { S.settings.eq = {}; persist(); eqDialog(); },
  eqfree: () => { const m = {}; EQLIST.forEach(g => g.items.forEach(([t]) => m[t] = ['db', 'bb', 'kb', 'trx', 'sled', 'med', 'box', 'bands', 'glute'].includes(t))); S.settings.eq = m; persist(); eqDialog(); },
  showall: () => { ui.showAll = !ui.showAll; render(); },
  close: () => closeDlg(),
  tab: el => { ui.tab = el.dataset.v; if (ui.tab !== 'plans') ui.openPlan = null; render(); scrollTo(0, 0); },
  gen: () => genDialog(),
  dogen: () => {
    const lvl = +$('#g-lvl').value; S.settings.level = lvl;
    const p = generatePlan($('#g-split').value, $('#g-goal').value, lvl);
    S.plans.unshift(p); ui.tab = 'plans'; ui.openPlan = p.id; ui.editDay = 0;
    closeDlg(); persist(); render(); scrollTo(0, 0); toast('Plán vytvořen');
  },
  newplan: () => {
    const p = newPlan('Můj plán', [{ t: 'Den 1', ex: [] }]);
    S.plans.unshift(p); ui.tab = 'plans'; ui.openPlan = p.id; ui.editDay = 0; persist(); render(); scrollTo(0, 0);
  },
  openplan: el => { ui.openPlan = el.dataset.p; ui.editDay = 0; render(); scrollTo(0, 0); },
  back: () => { ui.openPlan = null; render(); },
  delplan: el => askDlg('Smazat celý plán?', 'dodelplan', `data-p="${el.dataset.p}"`),
  dodelplan: el => { S.plans = S.plans.filter(p => p.id !== el.dataset.p); closeDlg(); persist(); render(); },
  editday: el => { ui.editDay = +el.dataset.d; render(); },
  addday: () => { const p = curPlan(); p.days.push({ id: uid(), t: 'Den ' + (p.days.length + 1), ex: [] }); ui.editDay = p.days.length - 1; persist(); render(); },
  delday: () => askDlg('Smazat tento den?', 'dodelday'),
  dodelday: () => {
    const p = curPlan();
    if (p.days.length === 1) p.days[0].ex = []; else p.days.splice(ui.editDay, 1);
    ui.editDay = 0; closeDlg(); persist(); render();
  },
  pickex: () => { pickMode = 'day'; pickDialog(); },
  pcat: el => { pc = el.dataset.v; pickDialog(); },
  sessadd: () => { pickMode = 'sess'; pickDialog(); },
  addex: el => {
    if (pickMode === 'sess' && S.sess) {
      const e = exOf(el.dataset.x), lw = lastWeight(e.id);
      S.sess.items.push({ x: e.id, rest: e.rest, plan: e.r, sets: Array.from({ length: e.s }, () => ({ w: lw, r: repsLow(e.r), ok: false })) });
      closeDlg(); persist(); render(); toast('Přidáno: ' + e.n);
      requestAnimationFrame(() => scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
      return;
    }
    const d = curDay(); if (!d) return; d.ex.push(planItem(el.dataset.x, { w: lastWeight(el.dataset.x) })); persist(); render(); toast('Přidáno: ' + exOf(el.dataset.x).n); },
  rmex: el => { curDay().ex.splice(+el.dataset.k, 1); persist(); render(); },
  mvup: el => { const a = curDay().ex, k = +el.dataset.k; if (k > 0) [a[k - 1], a[k]] = [a[k], a[k - 1]]; persist(); render(); },
  mvdn: el => { const a = curDay().ex, k = +el.dataset.k; if (k < a.length - 1) [a[k + 1], a[k]] = [a[k], a[k + 1]]; persist(); render(); },
  cat: el => { ui.cat = el.dataset.v; render(); },
  toplan: el => toPlanDialog(el.dataset.x),
  addto: el => {
    const p = S.plans.find(x => x.id === el.dataset.p); p.days[+el.dataset.d].ex.push(planItem(pickX, { w: lastWeight(pickX) }));
    closeDlg(); persist(); toast('Přidáno do plánu ' + p.name);
  },
  addtonew: () => {
    const p = newPlan('Můj plán', [{ t: 'Den 1', ex: [planItem(pickX)] }]);
    S.plans.unshift(p); closeDlg(); persist(); toast('Vytvořen nový plán');
  },
  start: el => { if (S.sess) { toast('Nejdřív dokonči rozpracovaný trénink'); ui.tab = 'home'; render(); return; } startSession(el.dataset.p, +el.dataset.d); scrollTo(0, 0); },
  done: el => {
    const it = S.sess.items[+el.dataset.i], z = it.sets[+el.dataset.j];
    z.ok = !z.ok;
    S.sess.rest = z.ok ? { end: Date.now() + (it.rest || 60) * 1000 } : null;
    persist(); render();
  },
  addset: el => { const it = S.sess.items[+el.dataset.i], l = it.sets[it.sets.length - 1] || { w: 0, r: 8 }; it.sets.push({ w: l.w, r: l.r, ok: false }); persist(); render(); },
  delset: el => { const it = S.sess.items[+el.dataset.i]; if (it.sets.length > 1) it.sets.pop(); persist(); render(); },
  'rest+': () => { if (S.sess.rest) S.sess.rest.end += 30000; persist(); render(); },
  rest0: () => { S.sess.rest = null; persist(); render(); },
  finish: () => finishSession(),
  discard: () => askDlg('Zahodit rozpracovaný trénink?', 'dodiscard'),
  dodiscard: () => { S.sess = null; releaseScreen(); clearInterval(tick); tick = null; closeDlg(); persist(); render(); },
  openlog: el => { ui.hist = ui.hist === el.dataset.l ? null : el.dataset.l; render(); },
  dellog: el => askDlg('Smazat tento záznam?', 'dodellog', `data-l="${el.dataset.l}"`),
  dodellog: el => { S.logs = S.logs.filter(l => l.id !== el.dataset.l); ui.hist = null; closeDlg(); persist(); render(); }
};

Object.assign(ACTIONS, COACH_ACTIONS, SETTINGS_ACTIONS);
const num = (v, lo, hi) => Math.min(hi, Math.max(lo, parseInt(v) || lo));
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-act]');
  if (el && ACTIONS[el.dataset.act]) ACTIONS[el.dataset.act](el);
});
document.addEventListener('input', ev => {
  const t = ev.target, f = t.dataset.f, pf = t.dataset.pf;
  if (f === 'w' || f === 'r') {
    const z = S.sess.items[+t.dataset.i].sets[+t.dataset.j];
    z[f] = f === 'w' ? (parseFloat(String(t.value).replace(',', '.')) || 0) : (parseInt(t.value) || 0);
    persist();
  } else if (pf) {
    const it = curDay().ex[+t.dataset.k];
    if (pf === 's') it.s = num(t.value, 1, 10);
    else if (pf === 'rest') it.rest = num(t.value, 0, 600);
    else if (pf === 'w') it.w = parseFloat(String(t.value).replace(',', '.')) || 0;
    else if (pf === 'note') it.note = t.value.slice(0, 200);
    else it.r = t.value.slice(0, 14);
    persist();
  } else if (f === 'pname') { curPlan().name = t.value; persist(); }
  else if (f === 'dname') { curDay().t = t.value; persist(); }
  else if (f === 'q') { ui.q = t.value; $('#libList').innerHTML = libList(); }
  else if (f === 'pickq') { pq = t.value; $('#pickList').innerHTML = pickList(); }
});
document.addEventListener('change', ev => {
  if (ev.target.id === 'impfile') { importFile(ev.target); return; }
  if (ev.target.id === 's-prov') { applyProvVisibility(ev.target.value); return; }
  if (ev.target.dataset.eq) { S.settings.eq[ev.target.dataset.eq] = ev.target.checked; persist(); if (ui.tab === 'lib') render(); return; }
  if (ev.target.dataset.f === 'histex') { ui.histEx = ev.target.value; render(); }
  if (ev.target.dataset.f === 'cex') { ui.cex = ev.target.value; render(); }
  if (ev.target.dataset.pf === 's') render();
});

/* ===== Start ===== */
dlg = document.createElement('dialog'); dlg.setAttribute('aria-label', 'Dialog'); document.body.appendChild(dlg);
loadLocal();
if (S.sess) startTick();
render();
if (S.sess) holdScreen();
initCloud();
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  const hadSW = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').catch(() => {});
  if (hadSW) navigator.serviceWorker.addEventListener('controllerchange', () => toast('Aplikace se aktualizovala, nová verze se načte při dalším otevření'));
}
