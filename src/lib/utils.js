import { PLAYER_DB } from './constants';

export var findPlayer = function(name) {
  if (!name) return null;
  for (var k in PLAYER_DB) { if (name.indexOf(k) !== -1) return { key: k, data: PLAYER_DB[k] }; }
  return null;
};

export var getATPImage = function(name) {
  var p = findPlayer(name);
  return (p && p.data.slug) ? "https://www.atptour.com/-/media/alias/player-headshot/" + p.data.slug : null;
};

export var getESPNImage = function(name) {
  var p = findPlayer(name);
  return (p && p.data.espn) ? "https://a.espncdn.com/combiner/i?img=/i/headshots/tennis/players/full/" + p.data.espn + ".png&w=200&h=145" : null;
};

export var getSofaScoreImage = function(name, teamId) {
  if (teamId) return "/api/player-image?id=" + teamId;
  var p = findPlayer(name);
  if (p && p.data.sofa) return "/api/player-image?id=" + p.data.sofa;
  return null;
};

export var formatTimeAgo = function(d) { if (!d) return ""; try { var m = Math.floor((new Date() - new Date(d)) / 60000); if (m < 1) return "agora"; if (m < 60) return "há " + m + " min"; var h = Math.floor(m / 60); if (h < 24) return "há " + h + "h"; var dd = Math.floor(h / 24); if (dd === 1) return "ontem"; if (dd < 7) return "há " + dd + " dias"; return new Date(d).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }); } catch(e) { return ""; } };

export var formatMatchDate = function(d) { if (!d) return "Sem data confirmada"; try { var dt = new Date(d); return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("pt-BR", { day: "numeric", month: "long" }); } catch(e) { return d; } };

export var detectDevice = function() { if (typeof window === "undefined") return "unknown"; var ua = navigator.userAgent.toLowerCase(); if (/iphone|ipad|ipod/.test(ua)) return "ios"; if (/android/.test(ua)) return "android"; return "desktop"; };
