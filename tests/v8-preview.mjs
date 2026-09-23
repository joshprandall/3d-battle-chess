import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright';

const server=spawn('python3',['-m','http.server','8771','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 await delay(900);
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:1280,height:820}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8771/v8-preview.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__v8Preview?.director?.attacker?.userData?.v8===true,null,{timeout:45000});
 assert.match(await page.locator('#title').textContent(),/Classic:/,'preview loads v8 character identities');
 assert.ok(await page.locator('#scene canvas').isVisible(),'preview WebGL canvas visible');

 const cases=[
  ['classic','p','r'],
  ['arcane','n','q'],
  ['monsters','n','r'],
  ['brick','q','k'],
  ['cosmic','r','p']
 ];
 for(const [theme,a,d] of cases){
   await page.locator('#set').selectOption(theme);
   await page.locator('#attacker').selectOption(a);
   await page.locator('#defender').selectOption(d);
   await page.locator('#play').click();
   await page.waitForFunction(()=>document.querySelector('#phase')?.textContent!=='Ready',null,{timeout:4000});
   const identity=await page.evaluate(()=>({
     a:window.__v8Preview.director.attacker.userData.definition.id,
     d:window.__v8Preview.director.defender.userData.definition.id,
     visualA:window.__v8Preview.director.attacker.userData.visualSignature,
     visualD:window.__v8Preview.director.defender.userData.visualSignature
   }));
   assert.equal(identity.a,`${theme}-${a}`);
   assert.equal(identity.d,`${theme}-${d}`);
   assert.equal(identity.visualA,identity.a);
   assert.equal(identity.visualD,identity.d);
   await delay(180);
 }
 assert.deepEqual(errors,[],'no uncaught errors in v8 combat lab');
 console.log('PASS v8 preview: isolated lab renders and starts matchups across all five sets');
}finally{await browser?.close();server.kill();}
