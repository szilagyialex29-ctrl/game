// A játék teljes tartalma: világ, szereplők, küldetések, párbeszédek.

export const PLAYER_NAME = 'A Névtelen';

export const PALETTE = {
  zenith: 0x2f5a86,
  horizon: 0xe6c69c,
  fog: 0xd8c09b,
  sun: 0xffd7a3,
  skyLight: 0xaecbff,
  groundLight: 0x6b5236,
};

export const SUN_POSITION = { x: -80, y: 58, z: 96 };
export const SUN_TARGET = { x: 0, y: 0, z: -20 };
export const SPAWN = { x: 0, z: 8 };
export const VILLAGE = { x: 0, z: -34, radius: 17 };
export const WORLD_RADIUS = 82;

export const HUTS = [
  { x: -15, z: -40, rot: 0.85 },
  { x: 15.5, z: -41, rot: -0.8 },
  { x: -14, z: -24, rot: 2.3 },
  { x: 13.5, z: -23, rot: -2.4 },
  { x: -3, z: -51, rot: 0.1 },
  { x: -26, z: -33, rot: 1.55 },
];

export const WELL = { x: 8, z: -37.5 };

export const NPCS = [
  { id: 'rovan', name: 'Rovan', title: 'a kapu őrszem', variant: 'guard', hairColor: 0x3a2f26, x: 0.7, z: -1.5, skin: 0xc08a63, cloth: 0x5d4630, accent: 0x37485f, scale: 1.05, rot: Math.PI },
  { id: 'fatyol', name: 'Fátyol asszony', title: 'a falu véne', variant: 'elder', hairColor: 0xbdb6ad, x: 2.4, z: -38.6, skin: 0xd7ae86, cloth: 0x463a5e, accent: 0xa8853f, scale: 0.97 },
  { id: 'bernal', name: 'Bernal', title: 'kovács', variant: 'smith', hairColor: 0x2f241c, x: -16, z: -30, skin: 0xb87f57, cloth: 0x4f3527, accent: 0x2b2b30, scale: 1.12 },
  { id: 'tam', name: 'Tam', title: 'a falu gyereke', variant: 'child', hairColor: 0x6b4a2e, x: 9.5, z: -29.5, skin: 0xd6a97e, cloth: 0x7d6b3f, accent: 0x4c6b46, scale: 0.8 },
];

export const BEACONS = [
  { id: 'beacon_nyugat', name: 'nyugati jelzőtűz', x: -40, z: -14 },
  { id: 'beacon_kelet', name: 'keleti jelzőtűz', x: 42, z: -30 },
  { id: 'beacon_eszak', name: 'északi jelzőtűz', x: -6, z: -72 },
];

export const SHARDS = [
  { id: 'shard_1', title: 'Fénytöredék I.', x: -26, z: 24, text: 'Nem hősnek hívtak. Pótlásnak. Egy lyukat kell betöltenem, amit egy másik világ ütött.' },
  { id: 'shard_2', title: 'Fénytöredék II.', x: 30, z: -4, text: 'Aeloria nem ország. Egy seb, amit az idő nem tud behegeszteni — csak elfedni.' },
  { id: 'shard_3', title: 'Fénytöredék III.', x: 22, z: -56, text: 'Aki átlép a Kapun, az emlékeit a túloldalon hagyja. Ezért nem emlékszem a nevemre sem.' },
];

export const CHAPTERS = {
  1: {
    title: 'A fény, amely elvitt',
    intro: [
      'A busz késik. A megállóban állsz, a fülesedben ugyanaz a dal szól tizenkettedik perce. Az eső elállt, de a levegő még mindig nehéz.',
      'Aztán a fény nem az égből jön. A betonból. A saját árnyékodból. Egy kéz — nem kéz, csak fény — megragadja a bokád.',
      'A világ kifordul. Nem zuhansz, csak megérkezel: fű, hamu, és egy kőkapu, ami már nagyon régóta vár valakire.',
      'A fejedben egy hang szól, ami nem a tiéd: „Bocsánat. Nem volt időnk kérdezni.”',
    ],
  },
};

export const DIALOGUES = {
  rovan: {
    start: (flags) => (flags.includes('met_rovan') ? 'rovan_after' : 'rovan_intro'),
    nodes: {
      rovan_intro: {
        text: 'Állj meg ott, ahol vagy. …Hogy kerültél a Kapu túloldalára? Élve még senki nem jött át, akit nem hívtak.',
        choices: [
          { label: 'Hol vagyok?', goto: 'rovan_world' },
          { label: 'Ki vagy te?', goto: 'rovan_who' },
          { label: 'Mit akarsz tőlem?', goto: 'rovan_want' },
        ],
      },
      rovan_world: {
        text: 'Ez Aeloria. Vagy ami megmaradt belőle. A fény, ami elvitt, nem véletlenül választott — és nem is ingyen.',
        choices: [
          { label: 'Ki vagy te?', goto: 'rovan_who' },
          { label: 'Mit akarsz tőlem?', goto: 'rovan_want' },
          { label: 'Továbbmegyek.', goto: 'rovan_leave' },
        ],
      },
      rovan_who: {
        text: 'Rovan. A Kapu őrszem. Húsz éve nem aludtam rendesen, és még mindig nem tudom, mit őrzök valójában.',
        choices: [
          { label: 'Hol vagyok?', goto: 'rovan_world' },
          { label: 'Mit akarok itt?', goto: 'rovan_want' },
          { label: 'Továbbmegyek.', goto: 'rovan_leave' },
        ],
      },
      rovan_want: {
        text: 'Nem én akarok tőled semmit. A falu véne, Fátyol asszony vár rád a tűznél. Ő tudja, miért hívtak — és mit kell tenned, hogy itt maradhass.',
        choices: [
          { label: 'Miért hívtak?', goto: 'rovan_world' },
          { label: 'Megyek hozzá.', goto: 'rovan_leave' },
        ],
      },
      rovan_leave: {
        text: 'Menj egyenesen befelé, a füstöt követve. És idegen — a völgyben ne bízz abban, ami fényesen hívogat.',
        effects: ['met_rovan'],
        end: true,
      },
      rovan_after: {
        text: 'Fátyol asszony a falu tüzénél van. Siess, mielőtt lemegy a nap.',
        end: true,
      },
    },
  },

  fatyol: {
    start: (flags, beacons) => {
      if (flags.includes('ch1_done')) return 'fatyol_after';
      if (beacons.length >= BEACONS.length) return 'fatyol_done';
      if (flags.includes('met_fatyol')) return 'fatyol_progress';
      return 'fatyol_intro';
    },
    nodes: {
      fatyol_intro: {
        text: 'Te vagy az. A fény hozott, nem a saját lábad. Ülj le — nem, ne ülj le. Nincs idő. A három jelzőtűz kialudt.',
        choices: [
          { label: 'Mit kell tennem?', goto: 'fatyol_task' },
          { label: 'Ki hívott ide?', goto: 'fatyol_summon' },
          { label: 'Miért pont én?', goto: 'fatyol_why' },
        ],
      },
      fatyol_summon: {
        text: 'A völgy hívott. A régi fény, amit a kőtálakba zártunk, amikor még volt, aki emlékezzen a szavakra. Mostanra csak a szavak maradtak.',
        choices: [
          { label: 'Mit kell tennem?', goto: 'fatyol_task' },
          { label: 'Miért pont én?', goto: 'fatyol_why' },
        ],
      },
      fatyol_why: {
        text: 'Mert a Kapun csak az jöhet át, akinek nincs itt semmije. Neked nincs. Ez nem szerencse — ez az egyetlen feltétel.',
        choices: [
          { label: 'Mit kell tennem?', goto: 'fatyol_task' },
          { label: 'Ki hívott ide?', goto: 'fatyol_summon' },
        ],
      },
      fatyol_task: {
        text: 'Menj körbe a völgy peremén. Nyugat, kelet, észak — mindenhol áll egy kőtál a régi hamuval. Állj oda, és a fény visszatér. Ha az éjszaka leszáll, és egy is hiányzik, nem lesz hol felébredned.',
        effects: ['met_fatyol'],
        end: true,
      },
      fatyol_progress: {
        text: 'Még nem mind ég. A tüzeket a völgy peremén keresd — ahol a fű elfogy, és a kő kezdődik.',
        end: true,
      },
      fatyol_done: {
        text: 'Érzem. A völgy lélegzik újra. …Amit ma tettél, azt holnap már nem tudod visszavonni: a tüzek fényét a Kapu túloldaláról is látni fogják.',
        effects: ['ch1_done'],
        end: true,
      },
      fatyol_after: {
        text: 'Pihenj. Holnap a Kapuhoz megyünk — és akkor megtudod, miért nem volt időnk kérdezni.',
        end: true,
      },
    },
  },

  bernal: {
    start: (flags) => (flags.includes('ch1_done') ? 'bernal_after' : 'bernal_intro'),
    nodes: {
      bernal_intro: {
        text: 'Idegen. Jó. A kalapácsomnak mindegy, ki emeli fel — csak az számít, hogy bírja-e.',
        choices: [
          { label: 'Mi történt ezzel a világgal?', goto: 'bernal_world' },
          { label: 'Van valami, amit érdemes tudnom?', goto: 'bernal_hint' },
        ],
      },
      bernal_world: {
        text: 'A Kapu nem ajtó. Száj. A másik oldalunkról szívja ki a világokat, és ami ideér, az már nem a régi formája. Ezért nincs itt két egyforma hegy.',
        choices: [
          { label: 'Van valami, amit érdemes tudnom?', goto: 'bernal_hint' },
          { label: 'Köszönöm.', goto: 'bernal_end' },
        ],
      },
      bernal_hint: {
        text: 'A fénytöredékekre figyelj — ahol az eső elkerüli a füvet, ott csillog valami. A vének szerint egy-egy emlékét őrzik annak, aki előtted járt.',
        choices: [
          { label: 'Mi történt ezzel a világgal?', goto: 'bernal_world' },
          { label: 'Köszönöm.', goto: 'bernal_end' },
        ],
      },
      bernal_end: {
        text: 'Ha a tüzeket meggyújtod, gyere vissza. Adok valamit, ami jobban bírja az utat, mint ez a ruha.',
        effects: ['met_bernal'],
        end: true,
      },
      bernal_after: {
        text: 'Holnap. Most még a vas sem engedelmeskedik, nemhogy a világ.',
        end: true,
      },
    },
  },

  tam: {
    start: () => 'tam_intro',
    nodes: {
      tam_intro: {
        text: 'Csukott szemmel is megérzem, hogy idegen vagy. A felnőttek félnek tőled. Én nem. Mit tudsz csinálni?',
        choices: [
          { label: 'Nem tudom. Még semmit.', goto: 'tam_hint' },
          { label: 'Hogy kerülök haza?', goto: 'tam_home' },
        ],
      },
      tam_home: {
        text: 'Haza? A Kapu csak egyfelé nyílik. De a fénytöredékek beszélnek. Ha mindet megtalálod, talán emlékezni fogsz arra, aki voltál.',
        choices: [
          { label: 'Hol találom őket?', goto: 'tam_hint' },
          { label: 'Köszönöm.', goto: 'tam_end' },
        ],
      },
      tam_hint: {
        text: 'Ahol a fű világosabb, és a szél nem ér oda. Kettőt láttam: az egyik nyugatra, a hegy lábánál, a másik keletre, ahol a fák véget érnek.',
        choices: [
          { label: 'Hogy kerülök haza?', goto: 'tam_home' },
          { label: 'Köszönöm.', goto: 'tam_end' },
        ],
      },
      tam_end: {
        text: 'Ha megtalálod őket, ne szólj róla a véneknek. Ők mindent összeírnak.',
        end: true,
      },
    },
  },
};

export function getDialogueStart(npcId, flags, beacons) {
  const entry = DIALOGUES[npcId];
  if (!entry) return null;
  return entry.start(flags, beacons);
}

export function getDialogueNode(npcId, nodeId) {
  return DIALOGUES[npcId]?.nodes[nodeId] ?? null;
}

export function getObjective(state, player) {
  const flags = state.flags || [];
  const beacons = state.beacons || [];
  const has = (f) => flags.includes(f);
  const near = (list) => {
    if (!player) return list[0];
    return list.reduce((best, item) => {
      const da = Math.hypot(item.x - player.x, item.z - player.z);
      const db = Math.hypot(best.x - player.x, best.z - player.z);
      return da < db ? item : best;
    }, list[0]);
  };

  if (!has('met_rovan')) {
    const npc = NPCS.find((n) => n.id === 'rovan');
    return { id: 'o_rovan', text: 'Beszélj Rovannal, a kapu őrszemmel.', target: npc, counter: null };
  }
  if (!has('met_fatyol')) {
    const npc = NPCS.find((n) => n.id === 'fatyol');
    return { id: 'o_fatyol', text: 'Menj be a faluba, és keresd fel Fátyol asszonyt.', target: npc, counter: null };
  }
  if (beacons.length < BEACONS.length) {
    const rest = BEACONS.filter((b) => !beacons.includes(b.id));
    return {
      id: 'o_beacons',
      text: `Gyújtsd meg a jelzőtüzeket a völgy peremén.`,
      target: near(rest),
      counter: `${beacons.length}/${BEACONS.length}`,
    };
  }
  if (!has('ch1_done')) {
    const npc = NPCS.find((n) => n.id === 'fatyol');
    return { id: 'o_return', text: 'Térj vissza Fátyol asszonyhoz a falu tüzéhez.', target: npc, counter: null };
  }
  return {
    id: 'o_done',
    text: 'Az 1. fejezet teljesítve. A Kapu túloldala még vár.',
    target: null,
    counter: null,
  };
}

export function getJournal(state) {
  const flags = state.flags || [];
  const beacons = state.beacons || [];
  const shards = state.shards || [];
  return {
    steps: [
      { id: 'met_rovan', text: 'Rovan beengedett a völgybe, és a vénekhez küldött.', done: flags.includes('met_rovan') },
      { id: 'met_fatyol', text: 'Fátyol asszony rád bízta a völgy régi fényeit.', done: flags.includes('met_fatyol') },
      { id: 'beacons', text: `Jelzőtüzek meggyújtva (${beacons.length}/${BEACONS.length}).`, done: beacons.length === BEACONS.length },
      { id: 'ch1_done', text: 'A völgy átvészelte az éjszakát. Az 1. fejezet véget ért.', done: flags.includes('ch1_done') },
    ],
    lore: SHARDS.filter((s) => shards.includes(s.id)).map((s) => ({ id: s.id, title: s.title, text: s.text })),
  };
}