# vibe100coding-kit

**O workflow completo para programar com agentes (Claude Code) sem perder o controle: hooks que impõem o ciclo de tarefa, gates que provam que provam, ondas paralelas de subagentes, integração com rebase antes de validar, e a lei do aprendizado.** Extraído de produção (um SaaS com ~480 gates e um estúdio de conteúdo com 4 produtos), evoluído sobre o [vibe-coding-toolkit](https://github.com/soumatheusgomes/vibe-coding-toolkit).

> **EN:** A production-extracted workflow for coding with agents: 4 Claude Code hooks that enforce a task cycle (no edits on `main`, no stacking on finished tasks, "integrate me" reminders), a parallel gate runner plus a **meta-gate** that injects the real defect to prove every gate turns red, parallel subagent waves with disjoint file sets, rebase-then-validate integration with a per-machine FIFO queue, and templates for `CLAUDE.md`, decisions and learnings. Docs are in Portuguese; the code and hooks are language-agnostic. MIT.

<p align="center">
  <a href="#instalação-passo-a-passo"><img src="https://img.shields.io/badge/npx_github%3Aspyko--app%2Fvibe100coding--kit-init-0a84ff?style=for-the-badge&logo=npm&logoColor=white" alt="npx github:spyko-app/vibe100coding-kit init"></a>
  &nbsp;
  <a href="https://github.com/spyko-app/vibe100coding-kit/archive/refs/heads/main.zip"><img src="https://img.shields.io/badge/Download-.zip-333?style=for-the-badge&logo=github&logoColor=white" alt="Download zip"></a>
</p>

## O fluxo em uma tela

```
abrir sessão ─► sessao/tarefa ─► brainstorm → spec ─► implementar (TDD, ondas) ─► gates + meta-gate ─► commit ─► push
                                                                                                          │
      registrar (learnings/) ◄─ tarefa concluir ◄─ integrar (fila → rebase → gates na base nova → push) ◄─ dono autoriza
```

Cada etapa existe por causa de um defeito real e medido. Eles estão em [`docs/00-fluxo.md`](docs/00-fluxo.md).

## O que vem na caixa

| Peça | Arquivo | O que impõe |
|---|---|---|
| **4 hooks** | `.claude/hooks/*.cjs` | regras da sessão + aviso de árvore velha e de diretório compartilhado · roteamento prompt → skill · **recusa edição na `main`, com HEAD solto, com tarefa concluída ou com mutação de gate em voo** · lembrete de integrar quando há commits parados |
| **Ciclo de tarefa** | `scripts/sessao.mjs`, `tarefa.mjs` | worktree por sessão, marca explícita `aberta / concluida` na branch |
| **Integração** | `scripts/integrar.mjs` | fila FIFO por máquina → fetch → rebase → gates **sobre a base nova** → push; conflito aborta e devolve |
| **Gates** | `scripts/rodar-gates.mjs`, `gates.txt`, `gates/` | todos rodam, em paralelo, acumulando falhas; 3 gates de exemplo (sem comentário no código, sem travessão em texto exibido, lista íntegra) |
| **Meta-gate** | `scripts/meta-gate.mjs`, `mutacoes.mjs` | cobertura por contagem, âncora viva, injeção do defeito real: gate que nunca ficou vermelho não provou nada |
| **Regras** | `.claude/rules/` | roteamento de especialistas (agentes que existem, camada de modelo explícita), ondas paralelas, onda de investigação |
| **Skills** | `.claude/skills/` | `extract-approach` (lei do aprendizado), `sync-main` (publicar com disciplina), `checar-entrega` (régua + segurança antes de entregar) |
| **Templates** | `templates/` | `CLAUDE.md` (as quatro leis, erro → regra, régua, escalada), `REGRA.md`, `CEREBRO-AGENTE.md` (como raciocinar), `DECISOES.md`, learning, spec, `kit.json` |
| **Prompts** | `docs/prompts/` | brainstorm → spec · onda paralela · varredura de segurança por classe · registrar aprendizado |
| **Instalador** | `bin/vibekit.mjs` | `init` aditivo (nunca sobrescreve o que existe) e `doctor` |

## Instalação (passo a passo)

### Pré-requisitos
- **Node.js 20+** (`node -v`) e **git**.
- **Claude Code** instalado (`claude --version`). Plugins recomendados: `superpowers`, `caveman`, `context7`; opcional `graphify` (`pip install graphifyy`).

### 1. Instale o kit no seu projeto

```bash
cd meu-projeto
npx github:spyko-app/vibe100coding-kit init
```

Ou clonando:

```bash
git clone https://github.com/spyko-app/vibe100coding-kit.git /tmp/vibekit
node /tmp/vibekit/bin/vibekit.mjs init .
```

O `init` copia hooks, regras, skills, scripts e templates **só onde não existe nada** (um `.claude/` afinado por meses fica intacto), mescla os hooks em `.claude/settings.json` e adiciona os scripts `sessao`, `tarefa`, `gates`, `meta-gate`, `integrar` ao `package.json`.

### 2. Descreva o projeto em `kit.json`

```json
{
  "nome": "MeuProjeto",
  "branchPrincipal": "main",
  "pastasLimpas": ["src"],
  "regras": ["O QUE É: SaaS de X. Não faz Y.", "SEGURANÇA: segredo em env, auth + dono, rate-limit."],
  "skills": [{ "regex": "\\bdeploy\\b", "msg": "Rode os gates antes de publicar." }]
}
```

Tudo é opcional; sem `kit.json` os hooks usam os padrões.

### 3. Preencha `CLAUDE.md` e `docs/REGRA.md`

Os templates vêm com `<marcadores>`. Preencha contexto, comandos e a tabela "erro → regra que previne". O `docs/CEREBRO-AGENTE.md` (como raciocinar) já vem pronto.

### 4. Prove que os gates provam

```bash
npm run meta-gate     # cada gate fica vermelho com o defeito injetado
npm run gates         # todos verdes
npx github:spyko-app/vibe100coding-kit doctor
```

### 5. Commite o kit e abra a primeira tarefa

```bash
git add -A && git commit -m "chore: instala o vibe100coding-kit"
npm run sessao -- feature/primeira-tarefa     # worktree + branch marcada como ABERTA
# ou, sozinho no repo: npm run tarefa -- abrir feature/primeira-tarefa
```

### 6. Abra o Claude Code

Os hooks valem na próxima sessão. Teste: peça para editar um arquivo estando na `main` e veja a recusa com a instrução de abrir tarefa.

### 7. Feche o ciclo

```bash
npm run gates && git add <arquivos> && git commit -m "feat(escopo): o que mudou"
git push -u origin feature/primeira-tarefa
# pergunte ao dono; autorizado:
npm run integrar                 # fila → rebase → gates na base nova → push
npm run tarefa -- concluir
```

### Testar os hooks na mão

```bash
echo '{"prompt":"tem um bug no login"}' | node .claude/hooks/skill-suggest.cjs
echo '{"tool_input":{"file_path":"'$PWD'/src/a.ts"},"cwd":"'$PWD'"}' | node .claude/hooks/exige-tarefa.cjs
```

## Como escrever um gate novo (a lei do gate)

1. `scripts/gates/<nome>.mjs` sai 0 ou 1. Nome diz o que protege.
2. Linha em `scripts/gates.txt` e script `gate:<nome>` no `package.json`.
3. **Mutação** em `scripts/mutacoes.mjs`: o trecho real (`de`) e o defeito (`para`).
4. `npm run meta-gate` verde. Gate sem mutação reprova a cobertura.

Detalhe em [`docs/03-gates-e-meta-gate.md`](docs/03-gates-e-meta-gate.md).

## As quatro leis

1. **Hipótese não é resposta.** Meça, ou diga "não medi; custa X medir".
2. **Se existe uma decisão, use a decisão.** Nunca se escolhe um número.
3. **Nada fica só no chat.** Decisão vai para `docs/` ou `learnings/`.
4. **Gate que não sabe dizer como se prova não protege nada.**

## Documentação

- [`docs/00-fluxo.md`](docs/00-fluxo.md): o fluxo etapa por etapa, com o defeito que originou cada uma
- [`docs/02-hooks.md`](docs/02-hooks.md): os quatro hooks e o `kit.json`
- [`docs/03-gates-e-meta-gate.md`](docs/03-gates-e-meta-gate.md): camadas de gate, onde ancorar, vermelho é dado
- [`docs/04-vs-vibe-coding-toolkit.md`](docs/04-vs-vibe-coding-toolkit.md): o que veio do toolkit, o que foi melhorado, o que ficou de fora e por quê
- [`.claude/rules/`](.claude/rules/): roteamento de especialistas · ondas paralelas · onda de investigação
- [`docs/prompts/`](docs/prompts/): 4 prompts prontos

## Sobre comentários no código

`scripts/` e `.claude/hooks/` são comentados de propósito: cada comentário registra o defeito que originou o mecanismo, e é isso que impede a próxima sessão de "simplificar" o que já falhou. A regra "sem comentário" vale para o código de **produto** (`pastasLimpas`), não para a infraestrutura do fluxo.

## Créditos

[vibe-coding-toolkit](https://github.com/soumatheusgomes/vibe-coding-toolkit) (Matheus Gomes) pela base e pelos sete pilares · [Superpowers](https://github.com/obra/superpowers) · [Caveman](https://github.com/JuliusBrussee/caveman) · [Graphify](https://github.com/safishamsi/graphify). O restante foi medido em produção.

## Licença

[MIT](LICENSE)
