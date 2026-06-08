import { useState, useEffect } from "react";
import Head from "next/head";
import { SANS, SERIF } from "../lib/constants";

// Painel privado pra gerar posts (tweets) prontos do FonsecaNews.
// Le os dados reais do site e monta o texto — voce copia e cola no X.
// Acesso por senha (PUSH_SECRET), guardada no proprio aparelho (localStorage).

export default function AdminPosts() {
  var _secret = useState(""); var secret = _secret[0]; var setSecret = _secret[1];
  var _input = useState(""); var input = _input[0]; var setInput = _input[1];
  var _posts = useState([]); var posts = _posts[0]; var setPosts = _posts[1];
  var _texts = useState({}); var texts = _texts[0]; var setTexts = _texts[1];
  var _loading = useState(false); var loading = _loading[0]; var setLoading = _loading[1];
  var _error = useState(""); var error = _error[0]; var setError = _error[1];
  var _copied = useState(""); var copied = _copied[0]; var setCopied = _copied[1];
  var _genAt = useState(""); var genAt = _genAt[0]; var setGenAt = _genAt[1];

  useEffect(function () {
    try {
      var saved = window.localStorage.getItem("fn_admin_secret");
      if (saved) { setSecret(saved); fetchPosts(saved); }
    } catch (e) {}
  }, []);

  function fetchPosts(sec) {
    setLoading(true); setError("");
    fetch("/api/generate-posts?secret=" + encodeURIComponent(sec))
      .then(function (r) {
        if (r.status === 401) { throw new Error("Senha incorreta."); }
        if (!r.ok) { throw new Error("Erro ao carregar (" + r.status + ")."); }
        return r.json();
      })
      .then(function (d) {
        setPosts(d.posts || []);
        var t = {};
        (d.posts || []).forEach(function (p) { t[p.id] = p.text; });
        setTexts(t);
        setGenAt(d.generatedAt || "");
        try { window.localStorage.setItem("fn_admin_secret", sec); } catch (e) {}
      })
      .catch(function (e) {
        setError(e.message || "Erro.");
        if ((e.message || "").indexOf("Senha") !== -1) {
          setSecret(""); try { window.localStorage.removeItem("fn_admin_secret"); } catch (er) {}
        }
      })
      .finally(function () { setLoading(false); });
  }

  function handleEnter() {
    if (!input.trim()) return;
    setSecret(input.trim());
    fetchPosts(input.trim());
  }

  function handleLogout() {
    setSecret(""); setPosts([]); setTexts({}); setInput("");
    try { window.localStorage.removeItem("fn_admin_secret"); } catch (e) {}
  }

  function copyText(id) {
    var val = texts[id] || "";
    function done() { setCopied(id); setTimeout(function () { setCopied(""); }, 1800); }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(val).then(done).catch(function () { fallbackCopy(id, done); });
      } else { fallbackCopy(id, done); }
    } catch (e) { fallbackCopy(id, done); }
  }

  function fallbackCopy(id, done) {
    try {
      var el = document.getElementById("ta_" + id);
      if (el) { el.focus(); el.select(); document.execCommand("copy"); done(); }
    } catch (e) {}
  }

  function onEdit(id, value) {
    var t = Object.assign({}, texts); t[id] = value; setTexts(t);
  }

  // ===== Tela de login =====
  if (!secret) {
    return (
      <Wrapper>
        <div style={{ maxWidth: 380, margin: "0 auto", paddingTop: 60 }}>
          <h1 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>Posts · FonsecaNews</h1>
          <p style={{ fontFamily: SANS, fontSize: 13, color: "rgba(255,255,255,0.55)", margin: "0 0 24px", lineHeight: 1.5 }}>
            Gera os textos prontos pra postar no X. Digite a senha de admin.
          </p>
          <input
            type="password" value={input} placeholder="Senha"
            onChange={function (e) { setInput(e.target.value); }}
            onKeyDown={function (e) { if (e.key === "Enter") handleEnter(); }}
            style={inputStyle}
          />
          <button onClick={handleEnter} style={btnPrimary}>Entrar</button>
          {error ? <p style={{ color: "#F87171", fontFamily: SANS, fontSize: 13, marginTop: 12 }}>{error}</p> : null}
        </div>
      </Wrapper>
    );
  }

  // ===== Painel =====
  return (
    <Wrapper>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <h1 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>Posts para o X</h1>
          <button onClick={handleLogout} style={btnGhost}>Sair</button>
        </div>
        <p style={{ fontFamily: SANS, fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 16px" }}>
          Edite se quiser, toque em <b style={{ color: "rgba(255,255,255,0.7)" }}>Copiar</b> e cole no X. Nada é postado automaticamente.
        </p>

        <button onClick={function () { fetchPosts(secret); }} style={btnRefresh} disabled={loading}>
          {loading ? "Carregando…" : "↻ Atualizar com dados do site"}
        </button>

        {error ? <p style={{ color: "#F87171", fontFamily: SANS, fontSize: 13 }}>{error}</p> : null}

        {!loading && posts.length === 0 && !error ? (
          <p style={{ color: "rgba(255,255,255,0.5)", fontFamily: SANS, fontSize: 14, marginTop: 24 }}>
            Nenhum post disponível agora. Quando houver próximo torneio, jogo ou resultado, eles aparecem aqui.
          </p>
        ) : null}

        {posts.map(function (p) {
          var val = texts[p.id] != null ? texts[p.id] : p.text;
          var chars = val.length;
          var over = chars > 280;
          var rows = Math.max(4, val.split("\n").length + 1);
          return (
            <div key={p.id} style={card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={chip}>{p.emoji} {p.label}</span>
                <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: over ? "#F87171" : "rgba(255,255,255,0.5)" }}>
                  {chars}/280
                </span>
              </div>
              <textarea
                id={"ta_" + p.id} value={val} rows={rows}
                onChange={function (e) { onEdit(p.id, e.target.value); }}
                style={textarea}
              />
              <button onClick={function () { copyText(p.id); }} style={copied === p.id ? btnCopied : btnCopy}>
                {copied === p.id ? "✓ Copiado!" : "Copiar"}
              </button>
            </div>
          );
        })}

        {genAt ? (
          <p style={{ fontFamily: SANS, fontSize: 11, color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: 20 }}>
            Gerado {new Date(genAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
          </p>
        ) : null}
      </div>
    </Wrapper>
  );
}

function Wrapper(props) {
  return (
    <>
      <Head>
        <title>Posts · FonsecaNews (admin)</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{ minHeight: "100vh", background: "#0a1220", padding: "24px 16px 60px" }}>
        {props.children}
      </div>
    </>
  );
}

var inputStyle = {
  width: "100%", boxSizing: "border-box", height: 46, borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)",
  color: "#fff", fontSize: 16, padding: "0 14px", fontFamily: SANS, outline: "none", marginBottom: 12,
};
var btnPrimary = {
  width: "100%", height: 46, borderRadius: 10, border: "none", cursor: "pointer",
  background: "#00A859", color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: SANS,
};
var btnGhost = {
  background: "none", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)",
  borderRadius: 8, padding: "6px 12px", fontSize: 12, fontFamily: SANS, cursor: "pointer", fontWeight: 600,
};
var btnRefresh = {
  width: "100%", height: 42, borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.85)", fontSize: 13,
  fontWeight: 600, fontFamily: SANS, cursor: "pointer", marginBottom: 18,
};
var card = {
  background: "#111827", borderRadius: 16, padding: 16, marginBottom: 14,
  border: "1px solid rgba(255,255,255,0.06)",
};
var chip = {
  fontFamily: SANS, fontSize: 12, fontWeight: 700, color: "#fff",
  background: "rgba(0,168,89,0.18)", borderRadius: 999, padding: "4px 10px",
};
var textarea = {
  width: "100%", boxSizing: "border-box", borderRadius: 10, resize: "vertical",
  border: "1px solid rgba(255,255,255,0.1)", background: "#0a1220", color: "#f3f4f6",
  fontSize: 15, lineHeight: 1.5, padding: 12, fontFamily: SANS, outline: "none", marginBottom: 10,
};
var btnCopy = {
  width: "100%", height: 46, borderRadius: 10, border: "none", cursor: "pointer",
  background: "#1D9BF0", color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: SANS,
};
var btnCopied = Object.assign({}, btnCopy, { background: "#00A859" });
