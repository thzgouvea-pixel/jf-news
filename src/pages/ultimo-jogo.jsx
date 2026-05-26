import Head from "next/head";
import Link from "next/link";
import { kv } from "@vercel/kv";
import PlayerBlock from "../components/PlayerBlock";
import { SANS, SERIF, TEXT, DIM, GREEN, RED } from "../lib/constants";

async function readKV(key) {
  try {
    var v = await kv.get(key);
    if (!v) return null;
    return typeof v === "string" ? JSON.parse(v) : v;
  } catch (e) { return null; }
}

export async function getServerSideProps(ctx) {
  var results = await Promise.all([
    readKV("fn:lastMatch"),
    readKV("fn:matchStats"),
    readKV("fn:recentForm"),
    readKV("fn:prizeMoney"),
    readKV("fn:opponentProfile"),
    readKV("fn:ranking"),
    readKV("fn:season"),
  ]);
  ctx.res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  return { props: {
    lastMatch: results[0] || null,
    matchStats: results[1] || null,
    recentForm: results[2] || null,
    prizeMoney: results[3] && results[3].amount != null ? results[3].amount : null,
    opponentProfile: results[4] || null,
    playerRanking: results[5] && results[5].ranking ? results[5].ranking : null,
    season: results[6] || null,
  }};
}

export default function UltimoJogo(props) {
  var lm = props.lastMatch;
  var hasLm = !!(lm && lm.opponent_name && lm.result);

  var oppShort = hasLm ? lm.opponent_name.split(" ").pop() : "";
  var resultWord = hasLm ? (lm.result === "V" ? "venceu" : "perdeu para") : "";
  var scoreStr = hasLm ? (lm.score || "") : "";
  var dateBR = hasLm && lm.startTimestamp
    ? new Date(lm.startTimestamp * 1000).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" })
    : "";

  var title = hasLm
    ? "Fonseca " + resultWord + " " + oppShort + " " + scoreStr + (lm.tournament_name ? " — " + lm.tournament_name : "") + (lm.round ? " · " + lm.round : "") + " | Fonseca News"
    : "Último jogo do João Fonseca | Fonseca News";

  var description = hasLm
    ? "João Fonseca " + resultWord + " " + lm.opponent_name + " por " + scoreStr + (lm.tournament_name ? " em " + lm.tournament_name : "") + (dateBR ? " no dia " + dateBR : "") + ". Veja estatísticas e forma recente."
    : "Acompanhe o resultado do último jogo do João Fonseca, estatísticas da partida e forma recente.";

  var canonical = "https://fonsecanews.com.br/ultimo-jogo";
  var ogImg = "https://fonsecanews.com.br/og-image.PNG";

  var jsonLd = null;
  if (hasLm) {
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "SportsEvent",
      "name": "João Fonseca x " + lm.opponent_name,
      "sport": "Tennis",
      "competitor": [
        { "@type": "Person", "name": "João Fonseca", "nationality": "BR" },
        Object.assign({ "@type": "Person", "name": lm.opponent_name }, lm.opponent_country ? { "nationality": lm.opponent_country } : {})
      ],
    };
    var iso = lm.date || (lm.startTimestamp ? new Date(lm.startTimestamp * 1000).toISOString() : null);
    if (iso) jsonLd.startDate = iso;
    if (lm.tournament_name) {
      jsonLd.location = { "@type": "Place", "name": lm.tournament_name };
      jsonLd.superEvent = { "@type": "SportsEvent", "name": lm.tournament_name + " 2026" };
    }
  }

  // Mostra opponentProfile apenas se o nome bater com o oponente do ultimo jogo
  var op = props.opponentProfile;
  var oppProfileForBlock = null;
  if (op && op.name && hasLm) {
    var opLast = op.name.split(" ").pop().toLowerCase();
    var lmLast = lm.opponent_name.split(" ").pop().toLowerCase();
    if (opLast === lmLast) oppProfileForBlock = op;
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
          {hasLm
            ? "Fonseca " + resultWord + " " + oppShort
            : "Último jogo do João Fonseca"}
        </h1>
        {hasLm && (
          <p style={{ color: DIM, fontSize: 13, margin: "0 0 4px" }}>
            <span style={{ color: lm.result === "V" ? GREEN : RED, fontWeight: 800, fontSize: 16 }}>{scoreStr}</span>
            {lm.tournament_name ? " · " + lm.tournament_name : ""}
            {lm.round ? " · " + lm.round : ""}
          </p>
        )}
        {hasLm && dateBR && (
          <p style={{ color: DIM, fontSize: 12, margin: "0 0 16px" }}>{dateBR}</p>
        )}

        {!hasLm ? (
          <p style={{ color: DIM, fontSize: 14, margin: "8px 0 24px" }}>
            Ainda não há resultado disponível. Acompanhe a{" "}
            <Link href="/" style={{ color: GREEN, fontWeight: 700, textDecoration: "none" }}>
              página principal
            </Link>{" "}
            pra novidades.
          </p>
        ) : (
          <section style={{ padding: "8px 0 0" }}>
            <div style={{ borderRadius: 22, overflow: "hidden", boxShadow: "0 4px 20px rgba(10,18,32,0.25)", background: "#0a1220" }}>
              <PlayerBlock
                lastMatch={lm}
                matchStats={props.matchStats}
                recentForm={props.recentForm}
                prizeMoney={props.prizeMoney}
                playerRanking={props.playerRanking}
                opponentProfile={oppProfileForBlock}
                season={props.season}
              />
            </div>
          </section>
        )}

        <p style={{ marginTop: 24, fontSize: 12, color: DIM, textAlign: "center" }}>
          <Link href="/proximo-jogo" style={{ color: DIM, textDecoration: "underline" }}>
            Próximo jogo
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
