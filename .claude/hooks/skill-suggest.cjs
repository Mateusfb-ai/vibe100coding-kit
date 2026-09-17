#!/usr/bin/env node
// UserPromptSubmit — roteamento DETERMINÍSTICO prompt → skill. Não bloqueia:
// injeta um lembrete curto com a skill certa para o gatilho real. Ordem =
// prioridade: processo (brainstorm, spec, debug) antes de código.
//
// Regra escrita depende de o modelo lembrar; regex roda sempre. Regras extras
// por projeto entram em kit.json → "skills": [{ "regex", "msg" }].
const { lerEntrada, lerConfig } = require('./_kit.cjs');

const entrada = lerEntrada();
const cfg = lerConfig(entrada.cwd || process.cwd());
const prompt = String(entrada.prompt || entrada.user_prompt || '').toLowerCase();
if (!prompt) process.exit(0);

const REGRAS = [
  [/\b(nova (feature|funcionalidade)|criar? (feature|sistema|componente|fluxo)|construir|vamos (fazer|criar|montar)|implementar)\b/,
    'Antes de codar: `superpowers:brainstorming`; feature real ganha spec antes de código (`speckit`).'],
  [/\b(spec|especifica|planejar antes|plano de implementa|requisito)\b/,
    'Use `speckit` (specify → plan → tasks) antes de implementar.'],
  [/\b(bug|erro|falha|quebrad|n[aã]o funciona|stack ?trace|exce[çc][aã]o|traceback|regress[aã]o)\b/,
    'Use `superpowers:systematic-debugging` ANTES de propor conserto.'],
  [/\b(test[ae]s?|tdd|cobertura|unit test|jest|vitest|pytest|xctest)\b/,
    'Use `superpowers:test-driven-development` (teste primeiro).'],
  [/\b(refatora|refactor|multi[- ]?step|orquestr|tarefa (grande|complexa)|v[aá]rios? (agentes|passos)|onda)\b/,
    'Tarefa grande: `.claude/rules/ondas-paralelas.md` (ondas de subagentes) e `roteamento-de-especialistas.md`.'],
  [/\b(seguran[çc]a|auth|login|token|segredo|secret|api key|webhook|rate.?limit|lgpd|idor|vazar|cors|xss)\b/,
    'Rode a régua de segurança do projeto antes de subir (segredo em env, auth + dono, rate-limit, dados pessoais).'],
  [/\b(pesquis[ae]|research|tend[eê]ncia|[uú]ltimos dias|no twitter|no reddit|viral|o que falam|concorrente)\b/,
    'Pesquisa recente: `last30days` / `agent-reach`; relatório multi-fonte: `deep-research`.'],
  [/\b(ui|ux|design|landing|dashboard|interface|componente|layout|tela|paleta|cor(es)?|tipografia|css|figma|mockup)\b/,
    'UI/design: `impeccable` (`shape` antes de codar, `critique`/`audit` depois) e a skill de design da stack (ex.: `ui-ux-pro-max`).'],
  [/\b(marketing|copy|an[uú]ncio|ads?|seo|convers[aã]o|cro|newsletter|pre[çc]o|pricing|funil|paywall|onboarding)\b/,
    'Marketing/copy: `marketing-skills` (copywriting, ads, seo-audit, cro, pricing).'],
  [/\b(post|roteiro|legenda|caption|texto (final|de venda)|humaniz|soa como ia|cara de ia)\b/,
    'Texto final para humano passa por `humanizer` antes de entregar.'],
  [/\b(como funciona|onde (est[aá]|fica)|o que (chama|usa)|arquitetura|rela[çc][aã]o entre|fluxo de dados|que arquivo|depend[eê]ncia)\b/,
    'Consulte o grafo: `graphify query "<pergunta>"` na raiz e cite arquivo:linha (se graph.json existir).'],
  [/\b(pronto|pode publicar|entrega|revisa a pe[çc]a|t[aá] bom)\b/,
    'Entregável pronto: rode `checar-entrega` (régua + segurança) antes de mandar ao dono.'],
  [/\b(sobe pro main|publica|commita e sobe|leva pro main|integra)\b/,
    'Subir para a main: `sync-main` / `npm run integrar` (rebase antes, gates sobre a base nova, um push por vez).'],
  [/\b(code ?review|revis(a|ão) (do|de) (c[oó]digo|pr|diff|branch)|antes de (mergear|integrar)|painel de revis)\b/,
    'Revisão antes de integrar: painel de revisores (`docs/prompts/05-code-review-em-painel.md`) ou `/code-review`; achado sem cenário de falha não é achado.'],
  [/\b(testa(r)? (a )?(tela|frontend|front|p[aá]gina|fluxo)|navegador|browser|clica|preenche o form|e2e)\b/,
    'Teste de frontend de verdade: `agent-browser open <url>` → `snapshot` → `click/fill @eN` → `screenshot` (ou a superfície de navegador da sessão).'],
  [/\b(existe (uma )?skill|tem skill|como (eu )?fa[çc]o|skill (pra|para)|find.?skills)\b/,
    'Antes de improvisar: `find-skills` (`npx skills find "<tema>"`) busca no ecossistema aberto e instala.'],
  [/\b(resumid|breve|curto|econom[iz]|menos token|caveman|direto ao ponto)\b/,
    'Use `caveman` (modo compacto, mantém precisão técnica).'],
];

const hits = [];
for (const [re, msg] of REGRAS) if (re.test(prompt) && !hits.includes(msg)) hits.push(msg);
for (const extra of cfg.skills || []) {
  try {
    if (new RegExp(extra.regex, 'i').test(prompt) && !hits.includes(extra.msg)) hits.push(extra.msg);
  } catch { /* regex inválida em kit.json: ignora, não derruba o hook */ }
}

const cabecalho = [
  `[${cfg.nome}] ANTES de agir NESTE comando:`,
  '- 1) GRAFO: se `graphify-out/graph.json` existir, `graphify query "<o que preciso>"` e cite arquivo:linha.',
  '- 2) SKILL: cheque qual se aplica (1% de chance = usa, não improvisa).',
  `- 3) Fontes da verdade: ${cfg.fontesDaVerdade.join(' → ')}. Investigar antes de afirmar ou remover.`,
];
if (hits.length) cabecalho.push('- Skills sugeridas para este comando:', ...hits.map((h) => `  - ${h}`));
console.log(cabecalho.join('\n'));
