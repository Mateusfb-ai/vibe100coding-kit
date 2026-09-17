# Gates e o meta-gate

Um gate é um script que sai com código 0 (verde) ou diferente (vermelho). A lista canônica é `scripts/gates.txt`, uma linha por gate; `rodar-gates.mjs` roda **todas**, em paralelo, e reprova no fim. Não se seleciona gate pelo arquivo tocado: é assim que gate some da suíte sem ninguém ver.

## As camadas
1. **Limpeza:** sem comentário/emoji em código de produto, sem travessão em texto exibido (`gates/sem-comentario.mjs`, `gates/sem-travessao.mjs`).
2. **Tipos e build:** `tsc --noEmit`, `swift build`, o que a stack tiver.
3. **Lógica:** um script por invariante do produto (`scripts/gates/*.mjs`). Nome diz o que protege: `provar-recorte-nao-estoura`, `testar-rota-exige-dono`.
4. **Tela:** navegador headless medindo o que o dono aprovou olhando (ordem, altura, sem rolagem lateral).
5. **Lista:** `gates/lista-de-gates.mjs` garante que todo `gate:*` do package.json está em `gates.txt` ou declarado removido.
6. **Meta:** `meta-gate.mjs` prova que cada gate pega o defeito que promete.

## A lei do gate
> Gate que não sabe dizer como se prova não protege nada.

Gate novo nasce com a mutação em `scripts/mutacoes.mjs`:

```js
{ gate: "node scripts/gates/sem-travessao.mjs",
  arquivo: "src/i18n/pt-BR.json",
  de: "\"Salvo. Tudo certo.\"", para: "\"Salvo — tudo certo.\"" }
```

O meta-gate confere três coisas: **cobertura por contagem** (todo gate tem mutação ou isenção com motivo em `gates-sem-mutacao.txt`), **âncora viva** (`de` casa exatamente uma vez; senão a prova virou papel) e **injeção real** (aplica, roda, exige vermelho, restaura). Enquanto o defeito está no disco, `.kit-mutacao-em-voo.json` faz o hook recusar edição.

## Vermelho é dado, não veredito
Três causas pedem ações opostas: defeito, pré-condição ausente (sem build, sem `.env`, sem Xcode) e disputa entre sessões (passa sozinho, falha na suíte). Rode o gate isolado antes de concluir.

## Onde ancorar
No menor escopo que contém a decisão. Nunca no nome (aparece em comentário), nunca no arquivo inteiro quando o alvo é ordem, nunca preso à forma da implementação (reprova quando a forma muda com o comportamento intacto). Gate que lê intenção ("o arquivo bate com o gerador?") é cego para resultado ("o app compila?").

## Gate removido é declarado
`scripts/gates-removidos.txt`: o comando sozinho numa linha, o motivo em linhas de `#` abaixo. Gate que some em silêncio já custou quatro numa tarde.
