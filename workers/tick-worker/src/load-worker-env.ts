import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const WORKER_ENV_FILES = [
  "apps/web/.env.local",
  "apps/web/.env",
  "packages/db/.env",
  ".env",
] as const;

export function parseEnvFile(contents: string): Record<string, string> {
  const values: Record<string, string> = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (line.length === 0 || line.startsWith("#")) {
      continue;
    }

    const match = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    values[key] = unquoteEnvValue(rawValue.trim());
  }

  return values;
}

export function loadWorkerEnv(cwd: string = process.cwd()): string[] {
  const loadedFiles: string[] = [];

  for (const relativePath of WORKER_ENV_FILES) {
    const absolutePath = path.resolve(cwd, relativePath);

    if (!existsSync(absolutePath)) {
      continue;
    }

    const values = parseEnvFile(readFileSync(absolutePath, "utf8"));

    for (const [key, value] of Object.entries(values)) {
      process.env[key] ??= value;
    }

    loadedFiles.push(relativePath);
  }

  return loadedFiles;
}

function unquoteEnvValue(value: string): string {
  if (value.length < 2) {
    return value;
  }

  const first = value[0];
  const last = value[value.length - 1];

  if ((first === "\"" && last === "\"") || (first === "'" && last === "'")) {
    return value.slice(1, -1);
  }

  return value;
}
