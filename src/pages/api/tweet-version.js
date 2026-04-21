// Confirma qual versao do prompt do Gemini esta rodando em producao
// URL: https://fonsecanews.com.br/api/tweet-version

import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    var tweetPath = path.join(process.cwd(), "src/pages/api/tweet.js");
    var content = fs.readFileSync(tweetPath, "utf8");

    // Marcadores unicos da versao NOVA
    var hasNewPromptV2 = content.indexOf("Seu trabalho NAO e reescrever a manchete") >= 0;
    var hasRegrasDeVoz = content.indexOf("REGRAS DE VOZ") >= 0;
    var hasExemplosDoTom = content.indexOf("EXEMPLOS DO TOM QUE QUERO") >= 0;
    var hasCategoryHint = content.indexOf("categoryHint") >= 0;
    var hasSanityMax = content.indexOf("SANITY_MAX") >= 0;

    // Marcadores da versao ANTIGA
    var hasOldPrompt = content.indexOf("Reescreva esta noticia como um tweet") >= 0;
    var hasOld260 = content.indexOf("if (txt.length > 260)") >= 0;

    var version = "UNKNOWN";
    if (hasNewPromptV2 && hasRegrasDeVoz && hasExemplosDoTom) {
      version = "NEW_WITH_SAL";
    } else if (hasOldPrompt) {
      version = "OLD_PLAIN_REWRITE";
    }

    res.status(200).json({
      version: version,
      checks: {
        hasNewPromptV2: hasNewPromptV2,
        hasRegrasDeVoz: hasRegrasDeVoz,
        hasExemplosDoTom: hasExemplosDoTom,
        hasCategoryHint: hasCategoryHint,
        hasSanityMax: hasSanityMax,
        hasOldPrompt: hasOldPrompt,
        hasOld260: hasOld260,
      },
      file_size_bytes: content.length,
      file_lines: content.split("\n").length,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
