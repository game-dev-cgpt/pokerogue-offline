#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve("pokerogue-src");
const helper = path.join(root,"src/system/offline/debug-options.ts");
fs.mkdirSync(path.dirname(helper),{recursive:true});
fs.copyFileSync(path.resolve("new-files/src/system/offline/debug-options.ts"),helper);
const imp='import { getDebugOption } from "#system/offline/debug-options";';
const active='import { activeOverrides } from "#app/overrides";';
function patch(file,steps) {
 const p=path.join(root,file);
 if(!fs.existsSync(p))throw Error("Missing "+file);
 let content=fs.readFileSync(p,"utf8").replace(/\r\n/g,"\n");
 if(content.includes("DEBUGMOD-CHECKPOINT1"))return;
 for(const [a,b] of steps){
   const n=content.split(a).length-1;
   if(n!==1)throw Error(file+" unexpected anchor ("+n+"): "+a.slice(0,90));
   content=content.replace(a,b);
 }
 fs.writeFileSync(p,"/** DEBUGMOD-CHECKPOINT1 */\n"+content);
 console.log("Patched "+file);
}
patch("src/phases/attempt-capture-phase.ts",[
 ['import { achvs } from "#system/achv";','import { achvs } from "#system/achv";\n'+imp],
 ['const shakeProbability = Math.round(65536 / Math.pow(255 / modifiedCatchRate, 0.1875)); // Formula taken from gen 6',
 'const shakeProbability = getDebugOption("guaranteedCatches") ? 65536 : Math.round(65536 / Math.pow(255 / modifiedCatchRate, 0.1875));']
]);
patch("src/field/pokemon.ts",[
 [active,active+"\n"+imp],
 ['    this.shiny = (E ^ F) < shinyThreshold.value;',
 '    shinyThreshold.value = getDebugOption("alwaysShiny") ? 65536 : Math.min(65536, shinyThreshold.value * getDebugOption("shinyMultiplier"));\n    this.shiny = (E ^ F) < shinyThreshold.value;'],
 ['      this.shiny = randSeedInt(65536) < shinyThreshold.value;',
 '      shinyThreshold.value = getDebugOption("alwaysShiny") ? 65536 : Math.min(65536, shinyThreshold.value * getDebugOption("shinyMultiplier"));\n      this.shiny = randSeedInt(65536) < shinyThreshold.value;']
]);
patch("src/ui/handlers/egg-gacha-ui-handler.ts",[
 [active,active+"\n"+imp],
 ['const freePulls = activeOverrides.EGG_FREE_GACHA_PULLS_OVERRIDE;','const freePulls = activeOverrides.EGG_FREE_GACHA_PULLS_OVERRIDE || getDebugOption("freeEggs");'],
 ['if (!freePulls && globalScene.gameData.eggs.length + pulls > 99)','if (!activeOverrides.EGG_FREE_GACHA_PULLS_OVERRIDE && globalScene.gameData.eggs.length + pulls > 99)']
]);
patch("src/phases/egg-lapse-phase.ts",[
 [active,active+"\n"+imp],
 ['return activeOverrides.EGG_IMMEDIATE_HATCH_OVERRIDE ? true : --egg.hatchWaves < 1;',
 'return activeOverrides.EGG_IMMEDIATE_HATCH_OVERRIDE || getDebugOption("instantHatch") ? true : --egg.hatchWaves < 1;']
]);
patch("src/phases/select-modifier-phase.ts",[
 [active,active+"\n"+imp],
 ['  getRerollCost(lockRarities: boolean): number {\n','  getRerollCost(lockRarities: boolean): number {\n    if (getDebugOption("freeRerolls")) return 0;\n']
]);
patch("src/modifier/modifier-type.ts",[
 [active,active+"\n"+imp],
 ['export function getPartyLuckValue(party: readonly Pokemon[]): number {\n',
 'export function getPartyLuckValue(party: readonly Pokemon[]): number {\n  if (getDebugOption("maxLuck")) return 14;\n']
]);
patch("src/ui/utils/starter-select-ui-utils.ts",[
 ['import { globalScene } from "#app/global-scene";','import { globalScene } from "#app/global-scene";\n'+imp],
 ['  return valueLimit.value;\n','  return getDebugOption("unlimitedStarterPoints") ? 999 : valueLimit.value;\n']
]);
const tick=String.fromCharCode(96), dollarBrace=String.fromCharCode(36,123);
const label='label: '+tick+dollarBrace+'i18next.t('+tick+'menuUiHandler:'+dollarBrace+'toCamelCase(MenuOptions[option])}'+tick+')}'+tick+',';
const relabel='label: option === MenuOptions.DEBUG_OPTIONS ? "Debug Options" : '+tick+dollarBrace+'i18next.t('+tick+'menuUiHandler:'+dollarBrace+'toCamelCase(MenuOptions[option])}'+tick+')}'+tick+',';
const menu=[
'  private getDebugOptionsConfig(): OptionSelectModeConfig {',
'    const items: { key: DebugOptionKey; name: string }[] = [',
'      { key: "guaranteedCatches", name: "Guaranteed Catches" },',
'      { key: "shinyMultiplier", name: "Shiny Rate" },',
'      { key: "alwaysShiny", name: "Always Shiny" },',
'      { key: "freeEggs", name: "Free Eggs" },',
'      { key: "instantHatch", name: "Instant Hatch" },',
'      { key: "freeRerolls", name: "Free Rerolls" },',
'      { key: "maxLuck", name: "Maximum Luck" },',
'      { key: "unlimitedStarterPoints", name: "Unlimited Starter Points" },',
'    ];',
'    const ui = this.getUi();',
'    return {',
'      options: [',
'        ...items.map(item => ({',
'          label: item.name + ": " + (item.key === "shinyMultiplier" ? "x" + getDebugOption(item.key) : getDebugOption(item.key) ? "ON" : "OFF"),',
'          handler: () => {',
'            cycleDebugOption(item.key);',
'            ui.revertMode();',
'            ui.setOverlayMode(UiMode.MENU_OPTION_SELECT, this.getDebugOptionsConfig());',
'            return true;',
'          },',
'          keepOpen: true,',
'        })),',
'        { label: "Back", handler: () => { ui.revertMode(); return true; } },',
'      ],',
'      maxOptions: 9,',
'    };',
'  }',
'',
'  private optionSelected(option: MenuOptions): boolean {'
].join("\n");
patch("src/ui/handlers/menu-ui-handler.ts",[
 ['import { Button } from "#enums/buttons";','import { Button } from "#enums/buttons";\nimport { cycleDebugOption, getDebugOption, type DebugOptionKey } from "#system/offline/debug-options";'],
 ['enum MenuOptions {\n  GAME_SETTINGS,','enum MenuOptions {\n  DEBUG_OPTIONS,\n  GAME_SETTINGS,'],
 [label,relabel],
 ['  private optionSelected(option: MenuOptions): boolean {',menu],
 ['    switch (option) {\n      case MenuOptions.GAME_SETTINGS:',
 '    switch (option) {\n      case MenuOptions.DEBUG_OPTIONS:\n        ui.setOverlayMode(UiMode.MENU_OPTION_SELECT, this.getDebugOptionsConfig());\n        success = true;\n        break;\n      case MenuOptions.GAME_SETTINGS:']
]);
console.log("Debug Mod checkpoint 1 patches complete.");
