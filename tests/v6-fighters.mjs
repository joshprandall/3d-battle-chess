import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
const server=spawn('python3',['-m','http.server','8767','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 await delay(1100);
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:8767/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#state')?.textContent==='Battle in progress',null,{timeout:45000});
 const rigTest=await page.evaluate(async()=>{
  const {createDuelFighter,poseCharacter,weaponPoint,fighterCenter}=await import('./combatants-v6.js');
  let models=0,travel=0;
  for(const theme of ['classic','arcane','monsters','brick','cosmic'])for(const t of ['p','n','b','r','q','k'])for(const c of ['w','b']){
   const fighter=createDuelFighter({t,c},theme),r=fighter.userData.rigV6;
   if(!fighter.userData.duelFighter||!r?.right?.hinge||!r?.left?.hinge||!r?.rightLeg?.hinge||!r?.leftLeg?.hinge)throw Error(`Missing articulated joints: ${theme} ${t} ${c}`);
   if(!r.weapon||!r.tip||r.head.parent!==r.torso.children.find(child=>child===r.head.parent))throw Error(`Missing tracked weapon/head: ${theme} ${t} ${c}`);
   poseCharacter(fighter,{coil:1,brace:1});const before=weaponPoint(fighter);
   poseCharacter(fighter,{attack:1,gait:.3});const after=weaponPoint(fighter);
   const distance=before.distanceTo(after);if(distance<.16)throw Error(`Weapon fails to swing: ${theme} ${t} ${c}: ${distance}`);
   if(!Number.isFinite(fighterCenter(fighter).y))throw Error(`Invalid torso: ${theme} ${t}`);
   fighter.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});travel+=distance;models++;
  }
  return {models,travel};
 });
 assert.equal(rigTest.models,60,'all six roles in five themes for both sides have multi-joint fighters');
 assert.ok(rigTest.travel>12,'weapons travel through a meaningful arc');
 // Fullscreen behavior has dedicated v7 coverage; keep this fighter harness windowed.
 await page.evaluate(()=>{HTMLElement.prototype.requestFullscreen=async function(){this.dataset.fullscreenRequested='yes'}});
 await page.locator('#menuBtn').click();await page.locator('#mode').selectOption('local');await page.locator('#menuBtn').click();
 const move=async text=>{await page.locator('#moveInput').fill(text);await page.locator('#moveForm button').click()};
 await move('e2e4');await move('d7d5');
 await move('e4d5');await page.locator('.duel-ui').waitFor({timeout:12000});
 mkdirSync('artifacts',{recursive:true});
 await page.waitForFunction(()=>document.querySelector('.duel-ui')?.textContent.includes('HIT!'),null,{timeout:6500});
 await page.screenshot({path:'artifacts/v6-actual-contact-mobile.png'});
 await page.waitForFunction(()=>document.querySelectorAll('#log li').length===3,null,{timeout:10000});
 assert.equal(await page.locator('.duel-ui').count(),0,'unskipped sequence restores chess controls');
 assert.deepEqual(errors,[],'no browser errors');
 console.log(`PASS: ${rigTest.models} two-part fighter rigs, visible weapon travel, one physics-confirmed unskipped contact on mobile`);
}finally{await browser?.close();server.kill();}
