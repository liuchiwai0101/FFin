/**
 * Writes docs/assets/auth-config.js from FFIN_PASSWORDS in the environment or .env.
 * Usage: FFIN_PASSWORDS='{"Vin":"..."}' npm run auth:hashes
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadDotEnv() {
  const envPath = join(root, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadDotEnv();

let map = {};
try {
  map = JSON.parse(process.env.FFIN_PASSWORDS || "{}");
} catch {
  console.error("FFIN_PASSWORDS must be JSON, e.g. {\"Vin\":\"your-password\"}");
  process.exit(1);
}

if (!map || typeof map !== "object" || Array.isArray(map) || Object.keys(map).length === 0) {
  console.error("Set FFIN_PASSWORDS to a JSON object of username -> password.");
  process.exit(1);
}

const hashes = {};
for (const [username, password] of Object.entries(map)) {
  hashes[username] = createHash("sha256").update(String(password), "utf8").digest("hex");
}

const out = join(root, "docs/assets/auth-config.js");
writeFileSync(out, `window.FFIN_PASSWORD_HASHES = ${JSON.stringify(hashes)};\n`);
console.log(`Wrote ${out}`);
