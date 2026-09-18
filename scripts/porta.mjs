#!/usr/bin/env node
// Imprime a porta reservada para a árvore atual.
//
//   npm run porta          -> 3002
//
// A reserva é feita uma vez, por `sessao.mjs`, e vive em
// `git config branch.<branch>.porta`. Guardada e não recalculada, a árvore
// reabre sempre na mesma porta: favorito do navegador não quebra, e você sabe
// de cor qual é a de cada frente.
//
// Sem reserva (a branch principal, ou uma branch feita à mão) não imprime nada
// e sai 1 — para quem chama poder cair no padrão do próprio servidor em vez de
// receber um número inventado.
import { gitQuieto } from "./_git.mjs";

const branch = gitQuieto(process.cwd(), "rev-parse", "--abbrev-ref", "HEAD");
const porta = branch && branch !== "HEAD" ? gitQuieto(process.cwd(), "config", `branch.${branch}.porta`) : "";
if (!porta) process.exit(1);
console.log(porta);
