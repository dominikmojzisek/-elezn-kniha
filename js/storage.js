/* ===== Úložiště =====
   Aplikace nepotřebuje žádný server ani databázi. Data jsou dva JSON soubory:
     app.json    soukromý deník klienta (plány, tréninky, nastavení)
     coach.json  sdílený soubor mezi klientem a trenérem (kopie plánů, report, změny)
   Soubory leží u poskytovatele podle nastavení: Dropbox, WebDAV (Nextcloud) nebo ručně (export/import souboru).
   Všichni poskytovatelé mají stejné rozhraní: read(path) -> {data, rev} | null, write(path, obj, rev, mode).
   Souběžné zápisy hlídá revize (Dropbox rev, WebDAV ETag); při kolizi se čte a zapisuje znovu. */
const CFG_KEY = 'zk.cfg';
const DEFAULT_CFG = {
  provider: 'manual', role: 'client',
  appPath: '/ZeleznaKniha/app.json', coachPath: '/ZeleznaKniha-sdileni/coach.json',
  dbxKey: '', davUrl: '', davUser: '', davPass: ''
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const asciiJson = o => JSON.stringify(o).replace(/[\u007f-￿]/g, c => '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4));
const hashStr = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return 'h' + (h >>> 0).toString(36) + s.length; };
const randStr = n => { const a = new Uint8Array(n); crypto.getRandomValues(a); return Array.from(a, b => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[b % 62]).join(''); };
const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const conflict = () => ({ code: 'conflict', message: 'Soubor se mezitím změnil' });

/* ---------- Ruční režim: soubory v tomto prohlížeči, přenos exportem a importem ---------- */
const ManualProv = {
  kind: 'manual',
  ready: () => true,
  async read(path) {
    try {
      const raw = localStorage.getItem('zk.file.' + path); if (!raw) return null;
      const o = JSON.parse(raw); return { data: o.data, rev: String(o.rev) };
    } catch (e) { return null; }
  },
  async write(path, obj, rev, mode) {
    const cur = await this.read(path);
    if (mode === 'cas' && ((rev == null && cur) || (rev != null && (!cur || cur.rev !== rev)))) throw conflict();
    const n = (cur ? +cur.rev : 0) + 1;
    localStorage.setItem('zk.file.' + path, JSON.stringify({ rev: n, data: obj }));
    return String(n);
  }
};

/* ---------- Dropbox (OAuth PKCE, bez serveru) ---------- */
const DbxProv = {
  kind: 'dropbox',
  key() { return Store.cfg.dbxKey || (window.APP_CONFIG && APP_CONFIG.dropboxAppKey) || ''; },
  tok() { try { return JSON.parse(localStorage.getItem('zk.dbx') || 'null'); } catch (e) { return null; } },
  ready() { const t = this.tok(); return !!(t && t.refresh); },
  redirectUri() { return location.origin + location.pathname; },
  async login() {
    const key = this.key(); if (!key) throw new Error('Chybí Dropbox App key');
    const verifier = randStr(64); sessionStorage.setItem('zk.pkce', verifier);
    const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
    location.href = 'https://www.dropbox.com/oauth2/authorize?' + new URLSearchParams({
      client_id: key, response_type: 'code', code_challenge: challenge, code_challenge_method: 'S256',
      token_access_type: 'offline', redirect_uri: this.redirectUri()
    });
  },
  async handleRedirect() {
    const code = new URLSearchParams(location.search).get('code'); if (!code) return;
    const verifier = sessionStorage.getItem('zk.pkce');
    history.replaceState(null, '', location.pathname);
    if (!verifier) return;
    const r = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, grant_type: 'authorization_code', client_id: this.key(), code_verifier: verifier, redirect_uri: this.redirectUri() })
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error_description || 'Přihlášení k Dropboxu selhalo');
    localStorage.setItem('zk.dbx', JSON.stringify({ refresh: j.refresh_token, access: j.access_token, exp: Date.now() + j.expires_in * 1000 - 60000 }));
    sessionStorage.removeItem('zk.pkce');
  },
  async access() {
    const t = this.tok(); if (!t) throw new Error('Dropbox není přihlášen');
    if (t.access && t.exp > Date.now()) return t.access;
    const r = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: t.refresh, client_id: this.key() })
    });
    const j = await r.json();
    if (!r.ok) { localStorage.removeItem('zk.dbx'); throw new Error('Dropbox odmítl přihlášení, přihlas se znovu'); }
    localStorage.setItem('zk.dbx', JSON.stringify({ refresh: t.refresh, access: j.access_token, exp: Date.now() + j.expires_in * 1000 - 60000 }));
    return j.access_token;
  },
  async read(path) {
    const a = await this.access();
    const r = await fetch('https://content.dropboxapi.com/2/files/download', { method: 'POST', headers: { Authorization: 'Bearer ' + a, 'Dropbox-API-Arg': asciiJson({ path }) } });
    if (r.status === 409) { const t = await r.text(); if (/not_found/.test(t)) return null; throw new Error('Dropbox: ' + t.slice(0, 120)); }
    if (!r.ok) throw new Error('Dropbox ' + r.status);
    let meta = {}; try { meta = JSON.parse(r.headers.get('dropbox-api-result') || '{}'); } catch (e) {}
    const text = await r.text();
    return { data: JSON.parse(text), rev: meta.rev || hashStr(text) };
  },
  async write(path, obj, rev, mode) {
    const a = await this.access();
    let m;
    if (mode === 'overwrite') m = { '.tag': 'overwrite' };
    else if (rev == null) m = { '.tag': 'add' };
    else if (rev[0] === 'h') { const cur = await this.read(path); if (!cur || cur.rev !== rev) throw conflict(); m = { '.tag': 'overwrite' }; }
    else m = { '.tag': 'update', update: rev };
    const r = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + a, 'Content-Type': 'application/octet-stream', 'Dropbox-API-Arg': asciiJson({ path, mode: m, autorename: false, mute: true }) },
      body: JSON.stringify(obj)
    });
    if (r.status === 409) { const t = await r.text(); if (/conflict/.test(t)) throw conflict(); throw new Error('Dropbox: ' + t.slice(0, 120)); }
    if (!r.ok) throw new Error('Dropbox ' + r.status);
    return (await r.json()).rev;
  }
};

/* ---------- WebDAV (Nextcloud, ownCloud, jiné) ----------
   Z prohlížeče to funguje jen když server posílá CORS hlavičky (viz README). */
const DavProv = {
  kind: 'webdav', dirs: new Set(),
  ready() { return !!Store.cfg.davUrl; },
  url(path) { return Store.cfg.davUrl.replace(/\/+$/, '') + '/' + path.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/'); },
  hdr(extra) {
    const c = Store.cfg, h = Object.assign({}, extra);
    if (c.davUser || c.davPass) h.Authorization = 'Basic ' + btoa(unescape(encodeURIComponent(c.davUser + ':' + c.davPass)));
    return h;
  },
  async read(path) {
    const r = await fetch(this.url(path), { headers: this.hdr(), cache: 'no-store' });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error('WebDAV ' + r.status);
    const text = await r.text();
    return { data: JSON.parse(text), rev: r.headers.get('ETag') || hashStr(text) };
  },
  async ensureDirs(path) {
    const parts = path.replace(/^\/+/, '').split('/'); parts.pop();
    let cur = '';
    for (const p of parts) {
      cur += (cur ? '/' : '') + p;
      if (this.dirs.has(cur)) continue;
      try { await fetch(this.url(cur + '/'), { method: 'MKCOL', headers: this.hdr() }); } catch (e) {}
      this.dirs.add(cur);
    }
  },
  async write(path, obj, rev, mode) {
    const body = JSON.stringify(obj), h = { 'Content-Type': 'application/json' };
    if (mode !== 'overwrite') {
      if (rev == null) h['If-None-Match'] = '*';
      else if (rev[0] === 'h') { const cur = await this.read(path); if (!cur || cur.rev !== rev) throw conflict(); }
      else h['If-Match'] = rev;
    }
    await this.ensureDirs(path);
    const r = await fetch(this.url(path), { method: 'PUT', headers: this.hdr(h), body });
    if (r.status === 412) throw conflict();
    if (!r.ok) throw new Error('WebDAV ' + r.status);
    return r.headers.get('ETag') || hashStr(body);
  }
};

/* ---------- Dokument nad souborem ---------- */
const snapOf = r => ({ exists: !!r, data: () => r ? r.data : undefined, rev: r ? r.rev : null });
class Doc {
  constructor(store, name) { this.s = store; this.name = name; }
  get path() { return this.s.path(this.name); }
  _read() { return this.s.prov.read(this.path); }
  async get() { return snapOf(await this._read()); }
  async set(obj) { await this.s.prov.write(this.path, obj, null, 'overwrite'); }
  /* fn dostane aktuální obsah (nebo null) a vrátí změny k zapsání, nebo null pro nic. Při kolizi se opakuje. */
  async transact(fn) {
    for (let i = 0; i < 4; i++) {
      const cur = await this._read();
      const patch = fn(cur ? cur.data : null);
      if (patch == null) return { written: false, data: cur ? cur.data : null };
      const next = Object.assign({}, cur ? cur.data : {}, patch);
      try { await this.s.prov.write(this.path, next, cur ? cur.rev : null, 'cas'); return { written: true, data: next }; }
      catch (e) { if (e && e.code === 'conflict') { await sleep(150 + Math.random() * 250); continue; } throw e; }
    }
    throw conflict();
  }
  update(patch) { return this.transact(() => patch); }
  /* Soubory nemají push, proto se kontroluje revize každých 15 s (trenér) / 30 s (klient) a při návratu na stránku. */
  onSnapshot(next, error) {
    let stopped = false, last;
    const poll = async force => {
      if (stopped) return;
      try { const r = await this._read(), rev = r ? r.rev : null; if (force || rev !== last) { last = rev; next(snapOf(r)); } }
      catch (e) { if (error) error({ code: 'unavailable', message: String(e && e.message || e) }); }
    };
    poll(true);
    const timer = setInterval(() => { if (!document.hidden) poll(false); }, this.s.cfg.role === 'trainer' ? 15000 : 30000);
    const vis = () => { if (!document.hidden) poll(false); };
    document.addEventListener('visibilitychange', vis);
    return () => { stopped = true; clearInterval(timer); document.removeEventListener('visibilitychange', vis); };
  }
}

const Store = {
  cfg: Object.assign({}, DEFAULT_CFG), prov: ManualProv, ready: false, err: null,
  load() {
    try { Object.assign(this.cfg, JSON.parse(localStorage.getItem(CFG_KEY) || '{}')); } catch (e) {}
    this.prov = { dropbox: DbxProv, webdav: DavProv, manual: ManualProv }[this.cfg.provider] || ManualProv;
  },
  save() { localStorage.setItem(CFG_KEY, JSON.stringify(this.cfg)); this.load(); },
  async init() {
    this.load();
    try { if (this.cfg.provider === 'dropbox') await DbxProv.handleRedirect(); } catch (e) { this.err = e.message; }
    this.ready = this.prov.ready();
    return this.ready;
  },
  isManual() { return this.prov.kind === 'manual'; },
  path(name) { return name === 'coach' ? this.cfg.coachPath : this.cfg.appPath; },
  doc(name) { return new Doc(this, name); }
};
Store.load();
