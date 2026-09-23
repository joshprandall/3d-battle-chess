import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright';

const server=spawn('python3',['-m','http.server','8772','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 await delay(900);
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:1280,height:820}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8772/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#state')?.textContent==='Battle in progress',null,{timeout:45000});
 await page.evaluate(()=>{HTMLElement.prototype.requestFullscreen=async function(){this.dataset.fullscreenRequested='yes'};});
 await page.locator('#mode').selectOption('local');
 await page.locator('#theme').selectOption('monsters');

 async function move(text,count){
  await page.locator('#moveInput').fill(text);
  await page.locator('#moveForm button').click();
  await page.waitForFunction(n=>document.querySelectorAll('#log li').length===n,count,{timeout:12000});
 }
 await move('e2e4',1);
 await move('d7d5',2);

 await page.locator('#moveInput').fill('e4d5');
 await page.locator('#moveForm button').click();
 await page.waitForSelector('.v8-duel-ui',{state:'visible',timeout:5000});
 assert.match(await page.locator('.v8-duel-ui').textContent(),/Goblin Raider/,'real game capture instantiates Monster-set v8 characters');
 await page.waitForFunction(()=>document.querySelectorAll('#log li').length===3,null,{timeout:12000});
 await page.waitForSelector('.v8-duel-ui',{state:'detached',timeout:5000});
 assert.match(await page.locator('#log li').nth(2).textContent(),/d5/,'capture returns control to chess engine and commits the move');
 assert.equal(await page.locator('#state').textContent(),'Battle in progress');
 assert.deepEqual(errors,[],'v8 capture path has no uncaught browser errors');
 const boardIdentity=await page.evaluate(()=>window.__unused=0); // keep page settled before fallback validation
 const fallback=await browser.newPage({viewport:{width:1000,height:700}});
 await fallback.goto('http://127.0.0.1:8772/?combat=v7',{waitUntil:'domcontentloaded'});
 await fallback.waitForFunction(()=>document.querySelector('#state')?.textContent==='Battle in progress',null,{timeout:45000});
 assert.equal(await fallback.evaluate(()=>document.querySelectorAll('#scene canvas').length),1,'v7 fallback still initializes');
 await fallback.close();
 console.log('PASS v8 game integration: v8 is default, legal capture launches v8 duel, and ?combat=v7 remains available');
}finally{await browser?.close();server.kill();}
