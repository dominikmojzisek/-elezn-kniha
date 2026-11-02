# Železná kniha

Tréninkový deník a plány na posilování. Statická webová aplikace bez serveru a bez databáze:
běží na GitHub Pages a data ukládá jako dva JSON soubory do tvého cloudového úložiště.

V jedné složce jsou dva soubory (výchozí `/ZeleznaKniha`):

- `app.json` je deník klienta (tréninky, nastavení, příznak „právě cvičí“). Zapisuje ho jen klient.
- `plans.json` jsou plány a seznam změn od trenéra. Zapisuje klient i trenér.

Klient složku nasdílí trenérovi ve svém úložišti. Trenér je ve složce host.

Domácí cvičení: v záložce Cviky přepni na **Doma**, zadej vybavení (jednoručky, obouruční činka, polohovací lavice, stojan, kettlebell, gumy,
hrazda, TRX, běžecký pás a další) a nabízejí se jen cviky, které s ním zvládneš. Generátor umí domácí rozpisy a volitelně přidá běžecký pás
(rozcvička, chůze do kopce po tréninku, nebo samostatný den). Plán si pamatuje, jestli je pro posilovnu nebo domů.

Funkce: 53 cviků na konkrétních strojích, filtr podle vybavení klubu, generátor plánů, vlastní plány,
záznam skutečných vah a opakování, časovač pauz, graf pokroku, trenér s přístupem do sdílené složky a úpravy plánu
(jen když klient necvičí, každá změna je označená a klient ji potvrdí).

## 1. Nasazení na GitHub Pages

1. Vytvoř repozitář a nahraj do něj obsah této složky (větev `main`).
2. V repozitáři otevři **Settings → Pages** a jako zdroj zvol **GitHub Actions**.
3. Workflow `.github/workflows/pages.yml` stránku nasadí po každém pushi.
   Adresa bude `https://TVOJE-JMENO.github.io/NAZEV-REPOZITARE/`.

Lokálně: `python3 -m http.server 8000` a otevři `http://localhost:8000`. Žádný build není potřeba.

## 2. Úložiště

V aplikaci otevři **Připojení** (tlačítko na záložce Dnes) a vyber úložiště.

### Dropbox (doporučeno)

1. Na https://www.dropbox.com/developers/apps zvol **Create app → Scoped access → Full Dropbox**.
   Full Dropbox je nutný, aby šlo číst sdílenou složku mezi dvěma účty.
2. Na záložce **Permissions** zapni `files.content.read` a `files.content.write` a ulož.
3. Na záložce **Settings** přidej **Redirect URI** přesně v tomto tvaru: adresa tvé stránky včetně lomítka na konci,
   např. `https://TVOJE-JMENO.github.io/NAZEV-REPOZITARE/`. Stejnou adresu ukáže dialog Připojení.
4. Zkopíruj **App key** do `config.js` (`dropboxAppKey`) nebo ho zadej přímo v dialogu Připojení.
5. V dialogu Připojení zvol Dropbox a klikni na **Uložit a připojit**. Přihlásíš se v Dropboxu a vrátíš se do aplikace.

Soubory se vytvoří samy ve složce `/ZeleznaKniha`. Název složky jde změnit v dialogu Připojení.

### Nextcloud / WebDAV

- Adresa WebDAV: `https://tvuj-cloud.cz/remote.php/dav/files/TVOJE-JMENO`
- Uživatel a **aplikační heslo** (Nastavení → Zabezpečení → Zařízení a relace).
- Z prohlížeče to funguje jen když server posílá CORS hlavičky pro adresu tvé stránky. Příklad pro Apache:

```
Header always set Access-Control-Allow-Origin "https://TVOJE-JMENO.github.io"
Header always set Access-Control-Allow-Methods "GET, PUT, MKCOL, OPTIONS"
Header always set Access-Control-Allow-Headers "Authorization, Content-Type, If-Match, If-None-Match, Depth"
Header always set Access-Control-Expose-Headers "ETag"
```

  Server musí také odpovídat na OPTIONS bez přihlášení. Bez těchto hlaviček prohlížeč požadavky zablokuje.
  Pokud server ETag nevystaví, aplikace si poradí porovnáním obsahu, jen s menší ochranou proti souběžným zápisům.

### iCloud a ruční režim

iCloud Drive nemá veřejné rozhraní, které by šlo použít z webové stránky, takže přímé připojení není možné.
V režimu **Ručně** zůstávají data v prohlížeči a přenášíš je souborem:

- Zálohu deníku uložíš tlačítkem **Export deníku** a soubor dáš do iCloud Drive (přes Soubory / sdílení).
- Mezi klientem a trenérem se posílají `app.json` (deník, trenér ho jen čte) a `plans.json` (plány, **Export plánů** / **Import plánů**), třeba přes sdílenou složku iCloudu nebo zprávou.
- V ručním režimu nelze hlídat, že klient právě cvičí. Úpravy plánu před tréninkem musí trenér s klientem domluvit.

## Mobil, offline a displej

- Aplikace je PWA. Na iPhonu: Safari, Sdílet, Přidat na plochu. Na Androidu: Chrome, menu, Nainstalovat aplikaci.
- Po prvním načtení se všechny soubory uloží do mezipaměti (`sw.js`), takže se aplikace otevře i bez signálu.
  Synchronizace s cloudem pak proběhne, až je zase připojení. Nová verze se stáhne na pozadí a načte se při dalším otevření.
  Číslo verze doplní workflow při nasazení. Při lokálním vývoji (`__BUILD__`) po změně souborů smaž data stránky nebo
  v prohlížeči zapni „Update on reload“ pro service worker.
- Při tréninku drží aplikace displej rozsvícený (Screen Wake Lock). Jde vypnout tlačítkem „Displej zůstane zapnutý“.
  Na starších verzích iOS v aplikaci z plochy tato funkce nemusí fungovat.
- Přihlášení k Dropboxu na iPhonu proveď přímo v aplikaci z plochy. Safari a aplikace z plochy mají oddělené úložiště.

## 3. Trenér

1. Klient ve svém Dropboxu (nebo Nextcloudu) nasdílí složku `ZeleznaKniha` trenérovi s právem úprav.
   Trenér uvidí deník i plány, žádné zapínání sdílení v aplikaci není.
2. Trenér otevře stejnou adresu aplikace, v **Připojení** zvolí roli **Trenér**, připojí své úložiště a zadá cestu ke sdílené
   složce (obvykle se mu objeví v kořeni úložiště pod stejným názvem).
3. Trenér vidí report z deníku a upravuje plány. Změna se uloží hned a označí se u cviku štítkem „Změna“.
4. Klient dostane v aplikaci hlášení „Trenér změnil plán“ se seznamem a potvrdí ho tlačítkem **Rozumím**.
5. Když klient trénuje, trenér plán měnit nemůže (příznak v `app.json`). Po dokončení tréninku se zámek uvolní.
   Trenér má v souboru `app.json` právo zápisu, ale aplikace do něj nezapisuje.

## 4. Co je dobré vědět

- Soubory nemají push, aplikace kontroluje změny každých 15 s (trenér) a 30 s (klient) a při návratu na stránku.
- Souběžné zápisy hlídá revize souboru. Při kolizi se zápis zopakuje, kdo při kolizi prohrál, dostane upozornění a plán se načte znovu.
- Přihlašovací token Dropboxu (refresh token) a heslo k WebDAV jsou uložené v prohlížeči. Používej jen své zařízení
  a u Nextcloudu aplikační heslo, které jde kdykoli zrušit.
- Data jsou čitelný JSON, takže jde zálohovat a prohlížet i bez aplikace.

## 5. Stav testování

Logika (ukládání se souběžnými zápisy, sdílení složky, úpravy trenéra, označení změn, zámek při tréninku) je ověřená simulací
nad ručním úložištěm. Připojení k Dropboxu a Nextcloudu nebylo zkoušeno proti skutečným službám,
protože k tomu jsou potřeba tvoje klíče a server. Při prvním zapojení sleduj konzoli prohlížeče
(chyby 401, 403 nebo CORS prozradí špatný klíč, oprávnění nebo hlavičky serveru).

## Struktura

```
index.html        stránka včetně stylů (CSS je vložené přímo v ní)
config.js, manifest.webmanifest, icon.svg, sw.js
js/data.js        databáze cviků a šablony rozpisů
js/equipment.js   vybavení klubu a závislosti cviků
js/storage.js     úložiště: Dropbox, WebDAV, ruční režim
js/core.js        stav, ukládání, generátor plánů, průběh tréninku
js/views-*.js     obrazovky (Dnes, Plány, Cviky, Deník)
js/coach.js       sdílená složka, trenérský pohled, změny
js/settings.js    Připojení, export a import
js/events.js      události a start aplikace
```
