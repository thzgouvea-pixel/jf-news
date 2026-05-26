import Head from "next/head";
import Link from "next/link";
import { kv } from "@vercel/kv";
import NextDuelCard from "../components/NextDuelCard";
import MatchPrediction from "../components/MatchPrediction";
import { SANS, SERIF, TEXT, DIM, GREEN } from "../lib/constants";

async function readKV(key) {
  try {
    var v = await kv.get(key);
    if (!v) return null;
    return typeof v === "string" ? JSON.parse(v) : v;
  } catch (e) { return null; }
}

export async function getServerSideProps(ctx) {
  var results = await Promise.all([
    readKV("fn:nextMatch"),
    readKV("fn:opponentProfile"),
    readKV("fn:winProb"),
    readKV("fn:h2h"),
    readKV("fn:bracketUrl"),
    readKV("fn:nextTournament"),
    readKV("fn:ranking"),
  ]);
  var ranking = results[6];
  ctx.res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  return { props: {
    nextMatch: results[0] || null,
    opponentProfile: results[1] || null,
    winProb: results[2] || null,
    h2h: results[3] || null,
    bracketUrl: results[4] || null,
    nextTournament: results[5] || null,
    player: ranking && ranking.ranking ? { ranking: ranking.ranking } : null,
  }};
}

export default function ProximoJogo(props) {
  var nm = props.nextMatch;
  var op = props.opponentProfile;
  var isTBD = !nm || !nm.opponent_name || nm.opponent_name === "A definir";
  var oppProfileValid = !!(op && op.name && nm && nm.opponent_id && nm.opponent_name && nm.opponent_name !== "A definir");

  var oppShort = !isTBD ? nm.opponent_name.split(" ").pop() : "";
  var dateBR = !isTBD && nm.startTimestamp
    ? new Date(nm.startTimestamp * 1000).toLocaleString("pt-BR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })
    : "";

  var title = !isTBD
    ? "Fonseca x " + oppShort + " — " + nm.tournament_name + (nm.round ? " · " + nm.round : "") + ": horário, onde assistir e palpite | Fonseca News"
    : "Próximo jogo do João Fonseca | Fonseca News";

  var description = !isTBD
    ? "Próximo jogo do João Fonseca" + (dateBR ? " em " + dateBR : "") + " contra " + nm.opponent_name + " em " + nm.tournament_name + (nm.broadcast ? ". Transmissão: " + nm.broadcast : "") + ". Veja palpite, head-to-head e estatísticas."
    : "Acompanhe o próximo jogo do João Fonseca: horário, adversário, transmissão e palpite no Fonseca News.";

  var canonical = "https://fonsecanews.com.br/proximo-jogo";
  var ogImg = "https://fonsecanews.com.br/og-image.PNG";

  var jsonLd = null;
  if (!isTBD) {
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "SportsEvent",
      "name": "João Fonseca x " + nm.opponent_name,
      "sport": "Tennis",
      "eventStatus": "https://schema.org/EventScheduled",
      "eventAttendanceMode": "https://schema.org/MixedEventAttendanceMode",
      "competitor": [
        { "@type": "Person", "name": "João Fonseca", "nationality": "BR" },
        Object.assign({ "@type": "Person", "name": nm.opponent_name }, nm.opponent_country ? { "nationality": nm.opponent_country } : {})
      ],
    };
    var iso = nm.date || (nm.startTimestamp ? new Date(nm.startTimestamp * 1000).toISOString() : null);
    if (iso) jsonLd.startDate = iso;
    if (nm.tournament_name) {
      jsonLd.location = { "@type": "Place", "name": nm.tournament_name };
      jsonLd.superEvent = { "@type": "SportsEvent", "name": nm.tournament_name + " 2026" };
    }
    if (nm.broadcast) {
      jsonLd.broadcastOfEvent = {
        "@type": "BroadcastEvent",
        "broadcaster": { "@type": "Organization", "name": nm.broadcast }
      };
    }
  }

  var h2h = props.h2h;
  var h2hSummary = "";
  if (h2h && !isTBD && (h2h.fonseca_wins != null || h2h.opponent_wins != null)) {
    var fw = h2h.fonseca_wins || 0;
    var ow = h2h.opponent_wins || 0;
    if (fw + ow > 0) {
      h2hSummary = "Confrontos diretos: " + fw + "-" + ow + " (Fonseca-" + oppShort + ").";
    }
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImg} />
        <meta property="og:site_name" content="Fonseca News" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImg} />
        {jsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )}
      </Head>

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "16px", fontFamily: SANS }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: DIM, textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
            {"← Home"}
          </Link>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 16, fontWeight: 900, fontFamily: SERIF, color: TEXT, letterSpacing: "-0.02em" }}>
              Fonseca <span style={{ color: GREEN }}>News</span>
            </span>
          </Link>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: TEXT, fontFamily: SERIF, lineHeight: 1.2, margin: "8px 0 4px" }}>
          {isTBD
            ? "Próximo jogo do João Fonseca"
            : "Fonseca x " + oppShort + (nm.tournament_name ? " — " + nm.tournament_name : "")}
        </h1>
        {!isTBD && (
          <p style={{ color: DIM, fontSize: 13, margin: "0 0 16px" }}>
            {nm.round ? nm.round + " · " : ""}{dateBR ? dateBR + " (Brasília)" : "Horário a confirmar"}{nm.broadcast ? " · " + nm.broadcast : ""}
          </p>
        )}

        {isTBD ? (
          <p style={{ color: DIM, fontSize: 14, margin: "8px 0 24px" }}>
            Ainda não há próximo jogo confirmado. Acompanhe a{" "}
            <Link href="/" style={{ color: GREEN, fontWeight: 700, textDecoration: "none" }}>
              página principal
            </Link>{" "}
            pra novidades.
          </p>
        ) : (
          <>
            <section style={{ padding: "8px 0 0" }}>
              <div style={{ borderRadius: 22, overflow: "hidden", boxShadow: "0 4px 20px rgba(10,18,32,0.25)", background: "#0a1220" }}>
                <NextDuelCard
                  match={nm}
                  player={props.player}
                  onOppClick={null}
                  winProb={props.winProb}
                  oppProfile={oppProfileValid ? op : null}
                  liveData={null}
                  nextTournament={props.nextTournament}
                  bracketUrl={props.bracketUrl}
                />
              </div>
            </section>

            {h2hSummary && (
              <section style={{ padding: "12px 0 0", color: DIM, fontSize: 13 }}>
                {h2hSummary}
              </section>
            )}

            <section style={{ padding: "12px 0 0" }}>
              <MatchPrediction match={nm} />
            </section>
          </>
        )}

        <p style={{ marginTop: 24, fontSize: 12, color: DIM, textAlign: "center" }}>
          <Link href="/ultimo-jogo" style={{ color: DIM, textDecoration: "underline" }}>
            Último jogo
          </Link>
          {" · "}
          <Link href="/" style={{ color: DIM, textDecoration: "underline" }}>
            Voltar pra home
          </Link>
        </p>
      </main>
    </>
  );
}
