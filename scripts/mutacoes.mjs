// O DEFEITO QUE CADA GATE PROMETE PEGAR, escrito como código executável.
//
// Cada entrada é uma mutação: uma troca mínima num arquivo REAL que reintroduz
// o defeito. meta-gate.mjs aplica a mutação, roda o gate e exige VERMELHO;
// depois restaura. Gate que nunca ficou vermelho não provou nada.
//
//   { gate: "<linha exata de gates.txt>", arquivo: "<caminho relativo>",
//     de: "<trecho único no arquivo>", para: "<trecho com o defeito>" }
//
// Se "de" não casa exatamente UMA vez, a âncora envelheceu e o meta-gate acusa:
// mutação que não aplica é prova que virou papel.
export const MUTACOES = [
  {
    gate: "node scripts/gates/sem-comentario.mjs",
    arquivo: "scripts/gates/_fixtures/exemplo.js",
    de: "export const soma = (a, b) => a + b;",
    para: "// soma dois números\nexport const soma = (a, b) => a + b;",
  },
  {
    gate: "node scripts/gates/sem-travessao.mjs",
    arquivo: "scripts/gates/_fixtures/textos.json",
    de: "\"Salvo. Tudo certo por aqui.\"",
    para: "\"Salvo — tudo certo por aqui.\"",
  },
  {
    gate: "node scripts/gates/lista-de-gates.mjs",
    arquivo: "scripts/gates.txt",
    de: "node scripts/gates/sem-travessao.mjs\n",
    para: "",
  },
];
