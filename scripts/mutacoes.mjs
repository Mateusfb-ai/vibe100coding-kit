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
    arquivo: "scripts/gates/_fixtures/texto/textos.json",
    de: "\"Salvo. Tudo certo por aqui.\"",
    para: "\"Salvo — tudo certo por aqui.\"",
  },
  {
    gate: "node scripts/gates/lista-de-gates.mjs",
    arquivo: "scripts/gates.txt",
    de: "node scripts/gates/sem-travessao.mjs\n",
    para: "",
  },
  // Os quatro defeitos que ESTE gate viu de perto. Os três primeiros já
  // aconteceram em código rodando; o quarto é o que faz o painel ter território
  // próprio dentro de `app/`.
  {
    // O hook comparava caminho não resolvido com o `--show-toplevel` do git, que
    // vem resolvido. Sob `/tmp` ou `/var` (symlink no macOS) nada batia, e ele
    // concluía "fora do repositório" — liberando 100% das recusas, em silêncio.
    gate: "node scripts/gates/sessao-abre-arvore.mjs",
    arquivo: ".claude/hooks/escopo-da-sessao.cjs",
    de: "const abs = caminhoReal(path.resolve(alvo));",
    para: "const abs = path.resolve(alvo);",
  },
  {
    // Sem `--git-common-dir`, rodar o comando de dentro de um worktree criava
    // outro worktree ANINHADO dentro dele, e o caminho impresso saía errado.
    gate: "node scripts/gates/sessao-abre-arvore.mjs",
    arquivo: "scripts/sessao.mjs",
    de: "const raiz = raizDoRepo();",
    para: "const raiz = process.cwd();",
  },
  {
    // Só o teste de socket não basta: duas árvores abertas em seguida, com
    // nenhum servidor no ar, recebiam a MESMA porta.
    gate: "node scripts/gates/sessao-abre-arvore.mjs",
    arquivo: "scripts/sessao.mjs",
    de: "  if (reservadas.has(String(p))) continue;\n",
    para: "",
  },
  {
    // Inverte a regra: o prefixo mais CURTO passa a vencer. O `app/` do escopo
    // `site` engole `app/[locale]/painel/`, e o painel deixa de ter território
    // próprio dentro de `app/` -- fica recusado de editar a própria pasta.
    gate: "node scripts/gates/sessao-abre-arvore.mjs",
    arquivo: ".claude/hooks/escopo-da-sessao.cjs",
    de: "const peso = prefixo.replace(/\\/+$/, '').length;",
    para: "const peso = 1000 - prefixo.replace(/\\/+$/, '').length;",
  },
  {
    // A reserva da própria branch voltando a contar como ocupada: reabrir a
    // árvore grava outra porta por cima, e "reabre sempre na mesma" vira mentira.
    gate: "node scripts/gates/sessao-abre-arvore.mjs",
    arquivo: "scripts/sessao.mjs",
    de: "let porta = minha || null;",
    para: "let porta = null;",
  },
  {
    // `NotebookEdit` manda `notebook_path`. Lendo só `file_path`, o hook fica
    // registrado para a ferramenta e nunca decide sobre ela: libera sempre.
    gate: "node scripts/gates/sessao-abre-arvore.mjs",
    arquivo: ".claude/hooks/escopo-da-sessao.cjs",
    de: "const alvo = ti.file_path || ti.notebook_path;",
    para: "const alvo = ti.file_path;",
  },
  {
    // Sem a conferência da branch, `fix/painel` reaproveita a pasta de
    // `feature/painel`: diz "já existe", sai com 0, não cria a branch pedida, e
    // manda a sessão trabalhar na branch errada.
    gate: "node scripts/gates/sessao-abre-arvore.mjs",
    arquivo: "scripts/sessao.mjs",
    de: "if (branchDeLa && branchDeLa !== tarefa) {",
    para: "if (false) {",
  },
];
