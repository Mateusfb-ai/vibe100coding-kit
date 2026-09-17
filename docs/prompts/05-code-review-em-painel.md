# Prompt: code review em painel (antes de integrar)

Um revisor só favorece a própria lente. Um painel de revisores estreitos, em paralelo, acha mais problema real; a síntese é o que separa sinal de ruído.

```
Revise [DIFF / PR / BRANCH] com um painel de revisores independentes e
sintetize num relatório único ranqueado. Não revise você mesmo primeiro:
despache o painel.

1. Painel, em paralelo, num lote só (descarte a lente que não se aplica):
   - qualidade geral: legibilidade, estrutura, tratamento de erro, código
     morto, cobertura de teste faltando;
   - segurança: OWASP Top 10, segredo no código, injeção, auth quebrada,
     desserialização insegura, CVE de dependência;
   - tipagem em [LINGUAGEM]: cast inseguro, escape do sistema de tipos,
     assíncrono/concorrência, entrada não conferida;
   - [FRAMEWORK]: regras de componente/hook, render, acessibilidade, armadilhas
     do framework (só se o diff toca código de framework);
   - silent-failure-hunter: catch que engole a causa, fallback que esconde defeito.

   Cada revisor trabalha sem ver os outros e reporta cada achado como:
   arquivo:linha · severidade · afirmação em uma frase · cenário concreto de
   falha (a entrada ou o estado que faz quebrar). Achado sem cenário é palpite:
   o próprio revisor descarta.

2. Síntese: deduplique (mesmo defeito por mais de um revisor vira um item,
   anotando quem concordou) · filtre (sem cenário concreto, ou já tratado no
   código; confira no diff antes de descartar) · ranqueie CRÍTICO (segurança,
   perda de dado) → ALTO (bug real) → MÉDIO (manutenção) → BAIXO (estilo).

3. Relatório: um só, do mais grave ao menos, cada item com arquivo:linha,
   resumo, cenário, severidade e quem levantou. Lista CRÍTICO/ALTO vazia é
   resultado válido, não falha.

Alvo: [DIFF / PR / BRANCH]. Stack: [LINGUAGEM] / [FRAMEWORK].
Depois do relatório: cada CRÍTICO e ALTO corrigido vira gate com mutação.
```

Atalho no Claude Code: `/code-review` (plugin `code-review`) faz a passada por padrões do repositório e por spec; o painel acima é a versão com lentes independentes para mudança não trivial.
