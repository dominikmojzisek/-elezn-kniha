/* ===== Vybavení posilovny (GymNation Brno Kaštanová) =====
   Třetí hodnota = 1: potvrzeno na webu gymnation.cz (silová a functional zóna, značky Panatta, Precor, Glute Builder).
   Konkrétní seznam strojů web neuvádí, takže zbytek si uživatel zaškrtne sám. */
const GYM_NAME = 'GymNation Brno Kaštanová';
const EQLIST = [
  { g: 'Volné váhy', items: [['db', 'Jednoručky', 1], ['bb', 'Olympijská činka a kotouče', 1], ['rack', 'Stojan na dřepy a tlaky', 0], ['bench', 'Lavice rovná a šikmá', 0], ['ez', 'EZ činka', 0], ['smith', 'Smithův stroj', 0]] },
  { g: 'Stroje na horní tělo', items: [['chestm', 'Tlak na prsa (chest press)', 0], ['inclm', 'Šikmý tlak na prsa', 0], ['peck', 'Peck deck / zadní ramena', 0], ['shm', 'Tlak na ramena', 0], ['latpd', 'Stahování horní kladky (lat pulldown)', 0], ['rowm', 'Veslování vsedě / Hammer row', 0], ['tbar', 'T-bar', 0], ['assist', 'Asistovaný shyb a dip', 0], ['hyper', 'Lavice na hyperextenze', 0], ['preach', 'Scottova lavice', 0], ['tricm', 'Stroj na triceps', 0]] },
  { g: 'Stroje na nohy', items: [['legpress', 'Leg press', 0], ['hack', 'Hack dřep', 0], ['legext', 'Předkopávání', 0], ['legcurl', 'Zakopávání (vleže / vsedě)', 0], ['calfm', 'Výpony na lýtka', 0], ['abd', 'Odnožování a přinožování', 0], ['glute', 'Glute Builder (hip thrust)', 1]] },
  { g: 'Kladky a střed těla', items: [['cable', 'Kladková věž / crossover', 0], ['abm', 'Stroj na břicho', 0], ['pullbar', 'Hrazda / římská židle', 0]] },
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

/* Dostupnost cviku podle zaškrtnutého vybavení (co není výslovně vypnuté, platí za dostupné) */
function isAvail(e) {
  const eq = (typeof S === 'object' && S.settings && S.settings.eq) || {};
  return (EQ_OF[e.id] || []).every(t => eq[t] !== false);
}
