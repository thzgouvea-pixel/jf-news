import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import DuelHeroCardV3Clean from "../components/redesign/DuelHeroCardV3Clean";

const GREEN = "#00A859";
const BG = "#FCFCFD";
const BG_ALT = "#F7F8F9";
const TEXT = "#1a1a1a";
const SUB = "#6b6b6b";
const DIM = "#a0a0a0";
const BORDER = "#e8e8e8";
const SERIF = "'Source Serif 4', Georgia, serif";
const SANS = "'Inter', -apple-system, sans-serif";
const FONSECA_IMG = "https://www.atptour.com/-/media/alias/player-headshot/f0fv";
const PLAYER_IMG = { Zverev: "https://www.atptour.com/-/media/alias/player-headshot/z355", Berrettini: "https://www.atptour.com/-/media/alias/player-headshot/bk40", Nakashima: "https://www.atptour.com/-/media/alias/player-headshot/n0ae", Rinderknech: "https://www.atptour.com/-/media/alias/player-headshot/rc91", Diallo: "https://www.atptour.com/-/media/alias/player-headshot/d0f6", Bublik: "https://www.atptour.com/-/media/alias/player-headshot/b0bk", Cerundolo: "https://www.atptour.com/-/media/alias/player-headshot/c0aq", Davidovich: "https://www.atptour.com/-/media/alias/player-headshot/d0au" };
const COUNTRY_FLAGS = { Brazil: "🇧🇷", Brasil: "🇧🇷", Italy: "🇮🇹", Itália: "🇮🇹", USA: "🇺🇸", "United States": "🇺🇸", Canada: "🇨🇦", France: "🇫🇷", Argentina: "🇦🇷", Monaco: "🇲🇨", Mônaco: "🇲🇨", Germany: "🇩🇪", Alemanha: "🇩🇪" };

function formatTimeAgo(d){ if(!d) return ""; try{ const m=Math.floor((Date.now()-new Date(d).getTime())/60000); if(m<1) return "agora"; if(m<60) return `há ${m} min`; const h=Math.floor(m/60); if(h<24) return `há ${h}h`; const dd=Math.floor(h/24); return dd===1?"ontem":`há ${dd} dias`; }catch{return "";} }
function formatDateLabel(date){ if(!date) return "A definir"; try{ return new Date(date).toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long",timeZone:"America/Sao_Paulo"}).replace(/^./,c=>c.toUpperCase()); }catch{return "A definir";} }
function formatTimeLabel(date){ if(!date) return "A definir"; try{ return new Date(date).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit",timeZone:"America/Sao_Paulo"}); }catch{return "A definir";} }
function buildCountdownLabel(date){ if(!date) return ""; const diff=new Date(date).getTime()-Date.now(); if(diff<=0) return "Partida em andamento ou já iniciada"; const days=Math.floor(diff/86400000); const hours=Math.floor((diff%86400000)/3600000); const minutes=Math.floor((diff%3600000)/60000); const parts=[]; if(days>0) parts.push(`${days} ${days===1?"dia":"dias"}`); if(hours>0) parts.push(`${hours} ${hours===1?"hora":"horas"}`); if(minutes>0&&days===0) parts.push(`${minutes} ${minutes===1?"minuto":"minutos"}`); return parts.length?parts.join(" e "):"Menos de 1 minuto"; }
function pickOpponentImage(name){ if(!name) return null; const found=Object.keys(PLAYER_IMG).find(k=>name.includes(k)); return found?PLAYER_IMG[found]:null; }
function SectionLabel({children}){ return <p style={{margin:"0 0 12px",fontSize:11,fontWeight:700,color:DIM,fontFamily:SANS,textTransform:"uppercase",letterSpacing:"0.06em"}}>{children}</p>; }
function SoftCard({children,padding=18,elevated=false}){ return <div style={{background:"#fff",borderRadius:18,border:`1px solid ${BORDER}`,padding,boxShadow:elevated?"0 10px 30px rgba(15,23,42,0.05)":"none"}}>{children}</div>; }
function NewsItem({item,noBorder=false}){ return <article style={{padding:"18px 0",borderBottom:noBorder?"none":`1px solid ${BORDER}`}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><span style={{fontSize:11,fontWeight:700,color:GREEN,fontFamily:SANS}}>{item.category||"Notícia"}</span><span style={{fontSize:11,color:DIM,fontFamily:SANS}}>{item.source||"Fonte"}</span><span style={{fontSize:11,color:DIM,fontFamily:SANS,marginLeft:"auto"}}>{formatTimeAgo(item.date)}</span></div><h3 style={{margin:"0 0 6px",fontSize:18,fontWeight:700,color:TEXT,fontFamily:SERIF,lineHeight:1.35}}>{item.title}</h3>{item.summary?<p style={{margin:0,fontSize:14,color:SUB,fontFamily:SANS,lineHeight:1.6}}>{item.summary}</p>:null}</article>; }
function StatPill({label,value,accent=TEXT}){ return <div style={{textAlign:"center",background:BG_ALT,border:`1px solid ${BORDER}`,borderRadius:14,padding:"14px 10px"}}><span style={{display:"block",fontSize:18,fontWeight:800,color:accent,fontFamily:SANS,lineHeight:1}}>{value}</span><span style={{display:"block",fontSize:9,fontWeight:700,color:DIM,fontFamily:SANS,marginTop:4,textTransform:"uppercase",letterSpacing:"0.05em"}}>{label}</span></div>; }

function HeroMeta({nextMatch}){
  const round = nextMatch?.round || "Rodada a definir";
  const category = nextMatch?.tournament_category || "ATP Tour";
  const location = nextMatch?.city && nextMatch?.country ? `${nextMatch.city}, ${nextMatch.country}` : nextMatch?.city || nextMatch?.country || "";
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:10,padding:"0 4px",flexWrap:"wrap"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
        <span style={{fontSize:12,fontWeight:700,color:TEXT,fontFamily:SANS}}>{round}</span>
        <span style={{fontSize:12,color:DIM,fontFamily:SANS}}>{category}</span>
        {location ? <span style={{fontSize:12,color:DIM,fontFamily:SANS}}>· {location}</span> : null}
      </div>
      <span style={{fontSize:11,color:DIM,fontFamily:SANS}}>Guia do próximo jogo</span>
    </div>
  );
}

function LastMatchSummary({ lastMatch }) {
  if (!lastMatch) return null;
  const won = lastMatch?.result === "V";
  return (
    <div style={{marginTop:14,padding:"12px 14px",background: won ? `${GREEN}08` : "#FEF2F2",border: `1px solid ${won ? GREEN + '18' : '#FECACA'}`,borderRadius:14}}>
      <p style={{margin:0,fontSize:13,color:SUB,fontFamily:SANS,lineHeight:1.6}}>
        {won ? "João venceu" : "João foi superado por"} <strong>{lastMatch.opponent_name || "o adversário"}</strong> {lastMatch.score ? `por ${lastMatch.score}` : ""}{lastMatch.round ? `, em ${lastMatch.round.toLowerCase()}` : ""}.
      </p>
    </div>
  );
}

export default function HomePreviewLiveV5Clean(){
  const [news,setNews]=useState([]); const [nextMatch,setNextMatch]=useState(null); const [lastMatch,setLastMatch]=useState(null); const [player,setPlayer]=useState(null); const [season,setSeason]=useState(null); const [recentForm,setRecentForm]=useState([]); const [prizeMoney,setPrizeMoney]=useState(null); const [tournamentFacts,setTournamentFacts]=useState(null); const [winProb,setWinProb]=useState(null); const [highlightVideo,setHighlightVideo]=useState(null);
  useEffect(()=>{ fetch("/api/news").then(r=>r.json()).then(d=>{ if(d?.news) setNews(d.news); if(d?.nextMatch) setNextMatch(d.nextMatch); if(d?.lastMatch) setLastMatch(d.lastMatch); if(d?.player) setPlayer(d.player); if(d?.season) setSeason(d.season); }).catch(()=>{}); fetch("/api/sofascore-data").then(r=>r.json()).then(d=>{ if(d?.recentForm) setRecentForm(d.recentForm); if(d?.prizeMoney) setPrizeMoney(d.prizeMoney); if(d?.tournamentFacts) setTournamentFacts(d.tournamentFacts); if(d?.winProb) setWinProb(d.winProb); if(d?.season) setSeason(d.season); if(d?.ranking?.ranking) setPlayer(prev=>prev?{...prev,ranking:d.ranking.ranking}:{ranking:d.ranking.ranking}); if(d?.lastMatch?.result) setLastMatch(d.lastMatch); if(d?.nextMatch?.date) setNextMatch(d.nextMatch); }).catch(()=>{}); fetch("/api/manual-video").then(r=>r.json()).then(d=>{ if(d?.videoId) setHighlightVideo(d); }).catch(()=>{}); },[]);

  const duelData = useMemo(()=>{ const opponentName=nextMatch?.opponent_name||"A definir"; const opponentCountry=nextMatch?.opponent_country||""; return { statusLabel:"PRÓXIMO JOGO", tournamentName:(nextMatch?.tournament_name||"Próxima partida").split(",")[0], tournamentCategory:nextMatch?.tournament_category||"ATP Tour", round:nextMatch?.round||"Rodada a definir", surface:nextMatch?.surface||"A definir", dateLabel:formatDateLabel(nextMatch?.date), timeLabel:formatTimeLabel(nextMatch?.date), courtLabel:nextMatch?.court||"A definir", broadcastLabel:"ESPN 2 · Disney+", countdownLabel:buildCountdownLabel(nextMatch?.date), joao:{name:"J. Fonseca",flag:"🇧🇷",ranking:player?.ranking||40,image:FONSECA_IMG}, opponent:{name:opponentName,flag:COUNTRY_FLAGS[opponentCountry]||"",ranking:nextMatch?.opponent_ranking||null,image:pickOpponentImage(opponentName)}, probability:winProb?{fonseca:Math.round(winProb.fonseca||0),opponent:Math.round(winProb.opponent||0)}:null, factLabel:tournamentFacts?.facts?.[0]?.text||null, primaryActionLabel:"Onde assistir", primaryActionHref:"https://www.disneyplus.com", secondaryActionLabel:"Adicionar ao calendário" }; },[nextMatch,player,tournamentFacts,winProb]);

  const form = Array.isArray(recentForm)?recentForm.slice(-5).reverse():[]; const displayNews=news.slice(0,3); const seasonValue=season?.wins!==undefined&&season?.losses!==undefined?`${season.wins}-${season.losses}`:"14-8"; const prizeValue=prizeMoney?(prizeMoney>=1000000?`$${(Math.floor(prizeMoney/100000)/10).toFixed(1)}M`:`$${Math.round(prizeMoney/1000)}K`):"$2.9M";

  return <div style={{minHeight:"100vh",background:BG}}><Head><title>Fonseca News</title><meta name="description" content="Homepage v5 com topo mais limpo e hierarquia refinada" /></Head><style>{"@import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');"+"*{box-sizing:border-box;margin:0;padding:0}"+"body{background:#FCFCFD;-webkit-font-smoothing:antialiased}"}</style>
    <header style={{position:"sticky",top:0,zIndex:100,background:"rgba(252,252,253,0.94)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderBottom:`1px solid ${BORDER}`}}><div style={{maxWidth:760,margin:"0 auto",padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}><div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:42,height:42,borderRadius:12,background:"linear-gradient(135deg, #0D1726, #132440)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontFamily:SERIF,fontSize:17,fontWeight:800,letterSpacing:"-0.04em"}}><span style={{color:GREEN}}>F</span><span style={{color:"#FFCB05"}}>N</span></span></div><div><span style={{fontFamily:SERIF,fontSize:22,fontWeight:800,letterSpacing:"-0.02em"}}><span style={{color:GREEN}}>Fonseca</span> <span style={{color:"#FFCB05"}}>News</span></span><span style={{display:"block",fontSize:11,color:DIM,fontFamily:SANS,marginTop:1}}>Tudo sobre João Fonseca, em leitura rápida</span></div></div></div></header>
    <main style={{maxWidth:760,margin:"0 auto",padding:"20px 12px 32px"}}>
      <section style={{paddingBottom:26}}><HeroMeta nextMatch={nextMatch} /><DuelHeroCardV3Clean {...duelData} /></section>
      <section style={{paddingBottom:24}}><SectionLabel>O que acabou de acontecer</SectionLabel><div style={{display:"grid",gap:12}}><SoftCard padding={22} elevated><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:16}}><div><h2 style={{margin:0,fontSize:22,fontWeight:800,color:TEXT,fontFamily:SERIF}}>Última partida</h2><p style={{margin:"5px 0 0",fontSize:13,color:SUB,fontFamily:SANS}}>{lastMatch?.tournament_name||"Último torneio"}{lastMatch?.round?` · ${lastMatch.round}`:""}</p></div><span style={{fontSize:12,fontWeight:800,color:lastMatch?.result==="V"?GREEN:"#DC2626",fontFamily:SANS,background:lastMatch?.result==="V"?`${GREEN}12`:"#FEE2E2",padding:"7px 12px",borderRadius:999}}>{lastMatch?.score||"—"}</span></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div style={{background:BG_ALT,border:`1px solid ${BORDER}`,borderRadius:16,padding:16}}><div style={{fontSize:10,color:DIM,fontFamily:SANS,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>Adversário</div><div style={{fontSize:16,fontWeight:700,color:TEXT,fontFamily:SERIF}}>{lastMatch?.opponent_name||"A definir"}</div></div><div style={{background:BG_ALT,border:`1px solid ${BORDER}`,borderRadius:16,padding:16}}><div style={{fontSize:10,color:DIM,fontFamily:SANS,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>Forma recente</div><div style={{display:"flex",gap:6,marginTop:4}}>{form.length?form.map((m,i)=><span key={i} style={{width:24,height:24,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",background:m.result==="V"?`${GREEN}14`:"#FEE2E2",color:m.result==="V"?GREEN:"#DC2626",fontSize:10,fontWeight:800,fontFamily:SANS}}>{m.result}</span>):null}</div></div></div><LastMatchSummary lastMatch={lastMatch} /></SoftCard>{highlightVideo?<SoftCard padding={0} elevated><div style={{aspectRatio:"16 / 9",background:"linear-gradient(135deg, #111827 0%, #1F2937 100%)",borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontFamily:SANS,fontWeight:700}}>{highlightVideo?.title||"Melhores momentos"}</div></SoftCard>:null}</div></section>
      <section style={{paddingBottom:24}}><SectionLabel>O que mudou hoje</SectionLabel><SoftCard padding={22} elevated><div style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:10,marginBottom:18}}><StatPill label="Ranking" value={`#${player?.ranking||40}`} accent={GREEN} /><StatPill label="Temporada" value={seasonValue} /><StatPill label="vs Top 10" value="1-4" /><StatPill label="Prize Money" value={prizeValue} accent={GREEN} /></div>{displayNews.length?displayNews.map((item,idx)=><NewsItem key={`${item.title}-${idx}`} item={item} noBorder={idx===displayNews.length-1} />):<div style={{fontSize:14,color:SUB,fontFamily:SANS}}>Carregando notícias...</div>}</SoftCard></section>
    </main></div>;
}

export async function getServerSideProps(){ return { props:{} }; }
