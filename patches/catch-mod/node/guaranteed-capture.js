#!/usr/bin/env node
"use strict";
/**
 * Catch Mod: guarantee otherwise legal Pokeball throws without changing
 * restrictions on which enemies may be caught.
 * Run after cloning pagefaultgames/pokerogue into pokerogue-src.
 */
const fs = require("node:fs");
const path = require("node:path");
const target = path.join(process.cwd(), "pokerogue-src", "src", "phases", "attempt-capture-phase.ts");
if (!fs.existsSync(target)) {
  console.error("Cannot find capture phase: " + target);
  process.exit(1);
}
const src = fs.readFileSync(target, "utf8");
const marker = "const shakeProbability = 65536; // catch-mod: guaranteed eligible capture";
if (src.includes(marker)) {
  console.log("Capture patch already applied.");
  process.exit(0);
}
const normal = "pokemon.randBattleSeedInt(65536) < shakeProbability";
const critical = "pokemon.randBattleSeedInt(65536) >= shakeProbability";
if (!src.includes(normal) || !src.includes(critical)) {
  console.error("Upstream capture checks changed: refusing an unverified build.");
  process.exit(1);
}
const expression = /^([ \t]*)const shakeProbability = Math\.round\(65536 \/ Math\.pow\(255 \/ modifiedCatchRate, 0\.1875\)\);[^\r\n]*$/gm;
const found = [...src.matchAll(expression)];
if (found.length !== 1) {
  console.error("Expected exactly one capture probability expression, got " + found.length);
  process.exit(1);
}
fs.writeFileSync(target, src.replace(expression, (_, indent) => indent + marker), "utf8");
console.log("Catch Mod: all otherwise eligible captures now succeed.");
