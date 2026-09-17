# REGRA — fonte da verdade ÚNICA do projeto <NOME>

> Uma regra. Vale para TODO agente e TODA frente. **A verdade vive na branch principal.**
> Trabalho paralelo é permitido com disciplina: branch nasce da principal atualizada → rebase antes de integrar → integração pequena e frequente → uma por vez.

## 1. Divisão de trabalho (inegociável)
- **O código é o porteiro.** Regra de negócio vive no código (validação, gate), não no prompt de um modelo. IA que gera texto ou plano só ESCREVE; quem decide, valida e rejeita é o código.
- <Quem faz o quê neste projeto: motor, serviços, IA, humano.>

## 2. Fonte da verdade da configuração
- <Onde vive cada configuração (arquivo, env, painel) e qual vence quando duas discordam. Nada de hardcode que ignore a configuração.>

## 3. Regras de conteúdo e produto
- <O que NUNCA vai ao ar (dado inventado, fonte não confiável, texto com travessão, segredo em cliente…).>
- <O que SEMPRE vai (fonte na peça, auth + dono, prazo de dado pessoal…).>

## 4. Formatos e templates válidos
- <Os N formatos únicos aceitos. Tudo fora deles é retrabalho.>

## 5. Operação
- Um comando por coisa: `npm run sessao` · `npm run tarefa` · `npm run gates` · `npm run meta-gate` · `npm run integrar`.
- Qualidade acima de velocidade: produz 1, verifica, aprova, depois escala.
- Não decidir nem inventar sem conferir; conferir o que existe antes de afirmar.

## 6. Guardrails já no código
- <Lista dos gates e validadores que impõem as regras acima, com o arquivo de cada um. Regra sem gate é regra que já falhou.>

## 7. Trabalho paralelo (várias sessões)
- Uma sessão, um diretório (`npm run sessao`), uma tarefa por branch, um commit atômico.
- Território de arquivo: quem abriu a tarefa é dono dos arquivos dela. Achou defeito em território alheio: avisa e segue.
- Integração é serial e por mecanismo (`npm run integrar`): rebase → gates sobre a base nova → push. Nunca à mão.
