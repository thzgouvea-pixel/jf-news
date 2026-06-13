// ===== ATP CALENDAR 2026 — canonical, client-safe =====
// Pure data, no server-only deps (no process.env / fetch), so it can be
// imported safely from React components AND from the server (sofascore.js
// re-exports it). Single source of truth for the season schedule.
export var ATP_CALENDAR_2026 = [
  { name: "Australian Open",       cat: "Grand Slam",   surface: "Hard",  city: "Melbourne",       country: "Austrália",      start: "2026-01-18", end: "2026-02-01" },
  { name: "Buenos Aires",          cat: "ATP 250",      surface: "Clay",  city: "Buenos Aires",    country: "Argentina",       start: "2026-02-09", end: "2026-02-15" },
  { name: "Rio Open",              cat: "ATP 500",      surface: "Clay",  city: "Rio de Janeiro",  country: "Brasil",          start: "2026-02-16", end: "2026-02-22" },
  { name: "Acapulco Open",         cat: "ATP 500",      surface: "Hard",  city: "Acapulco",        country: "México",          start: "2026-02-23", end: "2026-03-01" },
  { name: "Indian Wells Masters",  cat: "Masters 1000", surface: "Hard",  city: "Indian Wells",    country: "EUA",             start: "2026-03-09", end: "2026-03-22" },
  { name: "Miami Open",            cat: "Masters 1000", surface: "Hard",  city: "Miami",           country: "EUA",             start: "2026-03-23", end: "2026-04-05" },
  { name: "Monte Carlo",           cat: "Masters 1000", surface: "Clay",  city: "Monte Carlo",     country: "Mônaco",          start: "2026-04-05", end: "2026-04-12" },
  { name: "Barcelona Open",        cat: "ATP 500",      surface: "Clay",  city: "Barcelona",       country: "Espanha",         start: "2026-04-13", end: "2026-04-19" },
  { name: "BMW Open",              cat: "ATP 500",      surface: "Clay",  city: "Munique",         country: "Alemanha",        start: "2026-04-13", end: "2026-04-19" },
  { name: "Madrid Open",           cat: "Masters 1000", surface: "Clay",  city: "Madri",           country: "Espanha",         start: "2026-04-22", end: "2026-05-03" },
  { name: "Roma Masters",          cat: "Masters 1000", surface: "Clay",  city: "Roma",            country: "Itália",          start: "2026-05-06", end: "2026-05-17" },
  { name: "Geneva Open",           cat: "ATP 250",      surface: "Clay",  city: "Genebra",         country: "Suíça",           start: "2026-05-17", end: "2026-05-23" },
  { name: "Lyon Open",             cat: "ATP 250",      surface: "Clay",  city: "Lyon",            country: "França",          start: "2026-05-17", end: "2026-05-23" },
  { name: "Roland Garros",         cat: "Grand Slam",   surface: "Clay",  city: "Paris",           country: "França",          start: "2026-05-24", end: "2026-06-07" },
  // ── temporada de grama ──
  { name: "Stuttgart Open",        cat: "ATP 250",      surface: "Grass", city: "Stuttgart",       country: "Alemanha",        start: "2026-06-08", end: "2026-06-14" },
  { name: "Libéma Open",           cat: "ATP 250",      surface: "Grass", city: "'s-Hertogenbosch",country: "Holanda",         start: "2026-06-08", end: "2026-06-14" },
  { name: "Halle Open",            cat: "ATP 500",      surface: "Grass", city: "Halle",           country: "Alemanha",        start: "2026-06-15", end: "2026-06-21" },
  { name: "Queen's Club",          cat: "ATP 500",      surface: "Grass", city: "Londres",         country: "Reino Unido",     start: "2026-06-15", end: "2026-06-21" },
  { name: "Mallorca Championships", cat: "ATP 250",     surface: "Grass", city: "Mallorca",        country: "Espanha",         start: "2026-06-22", end: "2026-06-27" },
  { name: "Eastbourne International", cat: "ATP 250",   surface: "Grass", city: "Eastbourne",      country: "Reino Unido",     start: "2026-06-22", end: "2026-06-27" },
  { name: "Wimbledon",             cat: "Grand Slam",   surface: "Grass", city: "Londres",         country: "Reino Unido",     start: "2026-06-29", end: "2026-07-12" },
  // ── verao americano + asiatico ──
  { name: "Hamburg Open",          cat: "ATP 500",      surface: "Clay",  city: "Hamburgo",        country: "Alemanha",        start: "2026-07-13", end: "2026-07-19" },
  { name: "Washington Open",       cat: "ATP 500",      surface: "Hard",  city: "Washington",      country: "EUA",             start: "2026-07-27", end: "2026-08-02" },
  { name: "Canadian Open",         cat: "Masters 1000", surface: "Hard",  city: "Toronto",         country: "Canadá",          start: "2026-08-04", end: "2026-08-10" },
  { name: "Cincinnati Masters",    cat: "Masters 1000", surface: "Hard",  city: "Cincinnati",      country: "EUA",             start: "2026-08-11", end: "2026-08-17" },
  { name: "US Open",               cat: "Grand Slam",   surface: "Hard",  city: "Nova York",       country: "EUA",             start: "2026-08-31", end: "2026-09-13" },
  { name: "Tokyo Open",            cat: "ATP 500",      surface: "Hard",  city: "Tóquio",          country: "Japão",           start: "2026-09-21", end: "2026-09-27" },
  { name: "China Open",            cat: "ATP 500",      surface: "Hard",  city: "Pequim",          country: "China",           start: "2026-09-28", end: "2026-10-04" },
  { name: "Shanghai Masters",      cat: "Masters 1000", surface: "Hard",  city: "Shanghai",        country: "China",           start: "2026-10-04", end: "2026-10-12" },
  { name: "Swiss Indoors Basel",   cat: "ATP 500",      surface: "Hard",  city: "Basileia",        country: "Suíça",           start: "2026-10-19", end: "2026-10-25" },
  { name: "Vienna Open",           cat: "ATP 500",      surface: "Hard",  city: "Viena",           country: "Áustria",         start: "2026-10-19", end: "2026-10-25" },
  { name: "Paris Masters",         cat: "Masters 1000", surface: "Hard",  city: "Paris",           country: "França",          start: "2026-10-26", end: "2026-11-01" },
  { name: "ATP Finals",            cat: "Finals",       surface: "Hard",  city: "Turim",           country: "Itália",          start: "2026-11-15", end: "2026-11-22" },
];
