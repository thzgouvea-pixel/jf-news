import { useState, useEffect, useRef, useCallback, useMemo } from "react";


// ===== SOUND SYSTEM =====
const SFX = {
  _muted: true,
  toggle() { this._muted = !this._muted; return this._muted; },
  isMuted() { return this._muted; },
  async ballHit() {},
  async setWon() {},
  async setLost() {},
  async matchWon() {},
  async matchLost() {},
  async titleWon() {},
  async click() {},
  async levelUp() {},
  async injury() {},
  async menuOpen() {},
  async menuClose() {},
  async achievement() {},
  async coin() {},
  async error() {},
  async save() {},
};

// ===== CALENDAR =====
const CAL = [
{w:1,m:"JAN",n:"ITF São Paulo",ci:"São Paulo",co:"BRA",sf:"clay",lv:"ITF15",pr:800,pt:3,mr:9999,tc:0,rd:5},
{w:1,m:"JAN",n:"ITF Antalya",ci:"Antalya",co:"TUR",sf:"hard",lv:"ITF15",pr:800,pt:3,mr:9999,tc:1200,rd:5},
{w:2,m:"JAN",n:"CH Campinas",ci:"Campinas",co:"BRA",sf:"clay",lv:"CH50",pr:4000,pt:12,mr:500,tc:100,rd:5},
{w:2,m:"JAN",n:"Brisbane Open",ci:"Brisbane",co:"AUS",sf:"hard",lv:"ATP250",pr:30000,pt:50,mr:120,tc:3500,rd:5},
{w:3,m:"JAN",n:"Melbourne Open",ci:"Melbourne",co:"AUS",sf:"hard",lv:"GS",pr:200000,pt:400,mr:105,tc:3800,rd:7},
{w:3,m:"JAN",n:"ITF Monastir",ci:"Monastir",co:"TUN",sf:"hard",lv:"ITF25",pr:1500,pt:5,mr:9999,tc:1100,rd:5},
{w:3,m:"JAN",n:"CH B. Horizonte",ci:"B. Horizonte",co:"BRA",sf:"clay",lv:"CH50",pr:4000,pt:12,mr:500,tc:200,rd:5},
{w:5,m:"FEV",n:"Buenos Aires Open",ci:"Buenos Aires",co:"ARG",sf:"clay",lv:"ATP250",pr:28000,pt:50,mr:120,tc:800,rd:5},
{w:5,m:"FEV",n:"Rotterdam Open",ci:"Rotterdam",co:"NED",sf:"hard",lv:"ATP500",pr:55000,pt:100,mr:80,tc:2500,rd:5},
{w:5,m:"FEV",n:"ITF Santos",ci:"Santos",co:"BRA",sf:"clay",lv:"ITF15",pr:800,pt:3,mr:9999,tc:100,rd:5},
{w:5,m:"FEV",n:"CH São Paulo",ci:"São Paulo",co:"BRA",sf:"clay",lv:"CH75",pr:6000,pt:18,mr:380,tc:0,rd:5},
{w:6,m:"FEV",n:"Rio de Janeiro Open",ci:"Rio de Janeiro",co:"BRA",sf:"clay",lv:"ATP500",pr:55000,pt:100,mr:80,tc:150,rd:5},
{w:6,m:"FEV",n:"CH Florianópolis",ci:"Florianópolis",co:"BRA",sf:"clay",lv:"CH50",pr:4000,pt:12,mr:500,tc:250,rd:5},
{w:7,m:"FEV",n:"Mexico Open",ci:"Acapulco",co:"MEX",sf:"hard",lv:"ATP500",pr:55000,pt:100,mr:80,tc:1500,rd:5},
{w:7,m:"FEV",n:"Chile Open",ci:"Santiago",co:"CHI",sf:"clay",lv:"ATP250",pr:28000,pt:50,mr:120,tc:700,rd:5},
{w:7,m:"FEV",n:"CH Cordoba",ci:"Cordoba",co:"ARG",sf:"clay",lv:"CH75",pr:6000,pt:18,mr:380,tc:700,rd:5},
{w:9,m:"MAR",n:"Desert Classic",ci:"Desert Classic",co:"USA",sf:"hard",lv:"M1000",pr:120000,pt:200,mr:55,tc:2800,rd:6},
{w:9,m:"MAR",n:"CH Phoenix",ci:"Phoenix",co:"USA",sf:"hard",lv:"CH175",pr:12000,pt:38,mr:300,tc:2500,rd:5},
{w:9,m:"MAR",n:"ITF Curitiba",ci:"Curitiba",co:"BRA",sf:"clay",lv:"ITF15",pr:800,pt:3,mr:9999,tc:200,rd:5},
{w:11,m:"MAR",n:"Sunshine Open",ci:"Miami",co:"USA",sf:"hard",lv:"M1000",pr:120000,pt:200,mr:55,tc:2200,rd:6},
{w:11,m:"MAR",n:"CH Lima",ci:"Lima",co:"PER",sf:"clay",lv:"CH100",pr:8000,pt:25,mr:350,tc:900,rd:5},
{w:13,m:"ABR",n:"Riviera Masters",ci:"Riviera Masters",co:"MON",sf:"clay",lv:"M1000",pr:120000,pt:200,mr:55,tc:2800,rd:6},
{w:13,m:"ABR",n:"CH Bogota",ci:"Bogota",co:"COL",sf:"clay",lv:"CH75",pr:6000,pt:18,mr:380,tc:600,rd:5},
{w:13,m:"ABR",n:"ITF Porto Alegre",ci:"Porto Alegre",co:"BRA",sf:"clay",lv:"ITF25",pr:1500,pt:5,mr:9999,tc:300,rd:5},
{w:15,m:"ABR",n:"Catalonia Open",ci:"Barcelona",co:"ESP",sf:"clay",lv:"ATP500",pr:55000,pt:100,mr:80,tc:2600,rd:5},
{w:15,m:"ABR",n:"CH Concepcion",ci:"Concepcion",co:"CHI",sf:"clay",lv:"CH50",pr:4000,pt:12,mr:500,tc:650,rd:5},
{w:17,m:"ABR",n:"Madrid Masters",ci:"Madrid",co:"ESP",sf:"clay",lv:"M1000",pr:120000,pt:200,mr:55,tc:2600,rd:6},
{w:19,m:"MAI",n:"Italian Masters",ci:"Roma",co:"ITA",sf:"clay",lv:"M1000",pr:120000,pt:200,mr:55,tc:2700,rd:6},
{w:19,m:"MAI",n:"CH Francavilla",ci:"Francavilla",co:"ITA",sf:"clay",lv:"CH100",pr:8000,pt:25,mr:350,tc:2600,rd:5},
{w:21,m:"MAI",n:"Paris Open",ci:"Paris",co:"FRA",sf:"clay",lv:"GS",pr:200000,pt:400,mr:105,tc:2600,rd:7},
{w:21,m:"MAI",n:"CH Heilbronn",ci:"Heilbronn",co:"GER",sf:"clay",lv:"CH100",pr:8000,pt:25,mr:350,tc:2700,rd:5},
{w:23,m:"JUN",n:"Stuttgart Open",ci:"Stuttgart",co:"GER",sf:"grass",lv:"ATP250",pr:28000,pt:50,mr:120,tc:2700,rd:5},
{w:23,m:"JUN",n:"CH Ilkley",ci:"Ilkley",co:"GBR",sf:"grass",lv:"CH75",pr:6000,pt:18,mr:380,tc:2500,rd:5},
{w:24,m:"JUN",n:"London Grass Open",ci:"Londres",co:"GBR",sf:"grass",lv:"ATP500",pr:55000,pt:100,mr:80,tc:2500,rd:5},
{w:26,m:"JUN",n:"London Championships",ci:"Londres",co:"GBR",sf:"grass",lv:"GS",pr:250000,pt:400,mr:105,tc:2500,rd:7},
{w:26,m:"JUN",n:"CH Surbiton",ci:"Surbiton",co:"GBR",sf:"grass",lv:"CH75",pr:6000,pt:18,mr:380,tc:2500,rd:5},
{w:28,m:"JUL",n:"Gstaad Open",ci:"Gstaad",co:"SUI",sf:"clay",lv:"ATP250",pr:28000,pt:50,mr:120,tc:2800,rd:5},
{w:29,m:"JUL",n:"Washington Open",ci:"Washington",co:"USA",sf:"hard",lv:"ATP500",pr:55000,pt:100,mr:80,tc:2200,rd:5},
{w:29,m:"JUL",n:"CH Salzburg",ci:"Salzburg",co:"AUT",sf:"clay",lv:"CH50",pr:4000,pt:12,mr:500,tc:2600,rd:5},
{w:31,m:"AGO",n:"Canada Masters",ci:"Toronto",co:"CAN",sf:"hard",lv:"M1000",pr:120000,pt:200,mr:55,tc:2400,rd:6},
{w:32,m:"AGO",n:"Ohio Masters",ci:"Ohio Masters",co:"USA",sf:"hard",lv:"M1000",pr:120000,pt:200,mr:55,tc:2200,rd:6},
{w:34,m:"AGO",n:"New York Open",ci:"Nova York",co:"USA",sf:"hard",lv:"GS",pr:250000,pt:400,mr:105,tc:2300,rd:7},
{w:34,m:"AGO",n:"CH Granby",ci:"Granby",co:"CAN",sf:"hard",lv:"CH75",pr:6000,pt:18,mr:380,tc:2300,rd:5},
{w:34,m:"AGO",n:"ITF Brasília",ci:"Brasília",co:"BRA",sf:"clay",lv:"ITF25",pr:1500,pt:5,mr:9999,tc:350,rd:5},
{w:37,m:"SET",n:"Tokyo Open",ci:"Tokyo",co:"JPN",sf:"hard",lv:"ATP500",pr:55000,pt:100,mr:80,tc:3500,rd:5},
{w:37,m:"SET",n:"CH Campinas II",ci:"Campinas",co:"BRA",sf:"clay",lv:"CH75",pr:6000,pt:18,mr:380,tc:100,rd:5},
{w:39,m:"OUT",n:"Shanghai Masters Masters",ci:"Xangai",co:"CHN",sf:"hard",lv:"M1000",pr:120000,pt:200,mr:55,tc:3600,rd:6},
{w:39,m:"OUT",n:"CH São Paulo II",ci:"São Paulo",co:"BRA",sf:"hard",lv:"CH100",pr:8000,pt:25,mr:350,tc:0,rd:5},
{w:41,m:"OUT",n:"Swiss Indoors",ci:"Basel",co:"SUI",sf:"hard",lv:"ATP500",pr:55000,pt:100,mr:80,tc:2800,rd:5},
{w:42,m:"OUT",n:"Paris Indoors",ci:"Paris",co:"FRA",sf:"hard",lv:"M1000",pr:120000,pt:200,mr:55,tc:2600,rd:6},
{w:42,m:"OUT",n:"CH Buenos Aires",ci:"Buenos Aires",co:"ARG",sf:"clay",lv:"CH100",pr:8000,pt:25,mr:350,tc:800,rd:5},
{w:44,m:"NOV",n:"Tour Finals",ci:"Turim",co:"ITA",sf:"hard",lv:"Finals",pr:300000,pt:500,mr:8,tc:2700,rd:5},
{w:44,m:"NOV",n:"CH Montevideo",ci:"Montevideo",co:"URU",sf:"clay",lv:"CH50",pr:4000,pt:12,mr:500,tc:600,rd:5},
{w:44,m:"NOV",n:"ITF Recife",ci:"Recife",co:"BRA",sf:"hard",lv:"ITF15",pr:800,pt:3,mr:9999,tc:400,rd:5},
// Fill empty weeks with ITFs and Challengers
{w:4,m:"JAN",n:"ITF Manacor",ci:"Manacor",co:"ESP",sf:"clay",lv:"ITF15",pr:800,pt:3,mr:9999,tc:2500,rd:5},
{w:4,m:"JAN",n:"CH Canberra",ci:"Canberra",co:"AUS",sf:"hard",lv:"CH75",pr:6000,pt:18,mr:380,tc:3800,rd:5},
{w:8,m:"FEV",n:"ITF Heraklion",ci:"Heraklion",co:"TUR",sf:"hard",lv:"ITF25",pr:1500,pt:5,mr:9999,tc:1200,rd:5},
{w:8,m:"FEV",n:"CH Medellin",ci:"Medellin",co:"COL",sf:"clay",lv:"CH50",pr:4000,pt:12,mr:500,tc:600,rd:5},
{w:10,m:"MAR",n:"ITF Cancun",ci:"Cancun",co:"MEX",sf:"hard",lv:"ITF15",pr:800,pt:3,mr:9999,tc:1500,rd:5},
{w:10,m:"MAR",n:"CH Santiago",ci:"Santiago",co:"CHI",sf:"clay",lv:"CH75",pr:6000,pt:18,mr:380,tc:700,rd:5},
{w:12,m:"MAR",n:"ITF Guayaquil",ci:"Guayaquil",co:"PER",sf:"clay",lv:"ITF25",pr:1500,pt:5,mr:9999,tc:800,rd:5},
{w:12,m:"MAR",n:"CH Rosario",ci:"Rosario",co:"ARG",sf:"clay",lv:"CH50",pr:4000,pt:12,mr:500,tc:700,rd:5},
{w:14,m:"ABR",n:"ITF Hammamet",ci:"Hammamet",co:"TUN",sf:"clay",lv:"ITF15",pr:800,pt:3,mr:9999,tc:1100,rd:5},
{w:14,m:"ABR",n:"CH Split",ci:"Split",co:"ESP",sf:"clay",lv:"CH75",pr:6000,pt:18,mr:380,tc:2600,rd:5},
{w:16,m:"ABR",n:"ITF Recife II",ci:"Recife",co:"BRA",sf:"hard",lv:"ITF15",pr:800,pt:3,mr:9999,tc:400,rd:5},
{w:16,m:"ABR",n:"CH Aix-en-Prov.",ci:"Aix-en-Prov.",co:"FRA",sf:"clay",lv:"CH100",pr:8000,pt:25,mr:350,tc:2600,rd:5},
{w:18,m:"MAI",n:"ITF Nonthaburi",ci:"Nonthaburi",co:"JPN",sf:"hard",lv:"ITF25",pr:1500,pt:5,mr:9999,tc:3500,rd:5},
{w:18,m:"MAI",n:"CH Torino",ci:"Turim",co:"ITA",sf:"clay",lv:"CH75",pr:6000,pt:18,mr:380,tc:2700,rd:5},
{w:20,m:"MAI",n:"ITF São José",ci:"São José",co:"BRA",sf:"clay",lv:"ITF15",pr:800,pt:3,mr:9999,tc:100,rd:5},
{w:20,m:"MAI",n:"CH Lyon",ci:"Lyon",co:"FRA",sf:"clay",lv:"CH100",pr:8000,pt:25,mr:350,tc:2600,rd:5},
{w:22,m:"JUN",n:"ITF Nottingham",ci:"Nottingham",co:"GBR",sf:"grass",lv:"ITF25",pr:1500,pt:5,mr:9999,tc:2500,rd:5},
{w:22,m:"JUN",n:"CH Prostejov",ci:"Prostejov",co:"GER",sf:"clay",lv:"CH50",pr:4000,pt:12,mr:500,tc:2700,rd:5},
{w:25,m:"JUN",n:"ITF Roehampton",ci:"Roehampton",co:"GBR",sf:"grass",lv:"ITF15",pr:800,pt:3,mr:9999,tc:2500,rd:5},
{w:25,m:"JUN",n:"CH Mallorca",ci:"Mallorca",co:"ESP",sf:"grass",lv:"CH75",pr:6000,pt:18,mr:380,tc:2600,rd:5},
{w:27,m:"JUL",n:"ITF C. do Jordão",ci:"C. do Jordão",co:"BRA",sf:"clay",lv:"ITF15",pr:800,pt:3,mr:9999,tc:200,rd:5},
{w:27,m:"JUL",n:"CH Tampere",ci:"Tampere",co:"GER",sf:"clay",lv:"CH50",pr:4000,pt:12,mr:500,tc:2700,rd:5},
{w:30,m:"JUL",n:"ITF Lexington",ci:"Lexington",co:"USA",sf:"hard",lv:"ITF25",pr:1500,pt:5,mr:9999,tc:2200,rd:5},
{w:30,m:"JUL",n:"CH Braunschweig",ci:"Braunschweig",co:"GER",sf:"clay",lv:"CH75",pr:6000,pt:18,mr:380,tc:2700,rd:5},
{w:33,m:"AGO",n:"ITF Goiânia",ci:"Goiânia",co:"BRA",sf:"clay",lv:"ITF15",pr:800,pt:3,mr:9999,tc:250,rd:5},
{w:33,m:"AGO",n:"CH Barletta",ci:"Barletta",co:"ITA",sf:"clay",lv:"CH50",pr:4000,pt:12,mr:500,tc:2700,rd:5},
{w:35,m:"SET",n:"ITF Maringá",ci:"Maringá",co:"BRA",sf:"clay",lv:"ITF25",pr:1500,pt:5,mr:9999,tc:150,rd:5},
{w:35,m:"SET",n:"CH Genova",ci:"Genova",co:"ITA",sf:"clay",lv:"CH75",pr:6000,pt:18,mr:380,tc:2700,rd:5},
{w:36,m:"SET",n:"ITF Florianópolis II",ci:"Florianópolis",co:"BRA",sf:"clay",lv:"ITF15",pr:800,pt:3,mr:9999,tc:250,rd:5},
{w:36,m:"SET",n:"CH Ismaning",ci:"Ismaning",co:"GER",sf:"hard",lv:"CH100",pr:8000,pt:25,mr:350,tc:2700,rd:5},
{w:38,m:"OUT",n:"ITF Buenos Aires II",ci:"Buenos Aires",co:"ARG",sf:"clay",lv:"ITF15",pr:800,pt:3,mr:9999,tc:800,rd:5},
{w:38,m:"OUT",n:"CH Tiburon",ci:"Tiburon",co:"USA",sf:"hard",lv:"CH75",pr:6000,pt:18,mr:380,tc:2200,rd:5},
{w:40,m:"OUT",n:"ITF M. das Cruzes",ci:"M. das Cruzes",co:"BRA",sf:"clay",lv:"ITF25",pr:1500,pt:5,mr:9999,tc:100,rd:5},
{w:40,m:"OUT",n:"CH Rennes",ci:"Rennes",co:"FRA",sf:"hard",lv:"CH100",pr:8000,pt:25,mr:350,tc:2600,rd:5},
{w:43,m:"NOV",n:"ITF Curitiba II",ci:"Curitiba",co:"BRA",sf:"clay",lv:"ITF15",pr:800,pt:3,mr:9999,tc:200,rd:5},
{w:43,m:"NOV",n:"CH Yokohama",ci:"Yokohama",co:"JPN",sf:"hard",lv:"CH50",pr:4000,pt:12,mr:500,tc:3500,rd:5},
];

const ROUND_NAMES = {
5:["1a Rodada","2a Rodada","3a Rodada","Semi","Final"],
6:["1a Rodada","2a Rodada","3a Rodada","4a Rodada","Semi","Final"],
7:["1a Rodada","2a Rodada","3a Rodada","4a Rodada","5a Rodada","Semi","Final"]
};

const PTS_TABLE = {
GS:    [10,50,100,200,400,800,2000],
M1000: [10,25,50,100,200,400,1000],
ATP500:[0,25,50,100,200,500],
ATP250:[0,13,25,50,100,250],
CH175: [0,6,12,25,50,175],
CH100: [0,4,8,18,40,100],
CH75:  [0,3,6,12,30,75],
CH50:  [0,2,4,8,20,50],
ITF25: [0,0,1,3,8,25],
ITF15: [0,0,1,2,5,15],
Finals:[200,200,200,400,500],
};

const PRIZE_TABLE = {
7:[0,0.005,0.01,0.025,0.05,0.12,1],
6:[0,0.01,0.025,0.06,0.15,1],
5:[0,0.02,0.05,0.12,1],
4:[0,0.05,0.12,1],
};

function getRN(rd){return(ROUND_NAMES[rd]||ROUND_NAMES[5])}
function getPts(lv,rd,ri){const t=PTS_TABLE[lv]||PTS_TABLE["CH50"];return t[Math.min(ri,t.length-1)]||0}
function getPrize(total,rd,ri){const t=PRIZE_TABLE[rd]||PRIZE_TABLE[5];return Math.floor(total*(t[Math.min(ri,t.length-1)]||0))}
function getOppRange(lv,ri,rd){
// ri = round index (0=1R), rd = total rounds
// Later rounds have stronger opponents (seeds advance)
const deep=rd>1?ri/(rd-1):0;
// Each tournament level has a realistic rank range for its draw
if(lv==="GS"||lv==="Finals")return[Math.max(1,~~(30-deep*28)),Math.max(5,~~(105-deep*95))];
if(lv==="M1000")return[Math.max(1,~~(30-deep*25)),Math.max(10,~~(60-deep*45))];
if(lv==="ATP500")return[Math.max(5,~~(40-deep*30)),Math.max(20,~~(80-deep*50))];
if(lv==="ATP250")return[Math.max(30,~~(80-deep*40)),Math.max(50,~~(120-deep*60))];
if(lv==="CH175")return[Math.max(80,~~(200-deep*80)),Math.max(120,~~(300-deep*120))];
if(lv==="CH100")return[Math.max(120,~~(250-deep*80)),Math.max(180,~~(350-deep*100))];
if(lv==="CH75")return[Math.max(180,~~(350-deep*100)),Math.max(250,~~(450-deep*120))];
if(lv==="CH50")return[Math.max(250,~~(400-deep*80)),Math.max(350,~~(550-deep*100))];
if(lv==="ITF25")return[Math.max(300,~~(420-deep*60)),Math.max(380,~~(500-deep*60))];
return[Math.max(350,~~(450-deep*50)),Math.max(400,~~(500-deep*30))]; // ITF15
}

const LC={ITF15:"#777",ITF25:"#999",CH50:"#8b6914",CH75:"#a07d1a",CH100:"#b8931f",CH175:"#d4a824",ATP250:"#2d6bc4",ATP500:"#c4612d",M1000:"#8b2252",GS:"#ffd700",Finals:"#c084fc"};
const LL={ITF15:"ITF $15K",ITF25:"ITF $25K",CH50:"CH 50",CH75:"CH 75",CH100:"CH 100",CH175:"CH 175",ATP250:"Pro 250",ATP500:"Pro 500",M1000:"Masters 1000",GS:"Grand Slam",Finals:"Tour Finals"};
const SC={hard:"#2d6bc4",clay:"#c4612d",grass:"#2d8c3c"};
const SN={hard:"Dura",clay:"Saibro",grass:"Grama"};
const CF={BRA:"\u{1F1E7}\u{1F1F7}",ARG:"\u{1F1E6}\u{1F1F7}",ESP:"\u{1F1EA}\u{1F1F8}",USA:"\u{1F1FA}\u{1F1F8}",FRA:"\u{1F1EB}\u{1F1F7}",ITA:"\u{1F1EE}\u{1F1F9}",AUS:"\u{1F1E6}\u{1F1FA}",GBR:"\u{1F1EC}\u{1F1E7}",GER:"\u{1F1E9}\u{1F1EA}",JPN:"\u{1F1EF}\u{1F1F5}",CHN:"\u{1F1E8}\u{1F1F3}",CAN:"\u{1F1E8}\u{1F1E6}",MEX:"\u{1F1F2}\u{1F1FD}",CHI:"\u{1F1E8}\u{1F1F1}",COL:"\u{1F1E8}\u{1F1F4}",PER:"\u{1F1F5}\u{1F1EA}",MON:"\u{1F1F2}\u{1F1E8}",NED:"\u{1F1F3}\u{1F1F1}",SUI:"\u{1F1E8}\u{1F1ED}",AUT:"\u{1F1E6}\u{1F1F9}",TUR:"\u{1F1F9}\u{1F1F7}",TUN:"\u{1F1F9}\u{1F1F3}",URU:"\u{1F1FA}\u{1F1FE}"};

const CLOTHING_BRANDS = [{id:"striker",name:"Striker",color:"#111"},{id:"apex",name:"Apex Sport",color:"#0057b8"},{id:"verde",name:"Verde Athletic",color:"#007847"},{id:"rossa",name:"Rossa",color:"#c8102e"},{id:"ironfit",name:"IronFit",color:"#1d1d1d"}];
const RACKET_BRANDS = [{id:"prohit",name:"ProHit",color:"#FFD700"},{id:"redline",name:"RedLine",color:"#e4002b"},{id:"greentech",name:"GreenTech",color:"#00a651"},{id:"bluecore",name:"BlueCore",color:"#0066cc"},{id:"royale",name:"Royale",color:"#9b59b6"}];
const SPONSORS=[
{id:"leader",name:"Casa das Raquetes",pay:200,bonus:0,mr:9999,desc:"Loja local de tênis"},
{id:"sportbr",name:"SportBR",pay:400,bonus:2,mr:250,desc:"Marca esportiva brasileira"},
{id:"lokus",name:"Lokus Energy",pay:800,bonus:3,mr:200,desc:"Bebida energética"},
{id:"proswing",name:"ProSwing",pay:1500,bonus:5,mr:150,desc:"Equipamentos premium"},
{id:"airjet",name:"AirJet Athletic",pay:3000,bonus:7,mr:100,desc:"Marca global de performance"},
{id:"titanium",name:"Titanium Gear",pay:6000,bonus:10,mr:50,desc:"Patrocinador de elite"},
{id:"apex",name:"Apex Athletics",pay:12000,bonus:12,mr:20,desc:"Top de linha mundial"},
{id:"grandslam",name:"GrandSlam Co.",pay:25000,bonus:15,mr:8,desc:"O maior do mercado"},
];

const RACKETS=[
{id:"starter",name:"Starter 100",ovr:2,price:0},
{id:"allcourt",name:"AllCourt Pro",ovr:4,price:800},
{id:"thunder",name:"Thunder Strike",ovr:6,price:4000},
{id:"precision",name:"Precision X",ovr:8,price:10000},
{id:"elite",name:"Elite Balance",ovr:11,price:25000},
{id:"legend",name:"Legend Pro 97",ovr:14,price:60000},
];

const SHOES=[
{id:"basic",name:"Tênis Básico",ovr:0,surfBonus:null,price:0},
{id:"clay_pro",name:"Clay Grip",ovr:1,surfBonus:"clay",price:800,desc:"+1 OVR, Saibro +5"},
{id:"hard_pro",name:"Hard Court",ovr:1,surfBonus:"hard",price:800,desc:"+1 OVR, Dura +5"},
{id:"grass_pro",name:"Grass Sprint",ovr:1,surfBonus:"grass",price:800,desc:"+1 OVR, Grama +5"},
{id:"clay_elite",name:"Clay Grip Elite",ovr:3,surfBonus:"clay",price:5000,desc:"+3 OVR, Saibro +5"},
{id:"hard_elite",name:"Hard Court Elite",ovr:3,surfBonus:"hard",price:5000,desc:"+3 OVR, Dura +5"},
{id:"grass_elite",name:"Grass Sprint Elite",ovr:3,surfBonus:"grass",price:5000,desc:"+3 OVR, Grama +5"},
{id:"allsurf",name:"All-Surface Pro",ovr:5,surfBonus:null,price:15000,desc:"+5 OVR, qualquer piso"},
{id:"champion",name:"Champion Gold",ovr:8,surfBonus:null,price:40000,desc:"+8 OVR, qualquer piso"},
];

const TRAINERS=[
{id:"none",name:"Sem preparador",ovr:0,price:0,salary:0},
{id:"junior",name:"Prep. Físico Junior",ovr:3,price:3000,salary:0,desc:"Condicionamento básico"},
{id:"senior",name:"Prep. Físico Senior",ovr:6,price:12000,salary:0,desc:"Treino avançado"},
{id:"elite_tr",name:"Prep. de Elite",ovr:10,price:35000,salary:0,desc:"Nível Pro Tour"},
];

const COURTS=[
{id:"none",name:"Sem quadra",ovr:0,price:0},
{id:"basic_court",name:"Quadra Comunitária",ovr:2,price:5000,desc:"Treino regular"},
{id:"pro_court",name:"Quadra Profissional",ovr:5,price:20000,desc:"Piso oficial"},
{id:"academy",name:"Academia Completa",ovr:8,price:50000,desc:"Centro de treinamento"},
];

const CONSUMABLES=[
{id:"isotonic",name:"Isotônico",price:150,desc:"+20 energia, +5 moral",icon:"\u{1F964}",effect:"revit",energy:20,moral:5},
{id:"tea",name:"Chá Revitalizante",price:250,desc:"+30 energia, +8 moral",icon:"\u{1F375}",effect:"revit",energy:30,moral:8},
{id:"energydrink",name:"Energético Pro",price:400,desc:"+50 energia, +5 moral",icon:"\u26A1",effect:"revit",energy:50,moral:5},
{id:"physio",name:"Sessão de Fisioterapia",price:600,desc:"+60 energia, +10 moral",icon:"\u{1F486}",effect:"revit",energy:60,moral:10},
{id:"spa",name:"Day Spa Completo",price:1000,desc:"Energia 100%, +15 moral",icon:"\u{1F9D6}",effect:"revit",energy:100,moral:15},
];

const MATCH_EVENTS=[
{text:"Torcida brasileira te apoiou!",effect:2,icon:"\u{1F1E7}\u{1F1F7}",chance:0.12},
{text:"Câimbra no intervalo!",effect:-3,icon:"\u{1F4A2}",chance:0.08},
{text:"Chuva atrasou a partida.",effect:1,icon:"\u{1F327}\uFE0F",chance:0.10},
{text:"Público vibrando com você!",effect:2,icon:"\u{1F3C6}",chance:0.10},
{text:"Calor intenso na quadra.",effect:-2,icon:"\u{1F525}",chance:0.08},
{text:"Rival discutiu com o juiz!",effect:1,icon:"\u{1F624}",chance:0.06},
{text:"Você achou seu ritmo!",effect:3,icon:"\u26A1",chance:0.07},
{text:"Dor no ombro incomoda.",effect:-2,icon:"\u{1F915}",chance:0.06},
];

const ACHIEVEMENTS=[
{id:"top400",name:"Promessa",desc:"Chegar ao Top 400",icon:"\u{1F31F}",check:p=>p.rank<=400,reward:"$500",tier:"Bronze",tierColor:"#CD7F32"},
{id:"top300",name:"Profissional",desc:"Chegar ao Top 300",icon:"\u{1F3C5}",check:p=>p.rank<=300,reward:"$1.000",tier:"Prata",tierColor:"#C0C0C0"},
{id:"top200",name:"Competidor",desc:"Chegar ao Top 200",icon:"\u{1F947}",check:p=>p.rank<=200,reward:"$2.500",tier:"Ouro",tierColor:"#FFD700"},
{id:"top100",name:"Elite",desc:"Entrar no Top 100",icon:"\u{1F3C6}",check:p=>p.rank<=100,reward:"$5.000",tier:"Platina",tierColor:"#E5E4E2"},
{id:"top50",name:"Estrela",desc:"Entrar no Top 50",icon:"\u2B50",check:p=>p.rank<=50,reward:"$10.000",tier:"Diamante",tierColor:"#B9F2FF"},
{id:"top20",name:"Craque",desc:"Entrar no Top 20",icon:"\u{1F48E}",check:p=>p.rank<=20,reward:"$25.000",tier:"Mestre",tierColor:"#FF6B6B"},
{id:"top10",name:"Lenda",desc:"Entrar no Top 10",icon:"\u{1F451}",check:p=>p.rank<=10,reward:"$50.000",tier:"Lenda",tierColor:"#A855F7"},
{id:"num1",name:"Número 1",desc:"Ser o #1 do mundo",icon:"\u{1F30D}",check:p=>p.rank===1,reward:"$100.000",tier:"GOAT",tierColor:"#FF4500"},
{id:"title1",name:"Primeiro Título",desc:"Ganhar seu primeiro torneio",icon:"\u{1F3BE}",check:p=>p.titles>=1,reward:"$1.000"},
{id:"title5",name:"Multicampeão",desc:"Ganhar 5 torneios",icon:"\u{1F3BE}\u{1F3BE}",check:p=>p.titles>=5,reward:"$5.000"},
{id:"title10",name:"Máquina de Títulos",desc:"Ganhar 10 torneios",icon:"\u{1F525}",check:p=>p.titles>=10,reward:"$10.000"},
{id:"gs1",name:"Grand Slam",desc:"Vencer um Grand Slam",icon:"\u{1F3C6}\u2B50",check:p=>p.gs>=1,reward:"$20.000"},
{id:"gs4",name:"Career Grand Slam",desc:"Vencer os 4 Grand Slams",icon:"\u{1F451}\u{1F3C6}",check:p=>p.gs>=4,reward:"$100.000"},
{id:"money50k",name:"Rico",desc:"Acumular $50.000",icon:"\u{1F4B0}",check:p=>p.money>=50000,reward:"+3 OVR"},
{id:"win10",name:"Sequência",desc:"10 vitórias na temporada",icon:"\u{1F4AA}",check:p=>p.sW>=10,reward:"$2.000"},
];

const EVT=[
{t:"Treino forte com sparring!",e:"ovr",v:1,em:"\u{1F4AA}"},{t:"Lesao no pulso.",e:"ovr",v:-3,em:"\u{1F915}"},
{t:"Sessao com coach lendario!",e:"ovr",v:2,em:"\u{1F3AF}"},{t:"Pressao da midia!",e:"ovr",v:-1,em:"\u{1F4FA}"},
{t:"Fas te apoiaram!",e:"ovr",v:1,em:"\u{1F1E7}\u{1F1F7}"},{t:"Treino especifico de saque!",e:"ovr",v:1,em:"\u{1F3C6}"},
{t:"Chuva cancelou treinos.",e:"ovr",v:-1,em:"\u{1F327}"},{t:"Novo grip na raquete!",e:"ovr",v:1,em:"\u{1F3BE}"},
{t:"Contusao no tornozelo.",e:"ovr",v:-4,em:"\u{1F3E5}"},{t:"Retiro de yoga e foco!",e:"ovr",v:2,em:"\u{1F9D8}"},
{t:"Descanso na praia!",e:"ovr",v:1,em:"\u{1F3D6}"},
];

const MARCOS_HUB=["Bora pra mais uma!","Foco total hoje.","Vamos buscar essa vitória.","Confiança é tudo.","Hoje é dia de jogar bem.","Cabeça fria, coração quente.","Você está pronto.","Mais uma batalha nos espera.","Vamos com tudo!","Esse torneio é nosso."];
const MARCOS_BREAK=["BREAK! Era isso que eu queria!","Quebrou o saque dele! Vamos!","BREAK! Agora segura!"];
const MARCOS_BROKEN=["Perdeu o saque… calma!","Ele quebrou, mas vamos reagir!","Foco no próximo game!"];
const MARCOS_SET_WIN=["Set pra nos! Bora fechar!","Grande set! Continue assim!"];
const MARCOS_SET_LOSE=["Perdeu o set, mas o jogo é longo!","Esquece esse set. O próximo é nosso!"];
const MARCOS_WIN=["Isso! Continue assim!","Muito bem! Foco!","É assim que se joga!","Você está crescendo!","Boa! Não para!","Ótimo game!","Mandou bem!","Esse ponto foi lindo!","Tá jogando demais!","Vamos, vamos!"];
const MARCOS_LOSE=["Calma, ainda dá!","Segura o mental!","Respira fundo!","Foco no próximo game!","Não desanima!","Ele está jogando bem, mas você também sabe!","Cabeça no lugar!","Próximo ponto é nosso!","Concentra!"];
const MARCOS_TOURNEY_WIN=["Título merecido! Você jogou demais!","Campeão! Eu sabia que você conseguia!","Isso é só o começo. Vamos buscar mais!","Que campanha! Orgulho de ser seu treinador.","Viu? O trabalho duro compensa!","Troféu na mão! Agora vamos pro próximo."];
const MARCOS_EASTER_EGGS=["Sabia que muitos campeões começaram perdendo em ITFs?","Já houve campeões que ninguém acreditava. Pode ser você!","Muitos lendas perderam nas primeiras rodadas por anos antes de dominar.","Grandes campeões foram rejeitados em academias quando crianças.","Alguns campeões treinaram em condições precárias antes de chegar ao topo.","O tênis é 90% mental. Os outros 10% também são mentais."];
const MARCOS_TOURNEY_LOSE=["Cabeça erguida. A próxima oportunidade vem.","Faz parte. Cada derrota te deixa mais forte.","Não foi dessa vez, mas você evoluiu.","O importante é continuar trabalhando.","Descanso e foco. O próximo torneio é nosso.","Perdeu a batalha, não a guerra."];

const RALLY_CMT=["Rally longo!","Troca de bolas!","Bola curta!","Subiu na rede!","Passada de forehand!","Backhand paralelo!","Voleio!","Slice baixo…","Bola profunda!","Angulo fechado!"];

const RIVAL_NAMES={
BRA:{fn:["Thiago","Lucas","Gabriel","Rafael","Pedro","Bruno","Gustavo","Felipe","Leonardo","Eduardo","Mateus","Joao","Diego","Andre","Caio","Vitor","Henrique","Marcelo","Ricardo","Fernando"],ln:["Silva","Santos","Oliveira","Costa","Ferreira","Almeida","Ribeiro","Gomes","Rocha","Lima","Monteiro","Monteiro","Fonseca","Vidal","Prado","Souza","Pereira","Carvalho","Barbosa","Martins"],w:18},
ARG:{fn:["Juan","Martin","Diego","Federico","Sebastian","Tomas","Francisco","Horacio","Guillermo","Nicolas","Mariano","Facundo","Santiago","Agustin","Pablo"],ln:["Acosta","Suarez","Medina","Romero","Castro","Aguirre","Valenzuela","Echeverria","Navarro","Acevedo","Cabrera","Lucero","Gimenez","Delgado","Peña"],w:12},
ESP:{fn:["Carlos","Rafael","Pablo","Alejandro","Pedro","Roberto","Albert","Jaume","Daniel","Bernabe","Mario","David","Fernando","Feliciano","Marcel"],ln:["Alcaide","Navarro","Romero","Herrera","Castro","Salinas","Tablada","Dominguez","Molina","Iglesias","Romero","Reyes","Vargas","Velasco","Ferrero"],w:12},
ITA:{fn:["Jannik","Lorenzo","Matteo","Flavio","Luca","Marco","Fabio","Andrea","Giovanni","Luciano","Stefano","Alessandro","Simone","Filippo","Paolo"],ln:["Santini","Moretti","Benedetti","Colombo","Neri","Andretti","Soprano","Fontana","Perrone","Lombardi","Rinaldi","Bianchi","Gallo","Pagano","Vitale"],w:12},
FRA:{fn:["Ugo","Gael","Arthur","Corentin","Adrian","Richard","Alexandre","Hugo","Lucas","Benoit","Jeremy","Quentin","Giovanni","Antoine","Gregoire"],ln:["Hubert","Montfort","Perrin","Chevalier","Laurent","Garnier","Fontaine","Rousseau","Bernard","Paré","Moreau","Dubois","Lefevre","Garnier","Mercier"],w:10},
USA:{fn:["Taylor","Ben","Frances","Tommy","Brandon","Sebastian","Reilly","Christopher","Jenson","Marcos","Michael","John","Mackenzie","Stefan","Maxime"],ln:["Foster","Sherman","Thomas","Bennett","Foster","Kendall","Osborne","Griffin","Brooks","Torres","Carter","Irving","Bishop","Reed","Crawford"],w:10},
GER:{fn:["Alexander","Jan-Lennard","Dominik","Oscar","Daniel","Maximilian","Yannick","Peter","Henri","Mischa","Philipp","Dustin","Cedrik","Rudolf","Marvin"],ln:["Zimmerman","Weber","Kessler","Braun","Schwarz","Kaiser","Vogel","Falk","Krause","Neumann","Engel","Hartmann","Pfeiffer","Lange","Scholz"],w:8},
GBR:{fn:["Jack","Daniel","Cameron","Andy","Kyle","Liam","Ryan","Jay","Bennett","Aidan","Jan","Billy","Arthur","Charles","George"],ln:["Drake","Fletcher","Barker","Morgan","Edwards","Ashford","Blackwell","Preston","Ashford","Crawford","Langley","Weston","Thornton","Clifford","Bancroft"],w:6},
AUS:{fn:["Alex","Thanasi","Jordan","Nick","Alexei","Max","Rinky","James","Chris","John","Jason","Bernard","Matthew","Luke","Dane"],ln:["Gallagher","Kellerman","Crawford","Keating","Porter","Donovan","Cassidy","Whelan","Keating","Byrne","Doyle","Torres","Barrett","Connolly","Henley"],w:6},
JPN:{fn:["Kei","Yoshihito","Taro","Daniel","Shintaro","Yosuke","Kaichi","Sho","Hiroki","Ben","Go","Yasutaka","Yuichi","Renta","Yuta"],ln:["Nakamura","Nakata","Nakamura","Morita","Suzuki","Sato","Ito","Watanabe","Kimura","Hayashi","Matsuda","Inoue","Kato","Yoshida","Ogawa"],w:4},
SUI:{fn:["Stan","Roger","Dominic","Marc","Henri","Luca","Sandro","Remy","Antoine","Jerome","Leandro","Kilian","Jakub","Cedric","Alexander"],ln:["Wagner","Fischer","Steiner","Gerber","Wyss","Huber","Steiner","Frey","Roth","Baumann","Bennett","Meier","Schmid","Maurer","Moser"],w:4},
CHI:{fn:["Cristian","Nicolas","Alejandro","Gonzalo","Tomas","Christian","Marcelo","Jorge","Hans","Ricardo","Felipe","Bastian","Julio","Matias","Rodrigo"],ln:["Garcia","Jara","Tablada","Reyes","Mendoza","Cifuentes","Valenzuela","Figueroa","Saavedra","Bravo","Saavedra","Contreras","Navarro","Araya","Medina"],w:4},
};

function genRivals(n){const r=[],u=new Set();
const countries=Object.keys(RIVAL_NAMES);
const weights=countries.map(co=>RIVAL_NAMES[co].w);
const totalW=weights.reduce((a,b)=>a+b,0);
const pickCountry=()=>{let rnd=Math.random()*totalW;for(let i=0;i<countries.length;i++){rnd-=weights[i];if(rnd<=0)return countries[i]}return countries[0]};
for(let i=0;i<n;i++){let nm,co;
do{co=pickCountry();const pool=RIVAL_NAMES[co];const fn=pool.fn[~~(Math.random()*pool.fn.length)];const ln=pool.ln[~~(Math.random()*pool.ln.length)];nm=fn+" "+ln}while(u.has(nm));u.add(nm);
let p;
if(i<3)p=9000+~~(Math.random()*3000);
else if(i<10)p=5000+~~(Math.random()*3000);
else if(i<20)p=3000+~~(Math.random()*2000);
else if(i<50)p=1500+~~(Math.random()*1500);
else if(i<100)p=700+~~(Math.random()*800);
else if(i<150)p=350+~~(Math.random()*350);
else if(i<200)p=180+~~(Math.random()*170);
else if(i<300)p=60+~~(Math.random()*120);
else if(i<400)p=20+~~(Math.random()*40);
else p=5+~~(Math.random()*15);
const baseSkill=Math.max(55,97-i*0.08);const variance=(Math.random()*6-3);
r.push({name:nm,rank:i+1,skill:Math.round(Math.max(52,Math.min(99,baseSkill+variance))),points:p,country:co,headToHead:{w:0,l:0}})}return r}

const YELLOW="#E8A87C";
const MARCOS_IMG="data:image/png;base64,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";

const PLAYER_IMG="data:image/png;base64,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";
const PLAYER_SM="data:image/png;base64,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";
const PLAYER_TN="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAoCAYAAADt5povAAADsElEQVR42u2Wf0zUdRjHX9/74V3HwXnHQYBwifw6kR9ygPz4g2JlOStgzR9TNGE1XTOd4bLZ1mq11UqjNTatjZUtJJdrVltY2A/LP7RQxJZgDBAVYhLJrzuPO+54+u8c+UcQd6w/eP/13ffzfZ733s/n/TzfBxawgPlCsjlS/kucarYBKZFxAvCgI23+1Plvd4rP0y8FNpvsWl0sGVFLJLTltMSLPcokh+rel6bjn4SWbG3qMrlxeJuUJUVJf93WWZMpsw2YOFglfRonthUpeFp6MebFojxcq4RUZe/La2T4ixp5szBB5sU0O3NS5Wh5pvh+2B/akpZv3C9FRSup9B8jzh7NBeM6LNZoYq1awu5NV4JO2PLj12IOU2G2mPD7PBiNRkbHnJitEVxs66XooQolaI1/4niDtHXcBBUsWqQQFmZEUPjgqz9oa79FSsrS4E6aRNtSxjxaUPToFunQ6TV09U+y5bHl/D4wiUan4Zcz30jQCJt3b+K37lu43cOMDDtxu5ykLdHgGu7jtVfeYOKzl7h5aG/wFC6PCccWY8GvtmKx6JlSGfBN+bnQMUJXx2lFF2akZHXWv+bRzJQwe1UszX+5uNTez+CQkaRYLT//OsD4qBsAUQmmqkYlKISZRp0YFi9Gc1vN4yVxTEwqmExGPG1DWK2gvq9cEl4PYqNfO1AmG9LipfHDj+Va60l5+63DUrl5p4xdPSsAQ8d2zHgAzEihwTDF9cg8ega95ImW1LRESgsTiEgsUoqLCkTvdgV3lH1XnS/pGkVychzTlGRlZ4dmlibn1wQSJyXbA8+ZWTnicORK+oqVMyaeUVusP18LgMORL2ZzBADLkuyi1+tQFBXtl9uUoBFu0eqkSaUHoLW1RfF6PAD0dF9RXE4XXt9k8JaoTevWy8iajVzyTygA3a+WSvP2RLbH6wSgOnaCM89n0lSVMfe7fGrbDsnNLRGAmr37xLs1XwAu7imWU7seCBCce7ZU3A1Pzo3wdM2dvnpuzwsC0L+2QB6xhstI/Qb5s64icN61735xNVYHx621B98Vuz1vWrKBA49KZbQSePfl0/kyfmTz3Fz6REWlAMTExHOPXj3tzOv1cXRQAq4sq29R3GPjczPNMz3nAfj+p7Oo3c47P+ETn0q8Peau7yOirKFZnj5veE9SCnffVb7rl8+J2pwrQWv8zpZTMnjlpJhVI7xYnUXjR0cCydNtcXL1Rh/fvrMqNIvwP6ENLxSDCTBkMNpZH9qFeAH/C/wNUXhhf8W6lG4AAAAASUVORK5CYII=";
const MARCOS_SM="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAOvklEQVR42u2Ze3Qc5XnGn/ebmb3fd7W7klZ32Ui+XzHY2AZKsGMHE3ANLsSBUxIICSkkJbSH9BTBaSkpIaeUlKRpAgkJIRCcUqDUKWCMwTfZxrYs3627VlqtVqu9X2e+t3/Q9vSfngJWcXpOn//n+97fPM/7zTszwKegrq6vOvB/TZ2NbfoTf3ofA8DU4D6eFW4p/2/so87EIlu2bFFqBFf7hqN/N7ul4WtSl+R22ZHNF/iem7bwsYM9CIc8uSe/+7Q0mPTrtt1tmikA5UIXuPPOO7V9b+2qWlSNHDbLpVtuuJosFhOv+9xa2vPuITrScxJ79x3j69ZfYWVD0qkTp5VctvTnY4nEIxfdgeZgXWnH9le1FYvnobOtEYDBHQvaaPmaS6n3yGk0tUSQmEyjVCxSc2MYUkrcdOtGBHweUX5ejx/vPxe8UAC60AXmNDTx3bdv4cUrOvmN37xFFouNhcKita0Jr7zyDtpbIli9diGy0yVev/kq9Bw+AbfPK9/fdZDufujxC06A+KQXXrV0mbFq3ny5YskCzFvYSmZVoa/cu43yVUM8+8IOvPnWQSTTaZSrFd6z+whvuHU9vfTsq5iMJenw/h4lGk2IJbPmyIsGEK5zhD6/8Sp0tkXwxHd/DiklFfMl9J05jbVzI7y+JsUPLSUUUynavHUDHr7/e2hqj/DSVYuxb38Pug/3wmoxUVdXl/jUm3jZ3PnSImwPTMYmcf2NV9PBAyfg8zhZQ5lWF47y5uUeXHrNbIq0h/jaJR4arfjROb8d508NUff+HgrUeFlAoaOnzyKfLD3dN9KX/1QdGB2N4dXdu8jlcuDMqWE5d14bDv92B+186XWEAg7ScznoVR1KwAeT383LPefohw8/TqOxSZqeTiEY8lHZKPJli+dDGPmJTz1CsfSkaPDXGnuO9JBq1sT4ocN49Pfr5Tc3eDmyfBZqVy6ErDK+tO1Z+rMHtkNoOj/znXWo8TghFBNe+uUOfGbdVVTVDY4nUsWL0gN1DbViMpXFy9t34NZ5qrHiwV3ijr98l2DSeN8rB3Hrt3bgltURrFsYApJpIqHCOryfF85rgVufAr39HN/11a00nZm2XBSAA0c/ILOqyt5zfdwTzSqZqsS/RjP40ffewqpb1uK5rrVo2faHcvuhEdKtTlQmE3LzZ1qoXMwigAI2bpqLRx76Phqaao9d1OfAmksXtBQGRvt/c89CNFw9j/f8Yjetuu2zYF2ynk2RMZ2HFg4BVjOUYhED5Xo8+o3HAQV4N6XJc+NR5aI48B/a3d0zELSp3HDFAsiqiZrnNEM6wwxIUt1OWFojrFg1KAyumN3y5IkhfuJP1vCgEuILLX5GAADgjaG4qMQnZKr3NDiTQ/bg+9jz8zeBUCOm9h0GvB7EEkwH+zXa2T1Ii+9/h4TZTDOxt4IZUrOOrjmz/PyTvhoynA1sNC7A+YESXnztABX7EzhaCKLG76bdB3oQm86jP55IF0qFxy76LPRf9c2bN0l//ATdfsN8rlsyi5jIIILy2u4C5l6+jH/87Ov07TWE2fe/Vx1LxmZkpBYzCXB8JAmatZyH3YtwuM8OmOwKS7Pce2oCL25/n7a6hxkmFXlNaDZnQP+dA3hz7/viXCxDzkgzkgWd45UAfrarKF549R1ckepGw+xaqDYzuFBB06bOGYnvjEYIAGz+Gr0yncbN16xRQjU+Hjy0h7rW13PrvAjZWiMY33sCl/7wLKvLIzSx62yllJoy/844YPOGC7a2oCCzWVTO90I9tYe+vMAlO9ctIWHTYBSLciieQ9PWTljsKv/ji0+Z0HVhNcwYgNnt192L6yyleJ5Il3TNbDcW1tlx7W0rhaooIEXFr176QDxg9WJsME11LR564Y2dCO9cZHgumc2uQLD3okRIdfmltcZB1nqXrLmkRozsHcGDbh0NATNcZhWXrahj1WIm0gxee7RExaKOhiYXntzyday9449RvyiIfKYMEJAdSCO+r/dj1fSJ3omtbl9OC3jswqlB1VSkTo+iPD4lZq1qxUhR5845DlhNTB0dNfC21/PKp08SdzrJZtPYW2Oj7pP9vOaL95F3tg++oA3eoA2SJXIBG5SglUNhJziKyLHXd0Zn3AGLJ2Q4OoOCmCDZAJFA5mQUECqESqxYQefuXcSB1hAUzUK1f92N7KlxyHIZ0BVcds8qlBI60kYe4SYHGAyw4PGRDDW1ehAdyjEUnXLjVQy/vo9mvAe8y+qpMlWEIRiKTeNgZ4AtzQGYfDaQVSPhsGPug3uoNJmkWX9/DPmhaZhq3WCDoda5cfDFDzA4HEM4YmU2GKVClft7JsnpNXF0JI3Zi0KoCTnY32KFPdLIMzpKWINBVqwWIrMC0g342gMEMDvrHeSod3F+ooDIijrK5hjXa0X+UV8JDSsjNPb2GW7Y2ElsUXjeujbyRxwQQtDoUJrNJo0CERtnEmVavLwFseg0aWYVFotCeSjIno0+PCMOqDYXq24HpJTQ8xUY0gAJAwwSYAKDqNg/QSQEnB0BXJ+wcnBugPpf7kVkw1zy1jkwa2ktERMgGboh4Q3aaeBAFGe64xQI2ZHNZAEBkASVClW4/CaQyZGcmQgJBeawB5VCFSTAvo4aZlZAgsAsQArBEvJytWhw9myC/WEXeZwW2Fv8qG3zwGrVQAqB/73zSsUq0pNFqG4zqCpRqRooFHXYbSrHYnmMDGRQ3+iGZ07EOyOnkKKpgGDIZAFq2E7Z0Rx8LW5IQ0ARBJYEw5CkWAW8c4PIp4sYPDqO9vXtTAoIQoDAYGIwCJPRPCcPT5C1wQF/mxfx0QxiMsNGRdLClbXIh8w425uAr92H6aMX6IBm97LJ74Qez0FWy7AGHbB4LZD84R1lycxCwtkRRDVVhVAVDP/2HNrXtUHVJAACMUMygyEQH8milKkQuAKjJDHWPQZBAi6/hVghpJIlEANtcwOABjgiDfKCAEwRP4y8zoVoEhAaFKsJUjITAQokmCWxBLsjLjx58wNI7OpD7VWtEApBSkEghvxPUglSBUKtbmlp9CFzfARQBKejWUyNZDgctvHEeA66zug/l2Cn3wZbi48+MUBg6TxGrsRkBik+J0gAueFpAETZyQIMZskkICUwtneIrYe3MWqcrDg0gPBhf4MkEQMsQCDUhB2cnioKWdYhTCqobJBQADaI4mMF1DW6YRiMjgW1GOiNo2yVcDQ28ScC+IPPXg1LxEPeSwJApYJqOg8WKoxylYWJkE+URSlbQiaapfybl9PqR35FP738HFRFID9dgsJMAITBxJJBU7ECWDIEBCQDiqKgMDKJar6K0lgGuqxi8GQCv/7aw3j88/eQTVdhF3Z0/c0ffXwHrrzySvXHz7yML21az8KsQSEFwmICpIFCskAwiIVFwOIwQe2PSWPyOHr/6gb++tsNiLT4UdUZlQqDJUCSiYiYQBjrS1M2lmVnyMVMAjqBi9EMW2qd+NbnbmQ3ubBh462ofv9b2LfWih3NJf7pVx79+ABTx45Ud1wbwg+eep46HLUopaZQSSVhJHJQzSoXJ3JgZpQLFQSoQqjZgt97xk+2lY0YPj8pASCbKUkSDNaAeDRPhVwFlYoOzWai1ECa1IAVGmlcSaboC8vX4LGuH9DztVN44+YmNM2JsGI1oXPj5fTSbbM/3ix0+5XNls01jkKd10qJTBlP7R/H7qxAqViCFvbCMzuAKjNMFgUCArlEDuUzCXiW1kNYNdh9VrBhwO03Y3KsxJVChYiB+lluTCdKSA6k4WtyYfi1EywcVpLZAkqZDD+/qZOMUhnX3TgHjnAN1IAf+TMDgKay44u/FB/5OXB9yFFsq3dCL1Tl8eEMXd3spuB4lp8b1FnPlERuIg9vsxtVA5AEWP022C9rgtmuQZgVsMGoViSmJsoQCpHJpKKuzcnjgzkUk0VyN9gwcWQc5nofFYcSEEQMGGJxu0W2XbmKZC6H4uQ0lFwV9vZGZkMnFxSZgSE+UoSEFFBNgsMdYXHTuibasCyMimFU9HJekeUKjFQR+WRZomoYqYEU7E4zyvkyWDBIgokZiiaYDIbTY0Kw2Y58rkLZyRxpNhVTp1Jwt/qglwzApELq1aTb4mJ/vZc0hw2smWEO+yHzGejpLFWzORz89hX0kXtAZ0a4s5GYJeqWzZEmhfDUlxeaAUBhCUeTD2SGcIbsStOSOpAmEGzzo5AsAAIkmQGDyFNrxdR4AQM9Uxw9PYXWRSHkJ/JwRuxID6chc0VoJg3LPWZ/7Bc3sCLB+b5BqBYTqrEpqB4nEif7MX74HL7wk175kSOUzJc50RcjX4OfYwdPkSfigcrGh2OF1wVhV1GOZqURdIrE0DQkSwSafZA6gSCYoVM+VUYpXUSloKP+Ei8pJsHnu8e4bn4NjRwaB6oSqBj0zF/cxauz+yk/Mgn/0vkkmUHEnK+UkexN8NFTU/TeSI4OxqaUjwzwD0fSWNLiNoKtISW0uAPMOv/zs+8RAEjDQPrYOMiuCRKCpc4kVAXJaBr+Ri9S0Q+nSqvHgtRACm2r6jk+lKaR/aPwX+ITwwfGoCfzqGTzWLZkMf727aO44c65UK0K5YdGkDw/iVJZp/6RFJI5A491x6lnYoo+1jHaHZsQ2w/FlYFjAyABaBY7zV/RgCUhHysmFXCYUJ3KYOKDMQq2++FvcUERAumRNMCSpC5RSOZgD1qhKIIcfhs7XGaqjBcwtLkOJ+9ollzW4Z/fik13bUPtXf+CUnwSw8dG4W8NQRDwjZ3j1VteOyX+u+L/x2m0vyqXj8aKB5pzGaEKC/wuhzyZKQvF5oIt7EC+UGXDkDTeOw6hKAyVSAgBoSnMxCRzVRTzeRTieZBJRUMqzcd/dhMlj/ZxZGEHjXRZsPqferG1ox2WQpoHu/vp2GAGW194J9czHnfOyFcJi2rjwe+shd3thM5VhO57B+ZIANKQ8M+rgVAFUgPTsPpt0CVYGEyGIVFNlrgcT5G9uYb1YpnutVbx4ANr2VQbpvLoOKDrUN02ZKMJLHnoA4wkx3Hj0pDt1/tGL+iX0//r09a/ASTpEWd6CyKxAAAAAElFTkSuQmCC";
function Avatar({hair="spiky",cloth="#fff",racketColor="#e44",size=60}){
const sz = size || 60;
return(<img src={PLAYER_IMG} width={sz} height={Math.round(sz*1.4)} style={{imageRendering:"pixelated",display:"block"}} alt="Player"/>);
}

function Px({children,size=12,color="#fff",style={}}){return <span style={{fontFamily:"'Press Start 2P',monospace",fontSize:size,color,lineHeight:1.8,...style}}>{children}</span>}

function Typewriter({text,size=8,color="#ddd",speed=30}){
const[displayed,setDisplayed]=useState("");
const[done,setDone]=useState(false);
useEffect(()=>{setDisplayed("");setDone(false);let i=0;const iv=setInterval(()=>{i++;if(i<=text.length){setDisplayed(text.slice(0,i))}else{clearInterval(iv);setDone(true)}},speed);return()=>clearInterval(iv)},[text,speed]);
return <span style={{fontFamily:"'Press Start 2P',monospace",fontSize:size,color,lineHeight:2.2}}>{displayed.split("\n").map((line,i)=><span key={i}>{i>0&&<br/>}{line}</span>)}{!done&&<span style={{opacity:0.5,animation:"pulse 0.8s infinite"}}>_</span>}</span>;
}

function CoachSmall(){return(<img src={MARCOS_SM} width={48} height={48} style={{imageRendering:"pixelated",display:"block"}} alt="Marcos"/>)}

function MarcosLarge(){return(<img src={MARCOS_IMG} width={160} height={160} style={{imageRendering:"pixelated",display:"block",margin:"0 auto"}} alt="Marcos"/>)}


function CourtScene(){return(
<div style={{borderRadius:8,overflow:"hidden",border:"1px solid #1a1a2e"}}>
<svg width="100%" viewBox="0 0 320 140" style={{display:"block",borderRadius:8}}>
<rect width="320" height="140" fill="#c4612d"/>
<rect x="20" y="10" width="280" height="120" fill="none" stroke="#fff" strokeWidth="2" rx="2"/>
<line x1="160" y1="10" x2="160" y2="130" stroke="#fff" strokeWidth="2"/>
<rect x="60" y="10" width="200" height="120" fill="none" stroke="#fff" strokeWidth="1.5"/>
<rect x="60" y="45" width="200" height="50" fill="none" stroke="#fff" strokeWidth="1"/>
<line x1="160" y1="5" x2="160" y2="135" stroke="#333" strokeWidth="3"/>
<rect x="154" y="2" width="12" height="6" rx="1" fill="#aaa"/>
<rect x="154" y="132" width="12" height="6" rx="1" fill="#aaa"/>
<circle cx="80" cy="35" r="5" fill="#ccff00" stroke="#999" strokeWidth="0.5"/>
<path d="M77,35 Q80,31 83,35" fill="none" stroke="#fff" strokeWidth="0.8"/>
</svg>
</div>
)}

const COUNTRIES=[
{id:"BRA",flag:"\u{1F1E7}\u{1F1F7}",name:"Brasil"},
{id:"ARG",flag:"\u{1F1E6}\u{1F1F7}",name:"Argentina"},
{id:"ESP",flag:"\u{1F1EA}\u{1F1F8}",name:"Espanha"},
{id:"USA",flag:"\u{1F1FA}\u{1F1F8}",name:"EUA"},
{id:"FRA",flag:"\u{1F1EB}\u{1F1F7}",name:"França"},
{id:"ITA",flag:"\u{1F1EE}\u{1F1F9}",name:"Itália"},
{id:"GBR",flag:"\u{1F1EC}\u{1F1E7}",name:"Inglaterra"},
{id:"GER",flag:"\u{1F1E9}\u{1F1EA}",name:"Alemanha"},
{id:"AUS",flag:"\u{1F1E6}\u{1F1FA}",name:"Austrália"},
{id:"JPN",flag:"\u{1F1EF}\u{1F1F5}",name:"Japão"},
{id:"CHI",flag:"\u{1F1E8}\u{1F1F1}",name:"Chile"},
];

const WEATHER=[
{id:"sun",icon:"\u2600\uFE0F",label:"Sol"},
{id:"partcloud",icon:"\u26C5",label:"Parc. nublado"},
{id:"cloud",icon:"\u2601\uFE0F",label:"Nublado"},
];
const MATCH_TIMES=["10:00","11:30","14:00","15:30","17:00","19:00","20:30"];

function getTemp(country,month){
const hot=["BRA","AUS","MEX","ARG","CHI","PER","COL","PAR","URU","ECU","TUN"];
const med=["USA","ESP","ITA","FRA","MON","POR","JPN","CHN"];
if(hot.includes(country))return 24+~~(Math.random()*10);
if(["GBR","NED","GER","SUI","AUT","SWE","POL","CRO","ROM"].includes(country)){
if(["JAN","FEV","MAR","NOV"].includes(month))return 4+~~(Math.random()*8);
if(["ABR","MAI","OUT"].includes(month))return 12+~~(Math.random()*8);
return 18+~~(Math.random()*8);
}
if(med.includes(country)){
if(["JAN","FEV","MAR","NOV"].includes(month))return 8+~~(Math.random()*10);
if(["ABR","MAI","OUT","SET"].includes(month))return 16+~~(Math.random()*8);
return 22+~~(Math.random()*10);
}
return 20+~~(Math.random()*10);
}

function weekToDate(week){
const day=((week-1)*7)%28+1;
const months=["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const mIdx=Math.min(11,Math.floor((week-1)/4.3));
return day+" de "+months[mIdx];
}

function nameHash(name){let h=0;for(let i=0;i<name.length;i++){h=((h<<5)-h)+name.charCodeAt(i);h|=0}return Math.abs(h)}

function Btn({onClick,color="#2d6bc4",children,style:es={},disabled=false}){
return(
<button
onClick={onClick}
disabled={disabled}
style={{
fontFamily:"'Press Start 2P',monospace",
fontSize:10,
padding:"13px 16px",
background:disabled
? "linear-gradient(180deg,#2a2f3d 0%, #1a1f2b 100%)"
: `linear-gradient(180deg,${color} 0%,${color}dd 100%)`,
color:disabled ? "#777" : "#fff",
border:"1px solid rgba(255,255,255,0.12)",
borderBottom:disabled ? "1px solid rgba(0,0,0,0.25)" : "3px solid rgba(0,0,0,0.28)",
borderRadius:8,
cursor:disabled ? "default" : "pointer",
width:"100%",
boxSizing:"border-box",
textAlign:"center",
textShadow:"1px 1px 0 rgba(0,0,0,0.25)",
boxShadow:disabled ? "none" : "0 8px 18px rgba(0,0,0,0.20)",
transition:"filter 0.15s ease, transform 0.08s ease, box-shadow 0.15s ease",
letterSpacing:0.2,
...es
}}
>
{children}
</button>
);
}

const UI = {
bg:"#070714",
panel:"#0d1020",
panel2:"#11162a",
line:"rgba(255,255,255,0.08)",
lineStrong:"rgba(255,215,0,0.18)",
text:"#f4f6fb",
muted:"#9aa3b2",
soft:"#6b7280",
gold:"#ffd700",
green:"#4ade80",
red:"#f87171",
blue:"#60a5fa",
radius:10,
radiusSm:6,
shadow:"0 10px 24px rgba(0,0,0,0.28)",
shadowSoft:"0 4px 12px rgba(0,0,0,0.18)",
};
function Card({children,style={}}){
return(
<div style={{
background:`linear-gradient(180deg, ${UI.panel2} 0%, ${UI.panel} 100%)`,
border:`1px solid ${UI.line}`,
borderRadius:UI.radius,
padding:12,
boxShadow:UI.shadowSoft,
...style
}}>
{children}
</div>
);
}
function SectionTitle({children,color=UI.gold,style={}}){
return(
<div style={{marginBottom:8,...style}}>
<Px size={8} color={color}>{children}</Px>
</div>
);
}
function InfoRow({label,value,valueColor="#fff",style={}}){
return(
<div style={{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
padding:"6px 0",
borderBottom:`1px solid ${UI.line}`,
...style
}}>
<Px size={6} color={UI.muted}>{label}</Px>
<Px size={7} color={valueColor}>{value}</Px>
</div>
);
}
function StatTile({label,value,color="#fff",style={}}){
return(
<div style={{
flex:1,
background:"rgba(255,255,255,0.03)",
border:`1px solid ${UI.line}`,
borderRadius:UI.radiusSm,
padding:"10px 8px",
textAlign:"center",
minHeight:62,
display:"flex",
flexDirection:"column",
justifyContent:"center",
...style
}}>
<Px size={6} color={UI.muted}>{label}</Px>
<div style={{marginTop:4}}>
<Px size={10} color={color}>{value}</Px>
</div>
</div>
);
}

const CSS=`@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes slideScore{from{opacity:0;transform:scale(0.88)}to{opacity:1;transform:scale(1)}}
@keyframes confettiFall{0%{transform:translateY(-100vh) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
@keyframes eyeBlink{0%,90%,100%{opacity:1}94%{opacity:0}}
@keyframes textFadeIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
@keyframes floatSoft{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes glowPulse{0%,100%{box-shadow:0 0 8px rgba(255,215,0,0.14)}50%{box-shadow:0 0 18px rgba(255,215,0,0.24)}}
@keyframes barFill{from{width:0}to{width:100%}}
@keyframes alertPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.88;transform:scale(1.01)}}
@keyframes tabBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}

*{box-sizing:border-box}
html,body,#root{margin:0;padding:0;background:#070714}
body{-webkit-font-smoothing:none;-moz-osx-font-smoothing:auto}

button:hover{filter:brightness(1.08)}
button:active{transform:translateY(2px);border-bottom-width:1px!important;filter:brightness(0.92)}
input:focus{outline:none;border-color:#ffd700!important;box-shadow:0 0 0 3px rgba(255,215,0,0.08)}

::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:#080818}
::-webkit-scrollbar-thumb{background:#2c3142;border-radius:4px}
`;

function Confetti(){
const colors=["#ffd700","#4ade80","#f87171","#60a5fa","#c084fc","#fbbf24","#fff"];
const pieces=Array.from({length:40},(_,i)=>({
left:Math.random()*100,delay:Math.random()*2,dur:1.5+Math.random()*2,color:colors[i%colors.length],size:4+Math.random()*6,
}));
return(<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,pointerEvents:"none",zIndex:3000,overflow:"hidden"}}>
{pieces.map((p,i)=>(<div key={i} style={{position:"absolute",left:p.left+"%",top:0,width:p.size,height:p.size,background:p.color,borderRadius:Math.random()>0.5?"50%":"0",animation:`confettiFall ${p.dur}s ease-in ${p.delay}s forwards`}}/>))}
</div>);
}

// ===== GENERATE ALL TOURNAMENT MATCHES (Elifoot style) =====
function genTourneyBracket(tourney, playerName, playerRank, playerOvr, playerFavSurf, playerPlaystyle, rivals, playerCountry) {
  const rd = tourney.rd;
  const rn = getRN(rd);
  // Number of matches per round: rd=5 -> 16,8,4,2,1 ; rd=6 -> 32,16,8,4,2,1 ; rd=7 -> 64,32,16,8,4,2,1
  const totalFirstRound = Math.pow(2, rd);
  
  // Generate all players for the draw
  const drawPlayers = [];
  // Player is always in the draw
  drawPlayers.push({ name: playerName, rank: playerRank, skill: playerOvr, isPlayer: true, country: playerCountry||"BRA" });
  
  // Fill the rest with opponents based on tournament level
  for (let i = 1; i < totalFirstRound; i++) {
    // Seed-based ranking - top seeds get better ranks
    const seedTier = i < 4 ? 0 : i < 8 ? 1 : i < 16 ? 2 : 3;
    const range = getOppRange(tourney.lv, seedTier, rd);
    const cands = rivals.filter(r => r.rank >= range[0] && r.rank <= Math.min(range[1], 500));
    let rv;
    if (cands.length > i) {
      // Pick without repeats
      const available = cands.filter(c => !drawPlayers.find(d => d.name === c.name));
      if (available.length > 0) {
        rv = available[~~(Math.random() * available.length)];
        drawPlayers.push({ name: rv.name, rank: rv.rank, skill: rv.skill, isPlayer: false, country: rv.country||"" });
      } else {
        const vRank = range[0] + ~~(Math.random() * (range[1] - range[0] + 1));
        const vSkill = Math.round(Math.max(52, 97 - vRank * 0.08 + (Math.random() * 8 - 4)));
        const rco=Object.keys(RIVAL_NAMES);const rc=rco[~~(Math.random()*rco.length)];const rp=RIVAL_NAMES[rc];const nm=rp.fn[~~(Math.random()*rp.fn.length)]+" "+rp.ln[~~(Math.random()*rp.ln.length)];
        drawPlayers.push({ name: nm, rank: vRank, skill: vSkill, isPlayer: false, country: rc||"" });
      }
    } else {
      const vRank = range[0] + ~~(Math.random() * (range[1] - range[0] + 1));
      const vSkill = Math.round(Math.max(52, 97 - vRank * 0.08 + (Math.random() * 8 - 4)));
      const rco=Object.keys(RIVAL_NAMES);const rc=rco[~~(Math.random()*rco.length)];const rp=RIVAL_NAMES[rc];const nm=rp.fn[~~(Math.random()*rp.fn.length)]+" "+rp.ln[~~(Math.random()*rp.ln.length)];
      drawPlayers.push({ name: nm, rank: vRank, skill: vSkill, isPlayer: false, country: rc||"" });
    }
  }
  
  // Shuffle draw but keep player in a random position
  const playerEntry = drawPlayers[0];
  const others = drawPlayers.slice(1);
  for (let i = others.length - 1; i > 0; i--) {
    const j = ~~(Math.random() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  const playerPos = ~~(Math.random() * totalFirstRound);
  const shuffled = [...others];
  shuffled.splice(playerPos, 0, playerEntry);
  
  // Build rounds: array of rounds, each round is array of matches
  const rounds = [];
  let numMatches = totalFirstRound / 2;
  
  // First round with actual players
  const firstRound = [];
  for (let m = 0; m < shuffled.length; m += 2) {
    let p1 = shuffled[m];
    let p2 = shuffled[m + 1];
    if (!p1 || !p2) continue;
    // Player always on left side (p1)
    if (p2.isPlayer) { const tmp = p1; p1 = p2; p2 = tmp; }
    const hasPlayer = p1.isPlayer || p2.isPlayer;
    firstRound.push({
      id: `r0-m${m/2}`,
      p1: { ...p1 },
      p2: { ...p2 },
      hasPlayer,
      sets: [],
      winner: null,
      finished: false,
      roundIdx: 0,
    });
  }
  // Sort: player match first
  // Note: we don't sort the actual array to keep propagation indices correct
  // Display sorting is handled in the render
  rounds.push(firstRound);
  
  // Future rounds: create placeholder matches (p1/p2 will be filled by propagation)
  for (let r = 1; r < rd; r++) {
    numMatches = Math.floor(numMatches / 2);
    const roundMatches = [];
    for (let m = 0; m < numMatches; m++) {
      roundMatches.push({
        id: `r${r}-m${m}`,
        p1: { name: "TBD", rank: 0, skill: 0, isPlayer: false },
        p2: { name: "TBD", rank: 0, skill: 0, isPlayer: false },
        hasPlayer: false,
        sets: [],
        winner: null,
        finished: false,
        roundIdx: r,
      });
    }
    rounds.push(roundMatches);
  }
  
  return rounds;
}

// Simulate a single match and return score
function simMatchScore(p1Skill, p2Skill, isGS, roundIdx) {
  const bo = isGS ? 5 : 3;
  const need = Math.ceil(bo / 2);
  let s1 = 0, s2 = 0;
  const sets = [];
  
  const winChance = Math.max(0.22, Math.min(0.78, 0.50 + (p1Skill - p2Skill) * 0.015 + (Math.random() * 0.14 - 0.07)));
  
  while (s1 < need && s2 < need) {
    const p1WinsSet = Math.random() < winChance;
    let g1, g2;
    if (p1WinsSet) {
      const margin = Math.random();
      if (margin < 0.3) { g1 = 6; g2 = ~~(Math.random() * 3); }
      else if (margin < 0.7) { g1 = 6; g2 = 3 + ~~(Math.random() * 2); }
      else { g1 = 7; g2 = Math.random() < 0.5 ? 5 : 6; }
      s1++;
    } else {
      const margin = Math.random();
      if (margin < 0.3) { g2 = 6; g1 = ~~(Math.random() * 3); }
      else if (margin < 0.7) { g2 = 6; g1 = 3 + ~~(Math.random() * 2); }
      else { g2 = 7; g1 = Math.random() < 0.5 ? 5 : 6; }
      s2++;
    }
    sets.push([g1, g2]);
  }
  
  return { sets, winner: s1 > s2 ? 1 : 2 };
}

export default function App(){

useEffect(function() { document.title = "Tennis Career 26 · Fonseca News"; }, []);
const[screen,setScreen]=useState("title");
const[player,setPlayer]=useState(null);
const[rivals,setRivals]=useState([]);
const[season,setSeason]=useState(1);
const[weekIdx,setWeekIdx]=useState(0);
const[pName,setPName]=useState("");
const[notif,setNotif]=useState(null);
const[sLog,setSLog]=useState([]);
const[prevRank,setPrevRank]=useState(300);
const[tourney,setTourney]=useState(null);
const[tRound,setTRound]=useState(0);
const[tResults,setTResults]=useState([]);
const[rndEvt,setRndEvt]=useState(null);
const[cHair,setCHair]=useState("short");
const[cCloth,setCCloth]=useState("nike");
const[cRacketBrand,setCRacketBrand]=useState("babolat");
const[setupStep,setSetupStep]=useState(0);
const[dialogIdx,setDialogIdx]=useState(0);
const[showNamePopup,setShowNamePopup]=useState(false);
const[fichaIdx,setFichaIdx]=useState(0);
const[showCostPopup,setShowCostPopup]=useState(false);
const[showOvrInfo,setShowOvrInfo]=useState(false);
const[showMenu,setShowMenu]=useState(false);
const[isMuted,setIsMuted]=useState(false);
const[cHand,setCHand]=useState("destro");
const[cBackhand,setCBackhand]=useState("duas");
const[cPlaystyle,setCPlaystyle]=useState("ambicioso");
const[cSurface,setCSurface]=useState("clay");
const[cCountry,setCCountry]=useState("BRA");
const[activeTab,setActiveTab]=useState("jogar");
const[nextOpponent,setNextOpponent]=useState(null); // opponent shown in VS card on hub
// Elifoot match state
const[bracket,setBracket]=useState(null); // full tournament bracket
const[simRound,setSimRound]=useState(0); // which round is being simulated
const[simStep,setSimStep]=useState(0); // animation step within round
const[simRunning,setSimRunning]=useState(false);
const[playerEliminated,setPlayerEliminated]=useState(false);
const[playerMatchResult,setPlayerMatchResult]=useState(null); // result of player's match this round
const[tourneySummary,setTourneySummary]=useState(null); // end-of-tourney stats
const[sponsorOffer,setSponsorOffer]=useState(null); // new sponsor proposal popup
const[energy,setEnergy]=useState(100); // fatigue system 0-100
const[injury,setInjury]=useState(0); // weeks of injury remaining
const[h2hLog,setH2hLog]=useState({}); // head to head record {rivalName: {w,l}}
const[showTutorial,setShowTutorial]=useState(true); // first time tutorial popup
const[tempOvr,setTempOvr]=useState(0); // temporary OVR from consumables
const[matchEvent,setMatchEvent]=useState(null); // in-match event
const[consecutiveLosses,setConsecutiveLosses]=useState(0); // track losing streak
const[showLossTip,setShowLossTip]=useState(false); // popup tip after losing streak
const[unlockedAchievements,setUnlockedAchievements]=useState([]); // list of unlocked achievement ids
const[newAchievement,setNewAchievement]=useState(null); // popup for newly unlocked achievement
const[setDecision,setSetDecision]=useState(null); // popup between sets {type:"lost"|"won", setScore, setsP, setsR}
const[setBonus,setSetBonus]=useState(0); // accumulated bonus from set decisions
const[moral,setMoral]=useState(60); // 0-100, starts slightly optimistic
const[personalBest,setPersonalBest]=useState({}); // {tourneyLevel: bestRoundsWon}
const[winStreak,setWinStreak]=useState(0); // consecutive tournaments with 2+ wins
const[marcosChallenge,setMarcosChallenge]=useState(null); // {desc, target, reward}
const[showStreakPopup,setShowStreakPopup]=useState(null); // streak milestone text
const[showPersonalBest,setShowPersonalBest]=useState(null);
const[lastEliminator,setLastEliminator]=useState(null); // personal best text
const[wildcardTourney,setWildcardTourney]=useState(null); // wildcard offer for ineligible tournament

const TENNIS_QUIZ=[
// === FÁCIL (regras básicas, cultura geral) ===
{q:"Quantos sets pra vencer um Grand Slam masculino?",a:["3","5","4"],correct:1},
{q:"O que significa 'love' no tênis?",a:["Empate","Zero","Vantagem"],correct:1},
{q:"O que é um 'ace'?",a:["Saque não devolvido","Ponto de voleio","Erro duplo"],correct:0},
{q:"O que é um 'break'?",a:["Pausa médica","Vencer game no saque do rival","Trocar de lado"],correct:1},
{q:"Quantos games pra vencer um set normal?",a:["4","6","8"],correct:1},
{q:"O que é 'double fault'?",a:["Dois aces seguidos","Errar os dois saques","Dois winners"],correct:1},
{q:"O que acontece no tiebreak?",a:["Game decisivo com 6-6","Set acaba empatado","Joga-se golden point"],correct:0},
{q:"O que é 'deuce'?",a:["15-15","40-40","30-30"],correct:1},
{q:"Qual Grand Slam é jogado em grama?",a:["Melbourne Open","Paris Open","London Championships"],correct:2},
{q:"Qual mão é mais rara entre tenistas profissionais?",a:["Direita","Esquerda","Ambas"],correct:1},
// === MÉDIO (história, estatísticas, conhecimento intermediário) ===
{q:"Qual o recorde de Grand Slams masculinos na história?",a:["20","22","24"],correct:2},
{q:"Quantos títulos de Grand Slam um jogador precisa pra ser considerado lenda?",a:["5+","10+","15+"],correct:1},
{q:"Em que década o Brasil teve seu primeiro campeão de Grand Slam?",a:["1980","1990","2000"],correct:1},
{q:"Qual o apelido do torneio de Desert Masters?",a:["O 5° Grand Slam","O Deserto Open","Masters do Oeste"],correct:0},
{q:"O que é 'bagel' no tênis?",a:["Vencer set por 6-0","Perder sem ganhar ponto","Empate no tiebreak"],correct:0},
{q:"Qual tenista completou o Career Golden Slam?",a:["Nenhum homem completou","Apenas uma mulher completou","Um americano completou"],correct:1},
{q:"O que é um 'breadstick'?",a:["Set vencido por 6-1","Sequência de aces","Jogo sem breaks"],correct:0},
{q:"Qual superfície tem a temporada mais curta no calendário?",a:["Saibro","Grama","Quadra dura"],correct:1},
{q:"Quantos Masters 1000 existem no calendário?",a:["6","9","12"],correct:1},
{q:"Aproximadamente quantas semanas durou o maior reinado como nº 1?",a:["~310","~430","~377"],correct:1},
{q:"Em que ano aconteceu o último Calendar Slam masculino?",a:["1969","2001","1988"],correct:0},
{q:"Qual país do Reino Unido tem tradição em Grands Slams de grama?",a:["Inglaterra","Escócia","País de Gales"],correct:0},
{q:"Qual a velocidade do saque mais rápido já registrado?",a:["~243 km/h","~263 km/h","~253 km/h"],correct:1},
{q:"Em que ano aconteceu o único Golden Slam da história?",a:["1984","1988","1992"],correct:1},
{q:"O que é 'hawk-eye'?",a:["Tipo de saque","Sistema eletrônico de revisão","Golpe de voleio"],correct:1},
// === DIFÍCIL (estratégia, regras obscuras, estatísticas profundas) ===
{q:"No tiebreak, quem saca primeiro no set seguinte?",a:["Quem sacou por último no tiebreak","Quem recebeu primeiro no tiebreak","Alternado"],correct:1},
{q:"Quantos desafios (challenges) cada jogador tem por set?",a:["2","3","Ilimitados com hawk-eye live"],correct:1},
{q:"O que é 'not up' no tênis?",a:["Bola bateu 2 vezes antes do golpe","Saque longo","Bola na rede"],correct:0},
{q:"Qual a penalidade por 'time violation'?",a:["1°: aviso, 2°: perde ponto","Perde o game direto","Multa de $500"],correct:0},
{q:"O que acontece se a bola toca o corpo do jogador?",a:["Ponto pro adversário","Let, repete-se","Depende se passou a rede"],correct:0},
{q:"Qual a duração do jogo mais longo da história?",a:["~6 horas","~11 horas","~8 horas"],correct:1},
{q:"Na Davis Cup, qual país tem mais títulos?",a:["EUA","Austrália","Espanha"],correct:0},
{q:"O que significa 'WO' no resultado?",a:["Walk Over (desistência)","Win Over","Sem vencedor"],correct:0},
{q:"Qual torneio introduziu o super tiebreak (10 pts) no 5° set?",a:["London Championships (2019)","New York Open (1970)","Melbourne Open (2019)"],correct:2},
{q:"Qual a diferença de ranking entre circuito masculino e feminino?",a:["Masculino é um circuito, feminino é outro","Ambos são profissionais","Não há diferença"],correct:0},
{q:"O que é 'coaching violation'?",a:["Jogador recebe instrução proibida","Treinador entra na quadra","Jogador xinga o juiz"],correct:0},
{q:"Quantos pontos vale a vitória nas Finals do circuito?",a:["400","1500","500-1500 dependendo das vitórias"],correct:2},
{q:"O que significa 'lucky loser'?",a:["Jogador eliminado no quali que entra na chave principal","Jogador que vence de virada","Wildcard de última hora"],correct:0},
{q:"Qual regra foi abolida em 2022 nos Grand Slams?",a:["Serve and volley obrigatório","Vantagem no 5° set sem tiebreak","Código de vestimenta"],correct:1},
{q:"O que é 'protected ranking' no circuito profissional?",a:["Ranking congelado por lesão longa","Ranking de jogador top 10","Ranking do campeão defensor"],correct:0},
{q:"Qual a menor idade para jogar no circuito profissional?",a:["14 anos","16 anos","Não há limite"],correct:0},
{q:"O que é um 'tank' no tênis?",a:["Desistir mentalmente de um jogo","Saque muito forte","Tática defensiva"],correct:0},
{q:"Quantos pontos vale o título de Masters 1000?",a:["500","1000","800"],correct:1},
{q:"O que é 'sneak attack by return'?",a:["Tipo de backhand","Ataque no retorno do 2° saque","Saque por baixo"],correct:1},
{q:"Qual Grand Slam é considerado o mais difícil de vencer?",a:["Paris (saibro)","Londres (grama)","Melbourne (dura)"],correct:0},
];
const ivRef=useRef(null);

// === SAVE / LOAD ===
const saveGame=async()=>{
if(!player)return;
try{
const saveData=JSON.stringify({player,rivals:rivals.map(r=>({name:r.name,rank:r.rank,skill:r.skill,points:r.points})),season,weekIdx,sLog,prevRank,energy,injury,h2hLog,unlockedAchievements,moral,personalBest,winStreak});
await window.storage.set("tc98-save",saveData);
notify("Jogo salvo!");
}catch(e){console.error("Save failed",e)}
};
const loadGame=async()=>{
try{
const result=await window.storage.get("tc98-save");
if(result&&result.value){
const d=JSON.parse(result.value);
setPlayer(d.player);setRivals(d.rivals);setSeason(d.season);setWeekIdx(d.weekIdx);setSLog(d.sLog||[]);setPrevRank(d.prevRank||450);setEnergy(d.energy||100);setInjury(d.injury||0);setH2hLog(d.h2hLog||{});setUnlockedAchievements(d.unlockedAchievements||[]);setMoral(d.moral||60);setPersonalBest(d.personalBest||{});setWinStreak(d.winStreak||0);setShowTutorial(false);setScreen("career");
return true;
}
}catch(e){console.error("Load failed",e)}
return false;
};
const hasSave=useRef(false);
useEffect(()=>{(async()=>{try{const r=await window.storage.get("tc98-save");hasSave.current=!!r}catch(e){}})()},[]);
useEffect(()=>{if(screen==="career"&&player)saveGame()},[screen]);

useEffect(()=>{const l=document.createElement("link");l.href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap";l.rel="stylesheet";document.head.appendChild(l)},[]);
const notify=(m)=>{setNotif(m);setTimeout(()=>setNotif(null),2500)};

// Check if player unlocked new achievements
const checkAchievements=useCallback((p)=>{
if(!p)return;
const newlyUnlocked=ACHIEVEMENTS.filter(a=>a.check(p)&&!unlockedAchievements.includes(a.id));
if(newlyUnlocked.length>0){
const first=newlyUnlocked[0];
setUnlockedAchievements(prev=>[...prev,...newlyUnlocked.map(a=>a.id)]);
// Give reward
if(first.reward.startsWith("$")){
const amount=parseInt(first.reward.replace(/[^0-9]/g,""));
setPlayer(prev=>({...prev,money:prev.money+amount}));
}else if(first.reward.includes("OVR")){
const amount=parseInt(first.reward.replace(/[^0-9]/g,""));
setPlayer(prev=>({...prev,ovr:Math.min(99,prev.ovr+amount)}));
}
setNewAchievement(first);
SFX.achievement();
try{if(navigator.vibrate)navigator.vibrate([100,80,100,80,200])}catch(e){}
}
},[unlockedAchievements]);

const weeks=useMemo(()=>[...new Set(CAL.map(t=>t.w))].sort((a,b)=>a-b),[]);
const curWeek=weeks[weekIdx]||weeks[0];

const getOvr=useCallback((p)=>{
if(!p)return 0;
let ovr = p.ovr;
ovr += (p.racket?.ovr||0);
ovr += (p.shoes?.ovr||0);
ovr += (p.trainer?.ovr||0);
ovr += (p.court?.ovr||0);
ovr += tempOvr;
return Math.min(99, ovr);
},[tempOvr]);

// Surface-specific OVR (includes shoe bonus for specific surface)
const getSurfOvr=useCallback((p, surface)=>{
if(!p)return 0;
let ovr = getOvr(p);
if(p.shoes?.surfBonus===surface) ovr += 5;
return Math.min(99, ovr);
},[getOvr]);

// Simulate all rivals playing tournaments this week - world is alive
const simRivalsWeek=useCallback((rv, week)=>{
  const weekTourneys = CAL.filter(t => t.w === week);
  
  return rv.map(r=>{
    // Most players play every week. Only skip if resting or "injured"
    // Top players rest more strategically, lower players play everything they can
    const restChance = r.rank <= 20 ? 0.25 : r.rank <= 50 ? 0.15 : r.rank <= 100 ? 0.10 : 0.05;
    if (Math.random() < restChance) return r; // resting this week
    
    const eligible = weekTourneys.filter(t => {
      if (r.rank > t.mr && t.mr !== 9999) return false;
      // Top players skip small tournaments (realistic)
      if (r.rank <= 30 && (t.lv.startsWith("ITF") || t.lv.startsWith("CH"))) return false;
      if (r.rank <= 80 && t.lv.startsWith("ITF")) return false;
      if (r.rank <= 150 && t.lv === "ITF15") return false;
      if (r.rank <= 250 && t.lv === "ITF15") return false;
      return true;
    });
    if (eligible.length === 0) return r;
    
    // Pick best tournament available (prefer higher level)
    const sorted = [...eligible].sort((a,b) => (b.pr||0) - (a.pr||0));
    const t = sorted[0];
    
    // Simulate rounds - realistic advance rates
    const rounds = t.rd;
    let roundsWon = 0;
    for (let rd = 0; rd < rounds; rd++) {
      // Advance chance per round based on rank vs tournament level
      let advanceChance;
      if (t.lv.startsWith("ITF")) {
        advanceChance = r.rank <= 100 ? 0.85 : r.rank <= 200 ? 0.60 : r.rank <= 350 ? 0.42 : 0.30;
      } else if (t.lv.startsWith("CH")) {
        advanceChance = r.rank <= 50 ? 0.75 : r.rank <= 150 ? 0.50 : r.rank <= 300 ? 0.35 : 0.22;
      } else {
        advanceChance = r.rank <= 10 ? 0.70 : r.rank <= 30 ? 0.55 : r.rank <= 80 ? 0.42 : 0.30;
      }
      if (Math.random() < advanceChance) roundsWon++;
      else break;
    }
    
    const ptsGained = getPts(t.lv, t.rd, roundsWon);
    return { ...r, points: r.points + ptsGained };
  });
},[]);

const rerank=useCallback((updatedRivals,playerData)=>{
const all=[...updatedRivals.map(r=>({...r,points:r.points||0})),{name:playerData.name,points:playerData.points||0,rank:playerData.rank}];
all.sort((a,b)=>(b.points||0)-(a.points||0));all.forEach((x,i)=>{x.rank=i+1});
const me=all.find(x=>x.name===playerData.name);
const newRivals=all.filter(x=>x.name!==playerData.name).map(r=>{const ex=updatedRivals.find(rv=>rv.name===r.name);return ex?{...ex,rank:r.rank,points:r.points}:r});
return{newRank:me?me.rank:playerData.rank,newRivals};
},[]);

const getTourneyCost=(lv)=>{
const costs={ITF15:80,ITF25:120,CH50:250,CH75:350,CH100:500,CH175:700,ATP250:1200,ATP500:2000,M1000:3000,GS:4000,Finals:5000};
return costs[lv]||150;
};

const startGame=()=>{
if(!pName.trim())return;
setPlayer({name:pName.trim(),age:19,rank:450,points:10,money:800,ovr:66,sponsor:SPONSORS[0],racket:RACKETS[0],shoes:SHOES[0],trainer:TRAINERS[0],court:COURTS[0],titles:0,gs:0,sW:0,sL:0,cW:0,cL:0,hair:cHair,cloth:cCloth,racketBr:cRacketBrand,country:cCountry,hand:cHand,backhand:cBackhand,playstyle:cPlaystyle,favSurface:cSurface});
const allRivals=genRivals(500);
setRivals(allRivals);setSeason(1);setWeekIdx(0);setSLog([]);setPrevRank(450);setScreen("sponsor_intro");
};

// ===== ELIFOOT-STYLE: Start tournament with full bracket =====
const startTourneyMatch = useCallback(() => {
  if (!player || !tourney) return;
  // Bracket already generated in pickTourney, just switch to match screen
  if (!bracket) {
    const playerOvr = getOvr(player);
    const b = genTourneyBracket(tourney, player.name, player.rank, playerOvr, player.favSurface, player.playstyle, rivals, player.country);
    setBracket(b);
  }
  setSimRound(0);
  setSimStep(0);
  setSimRunning(false);
  setPlayerEliminated(false);
  setPlayerMatchResult(null);
  setScreen("match");
}, [player, tourney, rivals, getOvr, bracket]);

// Simulate one round - set by set with player decisions between sets
const simCurrentRound = useCallback(() => {
  if (!bracket || simRunning) return;
  const round = bracket[simRound];
  if (!round || round.length === 0) return;
  const allReady = round.every(m => m.p1.name !== "TBD" && m.p2.name !== "TBD");
  if (!allReady) return;
  
  setSimRunning(true);
  setPlayerMatchResult(null);
  setSetDecision(null);
  
  const isGS = tourney.lv === "GS";
  const need = isGS ? 3 : 2;
  
  // Pre-calc other matches (non-player) in full
  const otherResults = round.map((match, idx) => {
    if (match.finished || match.hasPlayer) return null;
    const result = simMatchScore(match.p1.skill, match.p2.skill, isGS, simRound);
    return { idx, sets: result.sets, winner: result.winner };
  }).filter(Boolean);
  
  // Player match setup
  const pmIdx = round.findIndex(m => m.hasPlayer);
  let pBase1 = 0, pBase2 = 0, mEvt = null;
  if (pmIdx >= 0) {
    const pm = round[pmIdx];
    pBase1 = pm.p1.skill; pBase2 = pm.p2.skill;
    if (pm.p1.isPlayer) {
      if (player.favSurface === tourney.sf) pBase1 += 5;
      if (player.shoes?.surfBonus === tourney.sf) pBase1 += 5;
      if (player.playstyle === "clutch" && simRound >= tourney.rd - 2) pBase1 += 4;
      if (player.playstyle === "guerreiro") pBase1 += 2;
      pBase1 += (energy < 50 ? (energy - 50) * 0.15 : 0) + setBonus;
      // Moral influence: high moral boosts, low moral penalizes
      pBase1 += moral >= 70 ? 2 : moral >= 40 ? 0 : -2;
      // Rookie bonus: extra skill in first season
      if (season <= 1) pBase1 += 2;
    }
    if (pm.p2.isPlayer) {
      if (player.favSurface === tourney.sf) pBase2 += 5;
      if (player.shoes?.surfBonus === tourney.sf) pBase2 += 5;
      if (player.playstyle === "clutch" && simRound >= tourney.rd - 2) pBase2 += 4;
      if (player.playstyle === "guerreiro") pBase2 += 2;
      pBase2 += (energy < 50 ? (energy - 50) * 0.15 : 0) + setBonus;
      pBase2 += moral >= 70 ? 2 : moral >= 40 ? 0 : -2;
      if (season <= 1) pBase2 += 2;
    }
    const evt = MATCH_EVENTS.find(e => Math.random() < e.chance);
    if (evt) { mEvt = evt; if (pm.p1.isPlayer) pBase1 += evt.effect; else pBase2 += evt.effect; }
  }
  
  const isP1 = pmIdx >= 0 && round[pmIdx].p1.isPlayer;
  const pSets = []; let sW = 0, sL = 0;
  let decBonus = 0, animIdx = 0;
  
  const simOneSet = (bonus) => {
    const s1 = pBase1 + (isP1 ? bonus : 0), s2 = pBase2 + (!isP1 ? bonus : 0);
    const wc = Math.max(0.22, Math.min(0.78, 0.50 + (s1 - s2) * 0.015 + (Math.random() * 0.14 - 0.07)));
    const w = Math.random() < wc;
    let g1, g2;
    if (w) { const m=Math.random(); if(m<0.3){g1=6;g2=~~(Math.random()*3)}else if(m<0.7){g1=6;g2=3+~~(Math.random()*2)}else{g1=7;g2=Math.random()<0.5?5:6} }
    else { const m=Math.random(); if(m<0.3){g2=6;g1=~~(Math.random()*3)}else if(m<0.7){g2=6;g1=3+~~(Math.random()*2)}else{g2=7;g1=Math.random()<0.5?5:6} }
    return [g1, g2];
  };
  
  const finalize = () => {
    const pWinner = sW > sL ? (isP1 ? 1 : 2) : (isP1 ? 2 : 1);
    setBracket(prev => {
      const nb = prev.map(r => r.map(m => ({...m})));
      const tr = nb[simRound];
      otherResults.forEach(or => { const m=tr[or.idx]; m.sets=or.sets; m.winner=or.winner; m.finished=true;
        if(simRound+1<nb.length){const nr=nb[simRound+1];const ni=~~(or.idx/2);const sl=or.idx%2;if(nr[ni]){const w=or.winner===1?m.p1:m.p2;if(sl===0)nr[ni].p1={...w};else nr[ni].p2={...w};nr[ni].hasPlayer=nr[ni].p1.isPlayer||nr[ni].p2.isPlayer}}
      });
      if(pmIdx>=0){const m=tr[pmIdx];m.sets=pSets;m.winner=pWinner;m.finished=true;
        if(simRound+1<nb.length){const nr=nb[simRound+1];const ni=~~(pmIdx/2);const sl=pmIdx%2;if(nr[ni]){const w=pWinner===1?m.p1:m.p2;if(sl===0)nr[ni].p1={...w};else nr[ni].p2={...w};nr[ni].hasPlayer=nr[ni].p1.isPlayer||nr[ni].p2.isPlayer;
          // Always keep player as p1 (left side)
          if(nr[ni].p2.isPlayer){const tmp=nr[ni].p1;nr[ni].p1=nr[ni].p2;nr[ni].p2=tmp}
        }}
      }
      return nb;
    });
    if(pmIdx>=0){const pm=round[pmIdx];const pWon=sW>sL;
      setPlayerMatchResult({won:pWon,sets:pSets,opponent:pm.p1.isPlayer?pm.p2:pm.p1,matchEvent:mEvt});
      if(pWon) SFX.matchWon(); else SFX.matchLost();
      try{if(navigator.vibrate)navigator.vibrate(pWon?[100,50,100]:[200])}catch(e){}
      if(!pWon)setPlayerEliminated(true);
    }
    setSimRunning(false);setSetBonus(0);setSimStep(prev=>prev+1);
  };
  
  const tick = () => {
    const pDone = sW >= need || sL >= need;
    const maxO = otherResults.length > 0 ? Math.max(...otherResults.map(r=>r.sets.length)) : 0;
    if (pDone && animIdx >= maxO) { clearInterval(ivRef.current); finalize(); return; }
    
    if (!pDone && pmIdx >= 0) {
      const sr = simOneSet(decBonus);
      pSets.push(sr);
      const pWonSet = isP1 ? sr[0]>sr[1] : sr[1]>sr[0];
      if(pWonSet) { sW++; SFX.setWon(); } else { sL++; SFX.setLost(); }
      
      setBracket(prev => {
        const nb = prev.map(r => r.map(m => ({...m, sets: [...(m.sets||[])]})));
        nb[simRound][pmIdx].sets = [...pSets];
        otherResults.forEach(or => { if(animIdx<or.sets.length){const m=nb[simRound][or.idx];if(m.sets.length<=animIdx)m.sets.push(or.sets[animIdx])} });
        return nb;
      });
      animIdx++;
      
      const nowDone = sW >= need || sL >= need;
      if (!nowDone) {
        // Only show decision popup when LOSING a set
        if (!pWonSet) {
          clearInterval(ivRef.current);
          // Pick a random quiz question
          const quiz = TENNIS_QUIZ[~~(Math.random()*TENNIS_QUIZ.length)];
          setSetDecision({
            type: "quiz",
            setScore: isP1 ? sr[0]+"-"+sr[1] : sr[1]+"-"+sr[0],
            setsP: sW, setsR: sL,
            quiz: quiz,
            onChoose: (answeredCorrectly) => {
              decBonus = answeredCorrectly ? 3 : 0;
              if(answeredCorrectly) SFX.quizCorrect(); else SFX.quizWrong();
              setSetDecision(prev => ({...prev, answered: true, correct: answeredCorrectly}));
            },
            onContinue: () => {
              setSetDecision(null);
              setSimRunning(true);
              ivRef.current = setInterval(tick, 1200);
            }
          });
          return;
        }
        // Won set — just continue, no popup
      }
    } else {
      setBracket(prev => {
        const nb = prev.map(r => r.map(m => ({...m, sets: [...(m.sets||[])]})));
        otherResults.forEach(or => { if(animIdx<or.sets.length){const m=nb[simRound][or.idx];if(m.sets.length<=animIdx)m.sets.push(or.sets[animIdx])} });
        return nb;
      });
      animIdx++;
    }
  };
  
  ivRef.current = setInterval(tick, 1200);
}, [bracket, simRound, simRunning, tourney, player, energy, setBonus]);

// Advance to next round
const advanceRound = useCallback(() => {
  if (simRound + 1 >= (bracket?.length || 0)) {
    finishTourneyElifoot();
  } else {
    setSimRound(prev => prev + 1);
    setSimStep(0);
    setPlayerMatchResult(null);
  }
}, [simRound, bracket]);

// Cleanup interval
useEffect(() => () => { if (ivRef.current) clearInterval(ivRef.current) }, []);

const autoNextTourney=()=>{
if(!player)return;
setPrevRank(player.rank);
setTourney(null);
setTResults([]);
setActiveTab("jogar");
setNextOpponent(null);
setScreen("career");
};

// Get tournaments available this week based on rank
const getAvailableTourneys = useCallback((week, rank) => {
  const weekTourneys = CAL.filter(t => t.w === week);
  // Filter by rank eligibility
  return weekTourneys.filter(t => rank <= t.mr || t.mr === 9999);
}, []);

// Check for wildcard opportunity this week (called once per week transition)
const checkWildcard = useCallback((week, rank) => {
  const weekTourneys = CAL.filter(t => t.w === week);
  // Tournaments player can't enter by rank but could get wildcard
  const ineligible = weekTourneys.filter(t => rank > t.mr && t.mr !== 9999);
  if (ineligible.length === 0) return null;
  // 5% base chance, slightly higher if player has good record
  const wcChance = 0.05 + (player?.sW > 10 ? 0.02 : 0) + (player?.titles > 0 ? 0.03 : 0);
  if (Math.random() > wcChance) return null;
  // Pick the best tournament from ineligible ones (but not too far above rank)
  const reachable = ineligible.filter(t => rank <= t.mr * 1.8);
  if (reachable.length === 0) return null;
  // Prefer the highest level tournament
  const sorted = [...reachable].sort((a, b) => (b.pr || 0) - (a.pr || 0));
  return sorted[0];
}, [player]);

// Pick a specific tournament
const pickTourney = useCallback((t, isWildcard) => {
  if (!player) return;
  const cost = isWildcard ? 0 : getTourneyCost(t.lv);
  if (!isWildcard && player.money < cost) { notify("Sem dinheiro! Precisa de $" + cost); return; }
  if (injury > 0) { notify("Lesionado! " + injury + " semanas restantes"); return; }
  if (cost > 0) setPlayer(p => ({ ...p, money: p.money - cost }));
  if (isWildcard) { setWildcardTourney(null); setMoral(prev => Math.min(100, prev + 5)); }
  setTourney(t);
  setTRound(0);
  // Generate bracket immediately so VS card shows real opponent
  const playerOvr = getOvr(player);
  const b = genTourneyBracket(t, player.name, player.rank, playerOvr, player.favSurface, player.playstyle, rivals, player.country);
  setBracket(b);
  // Find player's first round opponent from bracket
  const playerMatch = b[0].find(m => m.hasPlayer);
  if (playerMatch) {
    const opp = playerMatch.p1.isPlayer ? playerMatch.p2 : playerMatch.p1;
    setNextOpponent(opp);
  }
}, [player, rivals, injury, getOvr]);

// Skip week (rest / injured) - but the WORLD keeps playing
const skipWeek = () => {
  const thisWeek = weeks[weekIdx] || 1;
  
  // Simulate rivals playing this week's tournaments
  const rvW = simRivalsWeek(rivals, thisWeek);
  const { newRank, newRivals } = rerank(rvW, player);
  
  const oldRank = player.rank;
  setPlayer(p => ({ ...p, rank: newRank }));
  setRivals(newRivals);
  
  // Advance week
  setWeekIdx(prev => prev + 1);
  setEnergy(prev => Math.min(100, prev + 20));
  setMoral(prev => Math.min(100, prev + 3)); // rest helps moral recovery
  setWildcardTourney(null); // wildcard expires when week is skipped
  if (injury > 0) { setInjury(prev => prev - 1); setMoral(prev => Math.max(8, prev - 3)); } // injury hurts moral
  
  // Show ranking update
  const delta = oldRank - newRank;
  if(delta>0)SFX.rankUp();else if(delta<0)SFX.rankDown();
  const topMovers = newRivals.slice().sort((a, b) => a.rank - b.rank).slice(0, 50);
  const randomMover = topMovers[~~(Math.random() * topMovers.length)];
  
  setPrevRank(oldRank);
  setRankingUpdate({
    oldRank,
    newRank,
    delta,
    mover: randomMover ? { name: randomMover.name, rank: randomMover.rank } : null,
    week: weeks[(weekIdx + 1) % weeks.length] || 1,
  });
  setScreen("ranking_update");
};

// ===== OVR PROGRESSION SYSTEM =====
function calcOvrChanges(playerData, bracket, tourney) {
  const rn = getRN(tourney.rd);
  const changes = [];
  let totalChange = 0;
  const ps = playerData.playstyle;
  
  for (let r = 0; r < bracket.length; r++) {
    const pm = bracket[r].find(m => m.hasPlayer);
    if (!pm) break;
    const pWon = (pm.p1.isPlayer && pm.winner === 1) || (pm.p2.isPlayer && pm.winner === 2);
    const opp = pm.p1.isPlayer ? pm.p2 : pm.p1;
    const rankDiff = opp.rank - playerData.rank;
    
    if (pWon) {
      let gain = 0;
      const highOvrPenalty = playerData.ovr > 80 ? 0.5 : playerData.ovr > 70 ? 0.75 : 1;
      if (rankDiff < -100) { gain = Math.random() < 0.4 * highOvrPenalty ? 1 : 0; }
      else if (rankDiff < -30) { gain = Math.random() < 0.25 * highOvrPenalty ? 1 : 0; }
      else if (rankDiff < 0) { gain = Math.random() < 0.15 * highOvrPenalty ? 1 : 0; }
      else { gain = 0; } // beat worse/similar = no OVR gain
      
      if (gain > 0) {
        changes.push({ reason: "Vitória vs #" + opp.rank + " (" + rn[r] + ")", value: gain, emoji: "\u2705" });
        totalChange += gain;
      }
    } else {
      let loss = 0;
      if (rankDiff > 100) { loss = -2; }
      else if (rankDiff > 30) { loss = Math.random() < 0.5 ? -1 : 0; }
      else { loss = 0; }
      
      if (loss < 0) {
        changes.push({ reason: "Derrota vs #" + opp.rank + " (" + rn[r] + ")", value: loss, emoji: "\u274C" });
        totalChange += loss;
      }
      break;
    }
  }
  
  // Title bonus (small)
  const roundsWon = bracket.reduce((acc, round) => {
    const pm = round.find(m => m.hasPlayer);
    if (!pm) return acc;
    const pWon = (pm.p1.isPlayer && pm.winner === 1) || (pm.p2.isPlayer && pm.winner === 2);
    return pWon ? acc + 1 : acc;
  }, 0);
  const isChampion = roundsWon === tourney.rd;
  
  if (isChampion) {
    let titleBonus = 1;
    if (tourney.lv === "M1000") titleBonus = 2;
    else if (tourney.lv === "GS" || tourney.lv === "Finals") titleBonus = 3;
    changes.push({ reason: "Título " + tourney.n, value: titleBonus, emoji: "\u{1F3C6}" });
    totalChange += titleBonus;
  }
  
  // Cap total change per tournament
  totalChange = Math.max(-3, Math.min(4, totalChange));
  
  return { changes, totalChange };
}

// After tournament ends (Elifoot version)
const finishTourneyElifoot = () => {
  if (!player || !bracket || !tourney) return;
  
  // Count how many rounds player won
  let roundsWon = 0;
  let isChampion = false;
  for (let r = 0; r < bracket.length; r++) {
    const pm = bracket[r].find(m => m.hasPlayer);
    if (!pm) break;
    const pWon = (pm.p1.isPlayer && pm.winner === 1) || (pm.p2.isPlayer && pm.winner === 2);
    if (pWon) roundsWon++;
    else break;
  }
  isChampion = roundsWon === tourney.rd;
  
  const pts = isChampion ? getPts(tourney.lv, tourney.rd, tourney.rd - 1) : getPts(tourney.lv, tourney.rd, roundsWon);
  const prize = isChampion ? tourney.pr : getPrize(tourney.pr, tourney.rd, roundsWon);
  
  // Calculate OVR changes with new system
  const ovrResult = calcOvrChanges(player, bracket, tourney);
  
  const updatedPlayer = { ...player, points: player.points + pts, money: player.money + prize + (player.sponsor?.pay||0) };
  updatedPlayer.ovr = Math.max(10, Math.min(99, updatedPlayer.ovr + ovrResult.totalChange));
  
  if (isChampion) {
    updatedPlayer.titles++;
    SFX.title();
    if (tourney.lv === "GS") updatedPlayer.gs++;
    setConsecutiveLosses(0);
  } else if (roundsWon === 0) {
    // Only count as bad loss if eliminated in 1st round
    setConsecutiveLosses(prev => prev + 1);
  } else {
    // Won at least 1 match = reset streak
    setConsecutiveLosses(0);
  }
  updatedPlayer.sW += roundsWon;
  updatedPlayer.sL += (playerEliminated ? 1 : 0);
  
  const rvW = simRivalsWeek(rivals, curWeek);
  const { newRank, newRivals } = rerank(rvW, updatedPlayer);
  updatedPlayer.rank = newRank;
  setPlayer(updatedPlayer);
  setRivals(newRivals);
  
  const moralBefore = moral;
  
  // Update moral based on tournament result
  if (isChampion) {
    setMoral(prev => Math.min(100, prev + 12));
  } else if (roundsWon >= tourney.rd - 1) {
    setMoral(prev => Math.min(100, prev + 6)); // lost in final
  } else if (roundsWon >= tourney.rd - 2) {
    setMoral(prev => Math.min(100, prev + 3)); // lost in semi
  } else if (roundsWon >= 2) {
    setMoral(prev => Math.min(100, prev + 2)); // good run (QF+)
  } else if (roundsWon === 1) {
    setMoral(prev => Math.max(8, prev - 2)); // 2nd round exit (softened)
  } else {
    setMoral(prev => Math.max(8, prev - 3)); // 1st round loss (softened)
  }
  
  // Win streak bonus
  if (roundsWon >= 3) {
    setMoral(prev => Math.min(100, prev + 3)); // bonus for deep run
  }
  
  // Passive moral: playing keeps you motivated (+1 just for competing)
  setMoral(prev => Math.min(100, prev + 1));
  
  // Extra moral penalties
  if (energy < 30) setMoral(prev => Math.max(8, prev - 2));
  if (ovrResult.totalChange < 0) setMoral(prev => Math.max(8, prev - 1));
  
  // Win streak tracking
  if (roundsWon >= 2) {
    setWinStreak(prev => {
      const ns = prev + 1;
      if (ns === 3) { setShowStreakPopup("3 boas campanhas seguidas!"); setMoral(p => Math.min(100, p + 5)); }
      if (ns === 5) { setShowStreakPopup("5 campanhas seguidas! Está voando!"); setMoral(p => Math.min(100, p + 8)); }
      if (ns === 8) { setShowStreakPopup("8 seguidas! Imbatível!"); setMoral(p => Math.min(100, p + 10)); }
      return ns;
    });
  } else {
    setWinStreak(0);
  }
  
  // Personal best tracking
  const lvl = tourney.lv;
  setPersonalBest(prev => {
    const old = prev[lvl] || 0;
    if (roundsWon > old && roundsWon >= 2) {
      const rdNames = getRN(tourney.rd);
      const rdName = rdNames[Math.min(roundsWon - 1, rdNames.length - 1)] || "Final";
      setShowPersonalBest("Recorde pessoal em " + (LL[lvl]||lvl) + ": " + rdName + "!");
      setMoral(p => Math.min(100, p + 4));
      return { ...prev, [lvl]: roundsWon };
    }
    return prev;
  });
  
  // Marcos challenge check
  if (marcosChallenge && roundsWon >= marcosChallenge.target) {
    setMoral(prev => Math.min(100, prev + 8));
    updatedPlayer.money += marcosChallenge.reward;
    setPlayer(prev => ({ ...prev, money: prev.money + marcosChallenge.reward }));
    setShowStreakPopup("Desafio do Marcos cumprido! +$" + marcosChallenge.reward);
    setMarcosChallenge(null);
  } else if (marcosChallenge) {
    setMarcosChallenge(null); // failed, remove
  }
  
  // Check achievements
  checkAchievements(updatedPlayer);
  
  // Build player results
  const rn = getRN(tourney.rd);
  const results = [];
  for (let r = 0; r < bracket.length; r++) {
    const pm = bracket[r].find(m => m.hasPlayer);
    if (!pm) break;
    const pWon = (pm.p1.isPlayer && pm.winner === 1) || (pm.p2.isPlayer && pm.winner === 2);
    const opp = pm.p1.isPlayer ? pm.p2 : pm.p1;
    const score = pm.sets.map(s => s[pm.p1.isPlayer ? 0 : 1] + "-" + s[pm.p1.isPlayer ? 1 : 0]).join(" ");
    results.push({ round: rn[r], rival: opp.name, rivalRank: opp.rank, won: pWon, score });
    if (!pWon) break;
  }
  setTResults(results);
  // Track rival who eliminated player
  const eliminatorMatch=results.find(r=>!r.won);
  if(eliminatorMatch)setLastEliminator({name:eliminatorMatch.rival,rank:eliminatorMatch.rivalRank});
  
  // Find tournament champion (winner of final match)
  let champion = null;
  const finalRound = bracket[bracket.length - 1];
  if (finalRound && finalRound[0] && finalRound[0].finished) {
    const fm = finalRound[0];
    champion = fm.winner === 1 ? fm.p1 : fm.p2;
  }
  
  // Find biggest upset (lowest ranked player beating highest ranked)
  let biggestUpset = null;
  let biggestDiff = 0;
  for (let r = 0; r < bracket.length; r++) {
    for (const m of bracket[r]) {
      if (!m.finished) continue;
      const w = m.winner === 1 ? m.p1 : m.p2;
      const l = m.winner === 1 ? m.p2 : m.p1;
      const diff = w.rank - l.rank;
      if (diff > biggestDiff) {
        biggestDiff = diff;
        biggestUpset = { winner: w, loser: l, round: rn[r] };
      }
    }
  }
  
  // Store summary for display (including OVR changes)
  setTourneySummary({ pts, prize, champion, biggestUpset, roundsWon, isChampion, ovrChanges: ovrResult.changes, ovrTotal: ovrResult.totalChange, moralBefore });
  
  // Energy drain: more rounds = more fatigue. Title run drains a lot.
  const energyDrain = roundsWon * 8 + (isChampion ? 15 : 5);
  setEnergy(prev => Math.max(0, prev - energyDrain));
  
  // Injury chance: higher when energy is low
  const injuryChance = energy < 30 ? 0.20 : energy < 50 ? 0.08 : 0.03;
  if (Math.random() < injuryChance && !isChampion) {
    const injuryWeeks = energy < 30 ? 2 + ~~(Math.random() * 3) : 1 + ~~(Math.random() * 2);
    setInjury(injuryWeeks);
  }
  
  // Track head-to-head with opponents
  const newH2h = { ...h2hLog };
  for (let r = 0; r < bracket.length; r++) {
    const pm = bracket[r].find(m => m.hasPlayer);
    if (!pm) break;
    const pWon = (pm.p1.isPlayer && pm.winner === 1) || (pm.p2.isPlayer && pm.winner === 2);
    const opp = pm.p1.isPlayer ? pm.p2 : pm.p1;
    if (!newH2h[opp.name]) newH2h[opp.name] = { w: 0, l: 0 };
    if (pWon) newH2h[opp.name].w++; else newH2h[opp.name].l++;
    if (!pWon) break;
  }
  setH2hLog(newH2h);
  
  setSLog(prev => [...prev, { name: tourney.n, level: tourney.lv, won: isChampion, rw: roundsWon, tr: tourney.rd, pts, prize }]);
  setBracket(null);
  setSimRound(0);
  setTempOvr(0); // reset temp bonuses after tournament
  setWildcardTourney(null); // clear any pending wildcard
  
  setScreen("tourney_end_elifoot");
};

// After tourney end screen, continue to next
const afterTourneyEnd = () => {
  // Advance week index
  setWeekIdx(prev => prev + 1);
  
  // Show ranking update popup
  const oldRank = prevRank;
  const newRank = player.rank;
  const delta = oldRank - newRank;
  if(delta>0)SFX.rankUp();else if(delta<0)SFX.rankDown();
  
  // Find a notable rival movement
  const topMovers = rivals.slice().sort((a,b) => a.rank - b.rank).slice(0, 50);
  const randomMover = topMovers[~~(Math.random() * topMovers.length)];
  
  setRankingUpdate({
    oldRank,
    newRank,
    delta,
    mover: randomMover ? { name: randomMover.name, rank: randomMover.rank } : null,
    week: weeks[(weekIdx + 1) % weeks.length] || 1,
  });
  setScreen("ranking_update");
};

// State for ranking update popup
const[rankingUpdate,setRankingUpdate]=useState(null);

const afterEvt=()=>{setRndEvt(null);if(!player)return;setTourney(null);setActiveTab("jogar");setScreen("career")};

const endSeason=()=>{
const newAge = player.age + 1;
setPlayer(p=>({...p,age:newAge}));
setRivals(prev=>{const ev=prev.map(r=>{
const sg=r.rank<=10?~~(Math.random()*3000)+2000:r.rank<=30?~~(Math.random()*1500)+800:r.rank<=80?~~(Math.random()*800)+300:r.rank<=150?~~(Math.random()*400)+100:r.rank<=300?~~(Math.random()*150)+30:~~(Math.random()*40)+5;
return{...r,skill:Math.max(20,Math.min(99,r.skill+~~(Math.random()*3-1))),points:Math.max(3,~~(r.points*0.35)+sg)}});ev.sort((a,b)=>b.points-a.points);ev.forEach((r,i)=>{r.rank=i+1});return ev});
if(newAge>=39){setScreen("retirement")}else{setScreen("season_end")}
};
const nextSeason=()=>{setSeason(s=>s+1);setWeekIdx(0);setSLog([]);setEnergy(100);setInjury(0);setPlayer(p=>({...p,sW:0,sL:0,points:Math.max(5,~~(p.points*0.35))}));setTourney(null);setActiveTab("jogar");setScreen("career")};
const buyRacket=r=>{if(!player||player.money<r.price){notify("Sem grana!");return}setPlayer(p=>({...p,money:p.money-r.price,racket:r}));setMoral(prev=>Math.min(100,prev+3));SFX.buy();notify(r.name+" equipada!")};
const buyShoes=s=>{if(!player||player.money<s.price){notify("Sem grana!");return}setPlayer(p=>({...p,money:p.money-s.price,shoes:s}));setMoral(prev=>Math.min(100,prev+2));SFX.buy();notify(s.name+" equipado!")};
const buyTrainer=t=>{if(!player||player.money<t.price){notify("Sem grana!");return}setPlayer(p=>({...p,money:p.money-t.price,trainer:t}));setMoral(prev=>Math.min(100,prev+3));SFX.buy();notify(t.name+" contratado!")};
const buyCourt=c=>{if(!player||player.money<c.price){notify("Sem grana!");return}setPlayer(p=>({...p,money:p.money-c.price,court:c}));setMoral(prev=>Math.min(100,prev+3));SFX.buy();notify(c.name+" desbloqueada!")};
const buyConsumable=item=>{if(!player||player.money<item.price){notify("Sem grana!");return}
setPlayer(p=>({...p,money:p.money-item.price}));
if(item.energy===100){setEnergy(100)}else{setEnergy(prev=>Math.min(100,prev+item.energy))}
setMoral(prev=>Math.min(100,prev+item.moral));
notify("+"+item.energy+" energia, +"+item.moral+" moral!");
SFX.buy();
};
const signSponsor=s=>{if(!player||(player.rank>s.mr&&s.mr<9999)){notify("Ranking insuficiente!");return}setPlayer(p=>({...p,sponsor:s}));notify(s.name+"!")};

const ctn={
width:"100%",
maxWidth:480,
margin:"0 auto",
minHeight:"100vh",
background:"radial-gradient(circle at top, #171b31 0%, #0b0e1b 45%, #070714 100%)",
fontFamily:"'Press Start 2P',monospace",
color:UI.text,
position:"relative",
overflowX:"hidden",
overflowY:"auto",
boxShadow:"0 0 0 1px rgba(255,255,255,0.03), 0 24px 60px rgba(0,0,0,0.35)"
};

const scan={
position:"fixed",
top:0,
left:0,
right:0,
bottom:0,
background:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.05) 3px,rgba(0,0,0,0.05) 6px)",
pointerEvents:"none",
zIndex:1000,
opacity:0.45
};

// ===== TITLE =====
if(screen==="title")return(<div style={ctn}><div style={scan}/><div style={{padding:20,textAlign:"center",paddingTop:30,minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center"}}>

{/* Pixel art court background */}
<div style={{position:"relative",marginBottom:20}}>
<svg width="100%" viewBox="0 0 320 140" style={{borderRadius:8,overflow:"hidden"}}>
{/* Court surface */}
<rect width="320" height="140" fill="#c4612d"/>
{/* Court lines */}
<rect x="20" y="10" width="280" height="120" fill="none" stroke="#fff" strokeWidth="2" rx="2"/>
<line x1="160" y1="10" x2="160" y2="130" stroke="#fff" strokeWidth="2"/>
<rect x="60" y="10" width="200" height="120" fill="none" stroke="#fff" strokeWidth="1.5"/>
<rect x="60" y="45" width="200" height="50" fill="none" stroke="#fff" strokeWidth="1"/>
{/* Net */}
<line x1="160" y1="5" x2="160" y2="135" stroke="#333" strokeWidth="3"/>
<line x1="155" y1="5" x2="155" y2="135" stroke="#888" strokeWidth="1" strokeDasharray="3,3"/>
<line x1="165" y1="5" x2="165" y2="135" stroke="#888" strokeWidth="1" strokeDasharray="3,3"/>
{/* Net posts */}
<rect x="154" y="2" width="12" height="6" rx="1" fill="#aaa"/>
<rect x="154" y="132" width="12" height="6" rx="1" fill="#aaa"/>
{/* Tennis balls scattered */}
<circle cx="80" cy="35" r="5" fill="#ccff00" stroke="#999" strokeWidth="0.5"/>
<path d="M77,35 Q80,31 83,35" fill="none" stroke="#fff" strokeWidth="0.8"/>

{/* Racket pixel art */}

</svg>
</div>


<div style={{fontFamily:"'Press Start 2P',monospace",fontSize:28,color:"#fff",textShadow:"3px 3px 0 #2d6bc4",marginTop:10}}>TENNIS</div>
<div style={{fontFamily:"'Press Start 2P',monospace",fontSize:14,color:"#ffd700",textShadow:"2px 2px 0 #b8860b",marginBottom:6}}>CAREER 26</div>
<Px size={6} color="#666" style={{letterSpacing:2}}>SIMULADOR DE CARREIRA PROFISSIONAL</Px>

<div style={{display:"flex",gap:8,justifyContent:"center",margin:"20px 0"}}>
{["ITF","CH","PRO","GS"].map((e,i)=>(<div key={i} style={{width:44,height:44,background:"rgba(255,255,255,0.04)",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid #222"}}><Px size={7} color={["#888","#d4a824","#2d6bc4","#ffd700"][i]}>{e}</Px></div>))}
</div>
<Btn onClick={()=>{setSetupStep(0);setDialogIdx(0);setScreen("newgame")}} color="#c4612d" style={{padding:"14px 16px",fontSize:11}}>NOVA CARREIRA</Btn>
<Btn onClick={()=>{loadGame().then(ok=>{if(!ok)notify("Nenhum jogo salvo")})}} color="#2d8c3c" style={{marginTop:8}}>JOGO SALVO</Btn>
<Btn onClick={()=>setScreen("howto")} color="#2d6bc4" style={{marginTop:8}}>COMO JOGAR</Btn>

<div style={{marginTop:24,paddingTop:12,borderTop:"1px solid #1a1a2e"}}>
<Px size={6} color="#555" style={{display:"block"}}>© 2026 Thomaz Gouvea. Todos os direitos reservados.</Px>
<Px size={6} color="#555" style={{display:"block",marginTop:4}}>Tennis Career 26 — Versão 1.0</Px>
<Px size={6} color="#555" style={{display:"block",marginTop:3}}>Proibida a reprodução total ou parcial sem autorização.</Px>
</div>
</div><style>{CSS}</style></div>);

// ===== HOW TO PLAY =====
if(screen==="howto")return(<div style={ctn}><div style={scan}/><div style={{padding:20,paddingTop:30,paddingBottom:30}}>
<div style={{textAlign:"center",marginBottom:14}}>
<div style={{fontSize:28,marginBottom:4}}>{"\u{1F3BE}"}</div>
<Px size={10} color="#ffd700">COMO JOGAR</Px>
</div>
<div style={{background:"#0a0a18",border:"1px solid #333",borderRadius:4,padding:12,marginBottom:10}}>
<Px size={6} color="#aaa" style={{display:"block",lineHeight:2.2}}>
Você é um tenista de 19 anos buscando o topo do ranking profissional. Jogue torneios, suba no ranking e invista em equipamentos.
</Px></div>

{[
["\u{1F3BE}","OVERALL","Seu nível como tenista. Sobe ao vencer e comprar equipamentos na Loja.","#fbbf24"],
["\u{1F4CA}","RANKING","Depende dos pontos. Ranking melhor = torneios maiores e patrocinadores melhores.","#ffd700"],
["\u{1F4B0}","DINHEIRO","Ganhe prêmios e patrocínios. Invista na Loja pra ficar mais forte.","#4ade80"],
["\u26A1","ENERGIA","Jogar cansa. Descanse entre torneios. Energia baixa = risco de lesão.","#f87171"],
["\u{1F604}","MORAL","Seu estado mental. Vitórias sobem, derrotas descem. Moral alta = joga melhor.","#60a5fa"],
["\u{1F3AF}","DESAFIOS","O Marcos propõe desafios semanais. Cumprir dá bônus de moral e dinheiro.","#a855f7"],
["\u{1F3C6}","CONQUISTAS","Alcance marcos como Top 400, Top 300, etc. Seu nome ganha títulos especiais.","#ffd700"],
].map(([ico,title,desc,color],i)=>(
<div key={i} style={{background:"#0a0a18",border:"1px solid #1a1a2e",borderRadius:4,padding:"10px 12px",marginBottom:6,display:"flex",gap:10,alignItems:"flex-start"}}>
<span style={{fontSize:18,flexShrink:0,marginTop:2}}>{ico}</span>
<div>
<Px size={7} color={color} style={{display:"block"}}>{title}</Px>
<Px size={6} color="#888" style={{display:"block",marginTop:3,lineHeight:2.2}}>{desc}</Px>
</div>
</div>
))}

<Btn onClick={()=>setScreen("title")} color="#222" style={{marginTop:6}}>VOLTAR</Btn>
</div><style>{CSS}</style></div>);

// ===== NEW GAME =====
if(screen==="newgame"){
const genBR=()=>{const fn=["Thomaz","Gustavo","Rafael","Lucas","Pedro","Gabriel","Felipe","Bruno","Leonardo","Eduardo"];const ln=["Silva","Santos","Oliveira","Costa","Ferreira","Almeida","Ribeiro","Gomes","Rocha","Lima"];return fn[~~(Math.random()*fn.length)]+" "+ln[~~(Math.random()*ln.length)]};
const dialogBox=(speaker,text)=>(
<div style={{animation:"fadeIn 0.4s"}}><div style={{background:"#0a0a18",border:"2px solid #444",borderRadius:2,padding:16,marginBottom:12,boxShadow:"0 0 8px rgba(45,107,196,0.15),inset 0 0 0 1px #1a1a2e"}}>
<Px size={6} color="#ffd700" style={{display:"block",marginBottom:8}}>{speaker}</Px>
<Typewriter text={text} size={8} color="#ddd"/>
</div></div>);

return(<div style={ctn}><div style={scan}/><div style={{padding:20,paddingTop:30,minHeight:"90vh",display:"flex",flexDirection:"column",justifyContent:"center"}}>

{setupStep===0&&(()=>{
const lines=["E aí, craque! Prazer em te conhecer. Me disseram que você tem muito potencial.","Então você quer ser o número 1 do mundo? Gosto dessa ambição!","Eu tenho o que é preciso pra te guiar até o topo.","O caminho é longo e difícil, mas juntos a gente chega lá. Bora?"];
const curLine=lines[Math.min(dialogIdx,lines.length-1)];
const isLast=dialogIdx>=lines.length-1;
return(<div style={{animation:"fadeIn 0.4s",display:"flex",flexDirection:"column",flex:1}}>

{/* Court scene - same as title screen */}
<div style={{borderRadius:8,overflow:"hidden",marginBottom:20,border:"1px solid #1a1a2e"}}>
<svg width="100%" viewBox="0 0 320 140" style={{display:"block",borderRadius:8}}>
<rect width="320" height="140" fill="#c4612d"/>
<rect x="20" y="10" width="280" height="120" fill="none" stroke="#fff" strokeWidth="2" rx="2"/>
<line x1="160" y1="10" x2="160" y2="130" stroke="#fff" strokeWidth="2"/>
<rect x="60" y="10" width="200" height="120" fill="none" stroke="#fff" strokeWidth="1.5"/>
<rect x="60" y="45" width="200" height="50" fill="none" stroke="#fff" strokeWidth="1"/>
<line x1="160" y1="5" x2="160" y2="135" stroke="#333" strokeWidth="3"/>
<line x1="155" y1="5" x2="155" y2="135" stroke="#888" strokeWidth="1" strokeDasharray="3,3"/>
<line x1="165" y1="5" x2="165" y2="135" stroke="#888" strokeWidth="1" strokeDasharray="3,3"/>
<rect x="154" y="2" width="12" height="6" rx="1" fill="#aaa"/>
<rect x="154" y="132" width="12" height="6" rx="1" fill="#aaa"/>
<circle cx="80" cy="35" r="5" fill="#ccff00" stroke="#999" strokeWidth="0.5"/>
<path d="M77,35 Q80,31 83,35" fill="none" stroke="#fff" strokeWidth="0.8"/>


</svg>
</div>

{/* Dialog box */}
<div style={{background:"linear-gradient(180deg,#0a0a20,#0a0a18)",border:"2px solid #ffd700",borderRadius:8,padding:16,marginBottom:20,position:"relative",boxShadow:"0 0 20px rgba(255,215,0,0.08)"}}>
<div style={{position:"absolute",top:-10,left:16,background:"#0a0a20",padding:"0 10px"}}><Px size={6} color="#ffd700">TREINADOR MARCOS</Px></div>
<div key={dialogIdx} style={{marginTop:6,animation:"textFadeIn 0.5s"}}><Px size={8} color="#fff" style={{display:"block",lineHeight:2.6}}>{curLine}</Px></div>
</div>

{/* Marcos centered - bigger with more spacing */}
<div style={{textAlign:"center",marginBottom:24,marginTop:4}}>
<div style={{display:"inline-block",}}>
<MarcosLarge/>
</div>
<div style={{marginTop:8}}><Px size={6} color="#666">Treinador Marcos</Px></div>
</div>

{/* Buttons */}
<div style={{display:"flex",gap:12,justifyContent:"center"}}>
{!isLast&&(<>
<button onClick={()=>{if(dialogIdx>0)setDialogIdx(d=>d-1);else setScreen("title")}} style={{fontFamily:"'Press Start 2P',monospace",fontSize:9,padding:"12px 24px",background:"#0a0a18",color:"#888",border:"2px solid #333",borderRadius:6,cursor:"pointer"}}>VOLTAR</button>
<button onClick={()=>setDialogIdx(d=>d+1)} style={{fontFamily:"'Press Start 2P',monospace",fontSize:9,padding:"12px 24px",background:"#1a3a6e",color:"#fff",border:"2px solid #2d5a8e",borderRadius:6,cursor:"pointer"}}>PRÓXIMO</button>
</>)}
{isLast&&(<div style={{animation:"fadeIn 0.4s",width:"100%"}}><Btn onClick={()=>setSetupStep(1)} color="#2d8c3c" style={{padding:"12px 16px",fontSize:10}}>VAMOS NESSA</Btn><Btn onClick={()=>setScreen("title")} color="#222" style={{marginTop:10}}>MENU</Btn></div>)}
</div>
<div style={{textAlign:"center",marginTop:10}}><Px size={6} color="#444">1 / 3</Px></div>
</div>);
})()}

{setupStep===1&&(<div style={{animation:"fadeIn 0.4s"}}>
<div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:16}}><div style={{flexShrink:0}}><CoachSmall/></div>{dialogBox("TREINADOR MARCOS","Bom, agora me conta sobre você.")}</div>
<Px size={8} color="#ffd700" style={{display:"block",marginBottom:8}}>NOME</Px>
<div style={{display:"flex",gap:6,marginBottom:24}}>
<input value={pName} onChange={e=>setPName(e.target.value)} maxLength={12} placeholder="Seu nome..." style={{flex:1,padding:14,fontFamily:"'Press Start 2P',monospace",fontSize:10,background:"#0a0a16",color:"#fff",border:"2px solid #333",borderRadius:3,boxSizing:"border-box"}}/>
<button onClick={()=>setPName(genBR())} style={{fontFamily:"'Press Start 2P',monospace",fontSize:12,padding:"10px 14px",background:"#1a1a2e",color:"#4ade80",border:"2px solid #333",borderRadius:3,cursor:"pointer"}} title="Nome aleatorio">{"\u{1F3B2}"}</button>
</div>
<Px size={8} color="#ffd700" style={{display:"block",marginBottom:8}}>NACIONALIDADE</Px>
<div style={{display:"flex",gap:6,marginBottom:24,flexWrap:"wrap"}}>
{COUNTRIES.map(c=>(<button key={c.id} onClick={()=>setCCountry(c.id)} style={{fontFamily:"'Press Start 2P',monospace",fontSize:7,padding:"8px 10px",background:cCountry===c.id?"#222":"#0a0a16",color:cCountry===c.id?"#fff":"#555",border:cCountry===c.id?"2px solid #ffd700":"2px solid #222",borderRadius:3,cursor:"pointer",transition:"all 0.15s"}}>{c.flag} {c.name}</button>))}
</div>
<Px size={8} color="#ffd700" style={{display:"block",marginBottom:8}}>MÃO DOMINANTE</Px>
<div style={{display:"flex",gap:8,marginBottom:24}}>
{[{id:"destro",label:"Destro",desc:"Classico, maioria dos pro"},{id:"canhoto",label:"Canhoto",desc:"Ângulos diferentes"}].map(h=>(<button key={h.id} onClick={()=>setCHand(h.id)} style={{fontFamily:"'Press Start 2P',monospace",fontSize:7,padding:"12px 10px",background:cHand===h.id?"#222":"#0a0a16",color:cHand===h.id?"#ffd700":"#555",border:cHand===h.id?"2px solid #ffd700":"2px solid #222",borderRadius:3,cursor:"pointer",flex:1,textAlign:"center",transition:"all 0.15s"}}><span style={{display:"block",fontSize:8,color:cHand===h.id?"#ffd700":"#aaa"}}>{h.label}</span><span style={{display:"block",fontSize:6,color:"#666",marginTop:6}}>{h.desc}</span></button>))}
</div>
<Px size={8} color="#ffd700" style={{display:"block",marginBottom:8}}>BACKHAND</Px>
<div style={{display:"flex",gap:8,marginBottom:28}}>
{[{id:"uma",label:"Uma mão",desc:"Mais alcance e spin"},{id:"duas",label:"Duas mãos",desc:"Mais consistência"}].map(h=>(<button key={h.id} onClick={()=>setCBackhand(h.id)} style={{fontFamily:"'Press Start 2P',monospace",fontSize:7,padding:"12px 10px",background:cBackhand===h.id?"#222":"#0a0a16",color:cBackhand===h.id?"#ffd700":"#555",border:cBackhand===h.id?"2px solid #ffd700":"2px solid #222",borderRadius:3,cursor:"pointer",flex:1,textAlign:"center",transition:"all 0.15s"}}><span style={{display:"block",fontSize:8,color:cBackhand===h.id?"#ffd700":"#aaa"}}>{h.label}</span><span style={{display:"block",fontSize:6,color:"#666",marginTop:6}}>{h.desc}</span></button>))}
</div>
<div style={{display:"flex",gap:8}}>
<Btn onClick={()=>setSetupStep(0)} color="#222" style={{flex:1}}>VOLTAR</Btn>
<Btn onClick={()=>{if(pName.trim()){setSetupStep(2)}else{setShowNamePopup(true)}}} color="#2d8c3c" style={{flex:1}}>PRÓXIMO</Btn>
</div>
{showNamePopup&&(<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setShowNamePopup(false)}>
<div onClick={e=>e.stopPropagation()} style={{background:"#0a0a18",border:"2px solid #ffd700",borderRadius:6,padding:20,maxWidth:320,width:"100%",textAlign:"center"}}>
<Px size={8} color="#ffd700" style={{display:"block",marginBottom:12}}>ESQUECEU O NOME!</Px>
<Btn onClick={()=>{setPName(genBR());setShowNamePopup(false)}} color="#2d8c3c" style={{marginBottom:8}}>GERAR NOME</Btn>
<Btn onClick={()=>setShowNamePopup(false)} color="#222">EU ESCOLHO</Btn>
</div></div>)}
<div style={{textAlign:"center",marginTop:12}}><Px size={6} color="#444">2 / 3</Px></div>
</div>)}

{setupStep===2&&(<div style={{animation:"fadeIn 0.4s"}}>
<div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:12}}><div style={{flexShrink:0}}><CoachSmall/></div>{dialogBox("TREINADOR MARCOS","Estamos quase lá...")}</div>
<Px size={8} color="#ffd700" style={{display:"block",marginBottom:8}}>MENTALIDADE</Px>
<div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:20}}>
{[{id:"ambicioso",icon:"\u{1F525}",label:"Ambicioso",desc:"Sobe OVR mais rápido, mas cai mais"},{id:"calmo",icon:"\u{1F9CA}",label:"Calmo",desc:"Perde menos OVR nas derrotas"},{id:"guerreiro",icon:"\u{1F6E1}\uFE0F",label:"Guerreiro",desc:"+OVR em jogos contra rank similar"},{id:"instável",icon:"\u26A1",label:"Intenso",desc:"+OVR em upsets, mas instável"},{id:"clutch",icon:"\u{1F3AF}",label:"Clutch",desc:"+OVR em semis e finais"}].map(p=>(<button key={p.id} onClick={()=>setCPlaystyle(p.id)} style={{fontFamily:"'Press Start 2P',monospace",fontSize:7,padding:"10px 12px",background:cPlaystyle===p.id?"#1a1a0a":"#0a0a16",color:cPlaystyle===p.id?"#ffd700":"#888",border:cPlaystyle===p.id?"2px solid #ffd700":"2px solid #222",borderRadius:3,cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}><span style={{marginRight:8}}>{p.icon}</span><span style={{color:cPlaystyle===p.id?"#ffd700":"#ccc",fontSize:8}}>{p.label}</span><span style={{display:"block",fontSize:6,color:"#555",marginTop:4,paddingLeft:22}}>{p.desc}</span></button>))}
</div>
<Px size={8} color="#ffd700" style={{display:"block",marginBottom:8}}>PISO FAVORITO</Px>
<div style={{display:"flex",gap:6,marginBottom:20}}>
{[{id:"clay",label:"Saibro",icon:"\u{1F7E4}",color:"#c4612d"},{id:"hard",label:"Dura",icon:"\u{1F535}",color:"#2d6bc4"},{id:"grass",label:"Grama",icon:"\u{1F7E2}",color:"#2d8c3c"}].map(s=>(
<button key={s.id} onClick={()=>setCSurface(s.id)} style={{fontFamily:"'Press Start 2P',monospace",fontSize:7,padding:"10px 6px",background:cSurface===s.id?s.color+"22":"#0a0a16",color:cSurface===s.id?s.color:"#555",border:cSurface===s.id?"2px solid "+s.color:"2px solid #222",borderRadius:3,cursor:"pointer",flex:1,textAlign:"center",transition:"all 0.15s"}}><span style={{fontSize:16,display:"block"}}>{s.icon}</span><span style={{display:"block",marginTop:2}}>{s.label}</span></button>
))}
</div>
<Px size={8} color="#ffd700" style={{display:"block",marginBottom:8}}>SUA RAQUETE</Px>
<div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>
{RACKET_BRANDS.map(b=>(<button key={b.id} onClick={()=>setCRacketBrand(b.id)} style={{fontFamily:"'Press Start 2P',monospace",fontSize:6,padding:"10px 4px",background:cRacketBrand===b.id?b.color+"22":"#0a0a16",color:cRacketBrand===b.id?b.color:"#555",border:cRacketBrand===b.id?"2px solid "+b.color:"2px solid #222",borderRadius:3,cursor:"pointer",transition:"all 0.15s",flex:1,textAlign:"center"}}>{b.name}</button>))}
</div>
<div style={{display:"flex",gap:8,marginTop:16}}>
<Btn onClick={()=>setSetupStep(1)} color="#222" style={{flex:1}}>VOLTAR</Btn>
<Btn onClick={startGame} color="#2d8c3c" style={{flex:1}}>PRÓXIMO</Btn>
</div>
<div style={{textAlign:"center",marginTop:10}}><Px size={6} color="#444">3 / 3</Px></div>
</div>)}

</div><style>{CSS}</style></div>);
}

if(!player)return null;
const pFlag=COUNTRIES.find(c=>c.id===player.country)?.flag||"\u{1F1E7}\u{1F1F7}";

// ===== RANKING UPDATE (Monday popup) =====
if(screen==="ranking_update"&&rankingUpdate){
const{oldRank,newRank,delta,mover,week}=rankingUpdate;
const weekDate=weekToDate(week);
const afterRankingUpdate=()=>{
  setRankingUpdate(null);
  setPrevRank(newRank);
  
  // Tournament unlock notifications
  const unlocks = [
    { rank: 380, name: "Challenger 75" },
    { rank: 350, name: "Challenger 100" },
    { rank: 300, name: "Challenger 175" },
    { rank: 120, name: "Pro 250" },
    { rank: 105, name: "Grand Slam" },
    { rank: 80, name: "Pro 500" },
    { rank: 55, name: "Masters 1000" },
  ];
  const oldR = rankingUpdate.oldRank || 500;
  unlocks.forEach(u => {
    if (oldR > u.rank && newRank <= u.rank) {
      notify("\u{1F513} " + u.name + " desbloqueado!");
      setMoral(prev => Math.min(100, prev + 5));
    }
  });
  
  // Moral reacts to ranking changes
  if (delta > 10) setMoral(prev => Math.min(100, prev + 5)); // big jump up
  else if (delta > 0) setMoral(prev => Math.min(100, prev + 1)); // small rise
  else if (delta < -10) setMoral(prev => Math.max(8, prev - 5)); // big drop
  else if (delta < 0) setMoral(prev => Math.max(8, prev - 2)); // small drop
  
  // Check if a better sponsor is now available
  const currentPay = player.sponsor?.pay || 0;
  const available = SPONSORS.filter(s => newRank <= s.mr && s.pay > currentPay && s.id !== player.sponsor?.id);
  const bestOffer = available.length > 0 ? available[available.length - 1] : null;
  
  if (bestOffer) {
    setSponsorOffer(bestOffer);
    setScreen("sponsor_offer");
    return;
  }
  
  // Season ends when we reach week 44+ (November)
  const currentW = weeks[weekIdx] || 1;
  if(currentW >= 44){endSeason()}
  else if(Math.random()<0.25){
    const e=EVT[~~(Math.random()*EVT.length)];
    setRndEvt(e);
    setPlayer(p=>{const np={...p};np.ovr=Math.max(10,Math.min(99,np.ovr+e.v));return np});
    setScreen("event");
  }else{
    setTourney(null);
    setActiveTab("jogar");
    if(consecutiveLosses>=4){setShowLossTip(true)}
    // Check for wildcard opportunity
    const nextW = weeks[weekIdx] || 1;
    const wc = checkWildcard(nextW, newRank);
    setWildcardTourney(wc);
    if(wc) SFX.wildcard();
    if(!marcosChallenge && Math.random() < 0.28){
      const challenges=[
        {desc:"Chegue às quartas!",target:2,reward:200},
        {desc:"Chegue à semi!",target:3,reward:350},
        {desc:"Chegue à final!",target:4,reward:500},
        {desc:"Ganhe 2 partidas!",target:2,reward:200},
      ];
      setMarcosChallenge(challenges[~~(Math.random()*challenges.length)]);
    }
    setScreen("career");
  }
};
return(<div style={ctn}><div style={scan}/><div style={{padding:20,paddingTop:24,textAlign:"center",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center"}}>
<Px size={8} color="#aaa" style={{letterSpacing:2}}>SEGUNDA-FEIRA</Px>
<div style={{marginTop:6,marginBottom:16}}><Px size={9} color="#ccc">{weekDate}</Px></div>
{rankingUpdate.weeksSkipped>1&&<Px size={7} color="#666" style={{display:"block",marginBottom:10}}>{rankingUpdate.weeksSkipped} semanas simuladas</Px>}
<div style={{fontSize:36,marginBottom:8}}>{"\u{1F4CA}"}</div>
<Px size={14} color="#ffd700" style={{display:"block",marginBottom:18}}>RANKING ATUALIZADO</Px>

{/* Rank change - BIG */}
<div style={{background:"#0a0a18",border:"2px solid "+(delta>0?"#4ade8044":delta<0?"#f8717144":"#333"),borderRadius:6,padding:20,marginBottom:14}}>
<div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:18,marginBottom:10}}>
<Px size={12} color="#888">#{oldRank}</Px>
<Px size={16} color={delta>0?"#4ade80":delta<0?"#f87171":"#888"}>{"\u2192"}</Px>
<Px size={22} color={delta>0?"#4ade80":delta<0?"#f87171":"#fff"}>#{newRank}</Px>
</div>
{delta!==0&&(
<div style={{padding:"8px 18px",background:delta>0?"#0a1a0a":"#1a0a0a",borderRadius:6,display:"inline-block",border:"1px solid "+(delta>0?"#4ade8044":"#f8717144")}}>
<Px size={9} color={delta>0?"#4ade80":"#f87171"}>{delta>0?"\u2191 Subiu "+delta+" posições":"\u2193 Caiu "+Math.abs(delta)+" posições"}</Px>
</div>
)}
{delta===0&&<Px size={8} color="#888">Ranking mantido</Px>}
</div>

{/* Player quick stats */}
<div style={{display:"flex",gap:6,marginBottom:14}}>
<div style={{flex:1,background:"#0a0a18",border:"1px solid #222",borderRadius:6,padding:"10px 6px",textAlign:"center"}}>
<Px size={6} color="#888" style={{display:"block",marginBottom:4}}>RECORD</Px>
<Px size={10} color="#fff">{player.sW}V-{player.sL}D</Px>
</div>
<div style={{flex:1,background:"#0a0a18",border:"1px solid #222",borderRadius:6,padding:"10px 6px",textAlign:"center"}}>
<Px size={6} color="#888" style={{display:"block",marginBottom:4}}>TÍTULOS</Px>
<Px size={10} color="#ffd700">{player.titles}</Px>
</div>
<div style={{flex:1,background:"#0a0a18",border:"1px solid #222",borderRadius:6,padding:"10px 6px",textAlign:"center"}}>
<Px size={6} color="#888" style={{display:"block",marginBottom:4}}>OVR</Px>
<Px size={10} color="#fbbf24">{getOvr(player)}</Px>
</div>
</div>

{/* Highlights */}
<div style={{background:"#0a0a18",border:"1px solid #222",borderRadius:6,padding:"12px 14px",marginBottom:14,textAlign:"left"}}>
<Px size={7} color="#ffd700" style={{display:"block",marginBottom:8}}>DESTAQUES</Px>
{mover&&<Px size={7} color="#aaa" style={{display:"block",marginBottom:4}}>{"\u{1F4E2}"} {mover.name} agora é #{mover.rank}</Px>}
{player.titles>0&&<Px size={7} color="#aaa" style={{display:"block",marginBottom:4}}>{"\u{1F3C6}"} Você tem {player.titles} título{player.titles>1?"s":""}</Px>}
{winStreak>=2&&<Px size={7} color="#fbbf24" style={{display:"block",marginBottom:4}}>{"\u{1F525}"} {winStreak} boas campanhas seguidas</Px>}
{marcosChallenge&&<Px size={7} color="#60a5fa" style={{display:"block",marginBottom:4}}>{"\u{1F3AF}"} Desafio: {marcosChallenge.desc}</Px>}
{delta>20&&<Px size={7} color="#4ade80" style={{display:"block"}}>{"\u{1F680}"} Grande subida no ranking!</Px>}
{delta<-20&&<Px size={7} color="#f87171" style={{display:"block"}}>{"\u{1F4A1}"} Hora de focar nos treinos</Px>}
{!mover&&!marcosChallenge&&delta===0&&<Px size={7} color="#666" style={{display:"block"}}>Semana tranquila no circuito</Px>}
</div>

<Btn onClick={afterRankingUpdate} color="#2d8c3c" style={{fontSize:11,padding:"16px 16px"}}>CONTINUAR</Btn>
</div><style>{CSS}</style></div>);
}

// ===== SPONSOR OFFER =====
if(screen==="sponsor_offer"&&sponsorOffer){
const continueSponsor=()=>{
  setSponsorOffer(null);
  const currentW = weeks[weekIdx] || 1;
  if(currentW >= 44){endSeason()}
  else if(Math.random()<0.25){
    const e=EVT[~~(Math.random()*EVT.length)];
    setRndEvt(e);
    setPlayer(p=>{const np={...p};np.ovr=Math.max(10,Math.min(99,np.ovr+e.v));return np});
    setScreen("event");
  }else{setTourney(null);setActiveTab("jogar");const wc=checkWildcard(weeks[weekIdx]||1,player.rank);setWildcardTourney(wc);if(wc)SFX.wildcard();setScreen("career")}
};
return(<div style={ctn}><div style={scan}/><div style={{padding:20,paddingTop:30,textAlign:"center",minHeight:"90vh",display:"flex",flexDirection:"column",justifyContent:"center"}}>
<div style={{fontSize:36,marginBottom:6}}>{"\u{1F4E9}"}</div>
<Px size={10} color="#ffd700" style={{display:"block",marginBottom:6}}>NOVA PROPOSTA</Px>
<Px size={7} color="#888" style={{display:"block",marginBottom:16}}>Seu ranking chamou atenção</Px>

<div style={{background:"#0a0a18",border:"2px solid #ffd700",borderRadius:6,padding:20,marginBottom:12}}>
<Px size={12} color="#fff" style={{display:"block",marginBottom:6}}>{sponsorOffer.name}</Px>
<Px size={6} color="#888" style={{display:"block",marginBottom:10}}>{sponsorOffer.desc}</Px>
<div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:8}}>
<div style={{background:"#111",borderRadius:4,padding:"8px 14px"}}><Px size={6} color="#888">POR TORNEIO</Px><div style={{marginTop:3}}><Px size={12} color="#4ade80">${sponsorOffer.pay.toLocaleString()}</Px></div></div>
<div style={{background:"#111",borderRadius:4,padding:"8px 14px"}}><Px size={6} color="#888">BÔNUS PRÊMIO</Px><div style={{marginTop:3}}><Px size={12} color="#fbbf24">+{sponsorOffer.bonus}%</Px></div></div>
</div>
<Px size={6} color="#555">Requer: Top {sponsorOffer.mr}</Px>
</div>

<div style={{background:"#0a0a18",border:"1px solid #333",borderRadius:4,padding:10,marginBottom:12,textAlign:"left"}}>
<Px size={6} color="#888">Patrocinador atual: <Px size={6} color="#fff">{player.sponsor?.name}</Px></Px>
<div style={{marginTop:3}}><Px size={6} color="#888">${player.sponsor?.pay}/torneio {"\u00B7"} +{player.sponsor?.bonus}% bônus</Px></div>
</div>

<Btn onClick={()=>{setPlayer(p=>({...p,sponsor:sponsorOffer}));notify("Contrato assinado!");continueSponsor()}} color="#2d8c3c" style={{marginBottom:8}}>ASSINAR CONTRATO</Btn>
<Btn onClick={()=>{continueSponsor()}} color="#555">RECUSAR</Btn>
</div><style>{CSS}</style></div>);
}

// ===== EVENT =====
if(screen==="event"&&rndEvt)return(<div style={ctn}><div style={scan}/><div style={{padding:20,paddingTop:40,textAlign:"center",minHeight:"90vh",display:"flex",flexDirection:"column",justifyContent:"center"}}>
<Px size={7} color="#888">ENTRE SEMANAS…</Px>
<div style={{background:"#0a0a18",border:"1px solid #222",borderRadius:4,marginTop:16,padding:24}}>
<div style={{fontSize:48,marginBottom:14}}>{rndEvt.em}</div>
<Px size={8} color="#fff" style={{display:"block",marginBottom:12,lineHeight:2}}>{rndEvt.t}</Px>
<span style={{padding:"4px 12px",background:"#111",borderRadius:3,border:"1px solid "+(rndEvt.v>0?"#4ade8044":"#f8717144")}}><Px size={8} color={rndEvt.v>0?"#4ade80":"#f87171"}>{rndEvt.e.toUpperCase()} {rndEvt.v>0?"+":""}{rndEvt.v}</Px></span>
</div>
<Btn onClick={afterEvt} color="#2d8c3c" style={{marginTop:16}}>CONTINUAR</Btn>
</div><style>{CSS}</style></div>);

// ===== SPONSOR INTRO =====
if(screen==="sponsor_intro"&&player){
const surfN={clay:"Saibro",hard:"Quadra Dura",grass:"Grama"};
const surfC={clay:"#c4612d",hard:"#2d6bc4",grass:"#2d8c3c"};
const mentN={ambicioso:"Ambicioso",calmo:"Calmo",guerreiro:"Guerreiro",instável:"Intenso",clutch:"Clutch"};
const mentC={ambicioso:"#f59e0b",calmo:"#60a5fa",guerreiro:"#ef4444",instável:"#a855f7",clutch:"#4ade80"};
const racketC=RACKET_BRANDS.find(b=>b.id===player.racketBr)?.color||"#ffd700";
const racketN=RACKET_BRANDS.find(b=>b.id===player.racketBr)?.name||"ProHit";
const handN=player.hand==="canhoto"?"Canhoto":"Destro";
const bhN=player.backhand==="uma"?"1 mão":"2 mãos";
const firstName=player.name.split(" ")[0];

const startCareer=()=>{setFichaIdx(0);autoNextTourney()};

return(<div style={ctn}><div style={scan}/><div style={{padding:20,paddingTop:20,paddingBottom:30,display:"flex",flexDirection:"column"}}>

{fichaIdx===0&&(<div style={{animation:"fadeIn 0.4s"}}>
{/* Dialog */}
<div style={{background:"linear-gradient(180deg,#0a0a20,#0a0a18)",border:"2px solid #ffd700",borderRadius:8,padding:16,marginBottom:14,position:"relative",boxShadow:"0 0 20px rgba(255,215,0,0.08)"}}>
<div style={{position:"absolute",top:-10,left:16,background:"#0a0a20",padding:"0 10px"}}><Px size={6} color="#ffd700">TREINADOR MARCOS</Px></div>
<div style={{marginTop:6}}><Px size={8} color="#fff" style={{display:"block",lineHeight:2.4}}>Boa, <Px size={8} color="#4ade80">{firstName}</Px>! Deixa eu ver sua ficha...</Px></div>
</div>

{/* Player card summary */}
<div style={{background:"#0a0a18",border:"1px solid #333",borderRadius:6,padding:14,marginBottom:14}}>
{[
["\u270B","Mão",handN,"#fbbf24"],
["\u{1F3BE}","Backhand",bhN,"#fbbf24"],
["\u{1F9E0}","Mentalidade",mentN[player.playstyle],mentC[player.playstyle]],
["\u{1F3DF}\uFE0F","Superfície",surfN[player.favSurface]||"Saibro",surfC[player.favSurface]||"#c4612d"],
["\u{1F3F8}","Raquete",racketN,racketC],
["\u{1F4BC}","Patrocínio","Casa das Raquetes — $200/t","#4ade80"],
].map(([ico,label,val,color],i)=>(
<div key={i} style={{display:"flex",alignItems:"center",padding:"6px 0",borderBottom:i<5?"1px solid #1a1a2e":"none",gap:8}}>
<span style={{fontSize:12,width:20,textAlign:"center"}}>{ico}</span>
<Px size={6} color="#888" style={{width:80}}>{label}</Px>
<Px size={7} color={color}>{val}</Px>
</div>
))}
</div>

{/* Player centered */}
<div style={{textAlign:"center",marginBottom:14}}>
<img src={PLAYER_IMG} width={120} height={168} style={{imageRendering:"pixelated",display:"block",margin:"0 auto",transform:player.hand==="canhoto"?"scaleX(-1)":"none"}} alt="Player"/>
<Px size={6} color="#ffd700" style={{display:"block",marginTop:6}}>{firstName}</Px>
</div>

<button onClick={()=>setFichaIdx(1)} style={{fontFamily:"'Press Start 2P',monospace",fontSize:9,padding:"12px 24px",background:"#1a3a6e",color:"#fff",border:"2px solid #2d5a8e",borderRadius:6,cursor:"pointer",width:"100%",marginBottom:8}}>PRÓXIMO</button>
<button onClick={()=>{setFichaIdx(0);setSetupStep(2);setScreen("newgame")}} style={{fontFamily:"'Press Start 2P',monospace",fontSize:8,padding:"8px 16px",background:"none",color:"#555",border:"none",cursor:"pointer",width:"100%"}}>VOLTAR E EDITAR</button>
</div>)}

{fichaIdx===1&&(<div style={{animation:"fadeIn 0.4s",display:"flex",flexDirection:"column",flex:1,justifyContent:"center"}}>
{/* Court scene */}
<div style={{marginBottom:18}}><CourtScene/></div>

{/* Dialog */}
<div style={{background:"linear-gradient(180deg,#0a0a20,#0a0a18)",border:"2px solid #ffd700",borderRadius:8,padding:16,marginBottom:18,position:"relative",boxShadow:"0 0 20px rgba(255,215,0,0.08)"}}>
<div style={{position:"absolute",top:-10,left:16,background:"#0a0a20",padding:"0 10px"}}><Px size={6} color="#ffd700">TREINADOR MARCOS</Px></div>
<div style={{marginTop:6}}><Px size={8} color="#fff" style={{display:"block",lineHeight:2.6}}>Tudo certo, <Px size={8} color="#4ade80">{firstName}</Px>. Bora fazer história?</Px></div>
</div>

{/* Marcos */}
<div style={{textAlign:"center",marginBottom:20}}>
<MarcosLarge/>
</div>

<Btn onClick={startCareer} color="#2d8c3c" style={{padding:"14px 16px",fontSize:10}}>COMEÇAR CARREIRA</Btn>
<button onClick={()=>setFichaIdx(0)} style={{fontFamily:"'Press Start 2P',monospace",fontSize:8,padding:"8px 16px",background:"none",color:"#555",border:"none",cursor:"pointer",width:"100%",marginTop:8}}>VOLTAR</button>
</div>)}

<div style={{textAlign:"center",marginTop:10}}><Px size={6} color="#444">{fichaIdx+1} / 2</Px></div>
</div><style>{CSS}</style></div>);
}

// ===== RETIREMENT =====
if(screen==="retirement"){
return(<div style={ctn}><div style={scan}/><Confetti/><div style={{padding:20,paddingTop:30,textAlign:"center",minHeight:"90vh",display:"flex",flexDirection:"column",justifyContent:"center"}}>
<div style={{fontSize:48,marginBottom:10}}>{"\u{1F3BE}"}</div>
<Px size={14} color="#ffd700" style={{display:"block",marginBottom:6}}>APOSENTADORIA</Px>
<Px size={8} color="#888" style={{display:"block",marginBottom:20}}>Uma carreira extraordinária chega ao fim</Px>

<div style={{background:"#0a0a18",border:"2px solid #ffd700",borderRadius:6,padding:16,marginBottom:14}}>
<Px size={12} color="#fff" style={{display:"block",marginBottom:8}}>{pFlag} {player.name}</Px>
{[
["Idade",player.age+" anos","#fff"],
["Melhor ranking","#"+player.rank,"#ffd700"],
["Títulos",""+player.titles,"#ffd700"],
["Grand Slams",""+player.gs,"#fbbf24"],
["Temporadas",""+(season),"#aaa"],
["Overall final",""+getOvr(player),"#ffd700"],
].map(([l,v,c],i)=>(
<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #1a1a2e"}}>
<Px size={6} color="#888">{l}</Px><Px size={8} color={c}>{v}</Px>
</div>
))}
</div>

<div style={{background:"#0a0a18",border:"1px solid #222",borderRadius:4,padding:"10px 14px",marginBottom:14}}>
<Px size={6} color="#666" style={{display:"block",marginBottom:3}}>Treinador Marcos</Px>
<Px size={7} color="#fbbf24" style={{display:"block",lineHeight:2}}>
{player.titles>5?"Lendário. Você fez história no tênis mundial."
:player.titles>0?"Que carreira! Poucos conseguem o que você fez."
:player.rank<=50?"Você chegou longe. Pode ter orgulho."
:"O importante é que você nunca desistiu. Obrigado por tudo."}
</Px>
</div>

<Btn onClick={()=>{setScreen("title");setPlayer(null)}} color="#c4612d" style={{fontSize:10}}>ENCERRAR CARREIRA</Btn>
</div><style>{CSS}</style></div>);
}

// ===== SEASON END =====
if(screen==="season_end"){
const wr=player.sW+player.sL>0?Math.round(player.sW/(player.sW+player.sL)*100):0;
const titlesThisSeason=sLog.filter(r=>r.won).length;
const bestResult=sLog.length>0?sLog.reduce((best,r)=>(r.rw>best.rw?r:best),sLog[0]):null;
const rankDelta=prevRank-player.rank;
const grade=titlesThisSeason>=8?"S":titlesThisSeason>=5?"A":titlesThisSeason>=3?"B":titlesThisSeason>=1?"C":wr>=60?"D":"E";
const gradeColor={S:"#ffd700",A:"#4ade80",B:"#60a5fa",C:"#fbbf24",D:"#f87171",E:"#888"};
const marcosReview=grade==="S"?"Temporada histórica! Você está entre os melhores!":grade==="A"?"Temporada excelente! Continue assim!":grade==="B"?"Boa temporada! Estamos evoluindo.":grade==="C"?"Temporada regular. Precisamos melhorar.":grade==="D"?"Temporada difícil, mas aprendemos.":"Ano complicado. Vamos recomeçar com foco.";

return(<div style={ctn}><div style={scan}/>{grade==="S"&&<Confetti/>}<div style={{padding:16,paddingTop:20,paddingBottom:90}}>
<div style={{textAlign:"center",marginBottom:12}}>
<div style={{fontSize:36,marginBottom:4}}>{"\u{1F4C5}"}</div>
<Px size={12} color="#ffd700">TEMPORADA {season}</Px>
<div style={{marginTop:2}}><Px size={7} color="#888">ENCERRADA</Px></div>
</div>

{/* Grade */}
<div style={{textAlign:"center",marginBottom:12}}>
<div style={{display:"inline-block",background:"#0a0a18",border:"3px solid "+gradeColor[grade],borderRadius:8,padding:"10px 24px"}}>
<Px size={6} color="#888">NOTA</Px>
<div><Px size={28} color={gradeColor[grade]}>{grade}</Px></div>
</div>
</div>

{/* Stats */}
<div style={{display:"flex",gap:5,marginBottom:10}}>
{[["RANK","#"+player.rank,rankDelta>0?"#4ade80":"#f87171"],["V/D",player.sW+"-"+player.sL,"#fff"],["TÍTULOS",""+titlesThisSeason,"#ffd700"],["WR",wr+"%",wr>=60?"#4ade80":"#f87171"]].map(([l,v,c],i)=>(
<div key={i} style={{flex:1,background:"#0a0a18",border:"1px solid #222",borderRadius:4,padding:"8px 4px",textAlign:"center"}}><Px size={6} color="#888">{l}</Px><div style={{marginTop:3}}><Px size={9} color={c}>{v}</Px></div></div>
))}
</div>

{/* Rank evolution */}
<div style={{background:"#0a0a18",border:"1px solid #222",borderRadius:4,padding:"10px 12px",marginBottom:10,textAlign:"center"}}>
<Px size={6} color="#888">EVOLUÇÃO NO RANKING</Px>
<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginTop:6}}>
<Px size={10} color="#888">#{prevRank||450}</Px>
<Px size={8} color={rankDelta>0?"#4ade80":"#f87171"}>{rankDelta>0?"\u2192":"\u2192"}</Px>
<Px size={10} color="#ffd700">#{player.rank}</Px>
<Px size={7} color={rankDelta>0?"#4ade80":"#f87171"}>({rankDelta>0?"+":""}{rankDelta})</Px>
</div>
</div>

{bestResult&&(
<div style={{background:"#0a0a18",border:"1px solid #222",borderRadius:4,padding:"10px 12px",marginBottom:10}}>
<Px size={6} color="#888" style={{display:"block",marginBottom:4}}>MELHOR RESULTADO</Px>
<Px size={7} color={bestResult.won?"#4ade80":"#fff"}>{bestResult.won?"\u{1F3C6} ":""}{bestResult.name} — {bestResult.rw}/{bestResult.tr} rodadas</Px>
</div>
)}

{/* Marcos review */}
<div style={{background:"#0a0a18",border:"1px solid #ffd70033",borderRadius:4,padding:"10px 12px",marginBottom:10}}>
<Px size={6} color="#666" style={{display:"block",marginBottom:4}}>Treinador Marcos</Px>
<Px size={7} color="#fbbf24" style={{display:"block",lineHeight:2.2}}>{marcosReview}</Px>
</div>

<Btn onClick={nextSeason} color="#2d8c3c" style={{fontSize:10}}>PRÓXIMA TEMPORADA</Btn>
</div><style>{CSS}</style></div>);
}

// ===== TOURNEY END (Elifoot) =====
if(screen==="tourney_end_elifoot"&&tourney&&tourneySummary){
const{pts,prize,champion,biggestUpset,roundsWon,isChampion,ovrChanges,ovrTotal,moralBefore}=tourneySummary;
const moralDelta=moral-(moralBefore||moral);
const easterEgg=Math.random()<0.05?MARCOS_EASTER_EGGS[~~(Math.random()*MARCOS_EASTER_EGGS.length)]:null;
const marcosQuote=easterEgg?easterEgg:(isChampion
  ?MARCOS_TOURNEY_WIN[~~(Math.random()*MARCOS_TOURNEY_WIN.length)]
  :MARCOS_TOURNEY_LOSE[~~(Math.random()*MARCOS_TOURNEY_LOSE.length)]);

return(<div style={ctn}><div style={scan}/>{isChampion&&<Confetti/>}<div style={{padding:20,paddingTop:24,paddingBottom:100,display:"flex",flexDirection:"column",minHeight:"100vh"}}>

{/* Header - BIG */}
<div style={{textAlign:"center",marginBottom:28}}>
<div style={{fontSize:56,marginBottom:10}}>{isChampion?"\u{1F3C6}":"\u{1F614}"}</div>
<Px size={18} color={isChampion?"#ffd700":"#888"} style={{display:"block"}}>{isChampion?"CAMPEÃO":"ELIMINADO"}</Px>
<div style={{marginTop:8}}><Px size={9} color="#aaa">{tourney.n}</Px></div>
</div>

{/* Match recap - BIGGER */}
{tResults.length>0&&(
<div style={{background:"#0a0a18",border:"1px solid #222",borderRadius:6,padding:"14px 16px",marginBottom:18}}>
<Px size={7} color="#888" style={{display:"block",marginBottom:10}}>RESUMO DAS PARTIDAS</Px>
{tResults.map((r,i)=>(
<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<tResults.length-1?"1px solid #1a1a2e":"none"}}>
<div style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
<Px size={10} color={r.won?"#4ade80":"#f87171"}>{r.won?"\u2713":"\u2717"}</Px>
<Px size={7} color="#aaa">{r.round}</Px>
</div>
<Px size={8} color="#fff" style={{flex:1,textAlign:"center"}}>{r.score}</Px>
<Px size={7} color="#888" style={{textAlign:"right",flex:1}}>vs #{r.rivalRank}</Px>
</div>
))}
</div>
)}

{/* 4 stats - BIGGER boxes */}
<div style={{display:"flex",gap:6,marginBottom:18}}>
{[
["PRÊMIO","$"+prize.toLocaleString(),"#4ade80"],
["PONTOS","+"+pts,"#fbbf24"],
["OVR",(ovrTotal>0?"+":"")+ovrTotal,ovrTotal>0?"#4ade80":ovrTotal<0?"#f87171":"#888"],
["MORAL",(moralDelta>0?"+":"")+moralDelta,moralDelta>0?"#60a5fa":moralDelta<0?"#f87171":"#888"],
].map(([label,val,color],i)=>(
<div key={i} style={{flex:1,background:"#0a0a18",border:"1px solid #222",borderRadius:6,padding:"14px 6px",textAlign:"center"}}>
<Px size={6} color="#888" style={{display:"block",marginBottom:6}}>{label}</Px>
<Px size={13} color={color}>{val}</Px>
</div>
))}
</div>

{/* Alerts */}
{injury>0&&(
<div style={{background:"#1a0a0a",border:"1px solid #f87171",borderRadius:6,padding:"14px 16px",marginBottom:12,textAlign:"center"}}>
<Px size={9} color="#f87171">{"\u{1F915}"} Lesão! Fora por {injury} semana{injury>1?"s":""}</Px>
</div>
)}
{energy<30&&!injury&&(
<div style={{background:"#1a1a0a",border:"1px solid #fbbf24",borderRadius:6,padding:"14px 16px",marginBottom:12,textAlign:"center"}}>
<Px size={9} color="#fbbf24">{"\u26A1"} Energia baixa: {energy}%</Px>
</div>
)}

{/* Streak / Personal best */}
{showStreakPopup&&(
<div style={{background:"#0a1a0a",border:"1px solid #4ade80",borderRadius:6,padding:"12px 16px",marginBottom:10,textAlign:"center"}}>
<Px size={8} color="#4ade80">{showStreakPopup}</Px>
</div>
)}
{showPersonalBest&&(
<div style={{background:"#0a0a1a",border:"1px solid #60a5fa",borderRadius:6,padding:"12px 16px",marginBottom:10,textAlign:"center"}}>
<Px size={8} color="#60a5fa">{showPersonalBest}</Px>
</div>
)}

{/* Marcos - BIGGER */}
<div style={{background:"#0a0a18",border:"1px solid #ffd70033",borderRadius:6,padding:"16px 18px",marginBottom:20}}>
<Px size={7} color="#888" style={{display:"block",marginBottom:6}}>Treinador Marcos</Px>
<Px size={9} color="#fbbf24" style={{display:"block",lineHeight:2.4}}>{marcosQuote}</Px>
</div>

<div style={{flex:1,minHeight:20}}/>

<Btn onClick={()=>{afterTourneyEnd();setShowStreakPopup(null);setShowPersonalBest(null)}} color="#2d8c3c" style={{fontSize:12,padding:"18px 16px"}}>CONTINUAR</Btn>

</div><style>{CSS}</style></div>);
}

// =============================================================
// ===== MATCH SCREEN - ELIFOOT STYLE =====
// =============================================================
if(screen==="match"&&tourney){
const rn=getRN(tourney.rd);
const roundName=rn[simRound]||"Rodada "+(simRound+1);
const currentRound=bracket?bracket[simRound]:null;
const allFinished=currentRound?currentRound.every(m=>m.finished):false;
const isFinalRound=simRound===(tourney.rd-1);
const isFavSurf=player.favSurface===tourney.sf;

// Short name helper
const shortName=(name)=>{
  const parts=name.split(" ");
  if(parts.length>=2) return parts[0][0]+". "+parts[parts.length-1];
  return name;
};

return(<div style={ctn}><div style={scan}/>
{notif&&<div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",background:"#0a0a18",border:"2px solid #ffd700",borderRadius:4,padding:"8px 18px",zIndex:2000,animation:"fadeIn 0.3s"}}><Px size={7} color="#ffd700">{notif}</Px></div>}

{/* QUIZ POPUP - when losing a set */}
{setDecision&&(
<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.92)",zIndex:2500,display:"flex",alignItems:"center",justifyContent:"center",padding:14}}>
<div style={{background:"linear-gradient(180deg,#12122e,#0a0a18)",border:"2px solid #ffd700",borderRadius:10,padding:20,maxWidth:380,width:"100%",animation:"fadeIn 0.3s",boxShadow:"0 0 40px rgba(255,215,0,0.1)"}}>

<div style={{textAlign:"center",marginBottom:12}}>
<div style={{fontSize:28,marginBottom:6}}>{"\u{1F9E0}"}</div>
<Px size={10} color="#ffd700" style={{display:"block"}}>SET PERDIDO</Px>
<Px size={16} color="#fff" style={{display:"block",marginTop:4}}>{setDecision.setScore}</Px>
<div style={{marginTop:8,display:"flex",justifyContent:"center",gap:16}}>
<div style={{textAlign:"center"}}>
<Px size={16} color="#ffd700">{setDecision.setsP}</Px>
<Px size={6} color="#888" style={{display:"block",marginTop:2}}>VOCÊ</Px>
</div>
<Px size={10} color="#555">x</Px>
<div style={{textAlign:"center"}}>
<Px size={16} color="#fff">{setDecision.setsR}</Px>
<Px size={6} color="#888" style={{display:"block",marginTop:2}}>RIVAL</Px>
</div>
</div>
</div>

<div style={{width:"100%",height:1,background:"#333",marginBottom:12}}/>

<Px size={6} color="#60a5fa" style={{display:"block",marginBottom:4}}>PERGUNTA MENTAL <Px size={6} color="#888">(valendo bônus)</Px></Px>
<Px size={7} color="#fff" style={{display:"block",marginBottom:12,lineHeight:2.2}}>
{setDecision.quiz.q}
</Px>

{!setDecision.answered&&(<>
{setDecision.quiz.a.map((ans,i)=>(
<button key={i} onClick={()=>setDecision.onChoose(i===setDecision.quiz.correct)} style={{
display:"block",width:"100%",fontFamily:"'Press Start 2P',monospace",fontSize:7,
padding:"12px 14px",marginBottom:6,textAlign:"left",cursor:"pointer",
background:i===0?"#0a1a0a":i===1?"#0a0a1a":"#1a0a0a",
border:"2px solid "+(i===0?"#4ade8044":i===1?"#60a5fa44":"#fbbf2444"),
borderRadius:6,color:"#fff"
}}>
<Px size={7} color="#fff">{String.fromCharCode(65+i)}) {ans}</Px>
</button>
))}
<button onClick={()=>{setSetDecision(null);setSimRunning(true);ivRef.current=setInterval(tick,1200)}} style={{fontFamily:"'Press Start 2P',monospace",fontSize:7,padding:"8px 16px",background:"none",color:"#555",border:"none",cursor:"pointer",width:"100%",marginTop:6}}>PULAR PERGUNTA</button>
</>)}

{setDecision.answered&&(
<div style={{textAlign:"center",animation:"fadeIn 0.3s"}}>
<div style={{fontSize:32,marginBottom:8}}>{setDecision.correct?"\u2705":"\u274C"}</div>
<Px size={10} color={setDecision.correct?"#4ade80":"#f87171"} style={{display:"block",marginBottom:6}}>{setDecision.correct?"ACERTOU":"ERROU"}</Px>
{setDecision.correct&&<Px size={6} color="#4ade80" style={{display:"block",marginBottom:10}}>Bônus de +3 no próximo set</Px>}
{!setDecision.correct&&<Px size={6} color="#888" style={{display:"block",marginBottom:10}}>Sem bônus dessa vez</Px>}
<Btn onClick={setDecision.onContinue} color="#2d6bc4" style={{fontSize:9}}>CONTINUAR</Btn>
</div>
)}

</div>
</div>
)}

<div style={{padding:10,paddingTop:8,paddingBottom:12,minHeight:"100vh",display:"flex",flexDirection:"column"}}>

{/* TOURNAMENT CARD - big, same style as hub */}
<div style={{background:SC[tourney.sf],borderRadius:6,padding:14,marginBottom:10,border:"2px solid #fff2"}}>
<Px size={14} color="#fff" style={{display:"block",textAlign:"center",marginBottom:5}}>{tourney.n}</Px>
<div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:5}}>
<Px size={7} color="#fffa">{LL[tourney.lv]}</Px>
<Px size={7} color="#fffa">{tourney.ci}</Px>
<Px size={7} color="#fffa">{SN[tourney.sf]}</Px>
</div>
<div style={{textAlign:"center",paddingTop:8,borderTop:"1px solid #fff2"}}>
<Px size={11} color="#fff">{roundName}</Px>
<Px size={7} color="#ffd70099" style={{marginLeft:10}}>Rodada {simRound+1} de {tourney.rd}</Px>
</div>
</div>

{/* Player match result highlight - ABOVE match list */}
{playerMatchResult&&allFinished&&(
<div style={{background:playerMatchResult.won?"#0a1a0a":"#1a0a0a",border:playerMatchResult.won?"2px solid #4ade80":"2px solid #f87171",borderRadius:4,padding:12,marginBottom:8,textAlign:"center",animation:"fadeIn 0.4s"}}>
<Px size={13} color={playerMatchResult.won?"#4ade80":"#f87171"}>
{playerMatchResult.won?"VITÓRIA!":"DERROTA"}
</Px>
<div style={{marginTop:5}}>
<Px size={7} color="#aaa">vs {playerMatchResult.opponent.name} #{playerMatchResult.opponent.rank}</Px>
</div>
<div style={{marginTop:5}}>
<Px size={10} color="#fff">
{playerMatchResult.sets.map((s,i)=>(
<span key={i} style={{marginRight:8}}>
<span style={{color:s[0]>s[1]?"#4ade80":"#f87171"}}>{s[0]}</span>
<span style={{color:"#444"}}>-</span>
<span style={{color:s[1]>s[0]?"#4ade80":"#f87171"}}>{s[1]}</span>
</span>
))}
</Px>
</div>
{/* OVR comparison */}
<div style={{marginTop:6,paddingTop:6,borderTop:"1px solid #1a1a2e",display:"flex",justifyContent:"center",gap:12}}>
<Px size={6} color="#888">OVR <Px size={6} color="#ffd700">{getOvr(player)}</Px> vs <Px size={6} color="#aaa">{playerMatchResult.opponent.skill}</Px></Px>
<Px size={6} color="#888">{"\u26A1"} <Px size={6} color={energy<50?"#f87171":"#4ade80"}>{energy}%</Px></Px>
{isFavSurf&&<Px size={6} color="#888">{"\u2B50"} Piso fav</Px>}
</div>
{/* Match event if any */}
{playerMatchResult.matchEvent&&(
<div style={{marginTop:5,padding:"4px 10px",background:"#111",borderRadius:3,display:"inline-block"}}>
<Px size={6} color={playerMatchResult.matchEvent.effect>0?"#4ade80":"#f87171"}>{playerMatchResult.matchEvent.icon} {playerMatchResult.matchEvent.text}</Px>
</div>
)}
</div>
)}

{/* Action buttons */}
<div style={{marginBottom:8}}>
{!bracket&&(
<Btn onClick={startTourneyMatch} color="#2d8c3c" style={{fontSize:10}}>INICIAR TORNEIO</Btn>
)}
{bracket&&!simRunning&&!allFinished&&(
<Btn onClick={simCurrentRound} color="#2d8c3c" style={{fontSize:10,padding:"12px 16px"}}>
{isFinalRound?"\u{1F3C6}":"\u{1F3BE}"} {isFinalRound?"JOGAR A FINAL":simRound>=tourney.rd-2?"JOGAR A SEMI":"JOGAR "+roundName.toUpperCase()}
</Btn>
)}
{allFinished&&!playerEliminated&&!isFinalRound&&(
<Btn onClick={advanceRound} color="#2d6bc4" style={{fontSize:10}}>
AVANÇAR
</Btn>
)}
{allFinished&&(playerEliminated||isFinalRound)&&(
<Btn onClick={finishTourneyElifoot} color={playerEliminated?"#8b2020":"#2d8c3c"} style={{fontSize:10}}>
{playerEliminated?"VER RESULTADO":"\u{1F3C6} VER RESULTADO"}
</Btn>
)}
</div>

{/* ALL MATCHES - Elifoot style list */}
{currentRound&&(<div style={{background:"#0a0a18",border:"2px solid #222",borderRadius:4,overflow:"hidden",marginBottom:10}}>

{/* Round header */}
<div style={{background:"#111",padding:"8px 12px",borderBottom:"1px solid #222",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
<Px size={7} color="#ffd700">{roundName.toUpperCase()}</Px>
<Px size={6} color="#666">{currentRound.length} jogos</Px>
</div>

{/* Match rows - player match first */}
{[...currentRound].sort((a,b)=>(b.hasPlayer?1:0)-(a.hasPlayer?1:0)).map((match,idx)=>{
const isPlayerMatch=match.hasPlayer;
const p1Short=shortName(match.p1.name);
const p1Flag=match.p1.isPlayer?(CF[player?.country]||""):(CF[match.p1.country]||"");
const p2Short=shortName(match.p2.name);
const p2Flag=match.p2.isPlayer?(CF[player?.country]||""):(CF[match.p2.country]||"");
const p1IsPlayer=match.p1.isPlayer;
const p2IsPlayer=match.p2.isPlayer;
const finished=match.finished;
const p1Won=finished&&match.winner===1;
const p2Won=finished&&match.winner===2;

return(<div key={match.id} style={{
padding:"8px 10px",
borderBottom:idx<currentRound.length-1?"1px solid #1a1a2e":"none",
background:isPlayerMatch?"rgba(255,215,0,0.04)":"transparent",
borderLeft:isPlayerMatch?"3px solid #ffd700":"3px solid transparent",
}}>

{/* Row: P1 name | sets | P2 name */}
<div style={{display:"flex",alignItems:"center",gap:4}}>

{/* P1 */}
<div style={{flex:1,textAlign:"left",minWidth:0}}>
<Px size={8} color={p1IsPlayer?"#ffd700":finished?(p1Won?"#fff":"#555"):"#ccc"} style={{
fontWeight:p1Won?"bold":"normal",
display:"block",
overflow:"hidden",
textOverflow:"ellipsis",
whiteSpace:"nowrap",
}}>{p1Flag?p1Flag+" ":""}{p1Short}</Px>
<Px size={6} color="#555">#{match.p1.rank}</Px>
</div>

{/* Sets */}
<div style={{display:"flex",gap:3,alignItems:"center",flexShrink:0}}>
{(match.sets||[]).map((s,si)=>(
<div key={si} style={{
background:s[0]>s[1]?"#1a2e1a":s[1]>s[0]?"#2e1a1a":"#1a1a2e",
borderRadius:2,
padding:"3px 4px",
minWidth:28,
textAlign:"center",
animation:"slideScore 0.3s ease",
}}>
<Px size={9} color={s[0]>s[1]?"#4ade80":"#f87171"}>{s[0]}</Px>
<Px size={6} color="#444"> - </Px>
<Px size={9} color={s[1]>s[0]?"#4ade80":"#f87171"}>{s[1]}</Px>
</div>
))}
{!finished&&match.sets.length===0&&(
<div style={{padding:"3px 8px"}}><Px size={7} color="#555">vs</Px></div>
)}
{simRunning&&!finished&&match.sets.length>0&&(
<div style={{width:6,height:6,borderRadius:3,background:"#ffd700",animation:"blink 0.6s infinite",marginLeft:2}}/>
)}
</div>

{/* P2 */}
<div style={{flex:1,textAlign:"right",minWidth:0}}>
<Px size={8} color={p2IsPlayer?"#ffd700":finished?(p2Won?"#fff":"#555"):"#ccc"} style={{
fontWeight:p2Won?"bold":"normal",
display:"block",
overflow:"hidden",
textOverflow:"ellipsis",
whiteSpace:"nowrap",
}}>{p2Short}{p2Flag?" "+p2Flag:""}</Px>
<Px size={6} color="#555">#{match.p2.rank}</Px>
</div>

</div>
</div>);
})}
</div>)}

</div><style>{CSS}</style></div>);
}

// =============================================================
// ===== CAREER HUB =====
// =============================================================
const rankDelta=prevRank-player.rank;
const rn=tourney?getRN(tourney.rd):[];
const roundName=tourney&&rn[0]?rn[0]:"";
const isFavSurf=tourney&&player.favSurface===tourney.sf;
const dateStr=weekToDate(curWeek);
const tourneyCost=tourney?getTourneyCost(tourney.lv):0;

// ===== TAB CONTENT =====
const renderTabContent=()=>{
// ----- LOJA -----
if(activeTab==="loja"){
const ShopSection=({title,emoji,items,current,onBuy,getLabel})=>(
<div style={{marginBottom:12}}>
<Px size={8} color="#ffd700" style={{display:"block",marginBottom:6}}>{emoji} {title}</Px>
{items.map(item=>{
const owned=current?.id===item.id;
const canBuy=player.money>=item.price&&!owned;
return(<div key={item.id} style={{background:owned?"#0a1a0a":"#0a0a18",border:owned?"1px solid #4ade80":"1px solid #1a1a2e",borderRadius:4,padding:"8px 10px",marginBottom:4}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
<div style={{flex:1}}>
<Px size={7} color={owned?"#4ade80":"#fff"}>{item.name}</Px>
{item.desc&&<Px size={6} color="#666" style={{display:"block",marginTop:2}}>{item.desc}</Px>}
<Px size={6} color="#fbbf24" style={{display:"block",marginTop:2}}>+{item.ovr} OVR</Px>
</div>
<div style={{textAlign:"right",flexShrink:0,marginLeft:8}}>
{owned?<Px size={6} color="#4ade80">ATIVO</Px>
:item.price===0?<Px size={6} color="#555">GRÁTIS</Px>
:<button onClick={()=>onBuy(item)} disabled={!canBuy} style={{fontFamily:"'Press Start 2P',monospace",fontSize:6,padding:"6px 10px",background:canBuy?"#2d8c3c":"#222",color:canBuy?"#fff":"#555",border:"1px solid "+(canBuy?"#4ade8044":"#333"),borderRadius:3,cursor:canBuy?"pointer":"default"}}>${item.price.toLocaleString()}</button>}
</div>
</div>
</div>);
})}
</div>
);

return(
<div style={{animation:"fadeIn 0.3s"}}>
<Px size={10} color="#ffd700" style={{display:"block",marginBottom:4}}>LOJA</Px>
<Px size={6} color="#888" style={{display:"block",marginBottom:10}}>Saldo: <Px size={7} color="#4ade80">${player.money.toLocaleString()}</Px></Px>
<ShopSection title="RAQUETES" emoji={"\u{1F3BE}"} items={RACKETS} current={player.racket} onBuy={buyRacket}/>
<ShopSection title="CALÇADO" emoji={"\u{1F45F}"} items={SHOES} current={player.shoes} onBuy={buyShoes}/>
<ShopSection title="PREPARADOR FÍSICO" emoji={"\u{1F4AA}"} items={TRAINERS} current={player.trainer} onBuy={buyTrainer}/>
<ShopSection title="QUADRA DE TREINO" emoji={"\u{1F3DF}\uFE0F"} items={COURTS} current={player.court} onBuy={buyCourt}/>

{/* Consumables */}
<div style={{marginBottom:12}}>
<Px size={8} color="#ffd700" style={{display:"block",marginBottom:6}}>{"\u{1F48A}"} ITENS CONSUMÍVEIS</Px>
<Px size={6} color="#555" style={{display:"block",marginBottom:6}}>Efeito temporário — usa e precisa comprar de novo</Px>
{tempOvr>0&&<Px size={6} color="#4ade80" style={{display:"block",marginBottom:6}}>OVR temporário ativo: +{tempOvr}</Px>}
{CONSUMABLES.map(item=>{
const canBuy=player.money>=item.price;
return(<div key={item.id} style={{background:"#0a0a18",border:"1px solid #1a1a2e",borderRadius:4,padding:"8px 10px",marginBottom:4}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
<div style={{flex:1}}>
<Px size={7} color="#fff">{item.icon} {item.name}</Px>
<Px size={6} color="#888" style={{display:"block",marginTop:2}}>{item.desc}</Px>
</div>
<button onClick={()=>buyConsumable(item)} disabled={!canBuy} style={{fontFamily:"'Press Start 2P',monospace",fontSize:6,padding:"6px 10px",background:canBuy?"#8b6914":"#222",color:canBuy?"#fff":"#555",border:"1px solid "+(canBuy?"#fbbf2444":"#333"),borderRadius:3,cursor:canBuy?"pointer":"default",flexShrink:0,marginLeft:8}}>${item.price}</button>
</div>
</div>);
})}
</div>
</div>
);
}

// ----- RANKING -----
if(activeTab==="ranking"){
// Sort ALL by points to get true ranking
const allForRank=[...rivals.map(r=>({...r}))];
allForRank.sort((a,b)=>(b.points||0)-(a.points||0));
allForRank.forEach((r,i)=>{r.displayRank=i+1});
// Find player position
const playerPts=player.points||0;
let playerDisplayRank=1;
allForRank.forEach(r=>{if((r.points||0)>playerPts)playerDisplayRank++});

const top10=allForRank.slice(0,10);
const playerInTop=playerDisplayRank<=10;
const nearbyAbove=allForRank.filter(r=>r.displayRank<playerDisplayRank&&r.displayRank>10).slice(-5);
const nearbyBelow=allForRank.filter(r=>r.displayRank>playerDisplayRank).slice(0,5);
const renderRow=(r,isMe)=>{
const h2h=h2hLog[r.name];
return(
<div style={{display:"flex",padding:"6px 10px",borderBottom:"1px solid #1a1a2e",alignItems:"center",background:isMe?"rgba(255,215,0,0.06)":"transparent"}}>
<Px size={7} color={r.displayRank<=3?"#ffd700":r.displayRank<=10?"#fff":"#888"} style={{width:28}}>{r.displayRank}</Px>
<Px size={6} color={isMe?"#ffd700":"#ccc"} style={{flex:1}}>{CF[r.country]||""} {r.name}</Px>
{h2h&&<Px size={6} color="#666" style={{marginRight:6}}>{h2h.w}V{h2h.l}D</Px>}
<Px size={6} color="#fbbf24" style={{width:50,textAlign:"right"}}>{r.points}</Px>
</div>);
};
return(
<div style={{animation:"fadeIn 0.3s"}}>
<Px size={10} color="#ffd700" style={{display:"block",marginBottom:10}}>RANKING PRO</Px>
<div style={{background:"#0a0a18",border:"1px solid #222",borderRadius:4,overflow:"hidden"}}>
<div style={{display:"flex",padding:"6px 10px",borderBottom:"2px solid #222",background:"#111"}}>
<Px size={6} color="#888" style={{width:28}}>#</Px>
<Px size={6} color="#888" style={{flex:1}}>JOGADOR</Px>
<Px size={6} color="#888" style={{width:50,textAlign:"right"}}>PTS</Px>
</div>
{top10.map(r=>(<div key={r.name}>{renderRow(r,false)}</div>))}
{!playerInTop&&nearbyAbove.length>0&&(
<div style={{padding:"4px 10px",background:"#111",textAlign:"center",borderBottom:"1px solid #1a1a2e"}}>
<Px size={6} color="#444">{"\u00B7\u00B7\u00B7"}</Px>
</div>
)}
{!playerInTop&&nearbyAbove.map(r=>(<div key={r.name}>{renderRow(r,false)}</div>))}
{!playerInTop&&(
<div style={{display:"flex",padding:"7px 10px",borderBottom:"1px solid #1a1a2e",alignItems:"center",background:"rgba(255,215,0,0.08)",borderLeft:"3px solid #ffd700"}}>
<Px size={7} color="#ffd700" style={{width:28}}>{playerDisplayRank}</Px>
<Px size={7} color="#ffd700" style={{flex:1}}>{pFlag} {player.name}</Px>
<Px size={7} color="#fbbf24" style={{width:50,textAlign:"right"}}>{player.points}</Px>
</div>
)}
{!playerInTop&&nearbyBelow.map(r=>(<div key={r.name}>{renderRow(r,false)}</div>))}
</div>
</div>
);
}

// ----- STATS -----
if(activeTab==="stats"){
// Calculate best victory and worst defeat from tResults and sLog
const allResults = tResults || [];
const bestVictory = allResults.filter(r=>r.won).sort((a,b)=>a.rivalRank-b.rivalRank)[0];
const worstDefeat = allResults.filter(r=>!r.won).sort((a,b)=>b.rivalRank-a.rivalRank)[0];
const winRate = player.sW+player.sL > 0 ? Math.round(player.sW/(player.sW+player.sL)*100) : 0;

return(
<div style={{animation:"fadeIn 0.3s"}}>
<Px size={10} color="#ffd700" style={{display:"block",marginBottom:10}}>ESTATÍSTICAS</Px>

{/* Player card */}
<div style={{background:"#0a0a18",border:"2px solid #333",borderRadius:4,padding:12,marginBottom:10}}>
<Px size={10} color="#fff" style={{display:"block"}}>{pFlag} {player.name}</Px>
<Px size={6} color="#888" style={{display:"block",marginTop:4}}>{player.age} anos {"\u00B7"} {player.hand==="canhoto"?"Canhoto":"Destro"} {"\u00B7"} BH {player.backhand==="uma"?"1 mão":"2 mãos"}</Px>
</div>

{/* Season stats */}
<div style={{background:"#0a0a18",border:"1px solid #222",borderRadius:4,padding:12,marginBottom:10}}>
<Px size={7} color="#ffd700" style={{display:"block",marginBottom:8}}>TEMPORADA {season}</Px>
{[
["Ranking","#"+player.rank,"#ffd700"],
["Record",player.sW+"V - "+player.sL+"D ("+winRate+"%)","#fff"],
["Títulos",""+player.titles,"#ffd700"],
["Torneios",""+sLog.length,"#aaa"],
["Dinheiro","$"+player.money.toLocaleString(),"#4ade80"],
["Overall",""+getOvr(player)+" (base "+player.ovr+")","#fbbf24"],
["Moral",""+moral+"%",moral>=70?"#4ade80":moral>=40?"#fbbf24":"#f87171"],
].map(([l,v,c],i)=>(
<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:i<6?"1px solid #1a1a2e":"none"}}>
<Px size={6} color="#888">{l}</Px><Px size={7} color={c}>{v}</Px>
</div>
))}
</div>

{/* Highlights */}
<div style={{background:"#0a0a18",border:"1px solid #222",borderRadius:4,padding:12,marginBottom:10}}>
<Px size={7} color="#ffd700" style={{display:"block",marginBottom:8}}>DESTAQUES</Px>
{bestVictory&&(
<div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid #1a1a2e"}}>
<Px size={6} color="#888">Melhor vitória</Px><Px size={6} color="#4ade80">vs #{bestVictory.rivalRank} ({bestVictory.score})</Px>
</div>
)}
{worstDefeat&&(
<div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid #1a1a2e"}}>
<Px size={6} color="#888">Derrota mais dura</Px><Px size={6} color="#f87171">vs #{worstDefeat.rivalRank}</Px>
</div>
)}
{winStreak>=2&&(
<div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid #1a1a2e"}}>
<Px size={6} color="#888">Sequência atual</Px><Px size={6} color="#fbbf24">{"\u{1F525}"} {winStreak} boas campanhas</Px>
</div>
)}
{Object.keys(personalBest).length>0&&(
<div style={{padding:"4px 0"}}>
<Px size={6} color="#888" style={{display:"block",marginBottom:4}}>Recordes pessoais</Px>
{Object.entries(personalBest).map(([lv,rw],i)=>{
const rdN=["1R","2R","QF","SF","Final","Título"];
return(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"2px 0"}}>
<Px size={6} color="#666">{LL[lv]||lv}</Px><Px size={6} color="#60a5fa">{rw>=5?"Título":rdN[Math.min(rw,5)]}</Px>
</div>);
})}
</div>
)}
{Object.keys(personalBest).length===0&&!bestVictory&&winStreak<2&&(
<Px size={6} color="#555" style={{display:"block",padding:"4px 0"}}>Jogue torneios para desbloquear destaques</Px>
)}
</div>

{/* Last tournament results */}
{tResults.length>0&&(
<div style={{background:"#0a0a18",border:"1px solid #222",borderRadius:4,padding:12,marginBottom:10}}>
<Px size={7} color="#ffd700" style={{display:"block",marginBottom:8}}>ÚLTIMO TORNEIO</Px>
{tResults.map((r,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid #1a1a2e"}}>
<Px size={6} color={r.won?"#4ade80":"#f87171"}>{r.won?"\u2713":"\u2717"} {r.round}</Px>
<Px size={6} color="#aaa">{r.score}</Px>
<Px size={6} color="#666">vs #{r.rivalRank}</Px>
</div>))}
</div>
)}

{/* Tournament history */}
{sLog.length>0&&(
<div style={{background:"#0a0a18",border:"1px solid #222",borderRadius:4,padding:12}}>
<Px size={7} color="#ffd700" style={{display:"block",marginBottom:8}}>HISTÓRICO</Px>
{sLog.slice().reverse().map((r,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid #1a1a2e"}}>
<Px size={6} color={LC[r.level]}>{r.name}</Px>
<Px size={6} color={r.won?"#4ade80":"#888"}>{r.won?"\u{1F3C6}":r.rw+"/"+r.tr}</Px>
</div>))}
</div>
)}
</div>
);
}

// ----- MAIS (Menu) -----
if(activeTab==="mais"){
const rankAchs=ACHIEVEMENTS.filter(a=>a.tier&&unlockedAchievements.includes(a.id));
const currentTier=rankAchs.length>0?rankAchs[rankAchs.length-1]:null;
return(
<div style={{animation:"fadeIn 0.3s"}}>

{/* Quick actions */}
<div style={{display:"flex",gap:6,marginBottom:10}}>
<button onClick={saveGame} style={{flex:1,fontFamily:"'Press Start 2P',monospace",fontSize:7,padding:"12px 8px",background:"#0a1a0a",border:"1px solid #4ade8044",borderRadius:4,color:"#4ade80",cursor:"pointer",textAlign:"center"}}>{"\u{1F4BE}"} SALVAR</button>
<button onClick={()=>{if(confirm("Voltar ao menu? O progresso não salvo será perdido."))setScreen("title")}} style={{flex:1,fontFamily:"'Press Start 2P',monospace",fontSize:7,padding:"12px 8px",background:"#0a0a18",border:"1px solid #333",borderRadius:4,color:"#888",cursor:"pointer",textAlign:"center"}}>{"\u{1F3E0}"} MENU</button>
</div>

{/* Current sponsor - compact */}
<div style={{background:"#0a0a18",border:"1px solid #333",borderRadius:4,padding:"10px 12px",marginBottom:10}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
<div>
<Px size={6} color="#888" style={{display:"block"}}>PATROCINADOR</Px>
<Px size={8} color="#fff" style={{display:"block",marginTop:3}}>{player.sponsor?.name||"Nenhum"}</Px>
</div>
<div style={{textAlign:"right"}}>
<Px size={8} color="#4ade80">${player.sponsor?.pay||0}/t</Px>
<Px size={6} color="#fbbf24" style={{display:"block",marginTop:2}}>+{player.sponsor?.bonus||0}%</Px>
</div>
</div>
</div>

{/* Achievements gallery */}
<div style={{background:"#0a0a18",border:"1px solid #222",borderRadius:4,padding:"10px 12px",marginBottom:10}}>
<div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
<Px size={7} color="#ffd700">CONQUISTAS</Px>
<Px size={6} color="#555">{unlockedAchievements.length}/{ACHIEVEMENTS.length}</Px>
</div>
{currentTier&&<Px size={6} color={currentTier.tierColor} style={{display:"block",marginBottom:8}}>Título atual: {currentTier.tier}</Px>}
<div style={{display:"flex",flexWrap:"wrap",gap:6}}>
{ACHIEVEMENTS.map(a=>{
const unlocked=unlockedAchievements.includes(a.id);
return(<div key={a.id} style={{width:40,height:40,background:unlocked?"#111":"#080810",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid "+(unlocked?(a.tierColor||"#ffd700")+"66":"#1a1a2e"),opacity:unlocked?1:0.3}} title={a.name}>
<span style={{fontSize:unlocked?16:12}}>{unlocked?a.icon:"\u{1F512}"}</span>
</div>);
})}
</div>
</div>

{/* Player info */}
<div style={{background:"#0a0a18",border:"1px solid #222",borderRadius:4,padding:"10px 12px",marginBottom:10}}>
<Px size={7} color="#ffd700" style={{display:"block",marginBottom:6}}>PERFIL</Px>
{[
[pFlag+" "+player.name,currentTier?currentTier.tier:"Sem título",currentTier?currentTier.tierColor:"#555"],
["Ranking","#"+player.rank,"#ffd700"],
["Overall",""+getOvr(player)+" (base "+player.ovr+")","#fbbf24"],
["Idade",player.age+" anos","#aaa"],
["Temporada",""+season,"#aaa"],
["Títulos",""+player.titles,"#ffd700"],
["Grand Slams",""+player.gs,"#fbbf24"],
].map(([l,v,c],i)=>(
<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:i<6?"1px solid #1a1a2e":"none"}}>
<Px size={6} color="#888">{l}</Px>
<Px size={6} color={c}>{v}</Px>
</div>
))}
</div>

{/* About */}
<div style={{background:"#0a0a18",border:"1px solid #1a1a2e",borderRadius:4,padding:"10px 12px"}}>
<Px size={6} color="#444" style={{display:"block"}}>Tennis Career 26 — Beta v0.9</Px>
<Px size={6} color="#333" style={{display:"block",marginTop:3}}>© 2026 Thomaz Gouvea. Todos os direitos reservados.</Px>
</div>

</div>
);
}

// ----- JOGAR (default) -----
const availableTourneys = getAvailableTourneys(curWeek, player.rank);

return(
<div style={{animation:"fadeIn 0.3s",display:"flex",flexDirection:"column",flex:1}}>

{/* STATS ROW - only when no tournament selected */}
{!tourney&&(<div style={{display:"flex",gap:5,marginBottom:6}}>
{[["Pontos",""+player.points,"#fbbf24"],["Dinheiro","$"+player.money.toLocaleString(),"#4ade80"],["Record",player.sW+" - "+player.sL,"#fff"]].map(([l,v,c],i)=>(<div key={i} style={{flex:1,textAlign:"center",background:"#0a0a18",border:"1px solid #1a1a2e",borderRadius:4,padding:"6px 4px"}}><Px size={6} color="#888">{l}</Px><div style={{marginTop:2}}><Px size={9} color={c}>{v}</Px></div></div>))}
</div>)}

{/* OVR + ENERGY row - only when no tournament selected */}
{!tourney&&(<div style={{display:"flex",gap:5,marginBottom:6}}>
<div style={{flex:1,background:"#0a0a18",border:"1px solid #1a1a2e",borderRadius:4,padding:"6px 10px"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
<Px size={7} color="#ffd700">OVR</Px>
<Px size={11} color="#ffd700">{getOvr(player)}</Px>
</div>
<div style={{width:"100%",height:6,background:"#111",borderRadius:3,overflow:"hidden",border:"1px solid #333"}}>
<div style={{width:Math.min(100,getOvr(player))+"%",height:"100%",background:"linear-gradient(90deg,#c4612d,#ffd700)",transition:"width 0.4s",boxShadow:"0 0 6px rgba(255,215,0,0.3)"}}/>
</div>
</div>
<div style={{flex:1,background:"#0a0a18",border:"1px solid "+(energy<30?"#f8717144":"#1a1a2e"),borderRadius:4,padding:"6px 10px"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
<Px size={7} color={energy<30?"#f87171":energy<60?"#fbbf24":"#4ade80"}>{"\u26A1"} Energia</Px>
<Px size={11} color={energy<30?"#f87171":energy<60?"#fbbf24":"#4ade80"}>{energy}%</Px>
</div>
<div style={{width:"100%",height:6,background:"#111",borderRadius:3,overflow:"hidden",border:"1px solid #333"}}>
<div style={{width:energy+"%",height:"100%",background:energy<30?"#f87171":energy<60?"#fbbf24":"#4ade80",transition:"width 0.4s",boxShadow:energy<30?"0 0 8px rgba(248,113,113,0.5)":"0 0 4px rgba(74,222,128,0.2)",animation:energy<30?"alertPulse 1.5s infinite":"none"}}/>
</div>
</div>
</div>)}

{/* MORAL bar */}
{!tourney&&(()=>{
const face=moral>=70?"\u{1F604}":moral>=40?"\u{1F610}":"\u{1F61E}";
const mColor=moral>=70?"#4ade80":moral>=40?"#fbbf24":"#f87171";
return(<div style={{background:"#0a0a18",border:"1px solid #1a1a2e",borderRadius:4,padding:"6px 10px",marginBottom:6}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
<Px size={7} color={mColor}>{face} Moral</Px>
<Px size={11} color={mColor}>{moral}%</Px>
</div>
<div style={{width:"100%",height:6,background:"#111",borderRadius:3,overflow:"hidden",border:"1px solid #333"}}>
<div style={{width:moral+"%",height:"100%",background:mColor,transition:"width 0.4s",boxShadow:moral>=70?"0 0 6px rgba(74,222,128,0.3)":"none"}}/>
</div>
</div>);
})()}

{/* NEXT GOAL - single line centered */}
{!tourney&&(()=>{
const nextGoal=ACHIEVEMENTS.find(a=>!unlockedAchievements.includes(a.id)&&!a.check(player));
if(!nextGoal)return null;
return(<div style={{background:"#0a0a18",border:"1px solid "+(nextGoal.tierColor||"#ffd700")+"33",borderRadius:6,padding:"10px 14px",marginBottom:6,textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
<span style={{fontSize:14}}>{nextGoal.icon}</span>
<Px size={6} color="#ffd700">1º OBJETIVO</Px>
<Px size={7} color="#fff">{nextGoal.desc}</Px>
</div>);
})()}

{/* MARCOS CHALLENGE */}
{!tourney&&marcosChallenge&&(
<div style={{background:"#0a0a18",border:"1px solid #2d6bc444",borderRadius:4,padding:"8px 12px",marginBottom:6,display:"flex",alignItems:"center",gap:8}}>
<span style={{fontSize:14,flexShrink:0}}>{"\u{1F3AF}"}</span>
<div style={{flex:1}}>
<Px size={6} color="#2d6bc4">DESAFIO DO MARCOS</Px>
<Px size={6} color="#fff" style={{display:"block",marginTop:1}}>{marcosChallenge.desc}</Px>
</div>
<Px size={6} color="#4ade80">+${marcosChallenge.reward}</Px>
</div>
)}

{/* WIN STREAK */}
{!tourney&&winStreak>=2&&(
<div style={{background:"#0a0a18",border:"1px solid #fbbf2433",borderRadius:4,padding:"6px 12px",marginBottom:6,display:"flex",alignItems:"center",gap:8}}>
<span style={{fontSize:12}}>{"\u{1F525}"}</span>
<Px size={6} color="#fbbf24">{winStreak} boas campanhas seguidas</Px>
</div>
)}

{/* INJURY WARNING */}
{!tourney&&injury>0&&(
<div style={{background:"#1a0a0a",border:"2px solid #f87171",borderRadius:6,padding:"12px 14px",marginBottom:8,textAlign:"center",animation:"alertPulse 2s infinite",boxShadow:"0 0 12px rgba(248,113,113,0.15)"}}>
<Px size={8} color="#f87171">{"\u{1F915}"} LESIONADO — {injury} semana{injury>1?"s":""} de recuperação</Px>
</div>
)}

{/* TOURNAMENT SELECTED - BROCHURE STYLE */}
{tourney&&(()=>{
const flag=CF[tourney.co]||"\u{1F3F3}\uFE0F";
const lastPlayed=sLog.filter(s=>s.name===tourney.n);
const lastChamp=lastPlayed.length>0?lastPlayed[lastPlayed.length-1]:null;
const totalRounds=tourney.rd;
const draw=Math.pow(2,totalRounds);
const isGS=tourney.lv==="GS";
const surfEmoji={clay:"\u{1F7E4}",hard:"\u{1F535}",grass:"\u{1F7E2}"}[tourney.sf]||"\u{1F3BE}";

return(<>
{/* Tournament poster */}
<div style={{background:`linear-gradient(180deg,${SC[tourney.sf]}dd,${SC[tourney.sf]}66)`,borderRadius:8,padding:"16px 14px",marginBottom:8,border:"2px solid #fff3",position:"relative",overflow:"hidden"}}>
{/* Surface texture overlay */}
<div style={{position:"absolute",top:0,left:0,right:0,bottom:0,opacity:0.06,background:"repeating-linear-gradient(45deg,#fff,#fff 2px,transparent 2px,transparent 8px)"}}/>

<div style={{position:"relative",textAlign:"center"}}>
<Px size={6} color="#fff9" style={{letterSpacing:2,display:"block",marginBottom:6}}>{LL[tourney.lv]}</Px>
<div style={{fontSize:24,marginBottom:4}}>{flag}</div>
<Px size={14} color="#fff" style={{display:"block",textShadow:"2px 2px 0 rgba(0,0,0,0.4)"}}>{tourney.n}</Px>
<Px size={7} color="#fffd" style={{display:"block",marginTop:6}}>{tourney.ci} {"\u00B7"} {SN[tourney.sf]} {surfEmoji}</Px>
{isFavSurf&&<div style={{marginTop:4}}><Px size={6} color="#ffd700">{"\u2B50"} Seu piso favorito!</Px></div>}
</div>
</div>

{/* Tournament info cards */}
<div style={{display:"flex",gap:6,marginBottom:8}}>
<div style={{flex:1,background:"#0a0a18",border:"1px solid #222",borderRadius:4,padding:"8px 6px",textAlign:"center"}}>
<Px size={6} color="#888">PRÊMIO</Px>
<Px size={9} color="#4ade80" style={{display:"block",marginTop:3}}>${tourney.pr.toLocaleString()}</Px>
</div>
<div style={{flex:1,background:"#0a0a18",border:"1px solid #222",borderRadius:4,padding:"8px 6px",textAlign:"center"}}>
<Px size={6} color="#888">CAMPEÃO</Px>
<Px size={9} color="#fbbf24" style={{display:"block",marginTop:3}}>{getPts(tourney.lv,tourney.rd,tourney.rd-1)} pts</Px>
</div>
<div style={{flex:1,background:"#0a0a18",border:"1px solid #222",borderRadius:4,padding:"8px 6px",textAlign:"center"}}>
<Px size={6} color="#888">RODADAS</Px>
<Px size={9} color="#fff" style={{display:"block",marginTop:3}}>{totalRounds}</Px>
<Px size={6} color="#555" style={{display:"block",marginTop:2}}>{isGS?"Melhor de 5":"Melhor de 3"}</Px>
</div>
</div>

{/* Last edition */}
{lastChamp&&(
<div style={{background:"#0a0a18",border:"1px solid #333",borderRadius:4,padding:"8px 12px",marginBottom:8}}>
<Px size={6} color="#888" style={{display:"block",marginBottom:3}}>SUA ÚLTIMA PARTICIPAÇÃO</Px>
<Px size={6} color={lastChamp.won?"#ffd700":"#aaa"}>{lastChamp.won?"\u{1F3C6} Campeão!":"Eliminado na rodada "+lastChamp.rw+"/"+lastChamp.tr}</Px>
</div>
)}

{/* VS Card */}
{nextOpponent&&(()=>{
const isRevanche=lastEliminator&&nextOpponent.name===lastEliminator.name;
const h2h=h2hLog[nextOpponent.name];
return(<div style={{background:isRevanche?"#1a0a0a":"#0a0a18",border:"2px solid "+(isRevanche?"#f87171":"#333"),borderRadius:4,padding:"10px 12px",textAlign:"center",marginBottom:6}}>
{isRevanche&&<Px size={6} color="#f87171" style={{display:"block",marginBottom:4}}>{"\u{1F525}"} REVANCHE</Px>}
<Px size={6} color="#888" style={{display:"block",marginBottom:6}}>1ª RODADA</Px>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 4px"}}>
<div style={{textAlign:"center",flex:1}}>
<Px size={10} color="#4ade80" style={{display:"block"}}>{player.name.split(" ")[0]}</Px>
<Px size={7} color="#888" style={{display:"block",marginTop:3}}>#{player.rank}</Px>
</div>
<Px size={14} color="#ffd700">VS</Px>
<div style={{textAlign:"center",flex:1}}>
<Px size={10} color={isRevanche?"#f87171":"#fff"} style={{display:"block"}}>{nextOpponent.name.split(" ")[0]}</Px>
<Px size={7} color="#888" style={{display:"block",marginTop:3}}>#{nextOpponent.rank}</Px>
</div>
</div>
{h2h&&(
<div style={{marginTop:5,paddingTop:5,borderTop:"1px solid #1a1a2e"}}>
<Px size={6} color="#666">H2H: <Px size={6} color="#4ade80">{h2h.w}V</Px> <Px size={6} color="#f87171">{h2h.l}D</Px></Px>
</div>
)}
</div>);
})()}

<div style={{flex:1,minHeight:2,maxHeight:12}}/>
<Btn onClick={startTourneyMatch} color="#2d8c3c" style={{padding:"14px 16px",fontSize:11}}>JOGAR</Btn>
<button onClick={()=>{setPlayer(p=>({...p,money:p.money+getTourneyCost(tourney.lv)}));setTourney(null);setNextOpponent(null)}} style={{fontFamily:"'Press Start 2P',monospace",fontSize:8,padding:"8px 16px",background:"none",color:"#555",border:"none",cursor:"pointer",width:"100%",textAlign:"center",marginTop:4}}>VOLTAR E ESCOLHER OUTRO</button>
</>);
})()}

{/* NO TOURNAMENT SELECTED - show weekly calendar */}
{!tourney&&(<>

{availableTourneys.length>0?(<>
<Px size={6} color="#666" style={{display:"block",marginBottom:10,textAlign:"center"}}>Escolha o torneio que deseja disputar esta semana</Px>
{availableTourneys.map((t,i)=>{
const cost=getTourneyCost(t.lv);
const canAfford=player.money>=cost;
const isInjured=injury>0;
const flag=CF[t.co]||"\u{1F3F3}\uFE0F";
const isFav=player.favSurface===t.sf;
const energyMin=isFav?8:13;
const energyMax=isFav?Math.max(10,t.rd*8+7):t.rd*8+15;
return(<button key={i} onClick={()=>{if(!isInjured)pickTourney(t)}} disabled={isInjured} style={{display:"block",width:"100%",background:SC[t.sf]+"22",border:"2px solid "+SC[t.sf]+"88",borderRadius:4,padding:"10px 12px",marginBottom:8,cursor:isInjured?"default":"pointer",textAlign:"left",fontFamily:"'Press Start 2P',monospace",opacity:isInjured?0.4:1}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
<div>
<Px size={8} color="#fff">{flag} {t.n}</Px>
<div style={{marginTop:4}}><Px size={6} color="#aaa">{LL[t.lv]} {"\u00B7"} {t.ci} {"\u00B7"} {SN[t.sf]}{isFav?" \u2B50":""}</Px></div>
<div style={{marginTop:3}}><Px size={6} color="#fbbf24">{getPts(t.lv,t.rd,t.rd-1)} pts</Px><Px size={6} color="#4ade80">{" \u00B7 $"}{t.pr.toLocaleString()}</Px></div>
</div>
<div style={{textAlign:"right",flexShrink:0}}>
<Px size={8} color={canAfford?"#4ade80":"#f87171"}>${cost}</Px>
<Px size={6} color={energy<=energyMax?"#f87171":"#666"} style={{display:"block",marginTop:3}}>{"\u26A1"}{energyMin}-{energyMax}%</Px>
</div>
</div>
</button>);
})}
</>):(<div style={{background:"#0a0a18",border:"1px solid #222",borderRadius:4,padding:16,marginBottom:6,textAlign:"center"}}>
<Px size={7} color="#888">Nenhum torneio disponível esta semana</Px>
<Px size={6} color="#555" style={{display:"block",marginTop:4}}>Descanse ou avance a semana</Px>
</div>)}

{/* WILDCARD OFFER */}
{wildcardTourney&&!tourney&&(()=>{
const wt=wildcardTourney;
const flag=CF[wt.co]||"\u{1F3F3}\uFE0F";
const isInjured=injury>0;
return(<div style={{animation:"fadeIn 0.4s",marginBottom:8}}>
<button onClick={()=>{if(!isInjured)pickTourney(wt,true)}} disabled={isInjured} style={{display:"block",width:"100%",background:"linear-gradient(135deg,#1a0a2e,#0a1a2e)",border:"2px solid #c084fc",borderRadius:6,padding:"12px 14px",cursor:isInjured?"default":"pointer",textAlign:"left",fontFamily:"'Press Start 2P',monospace",opacity:isInjured?0.4:1,boxShadow:"0 0 16px rgba(192,132,252,0.15)",animation:"glowPulse 2s infinite"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
<div>
<div style={{marginBottom:4}}><Px size={6} color="#c084fc" style={{letterSpacing:1}}>{"\u{1F3AB}"} WILDCARD</Px></div>
<Px size={8} color="#fff">{flag} {wt.n}</Px>
<div style={{marginTop:4}}><Px size={6} color="#c9a0ff">{LL[wt.lv]} {"\u00B7"} {wt.ci} {"\u00B7"} {SN[wt.sf]}</Px></div>
<div style={{marginTop:3}}><Px size={6} color="#fbbf24">{getPts(wt.lv,wt.rd,wt.rd-1)} pts</Px><Px size={6} color="#4ade80">{" \u00B7 $"}{wt.pr.toLocaleString()}</Px></div>
</div>
<div style={{textAlign:"right",flexShrink:0}}>
<Px size={8} color="#4ade80">GRÁTIS</Px>
<Px size={6} color="#c084fc" style={{display:"block",marginTop:3}}>Convite especial</Px>
</div>
</div>
</button>
<button onClick={()=>setWildcardTourney(null)} style={{fontFamily:"'Press Start 2P',monospace",fontSize:6,padding:"4px 8px",background:"none",color:"#555",border:"none",cursor:"pointer",width:"100%",textAlign:"center",marginTop:2}}>Recusar convite</button>
</div>);
})()}

<div style={{flex:1,minHeight:2,maxHeight:20}}/>
<Btn onClick={skipWeek} color={injury>0?"#c4612d":energy<50?"#8b6914":"#333"} style={{fontSize:10}}>
{injury>0?"\u{1F915} RECUPERAR ("+injury+" sem restantes)"
:energy<50?"\u{1F4A4} DESCANSAR (+20 energia)"
:"PULAR SEMANA"}
</Btn>
</>)}

</div>
);
};

return(<div style={ctn}><div style={scan}/>
{notif&&<div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",background:"#0a0a18",border:"2px solid #ffd700",borderRadius:4,padding:"8px 18px",zIndex:2000,animation:"fadeIn 0.3s"}}><Px size={7} color="#ffd700">{notif}</Px></div>}

{showOvrInfo&&(<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setShowOvrInfo(false)}>
<div onClick={e=>e.stopPropagation()} style={{background:"#0a0a18",border:"2px solid #ffd700",borderRadius:6,padding:20,maxWidth:320,width:"100%"}}>
<Px size={9} color="#ffd700" style={{display:"block",marginBottom:12}}>O QUE É OVERALL?</Px>
<Px size={7} color="#aaa" style={{display:"block",lineHeight:2.4,marginBottom:12}}>O Overall representa o seu nível como tenista. Quanto maior, mais chances de vencer.</Px>
<Px size={7} color="#aaa" style={{display:"block",lineHeight:2.4,marginBottom:14}}>Sobe ao ganhar partidas e títulos. Raquetes melhores também aumentam. Cuidado com lesões!</Px>
<Btn onClick={()=>setShowOvrInfo(false)} color="#222">ENTENDI</Btn>
</div>
</div>)}

{/* ACHIEVEMENT POPUP */}
{newAchievement&&(<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.92)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
<div style={{background:"linear-gradient(180deg,#1a1a0a,#0a0a18)",border:"2px solid #ffd700",borderRadius:10,padding:24,maxWidth:360,width:"100%",animation:"fadeIn 0.5s",boxShadow:"0 0 60px rgba(255,215,0,0.2)",textAlign:"center"}}>
<div style={{fontSize:48,marginBottom:8}}>{newAchievement.icon}</div>
<Px size={7} color="#ffd700" style={{letterSpacing:2,display:"block",marginBottom:6}}>CONQUISTA DESBLOQUEADA</Px>
<Px size={14} color="#fff" style={{display:"block",marginBottom:6}}>{newAchievement.name}</Px>
<Px size={7} color="#aaa" style={{display:"block",marginBottom:14}}>{newAchievement.desc}</Px>
<div style={{background:"#111",borderRadius:6,padding:"10px 16px",display:"inline-block",marginBottom:16}}>
<Px size={6} color="#888">RECOMPENSA</Px>
<Px size={11} color="#4ade80" style={{display:"block",marginTop:4}}>{newAchievement.reward}</Px>
</div>
<Btn onClick={()=>setNewAchievement(null)} color="#ffd700" style={{fontSize:10}}>INCRÍVEL!</Btn>
</div>
</div>)}

{/* LOSING STREAK TIP POPUP */}
{showLossTip&&!newAchievement&&(<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.88)",zIndex:2500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setShowLossTip(false)}><div onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(180deg,#12122e,#0a0a18)",border:"2px solid #fbbf24",borderRadius:8,padding:22,maxWidth:360,width:"100%",animation:"fadeIn 0.4s"}}>
<div style={{textAlign:"center",marginBottom:14}}>
<div style={{fontSize:36,marginBottom:8}}>{"\u{1F4A1}"}</div>
<Px size={11} color="#fbbf24" style={{display:"block"}}>DICA DO MARCOS</Px>
</div>
<div style={{background:"#0a0a18",border:"1px solid #333",borderRadius:6,padding:14,marginBottom:14}}>
<Px size={7} color="#fff" style={{display:"block",lineHeight:2.4}}>
{consecutiveLosses>=4
?"Ei, não desiste! Seus rivais estão mais fortes que você agora. Invista na Loja — uma raquete ou calçado melhor pode mudar tudo!"
:consecutiveLosses>=3
?"Fase difícil, mas faz parte da carreira. Dá uma olhada na Loja, equipamentos melhores aumentam seu OVR e suas chances."
:"Tá complicado, né? Sabia que na aba Loja você encontra itens que melhoram seu nível? Vale conferir!"}
</Px>
</div>
<div style={{display:"flex",gap:8}}>
<Btn onClick={()=>{setShowLossTip(false);setActiveTab("loja")}} color="#fbbf24" style={{flex:1}}>IR PRA LOJA</Btn>
<Btn onClick={()=>setShowLossTip(false)} color="#333" style={{flex:1}}>DEPOIS</Btn>
</div>
</div>
</div>)}

{/* FIRST TIME TUTORIAL */}
{showTutorial&&activeTab==="jogar"&&(()=>{
const firstGoal=ACHIEVEMENTS[0];
return(<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.90)",zIndex:2500,display:"flex",alignItems:"center",justifyContent:"center",padding:14}} onClick={()=>setShowTutorial(false)}>
<div onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(180deg,#0f0f28,#0a0a18)",border:"2px solid #ffd700",borderRadius:8,padding:20,maxWidth:380,width:"100%",animation:"fadeIn 0.5s",maxHeight:"85vh",overflowY:"auto"}}>

{/* TOP HALF - Motivation + First Conquest */}
<div style={{textAlign:"center",marginBottom:12}}>
<div style={{fontSize:32,marginBottom:4}}>{"\u{1F3BE}"}</div>
<Px size={12} color="#ffd700" style={{display:"block"}}>SUA JORNADA COMEÇA!</Px>
<Px size={6} color="#888" style={{display:"block",marginTop:4}}>Você tem um objetivo à vista</Px>
</div>

<div style={{background:"#0a0a14",border:"2px solid #ffd70044",borderRadius:6,padding:14,marginBottom:14,textAlign:"center"}}>
<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:8}}>
<span style={{fontSize:28}}>{firstGoal.icon}</span>
<div style={{textAlign:"left"}}>
<Px size={6} color="#ffd700" style={{display:"block"}}>PRIMEIRA CONQUISTA</Px>
<Px size={9} color="#fff" style={{display:"block",marginTop:2}}>{firstGoal.name}</Px>
<Px size={6} color="#aaa" style={{display:"block",marginTop:2}}>{firstGoal.desc}</Px>
</div>
</div>
<div style={{background:"#111",borderRadius:4,padding:"6px 12px",display:"inline-block"}}>
<Px size={6} color="#CD7F32">Seu nome ficará Bronze</Px>
</div>
</div>

{/* DIVIDER */}
<div style={{width:"100%",height:1,background:"linear-gradient(90deg,transparent,#ffd70044,transparent)",marginBottom:14}}/>

{/* BOTTOM HALF - Quick Tips */}
<Px size={7} color="#ffd700" style={{display:"block",marginBottom:8,textAlign:"center"}}>DICAS RÁPIDAS</Px>

{[
["\u{1F3BE}","Toque num torneio pra se inscrever e jogar"],
["\u{1F6D2}","Na Loja, compre equipamentos pra subir o OVR"],
["\u26A1","Cuidado com a energia — descanse entre torneios"],
["\u{1F4B0}","Não deixe seu dinheiro acabar!"],
].map(([ico,tip],i)=>(
<div key={i} style={{display:"flex",gap:8,alignItems:"center",padding:"5px 0",borderBottom:i<3?"1px solid #1a1a2e":"none"}}>
<span style={{fontSize:14,flexShrink:0}}>{ico}</span>
<Px size={6} color="#aaa" style={{lineHeight:1.8}}>{tip}</Px>
</div>
))}

<div style={{textAlign:"center",marginTop:14}}>
<Btn onClick={()=>setShowTutorial(false)} color="#2d8c3c" style={{fontSize:10}}>BORA JOGAR</Btn>
</div>
</div>
</div>);
})()}

<div style={{padding:12,paddingTop:10,paddingBottom:120,minHeight:"calc(100vh - 70px)",display:"flex",flexDirection:"column"}}>

{/* HEADER - only on Jogar tab when no tournament selected */}
{activeTab==="jogar"&&!tourney&&(()=>{
const rankAchs=ACHIEVEMENTS.filter(a=>a.tier&&unlockedAchievements.includes(a.id));
const currentTier=rankAchs.length>0?rankAchs[rankAchs.length-1]:null;
const nameColor=currentTier?currentTier.tierColor:"#fff";

return(
<Card style={{
marginBottom:10,
padding:14,
border:`1px solid ${UI.lineStrong}`,
boxShadow:UI.shadow
}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
<div style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}>
<div style={{
background:"radial-gradient(circle,#1a1d34,#0b0e1a)",
borderRadius:10,
padding:6,
border:`1px solid ${UI.lineStrong}`,
boxShadow:"0 0 18px rgba(255,215,0,0.08)",
flexShrink:0
}}>
<Avatar
hair={player.hair||"short"}
clothColor={CLOTHING_BRANDS.find(b=>b.id===player.cloth)?.color||"#111"}
racketColor={RACKET_BRANDS.find(b=>b.id===player.racketBr)?.color||"#ffd700"}
size={56}
/>
</div>

<div style={{minWidth:0}}>
<Px size={10} color={nameColor} style={{display:"block",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
{pFlag} {player.name}
</Px>

{currentTier&&(
<Px size={6} color={currentTier.tierColor} style={{display:"block",marginTop:4}}>
{currentTier.tier}
</Px>
)}

<Px size={6} color={UI.muted} style={{display:"block",marginTop:5}}>
{player.age} anos {"\u00B7"} {player.hand==="canhoto"?"Canhoto":"Destro"}
</Px>

<Px size={6} color={UI.soft} style={{display:"block",marginTop:3}}>
Semana {curWeek} {"\u00B7"} Temporada {season}
</Px>
</div>
</div>

<div style={{textAlign:"right",flexShrink:0}}>
<Px size={6} color={UI.muted} style={{display:"block",letterSpacing:1}}>
RANK
</Px>
<Px size={18} color={UI.gold} style={{display:"block",marginTop:4}}>
#{player.rank}
</Px>
{rankDelta!==0&&(
<Px size={7} color={rankDelta>0?UI.green:UI.red} style={{display:"block",marginTop:4}}>
{rankDelta>0?"\u2191"+rankDelta:"\u2193"+Math.abs(rankDelta)}
</Px>
)}
</div>
</div>

<div style={{
marginTop:10,
paddingTop:9,
borderTop:`1px solid ${UI.line}`,
display:"flex",
alignItems:"center",
gap:8
}}>
<img
src={MARCOS_SM}
width={28}
height={28}
style={{imageRendering:"pixelated",borderRadius:6,display:"block",flexShrink:0}}
alt=""
/>
<Px size={6} color="#fbbf24" style={{lineHeight:1.9}}>
{MARCOS_HUB[~~(Math.random()*MARCOS_HUB.length)]}
</Px>
</div>
</Card>
);
})()}

{/* TAB CONTENT - flex grow to fill */}
<div style={{flex:1,display:"flex",flexDirection:"column"}}>
{renderTabContent()}
</div>

</div>

{/* BOTTOM TAB BAR */}
<div style={{position:"fixed",bottom:0,left:0,right:0,background:"linear-gradient(180deg,#10102a,#0a0a18)",borderTop:"1px solid #ffd70022",display:"flex",flexDirection:"column",zIndex:1500}}>
<div style={{display:"flex",justifyContent:"space-around",padding:"6px 0 4px"}}>
{[
["jogar","Jogar","\u{1F3BE}"],
["loja","Loja","\u{1F6D2}"],
["ranking","Ranking","\u{1F3C6}"],
["stats","Stats","\u{1F4CA}"],
["mais","Mais","\u2699\uFE0F"],
].map(([id,label,ico])=>(
<button key={id} onClick={()=>{setActiveTab(id);SFX.click()}} style={{background:"none",border:"none",cursor:"pointer",textAlign:"center",padding:"6px 8px",fontFamily:"'Press Start 2P',monospace",opacity:activeTab===id?1:0.35,transition:"all 0.2s",filter:activeTab===id?"drop-shadow(0 0 6px rgba(255,215,0,0.3))":"none"}}>
<div style={{fontSize:26,marginBottom:4,transition:"transform 0.2s",transform:activeTab===id?"translateY(-2px)":"none"}}>{ico}</div>
<Px size={6} color={activeTab===id?"#ffd700":"#666"}>{label}</Px>
</button>
))}
<button onClick={()=>{const m=SFX.toggle();setIsMuted(m)}} style={{background:"none",border:"none",cursor:"pointer",textAlign:"center",padding:"6px 8px",fontFamily:"'Press Start 2P',monospace",opacity:0.6,transition:"all 0.2s"}}>
<div style={{fontSize:22,marginBottom:4}}>{isMuted?"\u{1F507}":"\u{1F50A}"}</div>
<Px size={6} color={isMuted?"#f87171":"#666"}>{isMuted?"Mudo":"Som"}</Px>
</button>
</div>
<div style={{textAlign:"center",paddingBottom:"max(6px, env(safe-area-inset-bottom, 6px))"}}><Px size={6} color="#555">© 2026 Thomaz Gouvea</Px></div>
</div>

<style>{CSS}</style>
</div>);
}
