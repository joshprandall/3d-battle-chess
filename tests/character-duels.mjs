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
 await page.goto('http://127.0.0.1:8766/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#state')?.textContent==='Battle in progress',null,{timeout:45000});
 const roles=await page.evaluate(async()=>{
  const {createCharacter,poseCharacter}=await import('./characters.js');const roles=[];
  for(const theme of ['classic','arcane','monsters','brick','cosmic'])for(const t of ['p','n','b','r','q','k']){
   const o=createCharacter({t,c:'w'},0,0,theme);if(!o.userData.rig?.right||o.userData.rig.legs.length!==2)throw Error(`rig missing ${theme} ${t}`);
   poseCharacter(o,{swing:-1,step:.4});if(o.userData.rig.right.rotation.x!==-1)throw Error(`joint missing ${theme} ${t}`);
   o.traverse(m=>{m.geometry?.dispose();m.material?.dispose()});roles.push(`${theme}:${t}`);
  }return roles;
 });
 assert.equal(roles.length,30,'all 30 combinations have animated joints');
 await page.locator('#menuBtn').click();await page.locator('#mode').selectOption('local');await page.locator('#menuBtn').click();
 const move=async text=>{await page.locator('#moveInput').fill(text);await page.locator('#moveForm button').click()};
 await move('e2e4');await move('d7d5');
 await move('e4d5');
 await page.locator('.duel-ui button').waitFor({timeout:10000});
 assert.equal(await page.locator('#log li').count(),2,'chess state waits until battle completes');
 mkdirSync('artifacts',{recursive:true});
 await delay(1050);
 await page.screenshot({path:'artifacts/character-duel-midfight-mobile.png'});
 await page.locator('.duel-ui button').click({force:true});
 await page.waitForFunction(()=>document.querySelectorAll('#log li').length===3,{timeout:10000});
 assert.equal(await page.locator('.duel-ui').count(),0,'battle UI cleans up after skip');
 assert.equal(await page.locator('#turn').textContent(),'Black to move');
 await page.screenshot({path:'artifacts/character-duel-mobile.png'});
 assert.deepEqual(errors,[],'no uncaught browser exceptions');
 console.log('PASS: 30 articulated characters, two-sided cinematic, mid-fight mobile screenshot, skippable capture, correct chess state');
}finally{await browser?.close();server.kill();}
