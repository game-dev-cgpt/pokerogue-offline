"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const script = path.join(root, "patches/catch-mod/node/guaranteed-capture.js");
const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "catchmod-"));
const target = path.join(cwd, "pokerogue-src/src/phases/attempt-capture-phase.ts");
fs.mkdirSync(path.dirname(target), { recursive: true });
const fixture = "const modifiedCatchRate = 3;\nconst shakeProbability = Math.round(65536 / Math.pow(255 / modifiedCatchRate, 0.1875)); // Formula taken from gen 6\nconst n = pokemon.randBattleSeedInt(65536) < shakeProbability;\nconst c = pokemon.randBattleSeedInt(65536) >= shakeProbability;\n";
const run = () => spawnSync(process.execPath, [script], { cwd, encoding: "utf8" });
try {
  fs.writeFileSync(target, fixture);
  assert.equal(run().status, 0);
  const patched = fs.readFileSync(target, "utf8");
  assert.match(patched, /const shakeProbability = 65536; \/\/ catch-mod/);
  assert.equal(run().status, 0, "patch must be idempotent");
  assert.equal(fs.readFileSync(target, "utf8"), patched);
  for (const roll of [0, 1, 32768, 65535]) {
    assert.ok(roll < 65536, "regular capture must pass");
    assert.ok(!(roll >= 65536), "critical capture must pass");
  }
  fs.writeFileSync(target, fixture.replace("pokemon.randBattleSeedInt(65536) >= shakeProbability", "pokemon.randBattleSeedInt(65536) >= anotherThreshold"));
  assert.notEqual(run().status, 0, "unexpected critical capture path must fail closed");
  fs.writeFileSync(target, fixture.replace("0.1875", "0.19"));
  assert.notEqual(run().status, 0, "upstream formula changes must fail closed");
  console.log("PASS catch probability and compatibility safeguards.");
} finally {
  fs.rmSync(cwd, { recursive: true, force: true });
}
