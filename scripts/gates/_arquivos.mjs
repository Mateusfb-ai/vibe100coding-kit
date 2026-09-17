import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export const RAIZ = path.resolve(import.meta.dirname, "..", "..");

export function config() {
  try { return JSON.parse(readFileSync(path.join(RAIZ, "kit.json"), "utf8")); } catch { return {}; }
}

export function listar(pastas, extensoes) {
  const out = [];
  const anda = (p) => {
    let entradas = [];
    try { entradas = readdirSync(p); } catch { return; }
    for (const e of entradas) {
      if (e === "node_modules" || e.startsWith(".")) continue;
      const abs = path.join(p, e);
      if (statSync(abs).isDirectory()) anda(abs);
      else if (extensoes.includes(path.extname(e))) out.push(abs);
    }
  };
  for (const p of pastas) anda(path.isAbsolute(p) ? p : path.join(RAIZ, p));
  return out;
}

export function reprovar(nome, problemas) {
  if (!problemas.length) { console.log(`${nome}: ok`); process.exit(0); }
  console.error(`${nome}: ${problemas.length} problema(s)`);
  for (const p of problemas.slice(0, 40)) console.error(`  ${p}`);
  process.exit(1);
}
