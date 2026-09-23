import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
const server=spawn('python3',['-m','http.server','8766','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 await delay(1200);
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8766/?combat=v7',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#state')?.textContent==='Battle in progress',null,{timeout:45000});
 const roles=await page.evaluate(async()=>{
  const {createCharacter,poseCharacter}=await import('./characters.js');const {createDuelFighter}=await import('./combatants.js');const roles=[];
  for(const theme of ['classic','arcane','monsters','brick','cosmic'])for(const t of ['p','n','b','r','q','k']){
   const board=createCharacter({t,c:'w'},0,0,theme);if(!board.userData.rig?.right||board.userData.rig.legs.length!==2)throw Error(`rig missing ${theme} ${t}`);
   poseCharacter(board,{swing:-1,step:.4});if(board.userData.rig.right.rotation.x!==-1)throw Error(`joint missing ${theme} ${t}`);
   board.traverse(m=>{m.geometry?.dispose();m.material?.dispose()});
   const fighter=createDuelFighter({t,c:'w'},theme);const rig=fighter.userData.rig.torso.parent;
   if(!fighter.userData.duelFighter||fighter.children.filter(c=>c.visible).length!==1||!rig.visible||fighter.userData.rig.legs.length!==2)throw Error(`Arena fighter missing or statue visible: ${theme} ${t}`);
   fighter.traverse(m=>{m.geometry?.dispose();m.material?.dispose()});roles.push(`${theme}:${t}`);
  }return roles;
 });
 assert.equal(roles.length,30,'all 30 combinations have independent, articulated arena fighters');
 // Fullscreen behavior has dedicated v7 coverage; keep this animation harness windowed.
 await page.evaluate(()=>{HTMLElement.prototype.requestFullscreen=async function(){this.dataset.fullscreenRequested='yes'}});
 await page.locator('#menuBtn').click();await page.locator('#mode').selectOption('local');await page.locator('#menuBtn').click();
 const move=async text=>{await page.locator('#moveInput').fill(text);await page.locator('#moveForm button').click()};
 await move('e2e4');await move('d7d5');
 await move('e4d5');
 await page.locator('.duel-ui button').waitFor({timeout:10000});
 assert.equal(await page.locator('#log li').count(),2,'chess state waits until battle completes');
 mkdirSync('artifacts',{recursive:true});
 await delay(1050);
 await page.screenshot({path:'artifacts/character-duel-midfight-mobile.png'});
 await page.locator('.duel-ui button').click();
 await page.waitForFunction(()=>document.querySelectorAll('#log li').length===3,{timeout:10000});
 assert.equal(await page.locator('.duel-ui').count(),0,'battle UI cleans up after skip');
 assert.equal(await page.locator('#turn').textContent(),'Black to move');
 await page.screenshot({path:'artifacts/character-duel-mobile.png'});
 await page.locator('#menuBtn').click();await page.locator('#newGame').click();await page.locator('#menuBtn').click();
 assert.equal(await page.locator('#moveForm').evaluate(form=>form.noValidate),true,'short castle notation bypasses HTML minlength');
 let count=0;
 for(const notation of ['e2e4','e7e5','g1f3','b8c6','f1e2','g8f6']){
  await move(notation);count++;
  await page.waitForFunction(n=>document.querySelectorAll('#log li').length===n,count,{timeout:12000}).catch(async err=>{throw Error(`${notation}: ${await page.locator('#toast').textContent()} | ${await page.locator('#turn').textContent()} | ${await page.locator('#log').innerText()} | ${err.message}`)});
 }
 await move('O-O');
 await page.waitForFunction(()=>document.querySelectorAll('#log li').length===7,null,{timeout:12000}).catch(async err=>{throw Error(`Castle: ${await page.locator('#toast').textContent()} | ${await page.locator('#turn').textContent()} | ${await page.locator('#log').innerText()} | ${err.message}`)});
 assert.match(await page.locator('#log li').last().textContent(),/O-O/,'mobile keyboard castling succeeds after clearing path');
 assert.deepEqual(errors,[],'no uncaught browser exceptions');
 console.log('PASS: 30 distinct arena rigs, mobile Skip battle, correct capture, O-O castling through UI');
}finally{await browser?.close();server.kill();}
