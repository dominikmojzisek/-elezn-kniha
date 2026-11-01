/* ===== Databáze cviků =====
   c = kategorie, m = stroj/vybavení v posilovně, mu = hlavní svaly,
   s = výchozí série, r = výchozí opakování, rest = pauza (s), lvl = 1 začátečník … 3 pokročilý */
const CATS = [
  {id:'hrudnik', n:'Hrudník'},
  {id:'zada',    n:'Záda'},
  {id:'nohy',    n:'Nohy a zadek'},
  {id:'ramena',  n:'Ramena'},
  {id:'paze',    n:'Paže'},
  {id:'stred',   n:'Střed těla'}
];
const EX = [
  // HRUDNÍK
  {id:'bench',   c:'hrudnik', n:'Bench press',               m:'Lavice s olympijskou činkou a stojany', mu:'Prsa, triceps, přední ramena', s:4, r:'6-8',  rest:150, lvl:2, tip:'Lopatky stáhni k sobě, činku spouštěj na spodní část hrudníku.'},
  {id:'chestp',  c:'hrudnik', n:'Tlak na prsa na stroji',    m:'Chest press (Hammer Strength / sedící)', mu:'Prsa, triceps', s:3, r:'8-12', rest:90,  lvl:1, tip:'Sedák nastav tak, aby madla byla ve výšce středu hrudníku.'},
  {id:'incdb',   c:'hrudnik', n:'Tlak s jednoručkami šikmo', m:'Nakloněná lavice 30° + jednoručky', mu:'Horní prsa, ramena', s:3, r:'8-10', rest:90, lvl:2, tip:'Sklon lavice 30°, vyšší sklon přenáší práci na ramena.'},
  {id:'incms',   c:'hrudnik', n:'Tlak šikmo na stroji',      m:'Incline chest press (stroj)', mu:'Horní prsa', s:3, r:'8-12', rest:90, lvl:1, tip:'Kontrolovaný návrat, nezamykej lokty.'},
  {id:'peck',    c:'hrudnik', n:'Peck deck (rozpažování)',   m:'Peck deck / Butterfly', mu:'Prsa', s:3, r:'12-15', rest:60, lvl:1, tip:'Na konci pohybu na vteřinu zadrž stisk.'},
  {id:'cross',   c:'hrudnik', n:'Kladky křížem',             m:'Cable crossover (dvojitá kladka)', mu:'Prsa', s:3, r:'12-15', rest:60, lvl:2, tip:'Mírně předkloň trup, ruce vedou oblouk k sobě.'},
  {id:'dipm',    c:'hrudnik', n:'Dipy na stroji',            m:'Assisted dip (asistovaný stroj)', mu:'Spodní prsa, triceps', s:3, r:'8-12', rest:90, lvl:1, tip:'Předkloň trup pro větší zapojení prsou.'},
  // ZÁDA
  {id:'latpd',   c:'zada', n:'Stahování kladky k hrudi',     m:'Lat pulldown (horní kladka)', mu:'Široký sval zádový, biceps', s:4, r:'8-12', rest:90, lvl:1, tip:'Táhni lokty dolů k bokům, ne rukama.'},
  {id:'seatrow', c:'zada', n:'Veslování vsedě na stroji',    m:'Seated row (sedící veslování)', mu:'Střed zad, zadní ramena', s:3, r:'10-12', rest:90, lvl:1, tip:'Hrudník opři o podložku, na konci stáhni lopatky.'},
  {id:'cabrow',  c:'zada', n:'Veslování na spodní kladce',   m:'Spodní kladka s trojúhelníkem', mu:'Střed zad', s:3, r:'10-12', rest:90, lvl:1, tip:'Záda rovná, nehoupej trupem.'},
  {id:'tbar',    c:'zada', n:'Veslování T-bar',              m:'T-bar row / s podložkou na hrudník', mu:'Střed zad, trapézy', s:3, r:'8-10', rest:120, lvl:2, tip:'Neutrální páteř, tah k pupku.'},
  {id:'hsrow',   c:'zada', n:'Veslování na stroji (po jedné)', m:'Hammer Strength row', mu:'Široký sval zádový', s:3, r:'8-12', rest:90, lvl:1, tip:'Pracuj každou rukou zvlášť pro vyrovnanost.'},
  {id:'assch',   c:'zada', n:'Shyby s asistencí',            m:'Assisted pull-up (asistovaný stroj)', mu:'Široký sval zádový, biceps', s:3, r:'6-10', rest:120, lvl:1, tip:'S postupem snižuj závaží asistence.'},
  {id:'dead',    c:'zada', n:'Mrtvý tah',                    m:'Olympijská činka, plošina', mu:'Záda, zadek, hamstringy', s:3, r:'4-6', rest:180, lvl:3, tip:'Činka u holení, záda rovná, tlač nohama do země.'},
  {id:'hyper',   c:'zada', n:'Extenze zad',                  m:'Lavice na hyperextenze (45°)', mu:'Bedra, zadek', s:3, r:'12-15', rest:60, lvl:1, tip:'Na vrcholu nepřepínej bedra do záklonu.'},
  // NOHY
  {id:'squat',   c:'nohy', n:'Dřep s činkou',                m:'Stojan na dřepy + olympijská činka', mu:'Kvadricepsy, zadek', s:4, r:'6-8', rest:150, lvl:3, tip:'Kolena po linii špiček, hloubka aspoň k rovnoběžce.'},
  {id:'smith',   c:'nohy', n:'Dřep na Smithově stroji',      m:'Smithův stroj', mu:'Kvadricepsy, zadek', s:3, r:'8-10', rest:120, lvl:1, tip:'Nohy lehce před tyčí, záda rovná.'},
  {id:'legpr',   c:'nohy', n:'Leg press',                    m:'Leg press (šikmý, 45°)', mu:'Kvadricepsy, zadek', s:4, r:'10-12', rest:120, lvl:1, tip:'Kolena v konci pohybu nezamykej, bedra drž na opěrce.'},
  {id:'hack',    c:'nohy', n:'Hack dřep',                    m:'Hack squat stroj', mu:'Kvadricepsy', s:3, r:'8-12', rest:120, lvl:2, tip:'Nohy níž na plošině zatíží víc kvadricepsy.'},
  {id:'legext',  c:'nohy', n:'Předkopávání',                 m:'Leg extension', mu:'Kvadricepsy', s:3, r:'12-15', rest:60, lvl:1, tip:'V horní poloze krátce zadrž.'},
  {id:'legcurl', c:'nohy', n:'Zakopávání vleže',             m:'Lying leg curl', mu:'Hamstringy', s:3, r:'10-12', rest:75, lvl:1, tip:'Boky drž přitisknuté k lavici.'},
  {id:'seatcurl',c:'nohy', n:'Zakopávání vsedě',             m:'Seated leg curl', mu:'Hamstringy', s:3, r:'10-12', rest:75, lvl:1, tip:'Pomalá negativní fáze (3 s).'},
  {id:'rdl',     c:'nohy', n:'Rumunský mrtvý tah',           m:'Olympijská činka / jednoručky', mu:'Hamstringy, zadek', s:3, r:'8-10', rest:120, lvl:2, tip:'Boky táhni dozadu, činka po stehnech.'},
  {id:'hipth',   c:'nohy', n:'Hip thrust',                   m:'Lavice + činka / hip thrust stroj', mu:'Zadek', s:3, r:'8-12', rest:90, lvl:2, tip:'Brada k hrudi, nahoře stáhni zadek.'},
  {id:'abduct',  c:'nohy', n:'Odnožování',                   m:'Hip abduction stroj', mu:'Zadní a boční zadek', s:3, r:'12-20', rest:60, lvl:1, tip:'Mírně se předkloň, zapojíš víc zadek.'},
  {id:'adduct',  c:'nohy', n:'Přinožování',                  m:'Hip adduction stroj', mu:'Přitahovače', s:3, r:'12-15', rest:60, lvl:1, tip:'Rozsah nastav tak, aby nebolel třísla.'},
  {id:'calf',    c:'nohy', n:'Výpony ve stoje',              m:'Standing calf raise stroj', mu:'Lýtka', s:4, r:'12-15', rest:60, lvl:1, tip:'Dole plný protažení, nahoře pauza.'},
  {id:'calfs',   c:'nohy', n:'Výpony vsedě',                 m:'Seated calf raise stroj', mu:'Lýtka (soleus)', s:3, r:'15-20', rest:45, lvl:1, tip:'Pomalé tempo, bez nadskakování.'},
  // RAMENA
  {id:'ohp',     c:'ramena', n:'Tlak nad hlavu',             m:'Olympijská činka ve stojanu', mu:'Ramena, triceps', s:4, r:'6-8', rest:120, lvl:2, tip:'Zpevni břicho, hlavu předsuň, až činka projde.'},
  {id:'shpm',    c:'ramena', n:'Tlak na ramena na stroji',   m:'Shoulder press stroj', mu:'Přední a střední ramena', s:3, r:'8-12', rest:90, lvl:1, tip:'Madla těsně nad úrovní uší na startu.'},
  {id:'dbsh',    c:'ramena', n:'Tlak s jednoručkami vsedě',  m:'Lavice se zádovou opěrou + jednoručky', mu:'Ramena', s:3, r:'8-10', rest:90, lvl:2, tip:'Lokty mírně před tělem.'},
  {id:'latr',    c:'ramena', n:'Upažování',                  m:'Jednoručky / Lateral raise stroj', mu:'Střední ramena', s:3, r:'12-15', rest:60, lvl:1, tip:'Veď lokty, ne zápěstí. Zvedej do výšky ramen.'},
  {id:'rpeck',   c:'ramena', n:'Zadní ramena na peck decku', m:'Peck deck (obráceně) / Reverse fly', mu:'Zadní ramena', s:3, r:'12-15', rest:60, lvl:1, tip:'Paže mírně pokrčené, lopatky nezvedej.'},
  {id:'facep',   c:'ramena', n:'Face pull',                  m:'Horní kladka s lanem', mu:'Zadní ramena, rotátory', s:3, r:'15-20', rest:60, lvl:1, tip:'Tahej lano k obličeji, lokty vysoko.'},
  {id:'shrug',   c:'ramena', n:'Krčení ramen',               m:'Smithův stroj / jednoručky', mu:'Trapézy', s:3, r:'10-15', rest:60, lvl:1, tip:'Svisle nahoru, žádné kroužení.'},
  // PAŽE
  {id:'bbcurl',  c:'paze', n:'Bicepsový zdvih s EZ činkou',  m:'EZ činka', mu:'Biceps', s:3, r:'8-12', rest:75, lvl:1, tip:'Lokty u těla, bez houpání.'},
  {id:'precurl', c:'paze', n:'Biceps na Scottově lavici',    m:'Preacher curl stroj / Scottova lavice', mu:'Biceps', s:3, r:'10-12', rest:60, lvl:1, tip:'Dole nepřepínej lokty do plného propnutí.'},
  {id:'hamcurl', c:'paze', n:'Kladivové zdvihy',             m:'Jednoručky', mu:'Biceps, předloktí', s:3, r:'10-12', rest:60, lvl:1, tip:'Neutrální úchop, střídavě nebo obě.'},
  {id:'pushd',   c:'paze', n:'Triceps na horní kladce',      m:'Horní kladka s lanem / tyčí', mu:'Triceps', s:3, r:'10-15', rest:60, lvl:1, tip:'Lokty přitisknuté, plně propni dole.'},
  {id:'fren',    c:'paze', n:'Francouzský tlak',             m:'EZ činka + rovná lavice', mu:'Triceps', s:3, r:'8-12', rest:75, lvl:2, tip:'Lokty míří ke stropu, spouštěj za hlavu.'},
  {id:'tripm',   c:'paze', n:'Extenze tricepsu na stroji',   m:'Triceps extension stroj', mu:'Triceps', s:3, r:'10-12', rest:60, lvl:1, tip:'Nastav sedák, lokty v ose ramen.'},
  // STŘED TĚLA
  {id:'crunm',   c:'stred', n:'Zkracovačky na stroji',       m:'Ab crunch stroj', mu:'Přímý sval břišní', s:3, r:'12-15', rest:60, lvl:1, tip:'Zakulacuj trup, ne jen kyčle.'},
  {id:'cabcr',   c:'stred', n:'Zkracovačky na kladce',       m:'Horní kladka s lanem (kleče)', mu:'Břicho', s:3, r:'12-15', rest:60, lvl:2, tip:'Boky držet na místě, tlačit lokty k stehnům.'},
  {id:'legrs',   c:'stred', n:'Zvedání nohou ve visu',       m:'Hrazda / římská židle', mu:'Spodní břicho', s:3, r:'10-15', rest:60, lvl:2, tip:'Nehoupej se, pánev podsaď.'},
  {id:'plank',   c:'stred', n:'Plank (výdrž)',               m:'Podložka', mu:'Hluboký stabilizační systém', s:3, r:'30-60 s', rest:45, lvl:1, tip:'Tělo v přímce, zadek nezvedej.'},
  {id:'woodc',   c:'stred', n:'Rotace na kladce',            m:'Kladka v úrovni hrudníku', mu:'Šikmé břišní', s:3, r:'12 / strana', rest:60, lvl:2, tip:'Otáčej trup, ne ruce.'}
];
const EXMAP = Object.fromEntries(EX.map(e => [e.id, e]));
const CATMAP = Object.fromEntries(CATS.map(c => [c.id, c.n]));

/* ===== Šablony splitů pro generátor =====
   Každý den je seznam id cviků v pořadí od těžkých po izolační. */
const SPLITS = {
  fb3: { n:'Celé tělo 3× týdně', days:[
    {t:'Celé tělo A', ex:['squat|legpr','bench|chestp','latpd','shpm|dbsh','legcurl','plank']},
    {t:'Celé tělo B', ex:['legpr|hack','incdb|incms','seatrow|tbar','latr','rdl|hipth','crunm']},
    {t:'Celé tělo C', ex:['hack|smith','chestp|peck','cabrow','ohp|shpm','legcurl|seatcurl','pushd','bbcurl']}
  ]},
  ul4: { n:'Horní / dolní 4× týdně', days:[
    {t:'Horní tělo A', ex:['bench|chestp','tbar|seatrow','shpm|dbsh','latpd','pushd','bbcurl']},
    {t:'Dolní tělo A', ex:['squat|legpr','rdl','legext','legcurl','calf','crunm']},
    {t:'Horní tělo B', ex:['incdb|incms','latpd|assch','cabrow','latr','facep','tripm','hamcurl']},
    {t:'Dolní tělo B', ex:['hack|smith','hipth','seatcurl','abduct','calfs','cabcr']}
  ]},
  ppl6: { n:'Push / Pull / Legs 6×', days:[
    {t:'Push (tlaky)', ex:['bench|chestp','incdb|incms','shpm|ohp','latr','peck|cross','pushd']},
    {t:'Pull (tahy)',  ex:['latpd|assch','tbar|seatrow','cabrow','rpeck|facep','bbcurl','hamcurl']},
    {t:'Nohy',         ex:['squat|legpr','rdl','legext','legcurl','calf','legrs|crunm']}
  ]},
  bro5: { n:'Po partiích 5×', days:[
    {t:'Hrudník',   ex:['bench|chestp','incdb|incms','peck|cross','dipm']},
    {t:'Záda',      ex:['latpd','tbar|seatrow','cabrow','hyper','shrug']},
    {t:'Nohy',      ex:['squat|legpr','hack|smith','legext','legcurl','calf']},
    {t:'Ramena',    ex:['ohp|shpm','latr','rpeck','facep','shrug']},
    {t:'Paže a střed těla', ex:['bbcurl','pushd','hamcurl','fren|tripm','crunm','plank']}
  ]}
};
/* Schémata podle cíle: násobitel sérií a rozsah opakování pro hlavní / izolační cviky */
const GOALS = {
  sila:    {n:'Síla',          main:'3-5',  iso:'6-8',   restMul:1.4, setAdd:0},
  objem:   {n:'Svalová hmota', main:'6-10', iso:'10-15', restMul:1.0, setAdd:0},
  vytrv:   {n:'Vytrvalost / tvarování', main:'12-15', iso:'15-20', restMul:.7, setAdd:-1}
};
