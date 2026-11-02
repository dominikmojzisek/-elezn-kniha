/* ===== Vybavení posilovny (GymNation Brno Kaštanová) =====
   Třetí hodnota = 1: potvrzeno na webu gymnation.cz (silová a functional zóna, značky Panatta, Precor, Glute Builder).
   Konkrétní seznam strojů web neuvádí, takže zbytek si uživatel zaškrtne sám. */
const GYM_NAME = 'GymNation Brno Kaštanová';
const EQLIST = [
  { g: 'Volné váhy', items: [['db', 'Jednoručky', 1], ['bb', 'Olympijská činka a kotouče', 1], ['rack', 'Stojan na dřepy a tlaky', 0], ['bench', 'Lavice rovná a šikmá', 0], ['ez', 'EZ činka', 0], ['smith', 'Smithův stroj', 0]] },
  { g: 'Stroje na horní tělo', items: [['chestm', 'Tlak na prsa (chest press)', 0], ['inclm', 'Šikmý tlak na prsa', 0], ['peck', 'Peck deck / zadní ramena', 0], ['shm', 'Tlak na ramena', 0], ['latpd', 'Stahování horní kladky (lat pulldown)', 0], ['rowm', 'Veslování vsedě / Hammer row', 0], ['tbar', 'T-bar', 0], ['assist', 'Asistovaný shyb a dip', 0], ['hyper', 'Lavice na hyperextenze', 0], ['preach', 'Scottova lavice', 0], ['tricm', 'Stroj na triceps', 0]] },
  { g: 'Stroje na nohy', items: [['legpress', 'Leg press', 0], ['hack', 'Hack dřep', 0], ['legext', 'Předkopávání', 0], ['legcurl', 'Zakopávání (vleže / vsedě)', 0], ['calfm', 'Výpony na lýtka', 0], ['abd', 'Odnožování a přinožování', 0], ['glute', 'Glute Builder (hip thrust)', 1]] },
  { g: 'Kladky a střed těla', items: [['cable', 'Kladková věž / crossover', 0], ['abm', 'Stroj na břicho', 0], ['pullbar', 'Hrazda / římská židle', 0]] },
  { g: 'Kardio', items: [['tread', 'Běžecký pás', 0]] },
  { g: 'Functional zóna', items: [['kb', 'Kettlebelly', 1], ['trx', 'TRX', 1], ['sled', 'Sáně', 1], ['med', 'Medicinbaly', 1], ['box', 'Plyo boxy', 1], ['bands', 'Rezistenční gumy', 1]] }
];

/* Které vybavení který cvik potřebuje (prázdné pole = stačí podložka) */
const EQ_OF = {
  bench: ['bb', 'rack', 'bench'], chestp: ['chestm'], incdb: ['db', 'bench'], incms: ['inclm'], peck: ['peck'], cross: ['cable'], dipm: ['assist'],
  latpd: ['latpd'], seatrow: ['rowm'], cabrow: ['cable'], tbar: ['tbar'], hsrow: ['rowm'], assch: ['assist'], dead: ['bb'], hyper: ['hyper'],
  squat: ['bb', 'rack'], smith: ['smith'], legpr: ['legpress'], hack: ['hack'], legext: ['legext'], legcurl: ['legcurl'], seatcurl: ['legcurl'],
  rdl: ['bb'], hipth: ['glute'], abduct: ['abd'], adduct: ['abd'], calf: ['calfm'], calfs: ['calfm'],
  ohp: ['bb', 'rack'], shpm: ['shm'], dbsh: ['db', 'bench'], latr: ['db'], rpeck: ['peck'], facep: ['cable'], shrug: ['db'],
  bbcurl: ['ez'], precurl: ['preach'], hamcurl: ['db'], pushd: ['cable'], fren: ['ez', 'bench'], tripm: ['tricm'],
  crunm: ['abm'], cabcr: ['cable'], legrs: ['pullbar'], plank: [], woodc: ['cable'],
  kbswing: ['kb'], goblet: ['kb'], boxup: ['box'], sled: ['sled'], trxrow: ['trx'], slam: ['med'], bandfp: ['bands']
};

/* Nové cviky podle potvrzeného vybavení functional zóny */
[
  { id: 'kbswing', c: 'nohy',   n: 'Kettlebell swing',       m: 'Kettlebell (functional zóna)', mu: 'Zadek, hamstringy, záda', s: 4, r: '12-15', rest: 75, lvl: 2, tip: 'Pohyb vychází z kyčlí, ne z rukou. Nahoře zpevni zadek.' },
  { id: 'goblet',  c: 'nohy',   n: 'Goblet dřep',            m: 'Kettlebell (functional zóna)', mu: 'Kvadricepsy, zadek', s: 3, r: '10-12', rest: 75, lvl: 1, tip: 'Závaží drž u hrudi, lokty tlač dovnitř kolen.' },
  { id: 'boxup',   c: 'nohy',   n: 'Výstupy na bednu',       m: 'Plyo box', mu: 'Kvadricepsy, zadek', s: 3, r: '10 / noha', rest: 75, lvl: 1, tip: 'Tlač přes celé chodidlo stojné nohy, druhou nepomáhej.' },
  { id: 'sled',    c: 'nohy',   n: 'Tlačení saní',           m: 'Sáně (functional zóna)', mu: 'Nohy, kondice', s: 4, r: '20 m', rest: 90, lvl: 1, tip: 'Trup nakloněný, krátké silné kroky.' },
  { id: 'trxrow',  c: 'zada',   n: 'Veslování na TRX',       m: 'TRX', mu: 'Střed zad, zadní ramena', s: 3, r: '10-15', rest: 60, lvl: 1, tip: 'Čím víc nakloníš tělo dozadu, tím těžší cvik.' },
  { id: 'slam',    c: 'stred',  n: 'Medicinbal slam',        m: 'Medicinbal', mu: 'Celé tělo, střed těla', s: 3, r: '10-12', rest: 60, lvl: 1, tip: 'Nahoře se natáhni, míč vrhej silně k zemi.' },
  { id: 'bandfp',  c: 'ramena', n: 'Face pull s gumou',      m: 'Rezistenční guma', mu: 'Zadní ramena, rotátory', s: 3, r: '15-20', rest: 45, lvl: 1, tip: 'Gumu upevni ve výši obličeje, lokty vysoko.' }
].forEach(e => { EX.push(e); EXMAP[e.id] = e; });

/* ===== Domácí cvičení =====
   Doma platí opačné pravidlo než v klubu: cvik je dostupný jen tehdy, když máš zaškrtnuté všechno vybavení, které potřebuje.
   Podložka se předpokládá vždy. Zápis 'a|b' znamená, že stačí jedno z toho. Cvik bez záznamu v HOME_OF je jen pro posilovnu. */
const HOMELIST = [
  { g: 'Činky a závaží', items: [['db', 'Jednoručky (jednoruční činka)'], ['bb', 'Obouruční činka s kotouči'], ['kb', 'Kettlebell'], ['med', 'Medicinbal']] },
  { g: 'Lavice a stojany', items: [['bench', 'Polohovací lavice'], ['rack', 'Stojan na dřepy a tlaky'], ['box', 'Stabilní bedna nebo stupínek'], ['pullbar', 'Hrazda (shyby, visy)']] },
  { g: 'Odpor a stabilita', items: [['bands', 'Posilovací gumy'], ['trx', 'Závěsný systém (TRX)'], ['fitball', 'Gymnastický míč'], ['abwheel', 'Kolečko na břicho']] },
  { g: 'Kardio', items: [['tread', 'Běžecký pás'], ['rope', 'Švihadlo']] }
];
const HOME_OF = {
  bench: ['bb', 'bench', 'rack'], incdb: ['db', 'bench'], dead: ['bb'], squat: ['bb', 'rack'], rdl: ['bb|db'], hipth: ['bench', 'bb|db'],
  ohp: ['bb', 'rack'], dbsh: ['db', 'bench'], latr: ['db'], shrug: ['db'], hamcurl: ['db'], legrs: ['pullbar'], plank: [],
  kbswing: ['kb'], goblet: ['kb|db'], boxup: ['box'], trxrow: ['trx'], slam: ['med'], bandfp: ['bands'],
  pushup: [], dbpress: ['db'], dbfly: ['db', 'bench'], dbrow: ['db'], pullup: ['pullbar'], bandpd: ['bands'], bandrow: ['bands'], bentbb: ['bb'],
  bodysq: [], lunge: ['db'], bulg: ['bench'], gluteb: [], hcalf: [], ballcurl: ['fitball'],
  dbohp: ['db'], rfly: ['db'], dbcurl: ['db'], dbtri: ['db'], benchdip: ['bench'], bandtri: ['bands'],
  crunch: [], abwheel: ['abwheel'], deadbug: [], russian: ['db|med'], sideplank: [],
  treadwarm: ['tread'], walkinc: ['tread'], runeasy: ['tread'], runint: ['tread'], rope: ['rope']
};
const EQ_OF_NEW = {
  incdb: ['db', 'bench'], dbfly: ['db', 'bench'], dbpress: ['db'], dbrow: ['db'], pullup: ['pullbar'], bentbb: ['bb'], lunge: ['db'], bulg: ['bench'],
  dbohp: ['db'], rfly: ['db'], dbcurl: ['db'], dbtri: ['db'], benchdip: ['bench'], bandpd: ['bands'], bandrow: ['bands'], bandtri: ['bands'],
  russian: ['db'], treadwarm: ['tread'], walkinc: ['tread'], runeasy: ['tread'], runint: ['tread']
};
Object.assign(EQ_OF, EQ_OF_NEW);

CATS.push({ id: 'kondice', n: 'Kondice a pás' });
CATMAP.kondice = 'Kondice a pás';
[
  { id: 'pushup',   c: 'hrudnik', n: 'Kliky',                           m: 'Podložka', mu: 'Prsa, triceps, ramena', s: 3, r: '8-15', rest: 60, lvl: 1, tip: 'Tělo v přímce, lokty šikmo od těla. Když nezvládáš, opři se o kolena.' },
  { id: 'dbpress',  c: 'hrudnik', n: 'Tlak s jednoručkami na podlaze', m: 'Jednoručky, podložka', mu: 'Prsa, triceps', s: 3, r: '8-12', rest: 75, lvl: 1, tip: 'Lokty se dole dotknou podlahy, pak tlač nahoru. Chrání ramena.' },
  { id: 'dbfly',    c: 'hrudnik', n: 'Rozpažování s jednoručkami',     m: 'Lavice + jednoručky', mu: 'Prsa', s: 3, r: '10-15', rest: 60, lvl: 2, tip: 'Lokty mírně pokrčené, dole neklesej pod úroveň lavice.' },
  { id: 'dbrow',    c: 'zada',    n: 'Veslování s jednoručkou',        m: 'Jednoručka + opora (lavice, židle)', mu: 'Široký sval zádový, střed zad', s: 3, r: '8-12 / ruka', rest: 75, lvl: 1, tip: 'Jednou rukou se opři, druhou táhni loket k boku.' },
  { id: 'pullup',   c: 'zada',    n: 'Shyby',                          m: 'Hrazda', mu: 'Záda, biceps', s: 3, r: '3-8', rest: 120, lvl: 3, tip: 'Začni z úplného visu, brada nad hrazdu.' },
  { id: 'bandpd',   c: 'zada',    n: 'Stahování gumy shora',           m: 'Posilovací guma upevněná nahoře', mu: 'Široký sval zádový', s: 3, r: '12-15', rest: 60, lvl: 1, tip: 'Táhni lokty dolů k bokům, záda rovná.' },
  { id: 'bandrow',  c: 'zada',    n: 'Veslování s gumou',              m: 'Posilovací guma', mu: 'Střed zad', s: 3, r: '12-15', rest: 60, lvl: 1, tip: 'Na konci stáhni lopatky k sobě.' },
  { id: 'bentbb',   c: 'zada',    n: 'Přítah činky v předklonu',       m: 'Obouruční činka', mu: 'Střed zad, trapézy', s: 3, r: '8-10', rest: 105, lvl: 2, tip: 'Záda rovná, trup téměř rovnoběžně se zemí, tah k pupku.' },
  { id: 'bodysq',   c: 'nohy',    n: 'Dřep s vlastní vahou',           m: 'Bez vybavení', mu: 'Kvadricepsy, zadek', s: 3, r: '15-20', rest: 60, lvl: 1, tip: 'Kolena po linii špiček, hrudník vzpřímený.' },
  { id: 'lunge',    c: 'nohy',    n: 'Výpady s jednoručkami',          m: 'Jednoručky', mu: 'Kvadricepsy, zadek', s: 3, r: '10 / noha', rest: 75, lvl: 2, tip: 'Krok dopředu, zadní koleno těsně nad zem, trup vzpřímený.' },
  { id: 'bulg',     c: 'nohy',    n: 'Bulharský dřep',                 m: 'Lavice (zadní noha) + jednoručky', mu: 'Kvadricepsy, zadek', s: 3, r: '8-12 / noha', rest: 90, lvl: 2, tip: 'Většina váhy na přední noze, zadní jen opora.' },
  { id: 'gluteb',   c: 'nohy',    n: 'Zvedání pánve (glute bridge)',   m: 'Podložka', mu: 'Zadek, hamstringy', s: 3, r: '12-20', rest: 45, lvl: 1, tip: 'Nahoře stáhni zadek a krátce zadrž, bedra nepřepínej.' },
  { id: 'hcalf',    c: 'nohy',    n: 'Výpony na jedné noze',           m: 'Schod nebo stupínek', mu: 'Lýtka', s: 3, r: '12-20 / noha', rest: 45, lvl: 1, tip: 'Dole plné protažení, nahoře pauza. Pro oporu se přidrž zdi.' },
  { id: 'ballcurl', c: 'nohy',    n: 'Zakopávání na míči',             m: 'Gymnastický míč', mu: 'Hamstringy, zadek', s: 3, r: '8-12', rest: 60, lvl: 2, tip: 'Z polohy na zádech zvedni pánev a přitahuj míč patami.' },
  { id: 'dbohp',    c: 'ramena',  n: 'Tlak s jednoručkami ve stoje',   m: 'Jednoručky', mu: 'Ramena, triceps', s: 3, r: '8-12', rest: 75, lvl: 1, tip: 'Břicho a zadek zpevni, žádný záklon.' },
  { id: 'rfly',     c: 'ramena',  n: 'Zadní ramena v předklonu',       m: 'Jednoručky', mu: 'Zadní ramena', s: 3, r: '12-15', rest: 45, lvl: 1, tip: 'Předkloň se, paže mírně pokrčené, vedeš lokty do stran.' },
  { id: 'dbcurl',   c: 'paze',    n: 'Bicepsový zdvih s jednoručkami', m: 'Jednoručky', mu: 'Biceps', s: 3, r: '10-12', rest: 60, lvl: 1, tip: 'Lokty u těla, nahoře otoč dlaně k sobě.' },
  { id: 'dbtri',    c: 'paze',    n: 'Triceps za hlavou s jednoručkou', m: 'Jednoručka', mu: 'Triceps', s: 3, r: '10-12', rest: 60, lvl: 1, tip: 'Lokty míří vzhůru a neroztahují se do stran.' },
  { id: 'benchdip', c: 'paze',    n: 'Dipy na lavici',                 m: 'Lavice nebo stabilní židle', mu: 'Triceps', s: 3, r: '8-15', rest: 60, lvl: 1, tip: 'Lokty dozadu, ne do stran. Záda blízko lavice.' },
  { id: 'bandtri',  c: 'paze',    n: 'Triceps s gumou',                m: 'Posilovací guma upevněná nahoře', mu: 'Triceps', s: 3, r: '12-20', rest: 45, lvl: 1, tip: 'Lokty přitisknuté, dole plně propni.' },
  { id: 'crunch',   c: 'stred',   n: 'Zkracovačky na podlaze',         m: 'Podložka', mu: 'Přímý sval břišní', s: 3, r: '12-20', rest: 45, lvl: 1, tip: 'Zvedej lopatky, ne krk. Bedra drž na zemi.' },
  { id: 'deadbug',  c: 'stred',   n: 'Dead bug',                       m: 'Podložka', mu: 'Hluboké břišní svaly', s: 3, r: '10 / strana', rest: 45, lvl: 1, tip: 'Bedra přitisknutá k zemi po celou dobu.' },
  { id: 'abwheel',  c: 'stred',   n: 'Kolečko na břicho',              m: 'Kolečko', mu: 'Břicho, celý střed', s: 3, r: '6-10', rest: 75, lvl: 3, tip: 'Začni z kolen a jeď jen tam, kde udržíš rovná záda.' },
  { id: 'russian',  c: 'stred',   n: 'Ruské twisty',                   m: 'Jednoručka nebo medicinbal', mu: 'Šikmé břišní', s: 3, r: '20 celkem', rest: 45, lvl: 1, tip: 'Otáčej trup, ne jen ruce. Nohy nad zemí je těžší varianta.' },
  { id: 'sideplank', c: 'stred',  n: 'Boční plank',                    m: 'Podložka', mu: 'Šikmé břišní, stabilita', s: 3, r: '30 s / strana', rest: 45, lvl: 1, tip: 'Tělo v přímce od hlavy po paty.' },
  { id: 'treadwarm', c: 'kondice', n: 'Rozcvička na pásu',             m: 'Běžecký pás', mu: 'Celé tělo, zahřátí', s: 1, r: '5-10 min', rest: 30, lvl: 1, tip: 'Svižná chůze nebo lehký klus, tep ať se jen zvedne.' },
  { id: 'walkinc',  c: 'kondice', n: 'Chůze do kopce',                 m: 'Běžecký pás se sklonem', mu: 'Nohy, kondice', s: 1, r: '15-20 min', rest: 30, lvl: 1, tip: 'Sklon 6-10 %, rychlost kolem 5 km/h, držadla nepoužívej.' },
  { id: 'runeasy',  c: 'kondice', n: 'Lehký běh',                      m: 'Běžecký pás', mu: 'Kondice', s: 1, r: '15-30 min', rest: 30, lvl: 1, tip: 'Tempo, při kterém ještě v klidu mluvíš.' },
  { id: 'runint',   c: 'kondice', n: 'Intervalový běh',                m: 'Běžecký pás', mu: 'Kondice, nohy', s: 6, r: '1 min rychle', rest: 90, lvl: 2, tip: 'Minuta svižně, pak chůze nebo pomalý klus do uvolnění tepu.' },
  { id: 'rope',     c: 'kondice', n: 'Švihadlo',                       m: 'Švihadlo', mu: 'Kondice, lýtka', s: 5, r: '1 min', rest: 60, lvl: 1, tip: 'Skáčeš z přední části chodidla, zápěstí pracuje, ne celé ruce.' }
].forEach(e => { EX.push(e); EXMAP[e.id] = e; });

/* Domácí rozpisy; cvik se vybere podle zaškrtnutého vybavení, jinak se vezme jiný dostupný cvik stejné partie */
Object.assign(SPLITS, {
  hfb3: { n: 'Celé tělo doma 3×', place: 'home', days: [
    { t: 'Celé tělo A', ex: ['squat|goblet|bodysq', 'bench|dbpress|pushup', 'pullup|dbrow|bandpd', 'dbohp|dbsh', 'gluteb|hipth', 'plank'] },
    { t: 'Celé tělo B', ex: ['rdl|lunge', 'incdb|dbpress|pushup', 'bentbb|dbrow|bandrow', 'latr|dbohp', 'bulg|lunge|bodysq', 'crunch|deadbug'] },
    { t: 'Celé tělo C', ex: ['goblet|squat|bodysq', 'dbfly|pushup', 'dbrow|bandrow|bentbb', 'rfly|bandfp', 'kbswing|gluteb', 'dbcurl', 'dbtri|benchdip'] }
  ] },
  hul4: { n: 'Horní / dolní doma 4×', place: 'home', days: [
    { t: 'Horní tělo A', ex: ['bench|dbpress|pushup', 'pullup|dbrow|bandpd', 'dbohp|dbsh', 'dbcurl', 'dbtri|benchdip', 'plank'] },
    { t: 'Dolní tělo A', ex: ['squat|goblet|bodysq', 'rdl|gluteb', 'lunge|bulg', 'hcalf', 'crunch|abwheel|deadbug'] },
    { t: 'Horní tělo B', ex: ['incdb|dbfly|pushup', 'bentbb|dbrow|bandrow', 'latr|dbohp', 'rfly|bandfp', 'dbcurl', 'bandtri|benchdip'] },
    { t: 'Dolní tělo B', ex: ['kbswing|hipth|gluteb', 'bulg|lunge|boxup', 'rdl|ballcurl', 'hcalf', 'sideplank|deadbug'] }
  ] }
});

/* Dostupnost cviku. Klub: co není výslovně vypnuté, platí za dostupné. Doma: musí být zaškrtnuté všechno potřebné. */
const curPlace = () => (typeof S === 'object' && S.settings && S.settings.place) || 'gym';
function isAvail(e, place) {
  place = place || curPlace();
  const st = (typeof S === 'object' && S.settings) || {};
  if (place === 'home') {
    const req = HOME_OF[e.id]; if (!req) return false;
    const h = st.home || {};
    return req.every(t => t.split('|').some(x => h[x] === true));
  }
  const eq = st.eq || {};
  return (EQ_OF[e.id] || []).every(t => eq[t] !== false);
}
