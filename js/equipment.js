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
/* (domácí rozpisy jsou níže v bloku Další domácí cviky) */

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

/* ===== Další domácí cviky ===== */
const HOME_NEW = [
  // [id, kat, název, vybavení (text), svaly, série, opak., pauza, lvl, tip, požadavky doma]
  ['pushdecl','hrudnik','Kliky s nohama výš','Lavice nebo bedna','Horní prsa, ramena',3,'8-12',60,2,'Nohy na lavici, tělo v přímce. Čím výš nohy, tím těžší.',['bench|box']],
  ['pushinc','hrudnik','Kliky s rukama na lavici','Lavice nebo bedna','Prsa, triceps',3,'10-15',60,1,'Lehčí varianta kliků, vhodná na začátek.',['bench|box']],
  ['pushdiam','hrudnik','Diamantové kliky','Podložka','Triceps, vnitřní prsa',3,'6-12',60,2,'Ruce pod hrudníkem do tvaru diamantu, lokty u těla.',[]],
  ['bandpress','hrudnik','Tlak s gumou na hrudník','Posilovací guma','Prsa, triceps',3,'12-15',60,1,'Gumu veď za zády, tlač před sebe a na konci stáhni prsa.',['bands']],
  ['dbsqueeze','hrudnik','Stisk jednoručky na hrudi','Jednoručky','Vnitřní prsa',3,'12-15',60,1,'Dvě jednoručky tiskni k sobě po celou dobu tlaku.',['db']],
  ['bbfloor','hrudnik','Tlak s činkou na podlaze','Obouruční činka','Prsa, triceps',3,'6-10',90,2,'Lokty se dole dotknou podlahy. Bezpečné bez stojanu.',['bb']],
  ['trxpush','hrudnik','Kliky na TRX','Závěsný systém','Prsa, střed těla',3,'8-12',60,2,'Čím šikměji stojíš, tím těžší cvik.',['trx']],
  ['dbpull','zada','Pullover s jednoručkou','Jednoručka','Široký sval zádový, prsa',3,'10-12',60,2,'Paže mírně pokrčené, oblouk za hlavu bez záklonu.',['db']],
  ['dbrow2','zada','Veslování se dvěma jednoručkami','Jednoručky','Střed zad',3,'8-12',75,2,'Předklon s rovnými zády, lokty táhni k bokům.',['db']],
  ['chin','zada','Shyby podhmatem','Hrazda','Záda, biceps',3,'4-8',120,2,'Dlaně k sobě, brada nad hrazdu.',['pullbar']],
  ['hang','zada','Vis na hrazdě','Hrazda','Předloktí, úchop, ramena',3,'20-40 s',60,1,'Lopatky aktivně stáhni dolů, nehoupej se.',['pullbar']],
  ['supm','zada','Superman','Podložka','Bedra, zadek',3,'12-15',45,1,'Zvedej paže i nohy najednou, nahoře krátce zadrž.',[]],
  ['dbdead','zada','Mrtvý tah s jednoručkami','Jednoručky','Záda, zadek, hamstringy',3,'8-12',90,1,'Záda rovná, jednoručky vedeš těsně u nohou.',['db']],
  ['kbrow','zada','Veslování s kettlebellem','Kettlebell','Střed zad',3,'8-12 / ruka',75,1,'Opři se druhou rukou o lavici, loket táhni k boku.',['kb']],
  ['trxy','zada','TRX Y-zdvih','Závěsný systém','Zadní ramena, trapézy',3,'10-12',45,1,'Paže tvoří písmeno Y, lopatky stahuj dolů.',['trx']],
  ['revlunge','nohy','Výpady vzad','Bez vybavení','Kvadricepsy, zadek',3,'10 / noha',60,1,'Krok dozadu, kolena kontroluj, trup vzpřímený.',[]],
  ['splitsq','nohy','Dřep na jedné noze k lavici','Lavice nebo bedna','Kvadricepsy, zadek',3,'6-10 / noha',75,2,'Sedni na lavici a vstaň bez rozhoupání.',['bench|box']],
  ['stepdb','nohy','Výstupy na bednu s jednoručkami','Bedna + jednoručky','Kvadricepsy, zadek',3,'8-12 / noha',75,2,'Tlač stojnou nohou, druhou nepomáhej.',['box','db']],
  ['sumo','nohy','Sumo dřep se závažím','Kettlebell nebo jednoručka','Přitahovače, zadek',3,'10-15',60,1,'Široký postoj, špičky ven, závaží drž mezi nohama.',['kb|db']],
  ['frontsq','nohy','Čelní dřep','Obouruční činka + stojan','Kvadricepsy, střed těla',4,'5-8',120,3,'Lokty vysoko, činka leží na předních ramenou.',['bb','rack']],
  ['sglb','nohy','Zvedání pánve na jedné noze','Podložka','Zadek, hamstringy',3,'8-12 / noha',45,2,'Pánev drž v rovině, nahoře stáhni zadek.',[]],
  ['wallsit','nohy','Výdrž v sedu u zdi','Zeď','Kvadricepsy',3,'30-60 s',45,1,'Stehna rovnoběžně s podlahou, záda opřená.',[]],
  ['jumpsq','nohy','Výskoky z dřepu','Bez vybavení','Nohy, výbušnost',3,'8-12',60,2,'Měkce dopadni a hned jdi do dalšího dřepu.',[]],
  ['sldl','nohy','Rumunský tah na jedné noze','Jednoručka nebo kettlebell','Hamstringy, zadek',3,'8-10 / noha',75,2,'Boky táhni dozadu, záda rovná, jako stoj na jedné noze.',['db|kb']],
  ['dbsqz','nohy','Dřep s jednoručkami','Jednoručky','Kvadricepsy, zadek',3,'10-12',75,1,'Jednoručky drž u ramen nebo podél těla.',['db']],
  ['bandsq','nohy','Dřep s gumou kolem kolen','Posilovací guma','Zadek, kvadricepsy',3,'12-15',60,1,'Kolena tlač do stran proti gumě.',['bands']],
  ['bandwalk','nohy','Chůze do stran s gumou','Posilovací guma','Zadek (boční)',3,'12 / strana',45,1,'Mírný dřep, krok do strany, guma ať je stále napnutá.',['bands']],
  ['hamslide','nohy','Zakopávání na ručníku','Ručník nebo kluzák, podložka','Hamstringy, zadek',3,'8-12',60,2,'Z můstku přitahuj paty po hladké podlaze.',[]],
  ['calfdb','nohy','Výpony s jednoručkami','Jednoručky','Lýtka',3,'12-20',45,1,'Dole plné protažení, nahoře pauza.',['db']],
  ['pike','ramena','Kliky v pozici V','Podložka','Ramena, triceps',3,'6-12',60,2,'Boky vysoko, hlava míří mezi paže.',[]],
  ['dbfront','ramena','Předpažení s jednoručkami','Jednoručky','Přední ramena',3,'10-15',45,1,'Zvedej do výšky ramen, bez houpání.',['db']],
  ['arnold','ramena','Arnoldův tlak','Jednoručky','Ramena',3,'8-12',75,2,'Při tlaku otáčej dlaně od sebe.',['db']],
  ['bandohp','ramena','Tlak s gumou nad hlavu','Posilovací guma','Ramena, triceps',3,'12-15',60,1,'Stoj na gumě a tlač nad hlavu, břicho zpevněné.',['bands']],
  ['bandlat','ramena','Upažování s gumou','Posilovací guma','Střední ramena',3,'12-20',45,1,'Veď lokty, výše než ramena nezvedej.',['bands']],
  ['bandpull','ramena','Rozpažování s gumou','Posilovací guma','Zadní ramena, střed zad',3,'15-20',45,1,'Gumu natahuj před sebou do stran, lopatky stahuj.',['bands']],
  ['kbpress','ramena','Tlak s kettlebellem','Kettlebell','Ramena, triceps',3,'8-10 / ruka',75,1,'Kettlebell drž u ramene, zápěstí rovně.',['kb']],
  ['dbconc','paze','Koncentrovaný zdvih','Jednoručka','Biceps',3,'10-12 / ruka',45,1,'Loket opři o stehno a zvedej pomalu.',['db']],
  ['bandcurl','paze','Biceps s gumou','Posilovací guma','Biceps',3,'12-20',45,1,'Stoj na gumě, lokty u těla.',['bands']],
  ['dbext','paze','Triceps v předklonu (kickback)','Jednoručka','Triceps',3,'12-15 / ruka',45,1,'Loket drž u těla, propni paži dozadu.',['db']],
  ['closepu','paze','Kliky úzkým úchopem','Podložka','Triceps, prsa',3,'8-15',60,1,'Lokty těsně u žeber.',[]],
  ['bbcurl2','paze','Bicepsový zdvih s činkou','Obouruční činka','Biceps',3,'8-12',60,1,'Záda rovná, bez houpání.',['bb']],
  ['skull','paze','Tricepsový tlak vleže s činkou','Činka + lavice','Triceps',3,'8-12',75,2,'Lokty míří ke stropu, spouštěj k čelu.',['bb','bench']],
  ['legraise','stred','Zvedání nohou vleže','Podložka','Spodní břicho',3,'10-15',45,1,'Bedra přitiskni k zemi, nohy spouštěj pomalu.',[]],
  ['bicycle','stred','Kolo (bicycle crunch)','Podložka','Šikmé břišní',3,'20 celkem',45,1,'Protilehlý loket a koleno, bez škubání krkem.',[]],
  ['mtn','stred','Horolezec','Podložka','Břicho, kondice',3,'20-30 s',45,1,'Boky v úrovni ramen, střídej kolena rychle.',[]],
  ['hollow','stred','Hollow hold','Podložka','Přímý sval břišní',3,'20-40 s',45,2,'Bedra přitisknutá k zemi, paže a nohy nad zemí.',[]],
  ['bird','stred','Bird dog','Podložka','Střed těla, bedra',3,'10 / strana',45,1,'Natahuj protilehlou ruku a nohu, trup nehybný.',[]],
  ['ballroll','stred','Plank na míči','Gymnastický míč','Hluboký stabilizační systém',3,'30-45 s',45,2,'Předloktí na míči, tělo v přímce.',['fitball']],
  ['ballcr','stred','Zkracovačky na míči','Gymnastický míč','Přímý sval břišní',3,'12-20',45,1,'Míč pod bedry, zakulacuj trup.',['fitball']],
  ['plankt','stred','Plank s dotykem ramen','Podložka','Střed těla, ramena',3,'20 celkem',45,1,'Boky nekývej, střídej ruce.',[]],
  ['pallof','stred','Pallof press s gumou','Posilovací guma','Šikmé břišní, stabilita',3,'10 / strana',45,1,'Guma tahá do strany, ty tlač před sebe a nepřetáčej se.',['bands']],
  ['bandchop','stred','Seknutí s gumou','Posilovací guma','Šikmé břišní',3,'12 / strana',45,1,'Diagonálně shora dolů, otáčej trup.',['bands']],
  ['kbcarry','stred','Nošení závaží','Kettlebell nebo jednoručky','Úchop, střed těla, trapézy',3,'20-30 m',60,1,'Vzpřímeně, ramena dolů, drobné kroky.',['kb|db']],
  ['burpee','kondice','Burpees','Bez vybavení','Celé tělo, kondice',4,'8-10',60,2,'Klik, výskok, plynule. Kdo nezvládne klik, vynechá ho.',[]],
  ['jj','kondice','Jumping jacks','Bez vybavení','Kondice, lýtka',3,'40 s',30,1,'Zahřátí nebo kondice mezi silovými cviky.',[]],
  ['hknees','kondice','Zvedání kolen na místě','Bez vybavení','Kondice, nohy',3,'40 s',30,1,'Kolena do výšky pasu, rychle a lehce.',[]],
  ['treadwalk','kondice','Svižná chůze na pásu','Běžecký pás','Kondice',1,'30-45 min',30,1,'Tempo, při kterém se mírně zadýcháš.',['tread']],
  ['treadhill','kondice','Intervaly do kopce na pásu','Běžecký pás','Nohy, kondice',5,'2 min',90,2,'2 minuty ve sklonu 8-10 %, pak chůze v rovině.',['tread']],
  ['treadsp','kondice','Sprinty na pásu','Běžecký pás','Kondice, rychlost',8,'20 s rychle',60,3,'Jen s dobrou kondicí. Držadla nepoužívej, drž se kraje pásu.',['tread']]
];
HOME_NEW.forEach(([id, c, n, m, mu, s, r, rest, lvl, tip, req]) => {
  const e = { id, c, n, m, mu, s, r, rest, lvl, tip };
  EX.push(e); EXMAP[id] = e; HOME_OF[id] = req;
  if (!EQ_OF[id]) EQ_OF[id] = req.filter(t => !t.includes('|'));
});

Object.assign(SPLITS, {
  hfb3: { n: 'Celé tělo doma 3×', place: 'home', days: [
    { t: 'Celé tělo A', ex: ['squat|goblet|dbsqz|bodysq', 'bench|dbpress|pushup', 'pullup|chin|dbrow|bandpd|supm', 'dbohp|kbpress|dbsh|pike', 'gluteb|hipth', 'plank|hollow'] },
    { t: 'Celé tělo B', ex: ['rdl|dbdead|sldl|hamslide', 'incdb|dbpress|pushdecl|pushup', 'bentbb|dbrow2|dbrow|bandrow', 'latr|dbfront|bandlat', 'bulg|lunge|revlunge', 'crunch|legraise|bicycle'] },
    { t: 'Celé tělo C', ex: ['goblet|sumo|squat|bodysq', 'dbfly|dbsqueeze|pushdiam|pushup', 'dbrow|kbrow|bandrow|supm', 'rfly|bandpull|bandfp', 'kbswing|sglb|gluteb', 'dbcurl|bandcurl', 'dbtri|benchdip|closepu', 'pallof|deadbug|bird'] }
  ] },
  hul4: { n: 'Horní / dolní doma 4×', place: 'home', days: [
    { t: 'Horní tělo A', ex: ['bench|dbpress|pushup', 'pullup|chin|dbrow|bandpd', 'dbohp|kbpress|dbsh|pike', 'dbcurl|bandcurl', 'dbtri|benchdip|closepu', 'plank|hollow'] },
    { t: 'Dolní tělo A', ex: ['squat|goblet|dbsqz|bodysq', 'rdl|dbdead|gluteb', 'lunge|bulg|revlunge', 'hcalf|calfdb', 'crunch|abwheel|legraise'] },
    { t: 'Horní tělo B', ex: ['incdb|dbfly|pushdecl|pushup', 'bentbb|dbrow2|dbrow|bandrow', 'latr|bandlat|dbfront', 'rfly|bandpull|bandfp', 'dbconc|dbcurl', 'bandtri|dbext|benchdip'] },
    { t: 'Dolní tělo B', ex: ['kbswing|hipth|sglb|gluteb', 'bulg|stepdb|splitsq|lunge|boxup', 'rdl|ballcurl|hamslide|sldl', 'hcalf|calfdb', 'sideplank|deadbug|bird'] }
  ] },
  hppl3: { n: 'Push / Pull / Legs doma 3×', place: 'home', days: [
    { t: 'Push (tlaky)', ex: ['bench|dbpress|pushup', 'incdb|pushdecl|pushdiam|dbfly', 'dbohp|kbpress|arnold|pike', 'latr|bandlat|dbfront', 'dbtri|benchdip|closepu', 'bandtri|dbext'] },
    { t: 'Pull (tahy)', ex: ['pullup|chin|dbrow|bandpd', 'bentbb|dbrow2|kbrow|bandrow', 'dbdead|supm', 'rfly|bandpull|bandfp', 'dbcurl|bbcurl2|bandcurl', 'dbconc|hang'] },
    { t: 'Nohy', ex: ['squat|frontsq|goblet|dbsqz|bodysq', 'rdl|sldl|hamslide|gluteb', 'bulg|lunge|stepdb|revlunge', 'sumo|bandsq|wallsit', 'hcalf|calfdb', 'crunch|legraise|mtn'] }
  ] },
  hbody3: { n: 'Vlastní váha a gumy 3×', place: 'home', days: [
    { t: 'Den A', ex: ['bodysq|jumpsq|wallsit', 'pushup|pushdiam|bandpress', 'bandrow|bandpd|supm', 'pike|bandohp', 'gluteb|sglb', 'plank|hollow'] },
    { t: 'Den B', ex: ['revlunge|bandsq', 'pushinc|pushup|closepu', 'bandrow|supm', 'bandlat|bandpull', 'hamslide|sglb|gluteb', 'bicycle|legraise'] },
    { t: 'Den C', ex: ['sumo|bodysq|bandwalk', 'pushdecl|pushdiam|pike', 'bandpull|bandfp|supm', 'bandcurl|bandtri', 'hcalf', 'mtn|deadbug|bird', 'burpee|jj'] }
  ] }
});
