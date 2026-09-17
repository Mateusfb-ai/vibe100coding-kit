# Onda de investigação — quando as tarefas terminam no mesmo arquivo

> Complementa [`ondas-paralelas.md`](ondas-paralelas.md), que descreve ondas de
> IMPLEMENTADORES. Esta nasceu do primeiro uso real daquela regra, e existe porque o caso mais comum aqui não é
> "muitas tarefas em muitos arquivos" — é **muitas tarefas que convergem para o
> MESMO arquivo**.

## O caso que a produziu

Dezesseis gates apareceram sem prova no meta-gate. Sete tinham a mesma causa
(âncora de mutação envelhecida) e o conserto dos sete acontecia num arquivo só:
`scripts/mutacoes.mjs`.

Pela regra de formação de onda isso **não paraleliza**: os `Files:` são
idênticos. Sete ondas de uma tarefa é o serial de sempre.

🔑 **Mas a colisão é da ESCRITA, não da LEITURA.** Descobrir *qual* é a âncora
certa exige ler o gate, ler o arquivo-alvo, entender o invariante e conferir
unicidade — trabalho caro, independente entre tarefas, e **somente leitura**.

## A regra

| fase | quem | modo | por quê |
|---|---|---|---|
| **investigar** | subagentes `Explore`, todos numa mensagem só | somente leitura | não há colisão possível entre leitores |
| **aplicar** | o orquestrador, uma tarefa por vez | escrita | o arquivo é um só |

É o princípio de `ondas-paralelas.md` — *implementador não commita, quem commita
é o orquestrador* — um degrau adiante: **investigador não escreve, quem escreve
é o orquestrador.**

## O contrato do investigador

Ele devolve uma proposta EXECUTÁVEL, não um relatório:

- o literal `de:` **atual**, com a contagem de ocorrências conferida por ele —
  `de:` que aparece 0 ou 2 vezes não serve, e mutação que não aplica é **falha,
  nunca "passou"**;
- o literal `para:`;
- uma frase de por que aquilo reproduz **o mecanismo**, não um sintoma parecido
  (o CLAUDE.md: injeção que não reproduz o mecanismo prova o gate contra um defeito
  que não existe);
- e a saída honesta — **"o invariante não existe mais"** — quando for o caso. Sem
  ela o agente inventa uma mutação para ter o que entregar, que é o CLAUDE.md com
  outro uniforme.

⚠️ **O orquestrador reconfere a contagem antes de escrever.** Não é desconfiança:
o arquivo pode ter mudado entre a leitura e a escrita — a mesma janela que o
`integrar` fecha rebaseando antes dos gates.

## Duas armadilhas medidas no mesmo dia

**A emenda que funde duas entradas.** Ao resolver conflito em
`mutacoes-dos-gates.ts`, o `=======` cai no lugar do `},` que fecha a entrada
anterior. Remover os marcadores sem devolver o `},` funde duas entradas numa só;
nenhum gate acusa, **só o `tsc`**. Aconteceu comigo depois de eu ter avisado
outra sessão sobre exatamente isso.

**Duas sessões consertando a mesma coisa.** Seis das minhas correções de âncora
colidiram com correções idênticas já integradas por outra sessão. Não é
desperdício evitável por regra — é o custo de trabalho paralelo — mas ao
rebasear, **fique com o lado já integrado** e preserve só o que é genuinamente
novo. E antes de começar um lote, vale perguntar nas sessões quem já está nele.

## O que NÃO entra numa onda, nunca

**Ferramenta que muta arquivo real** — o meta-gate. Ver
[`docs/FLUXO-DE-TRABALHO.md`](../../docs/FLUXO-DE-TRABALHO.md), seção *O
meta-gate não convive com edição nem commit*.

## O que o híbrido preserva

Nada do `CLAUDE.md` o CLAUDE.md muda: uma sessão, um worktree, uma tarefa; commit
atômico em pt-BR; `npm run gates` antes; `npm run integrar` para publicar — agora
em fila, uma por vez; e integrar continua sendo decisão do dono. Território de
outra sessão **não** se invade porque o trabalho ficou paralelo: dos dezesseis do
dia, sete eram meus e os outros viraram aviso às sessões donas.

Isto muda só uma coisa: **quantas perguntas são respondidas ao mesmo tempo.**
