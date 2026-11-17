/* ===== Doplňky: vlastní závaží, kotouče, rozcvičení, zvuk, rekordy, týdenní přehled, vlastní cviky, kopie, záloha ===== */

/* ---------- Dostupné závaží ----------
   Pro každé místo (posilovna, doma) si uživatel zadá osu, kotouče, jednoručky, kettlebelly a krok strojů.
   Seznamy se píšou oddělené mezerou, desetinná čárka je povolená ("20 10 5 2,5 1,25"). Prázdné pole = výchozí kroky. */
const GEAR_DEF = { gym: { bar: '20', plates: '25 20 15 10 5 2,5 1,25', db: '', kb: '', mach: '' }, home: { bar: '', plates: '', db: '', kb: '', mach: '' } };
const numList = v => String(v || '').split(/[\s;]+/).map(x => parseFloat(x.replace(',', '.'))).filter(x => x > 0);
function gearRaw(place) { return Object.assign({}, GEAR_DEF[place] || GEAR_DEF.gym, ((S.settings.gear || {})[place]) || {}); }
function gearOf(place) {
  const g = gearRaw(place);
  return { bar: numList(g.bar)[0] || 0, plates: numList(g.plates).sort((a, b) => b - a), db: numList(g.db).sort((a, b) => a - b), kb: numList(g.kb).sort((a, b) => a - b), mach: numList(g.mach)[0] || 0 };
}
/* čím se cvik zatěžuje: bb = obouruční činka, db = jednoručky, kb = kettlebell, mach = stroj nebo jiné */
function loadKind(xid) {
  const tags = (EQ_OF[xid] || []).concat(HOME_OF[xid] || []).join(' ');
  if (/\bbb\b/.test(tags)) return 'bb';
  if (/\bkb\b/.test(tags) && !/\bdb\b/.test(tags)) return 'kb';
  if (/\b(db|kb)\b/.test(tags)) return 'db';
  return 'mach';
}
const placeOfEx = xid => { for (const p of S.plans) for (const d of p.days) for (const i of d.ex) if (i.x === xid) return p.place || 'gym'; return curPlace(); };
function loadList(xid, place) {
  const g = gearOf(place), k = loadKind(xid);
  if (k === 'db') return g.db.length ? g.db : (/\bkb\b/.test((HOME_OF[xid] || []).join(' ')) ? g.kb : []);
  if (k === 'kb') return g.kb;
  return [];
}
/* nejbližší vyšší dostupná váha; když těžší není, vrátí stejnou */
function upW(xid, w, place) {
  const g = gearOf(place), k = loadKind(xid), L = loadList(xid, place);
  if (k === 'bb' && g.plates.length) {
    const base = g.bar || 20, st = 2 * g.plates[g.plates.length - 1];
    return roundTo(Math.max(base, base + (Math.floor((w - base) / st + 1e-9) + 1) * st), 0.05);
  }
  if (L.length) { const n = L.find(v => v > w + 1e-9); return n == null ? w : n; }
  if (k === 'mach' && g.mach > 0) return roundTo(w + g.mach, 0.05);
  return roundTo(w + wStep(xid, w), 0.25);
}
/* nejbližší dostupná váha směrem dolů k cíli */
function downW(xid, target, place) {
  const g = gearOf(place), k = loadKind(xid), L = loadList(xid, place);
  if (k === 'bb' && g.plates.length) {
    const base = g.bar || 20, st = 2 * g.plates[g.plates.length - 1];
    return roundTo(Math.max(base, base + Math.round((target - base) / st) * st), 0.05);
  }
  if (L.length) { const c = L.filter(v => v <= target + 1e-9); return c.length ? c[c.length - 1] : L[0]; }
  const st = k === 'mach' && g.mach > 0 ? g.mach : wStep(xid, target);
  return Math.max(st, roundTo(target, st));
}
/* co naložit na činku: kotouče na jednu stranu */
function platesFor(w, place) {
  const g = gearOf(place); if (!g.plates.length || !(w > 0)) return null;
  const bar = g.bar || 20; let side = (w - bar) / 2;
  if (side < -1e-9) return { bar, list: [], under: true };
  const list = [];
  for (const p of g.plates) { const n = Math.floor(side / p + 1e-9); if (n > 0) { list.push([p, n]); side -= n * p; } }
  return { bar, list, rem: Math.round(side * 2 * 100) / 100 };
}
function platesText(w, place) {
  const r = platesFor(w, place); if (!r) return '';
  if (r.under) return `Osa má ${fmtKg(r.bar)} kg, lehčí váhu z ní nesložíš.`;
  if (!r.list.length) return `Jen osa ${fmtKg(r.bar)} kg.`;
  return `Osa ${fmtKg(r.bar)} kg + na každou stranu ${r.list.map(([p, n]) => (n > 1 ? n + '× ' : '') + fmtKg(p)).join(', ')}` + (r.rem > 0.01 ? `. Přesně to nevyjde, složíš ${fmtKg(w - r.rem)} kg.` : '.');
}
/* rozcvičovací série před prvním cvikem na partii: 50 %, 70 % a 85 % pracovní váhy */
function warmupText(xid, w, place) {
  if (!(w >= 20) || exOf(xid).c === 'stred' || exOf(xid).c === 'kondice') return '';
  const out = [], seen = new Set();
  [[0.5, 8], [0.7, 5], [0.85, 2]].forEach(([k, r]) => {
    const v = downW(xid, w * k, place);
    if (v > 0 && v < w && !seen.has(v)) { seen.add(v); out.push(`${fmtKg(v)} kg × ${r}`); }
  });
  return out.length ? out.join(' · ') : '';
}

/* ---------- Zvuk na konci pauzy ---------- */
let actx = null;
function soundUnlock() {
  if (S.settings.sound === false) return;
  try { const A = window.AudioContext || window.webkitAudioContext; if (!A) return; actx = actx || new A(); if (actx.state === 'suspended') actx.resume(); } catch (e) {}
}
function beep() {
  if (S.settings.sound === false || !actx) return;
  try {
    [0, 0.25, 0.5].forEach(t => {
      const o = actx.createOscillator(), g = actx.createGain(), t0 = actx.currentTime + t;
      o.frequency.value = 880; o.connect(g); g.connect(actx.destination);
      g.gain.setValueAtTime(0.001, t0); g.gain.exponentialRampToValueAtTime(0.4, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
      o.start(t0); o.stop(t0 + 0.2);
    });
  } catch (e) {}
}

/* ---------- Pocit z tréninku ---------- */
const FEEL = { 1: 'Lehké', 2: 'V pohodě', 3: 'Tak akorát', 4: 'Těžké', 5: 'Na hraně' };

/* ---------- Osobní rekordy ---------- */
/* události, kdy nejvyšší váha u cviku překonala dosavadní maximum (první záznam se nepočítá) */
function prEvents() {
  const best = {}, out = [];
  S.logs.slice().sort((a, b) => a.date - b.date).forEach(l => l.items.forEach(it => {
    const top = it.sets.reduce((a, s) => (s.w || 0) > (a.w || 0) ? s : a, { w: 0 });
    if (!(top.w > 0)) return;
    if (best[it.x] != null && top.w > best[it.x]) out.push({ t: l.date, x: it.x, w: top.w, r: top.r, d: Math.round((top.w - best[it.x]) * 100) / 100 });
    if (best[it.x] == null || top.w > best[it.x]) best[it.x] = top.w;
  }));
  return out.reverse();
}
function prHtml() {
  const ev = prEvents().slice(0, 8);
  if (!ev.length) return '';
  return `<h2>Osobní rekordy</h2><div class="stack">${ev.map(e => `<button class="pickitem" data-act="histpick" data-x="${e.x}"><span><b>${esc(exOf(e.x).n)}</b><em>${fmtShort(e.t)} · ${fmtKg(e.w)} kg × ${e.r}</em></span><span class="tag">+${fmtKg(e.d)} kg</span></button>`).join('')}</div>`;
}
/* rekord přímo v tréninku: vyšší váha než kdykoli dřív i než v jiné hotové sérii tohoto tréninku */
function isPr(it, z) {
  const prev = bestOf(it.x).w;
  if (!(prev > 0) || !(z.w > prev)) return false;
  return !it.sets.some(o => o !== z && o.ok && (o.w || 0) >= z.w);
}

/* ---------- Týdenní přehled podle partií ---------- */
function weekByCat() {
  const now = Date.now(), cur = {}, prev = {};
  S.logs.forEach(l => {
    const age = now - l.date, tgt = age < 7 * 864e5 ? cur : age < 14 * 864e5 ? prev : null;
    if (tgt) l.items.forEach(it => { const c = exOf(it.x).c; tgt[c] = (tgt[c] || 0) + it.sets.length; });
  });
  return { cur, prev };
}
function weekHtml() {
  const { cur, prev } = weekByCat();
  const cats = CATS.filter(c => cur[c.id] || prev[c.id]);
  if (!cats.length) return '';
  const max = Math.max(1, ...cats.map(c => Math.max(cur[c.id] || 0, prev[c.id] || 0)));
  const rows = cats.map(c => {
    const a = cur[c.id] || 0, b = prev[c.id] || 0, d = a - b;
    return `<div><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><b style="font-size:15px">${esc(c.n)}</b><span class="num" style="font-size:14px">${a} sérií <span class="muted">${d === 0 ? '(stejně)' : '(' + (d > 0 ? '+' : '−') + Math.abs(d) + ')'}</span></span></div>
      <div class="bar" role="img" aria-label="${esc(c.n)}: ${a} sérií, minulý týden ${b}"><i style="width:${a / max * 100}%"></i></div></div>`;
  }).join('');
  const main = ['hrudnik', 'zada', 'nohy', 'ramena', 'paze', 'stred'].filter(c => !cur[c]).map(c => CATMAP[c].toLowerCase());
  const miss = main.length && main.length < 6 ? `<div class="muted" style="font-size:14px">Tento týden bez tréninku: ${main.join(', ')}.</div>` : '';
  return `<div class="card stack"><div><span class="lbl">Série za 7 dní podle partií</span><div class="muted" style="font-size:13px">V závorce změna proti předchozímu týdnu.</div></div>${rows}${miss}</div>`;
}

/* ---------- Vlastní cviky ----------
   Ukládají se do nastavení (settings.customEx), takže je vidí i trenér. Smazaný cvik zůstává dohledatelný podle id,
   aby se v deníku a plánech dál zobrazoval jeho název. */
function syncCustom() {
  for (let i = EX.length - 1; i >= 0; i--) if (EX[i].custom) EX.splice(i, 1);
  Object.keys(EXMAP).forEach(k => { if (EXMAP[k].custom) { delete EXMAP[k]; delete HOME_OF[k]; delete EQ_OF[k]; } });
  ((S.settings && S.settings.customEx) || []).forEach(c => {
    if (!c || !c.id || !c.n) return;
    const e = { id: c.id, c: CATMAP[c.c] ? c.c : 'stred', n: c.n, m: c.m || 'Vlastní', mu: c.mu || '', s: +c.s || 3, r: c.r || '8-12', rest: +c.rest || 60, lvl: 1, tip: c.tip || '', custom: true, gym: c.where !== 'home' };
    EXMAP[e.id] = e; EQ_OF[e.id] = [];
    if (c.where !== 'gym') HOME_OF[e.id] = [];
    if (!c.del) EX.push(e);
  });
}
function customDialog(id) {
  const c = ((S.settings.customEx || []).find(x => x.id === id)) || { c: ui.cat !== 'all' ? ui.cat : 'hrudnik', s: 3, r: '8-12', rest: 60, where: curPlace() === 'home' ? 'home' : 'both' };
  const inp = (k, l, v, extra = '') => `<label class="field"><span class="lbl">${l}</span><input id="cx-${k}" value="${esc(v ?? '')}" autocomplete="off" ${extra}></label>`;
  openDlg(`<h2>${id ? 'Upravit cvik' : 'Vlastní cvik'}</h2>
    ${inp('n', 'Název cviku', c.n, 'maxlength="60"')}
    ${sel('cx-c', { l: 'Partie', o: CATS.map(k => [k.id, k.n]), v: c.c })}
    ${inp('m', 'Stroj nebo vybavení', c.m, 'maxlength="60" placeholder="např. jednoručky, kladka"')}
    ${inp('mu', 'Zapojené svaly', c.mu, 'maxlength="80"')}
    <div class="grid2" style="grid-template-columns:repeat(3,minmax(0,1fr))">${inp('s', 'Série', c.s, 'inputmode="numeric"')}${inp('r', 'Opak.', c.r, 'maxlength="14"')}${inp('rest', 'Pauza s', c.rest, 'inputmode="numeric"')}</div>
    ${sel('cx-where', { l: 'Kde ho cvičíš', o: [['both', 'V posilovnách i doma'], ['gym', 'Jen v posilovnách'], ['home', 'Jen doma']], v: c.where || 'both' })}
    ${inp('tip', 'Poznámka k provedení', c.tip, 'maxlength="160"')}
    <div class="row"><button class="btn pri grow" data-act="cxsave" data-x="${id || ''}">Uložit cvik</button><button class="btn" data-act="close">Zrušit</button></div>`);
}

/* ---------- Kopie plánu a dne ---------- */
function clonePlan(p) {
  const c = JSON.parse(JSON.stringify(p));
  c.id = uid(); c.name = p.name + ' (kopie)'; c.created = Date.now();
  c.days.forEach(d => { d.id = uid(); d.ex.forEach(i => { i.id = uid(); i.chg = null; }); });
  return c;
}
function cloneDay(d) {
  const c = JSON.parse(JSON.stringify(d));
  c.id = uid(); c.t = d.t + ' (kopie)'; c.ex.forEach(i => { i.id = uid(); i.chg = null; });
  return c;
}

/* ---------- Záloha ---------- */
/* připomínka jen tehdy, když data nejsou v cloudu: po pěti trénincích bez zálohy */
function backupHint() {
  if (MODE !== 'client' || (Store.ready && !Store.isManual())) return '';
  const n = S.logs.length - (S.settings.backupN || 0);
  if (n < 5) return '';
  return `<div class="card stack" style="border-color:var(--warn)"><b>Zálohuj si data</b><div class="muted" style="font-size:14px">${n} tréninků je uložených jen v tomto zařízení. Když smažeš data prohlížeče, přijdeš o ně.</div>
    <div class="row"><button class="btn pri" data-act="exportf" data-n="app">Uložit zálohu</button><button class="btn ghost" data-act="backuplater">Později</button></div></div>`;
}

/* ---------- Dialog závaží ---------- */
function gearDialog(place) {
  place = place || curPlace();
  const g = gearRaw(place);
  const inp = (k, l, ph, mode = 'text') => `<label class="field"><span class="lbl">${l}</span><input id="gr-${k}" value="${esc(g[k])}" placeholder="${ph}" inputmode="${mode}" autocomplete="off"></label>`;
  openDlg(`<h2>Moje závaží</h2><p class="muted" style="margin:0;font-size:14px">Doporučené váhy se zaokrouhlí na to, co opravdu máš. Hodnoty odděluj mezerou. Prázdné pole znamená běžné kroky.</p>
    <div class="chips" role="group" aria-label="Místo">${gymList().concat([{ id: 'home', name: 'Doma' }]).map(g => `<button class="chip" aria-pressed="${place === g.id}" data-act="gear" data-v="${g.id}">${esc(g.name)}</button>`).join('')}</div>
    ${inp('bar', 'Váha osy obouruční činky (kg)', '20', 'decimal')}
    ${inp('plates', 'Kotouče, které máš (kg)', '20 10 5 2,5 1,25')}
    ${inp('db', 'Jednoručky (kg)', '4 6 8 10 12 14 16')}
    ${inp('kb', 'Kettlebelly (kg)', '8 12 16 20')}
    ${inp('mach', 'Krok závaží na strojích (kg)', '5', 'decimal')}
    <div class="row"><button class="btn pri grow" data-act="gearsave" data-v="${place}">Uložit</button><button class="btn" data-act="close">Zavřít</button></div>`);
}

/* ---------- Posilovny ---------- */
function gymsDialog() {
  const rows = gymList().map(g => `<div class="card stack" style="padding:12px"><label class="field"><span class="lbl">Název</span><input id="gn-${g.id}" value="${esc(g.name)}" maxlength="50" autocomplete="off"></label>
    <div class="row"><button class="btn sm" data-act="eq" data-v="${g.id}">Vybavení a stroje</button><button class="btn sm" data-act="gear" data-v="${g.id}">Závaží</button>${g.id === 'gym' ? '' : `<button class="btn sm ghost bad" data-act="gymdel" data-v="${g.id}">Smazat</button>`}</div></div>`).join('');
  const src = [['all', 'Všechny stroje dostupné'], ['free', 'Jen volné váhy a functional'], ['none', 'Nic, zaškrtnu si sám']].concat(gymList().map(g => ['copy:' + g.id, 'Zkopírovat z: ' + g.name]));
  openDlg(`<h2>Moje posilovny</h2><p class="muted" style="margin:0;font-size:14px">Každá posilovna má vlastní seznam strojů a závaží. Plán se vytváří pro konkrétní posilovnu a nabízí jen cviky, které tam zvládneš.</p>
    ${rows}<div><button class="btn sm" data-act="gymnames">Uložit názvy</button></div>
    <div class="card stack" style="padding:12px"><b>Přidat posilovnu</b>
      <label class="field"><span class="lbl">Název</span><input id="gn-new" maxlength="50" placeholder="např. Fitko u práce" autocomplete="off"></label>
      ${sel('gn-src', { l: 'Začít s vybavením', o: src, v: 'all' })}
      <button class="btn pri" data-act="gymadd">Přidat a nastavit stroje</button></div>
    <button class="btn" data-act="close">Hotovo</button>`);
}
const EQ_FREE = ['db', 'bb', 'kb', 'trx', 'sled', 'med', 'box', 'bands', 'glute'];
function setEqOf(place, m) { if (place === 'gym') S.settings.eq = m; else { const g = S.settings.gyms.find(x => x.id === place); if (g) g.eq = m; } }

const EXTRA_ACTIONS = {
  gyms: () => gymsDialog(),
  gymnames: () => {
    gymList().forEach(g => { const v = (($('#gn-' + g.id, dlg) || {}).value || '').trim().slice(0, 50); if (!v) return; if (g.id === 'gym') S.settings.gymName = v; else { const x = S.settings.gyms.find(y => y.id === g.id); if (x) x.name = v; } });
    persist(); render(); gymsDialog(); toast('Názvy uloženy');
  },
  gymadd: () => {
    const name = (($('#gn-new', dlg) || {}).value || '').trim().slice(0, 50), src = ($('#gn-src', dlg) || {}).value || 'all';
    if (!name) { toast('Zadej název posilovny'); return; }
    let eq = {};
    if (src === 'free') EQLIST.forEach(g => g.items.forEach(([t]) => { eq[t] = EQ_FREE.includes(t); }));
    else if (src === 'none') EQLIST.forEach(g => g.items.forEach(([t]) => { eq[t] = false; }));
    else if (src.startsWith('copy:')) eq = JSON.parse(JSON.stringify(eqOf(src.slice(5)) || {}));
    const id = 'g_' + uid();
    S.settings.gyms.push({ id, name, eq }); S.settings.place = id;
    persist(); render(); eqDialog(id);
  },
  gymdel: el => askDlg('Smazat posilovnu? Plány pro ni se přesunou do výchozí posilovny.', 'dogymdel', `data-v="${el.dataset.v}"`),
  dogymdel: el => {
    const id = el.dataset.v;
    S.settings.gyms = S.settings.gyms.filter(g => g.id !== id);
    S.plans.forEach(p => { if (p.place === id) p.place = 'gym'; });
    if (S.settings.gear) delete S.settings.gear[id];
    if (S.settings.place === id) S.settings.place = 'gym';
    persist(); render(); gymsDialog();
  },
  gear: el => gearDialog(el.dataset.v),
  gearsave: el => {
    const g = {}; ['bar', 'plates', 'db', 'kb', 'mach'].forEach(k => { g[k] = ($('#gr-' + k, dlg).value || '').trim().slice(0, 120); });
    S.settings.gear = Object.assign({}, S.settings.gear, { [el.dataset.v]: g });
    closeDlg(); persist(); render(); toast('Závaží uloženo');
  },
  sound: () => { S.settings.sound = (S.settings.sound === false); if (S.settings.sound) { soundUnlock(); beep(); } persist(); render(); },
  backuplater: () => { S.settings.backupN = Math.max(0, S.logs.length - 2); persist(); render(); },
  cxnew: () => customDialog(''),
  cxedit: el => customDialog(el.dataset.x),
  cxsave: el => {
    const v = k => (($('#cx-' + k, dlg) || {}).value || '').trim();
    if (!v('n')) { toast('Zadej název cviku'); return; }
    const list = S.settings.customEx = S.settings.customEx || [];
    let c = list.find(x => x.id === el.dataset.x);
    if (!c) { c = { id: 'c_' + uid() }; list.push(c); }
    Object.assign(c, { n: v('n').slice(0, 60), c: v('c'), m: v('m').slice(0, 60), mu: v('mu').slice(0, 80), s: Math.min(10, Math.max(1, parseInt(v('s')) || 3)), r: v('r').slice(0, 14) || '8-12',
      rest: Math.min(600, Math.max(0, parseInt(v('rest')) || 60)), where: v('where') || 'both', tip: v('tip').slice(0, 160), del: false });
    syncCustom(); closeDlg(); persist(); render(); toast('Cvik uložen');
  },
  cxdel: el => askDlg('Smazat vlastní cvik? V deníku a plánech jeho název zůstane.', 'docxdel', `data-x="${el.dataset.x}"`),
  docxdel: el => { const c = (S.settings.customEx || []).find(x => x.id === el.dataset.x); if (c) c.del = true; syncCustom(); closeDlg(); persist(); render(); },
  copyplan: el => { const p = S.plans.find(x => x.id === el.dataset.p); if (!p) return; S.plans.splice(S.plans.indexOf(p) + 1, 0, clonePlan(p)); persist(); render(); toast('Plán zkopírován'); },
  copyday: () => { const p = curPlan(), d = curDay(); if (!p || !d) return; p.days.splice(ui.editDay + 1, 0, cloneDay(d)); ui.editDay++; persist(); render(); toast('Den zkopírován'); },
  ss: el => { const it = curDay().ex[+el.dataset.k]; it.ss = !it.ss; persist(); render(); }
};
