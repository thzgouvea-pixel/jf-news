export const PLAYER_DB = {
  Alcaraz: { slug: "a0e2", espn: "4686", sofa: 856498 },
  Sinner: { slug: "s0ag", espn: "4375", sofa: 333849 },
  Djokovic: { slug: "d643", espn: "777", sofa: 12708 },
  Medvedev: { slug: "mm58", espn: "3367", sofa: 196065 },
  Zverev: { slug: "z355", espn: "3098", sofa: 197075 },
  Rublev: { slug: "re44", espn: "3523", sofa: 197592 },
  Ruud: { slug: "rh16", espn: null, sofa: null },
  Tsitsipas: { slug: "te51", espn: null, sofa: null },
  Fritz: { slug: "fb98", espn: "2981", sofa: 163713 },
  Rune: { slug: "r0dg", espn: "4685", sofa: null },
  Hurkacz: { slug: "hb71", espn: "3264", sofa: 203766 },
  Khachanov: { slug: "ke29", espn: "3112", sofa: null },
  Berrettini: { slug: "bk40", espn: "3316", sofa: 205641 },
  Diallo: { slug: "d0f6", espn: "3885", sofa: 280151 },
  Shelton: { slug: "s0jy", espn: "11712", sofa: 963814 },
  Draper: { slug: "d0bi", espn: "4580", sofa: 366258 },
  Tiafoe: { slug: "td51", espn: "3263", sofa: 235141 },
  Musetti: { slug: "m0ej", espn: "4228", sofa: 367702 },
  Fils: { slug: "f0gx", espn: "11716", sofa: 963839 },
  Cerundolo: { slug: "c0aq", espn: "11689", sofa: 829780 },
  "Davidovich Fokina": { slug: "d0au", espn: "4579", sofa: 367748 },
  "Auger-Aliassime": { slug: "ag37", espn: "3270", sofa: 230882 },
  "de Minaur": { slug: "dh58", espn: "3313", sofa: 226413 },
  Paul: { slug: "pl56", espn: "3117", sofa: 189458 },
  Tabilo: { slug: "t0ag", espn: "4684", sofa: 367700 },
  Machac: { slug: "m0eo", espn: "11709", sofa: 828775 },
  "Mpetshi Perricard": { slug: "m0je", espn: "11747", sofa: null },
  Mensik: { slug: "m0ij", espn: "11746", sofa: 979825 },
  Shapovalov: { slug: "su55", espn: "3086", sofa: 202233 },
  Munar: { slug: "mf53", espn: "4229", sofa: 252456 },
  Rinderknech: { slug: "rc91", espn: "3511", sofa: 136498 },
  Fonseca: { slug: "f0fv", espn: "11745", sofa: null },
  Nakashima: { slug: "n0ae", espn: "4581", sofa: 829749 },
  Baez: { slug: "b0dx", espn: "11690", sofa: 830192 },
  Etcheverry: { slug: "e0gd", espn: "11700", sofa: 953250 },
  Jarry: { slug: "j0ag", espn: "3539", sofa: 135133 },
  Bublik: { slug: "b0bk", espn: "3540", sofa: 227296 },
  Kokkinakis: { slug: "k0ad", espn: "3124", sofa: null },
  Korda: { slug: "k0ah", espn: "4578", sofa: 367699 },
  Norrie: { slug: "n0ab", espn: "3266", sofa: null },
  Dimitrov: { slug: "d875", espn: "1629", sofa: 26696 },
  Monfils: { slug: "m788", espn: "716", sofa: 14640 },
  Wawrinka: { slug: "w367", espn: "536", sofa: null },
  Nishikori: { slug: "n552", espn: "1058", sofa: null },
  Coric: { slug: "c0ag", espn: "2435", sofa: null },
  Popyrin: { slug: "p0dj", espn: "3541", sofa: null },
  Thompson: { slug: "t0aj", espn: "3099", sofa: null },
  Giron: { slug: "g0ah", espn: "3116", sofa: null },
  Kotov: { slug: null, espn: "11706", sofa: null },
  Safiullin: { slug: null, espn: "11714", sofa: null },
};

export function findPlayer(name) {
  if (!name) return null;

  for (const key in PLAYER_DB) {
    if (name.indexOf(key) !== -1) {
      return { key, data: PLAYER_DB[key] };
    }
  }

  return null;
}

export function getATPImage(name) {
  const player = findPlayer(name);
  return player?.data?.slug
    ? `https://www.atptour.com/-/media/alias/player-headshot/${player.data.slug}`
    : null;
}

export function getESPNImage(name) {
  const player = findPlayer(name);
  return player?.data?.espn
    ? `https://a.espncdn.com/combiner/i?img=/i/headshots/tennis/players/full/${player.data.espn}.png&w=200&h=145`
    : null;
}

export function getSofaScoreImage(name, sofascoreId) {
  const player = findPlayer(name);
  const id = player?.data?.sofa || sofascoreId;
  return id ? `https://api.sofascore.app/api/v1/player/${id}/image` : null;
}
