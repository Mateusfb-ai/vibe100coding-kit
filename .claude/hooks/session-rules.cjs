#!/usr/bin/env node
// SessionStart — injeta as regras não negociáveis no contexto (startup, compact,
// resume). Determinístico: não depende de o modelo lembrar do CLAUDE.md.
//
// Dois avisos condicionais vêm ANTES das regras, e só aparecem quando valem:
//   0.   você está no diretório principal com outros checkouts abertos (o HEAD
//        do git é um arquivo por diretório; outra sessão troca a sua branch sem
//        aviso — já mandou commit para a branch alheia e publicou branch vazia);
//   0-A. a árvore está N commits atrás de origin/<main> (inventário feito aqui
//        descreve o passado, e o resultado é indistinguível do certo).
// Aviso que aparece sempre vira ruído; por isso silêncio quando não se aplica.
const path = require('node:path');
const { lerEntrada, git, lerConfig } = require('./_kit.cjs');

const entrada = lerEntrada();
const cwd = entrada.cwd || process.cwd();
const cfg = lerConfig(cwd);
const principal = cfg.branchPrincipal;

function avisoDeDiretorioCompartilhado() {
  const meu = git(cwd, 'rev-parse', '--path-format=absolute', '--git-dir');
  const comum = git(cwd, 'rev-parse', '--path-format=absolute', '--git-common-dir');
  if (!meu || path.resolve(meu) !== path.resolve(comum)) return null;
  const checkouts = git(cwd, 'worktree', 'list', '--porcelain').split('\n').filter((l) => l.startsWith('worktree ')).length;
  if (checkouts < 2) return null;
  const branch = git(cwd, 'rev-parse', '--abbrev-ref', 'HEAD');
  return [
    '',
    `0. PARE: você está no DIRETÓRIO PRINCIPAL e há ${checkouts} checkouts abertos. A branch aqui (\`${branch}\`)`,
    '   é compartilhada: outra sessão pode trocá-la embaixo de você, sem erro e sem aviso.',
    `   Antes de editar qualquer arquivo, abra o seu próprio diretório: ${cfg.comandos.sessao}`,
    '',
  ].join('\n');
}

function avisoDeArvoreVelha() {
  const atraso = Number(git(cwd, 'rev-list', '--count', `HEAD..origin/${principal}`));
  if (!Number.isFinite(atraso) || atraso < 1) return null;
  return [
    '',
    `0-A. ESTA ÁRVORE ESTÁ ${atraso} COMMIT(S) ATRÁS DE \`origin/${principal}\`. Ela não descreve o produto de hoje:`,
    '   inventário, auditoria ou varredura feitos aqui descrevem o passado. Antes de medir qualquer coisa,',
    `   saia para uma árvore atualizada (${cfg.comandos.sessao}) ou meça contra origin/${principal} direto.`,
    '',
  ].join('\n');
}

const regrasFixas = [
  `REGRAS DE INÍCIO DE SESSÃO (${cfg.nome}), obrigatórias para a sessão inteira:`,
  '',
  '1. GRAFO PRIMEIRO: se `graphify-out/graph.json` existir, rode `graphify query "<pergunta>"` na raiz ANTES de responder sobre arquitetura ou arquivos, e cite arquivo:linha. Não responda de memória.',
  '2. SKILL A CADA COMANDO: se há 1% de chance de uma skill ajudar, use (feature → brainstorming + spec · bug → systematic-debugging · revisão antes de integrar → painel de code-review · teste de tela → agent-browser · UI → impeccable (shape antes, critique/audit depois) · texto para humano → humanizer · entrega pronta → checar-entrega · subir para a main → sync-main · não sabe se existe skill → find-skills). Escada da preguiça (Ponytail) em todo código: pula → reusa → stdlib → dependência → escreve.',
  `3. FONTES DA VERDADE, nesta ordem: ${cfg.fontesDaVerdade.join(' → ')}. Se a resposta está lá, não pergunte o dono. Doc e código divergem: o código vence, sinalize o doc.`,
  '4. AS QUATRO LEIS: hipótese não é resposta (meça, ou diga "não medi, custa X medir") · se existe uma decisão, use a decisão (nunca escolha um número) · nada fica só no chat (decisão vai para docs/ ou learnings/) · gate que não sabe dizer como se prova não protege nada (nasce com a mutação declarada).',
  `5. GIT: uma sessão, um diretório, uma tarefa. Antes da primeira edição: ${cfg.comandos.sessao} (ou ${cfg.comandos.tarefa}). O hook PreToolUse RECUSA Edit/Write na \`${principal}\`, com HEAD solto ou com a tarefa anterior já concluída. Um commit atômico por tarefa, Conventional Commits, \`git add\` seletivo por caminho.`,
  `6. AO CONCLUIR, nesta ordem: ${cfg.comandos.gates} → commit → push da branch → diga o que mudou e PERGUNTE ao dono se integra (decisão dele) → autorizado, ${cfg.comandos.integrar} (rebaseia, revalida sobre a base nova e só então publica; conflito ele aborta e devolve) → \`npm run tarefa -- concluir\`. Push aceito não é deploy feito.`,
  '7. SE NÃO É SEU, NÃO SE PREOCUPE: gate vermelho, defeito ou pendência no território de outra sessão se AVISA e se segue. Não conserta, não investiga a fundo, não segura a sua tarefa.',
  '8. NÃO INVENTAR, NÃO ADIVINHAR: valor, limiar, parâmetro ou comportamento de plataforma é hipótese até alguém medir. O que o dono aprovou vai verbatim para produção.',
  '9. PROSSEGUIR É PROSSEGUIR: pedido de prosseguir autoriza construir a peça que faltar no caminho. Exceção: valor aprovado pelo dono e ação destrutiva ou irreversível continuam pedindo confirmação.',
  '10. APRENDIZADO: após todo problema não trivial, nota em learnings/ (skill extract-approach). Trabalho sem a nota é inacabado.',
  `11. CÓDIGO LIMPO: ${cfg.pastasLimpas.join(', ')} não carregam comentário, emoji nem procedência de ferramenta; o porquê vai para docs/DECISOES.md ou learnings/. Diretiva de compilador não é comentário.`,
  '12. NENHUM TRAVESSÃO EM TEXTO QUE A PESSOA LÊ (UI, e-mail, site, notificação, erro). Vírgula, dois pontos, ponto ou parênteses no lugar. Prosa interna (docs, learnings) fica livre.',
  '13. RELATÓRIO AO DONO em markdown ao fechar tarefa ou integração: o que foi feito, o que está no ar e o que só está salvo, o que falta (meu × de outra sessão), o que deu errado. Curto, sem jargão, número medido no lugar de adjetivo.',
  `14. IDIOMA: ${cfg.idioma || 'pt-BR'}, claro e direto.`,
];

const extras = (cfg.regras || []).map((r, i) => `${15 + i}. ${r}`);

process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext: [avisoDeDiretorioCompartilhado(), avisoDeArvoreVelha(), ...regrasFixas, ...extras, '', 'Detalhe em CLAUDE.md e docs/CEREBRO-AGENTE.md. Estas regras vencem o improviso.']
      .filter((x) => x !== null).join('\n'),
  },
  suppressOutput: true,
}));
