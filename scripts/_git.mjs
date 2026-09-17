import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

export const git = (cwd, ...a) => execFileSync("git", a, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
export const gitQuieto = (cwd, ...a) => { try { return git(cwd, ...a); } catch { return ""; } };

export function raizDoRepo(cwd = process.cwd()) {
  return path.dirname(git(cwd, "rev-parse", "--path-format=absolute", "--git-common-dir"));
}

export function config(cwd = process.cwd()) {
  const padrao = { branchPrincipal: "main", marca: "kitTarefa", gates: "npm run gates", nome: path.basename(raizDoRepo(cwd)) };
  for (const c of [path.join(raizDoRepo(cwd), "kit.json"), path.join(raizDoRepo(cwd), ".claude", "kit.json")]) {
    try { return { ...padrao, ...JSON.parse(readFileSync(c, "utf8")) }; } catch { /* próximo */ }
  }
  return padrao;
}
