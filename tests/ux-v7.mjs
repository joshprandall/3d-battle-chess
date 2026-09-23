import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright';

const server=spawn('python3',['-m','http.server','8769','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 await delay(1100);
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
 const desktop=await browser.newPage({viewport:{width:1365,height:850}});
 await desktop.goto('http://127.0.0.1:8769/?handheld=1',{waitUntil:'domcontentloaded'});
 await desktop.waitForFunction(()=>document.querySelector('#state')?.textContent==='Battle in progress',null,{timeout:45000});
 assert.equal(await desktop.locator('#handheldConsole').isVisible(),false,'handheld console stays hidden on desktop even with handheld query');
 await desktop.locator('#mode').selectOption('local');
 await desktop.evaluate(()=>{HTMLElement.prototype.requestFullscreen=async function(){this.dataset.fullscreenRequested='yes'}});
 await desktop.keyboard.press('Enter');
 assert.equal(await desktop.locator('#gameShell').getAttribute('data-fullscreen-requested'),'yes','first keyboard play input requests fullscreen on desktop');
 await desktop.keyboard.press('ArrowUp');await desktop.keyboard.press('ArrowUp');await desktop.keyboard.press('Enter');
 await desktop.waitForFunction(()=>document.querySelectorAll('#log li').length===1,null,{timeout:5000});
 assert.match(await desktop.locator('#log li').first().textContent(),/e4/,'desktop game is fully playable without a mouse');
 await desktop.evaluate(()=>document.querySelector('#gameShell').classList.add('immersive-fullscreen'));
 assert.equal(await desktop.locator('.topbar').evaluate(el=>getComputedStyle(el).display),'none','immersive fullscreen removes top chrome');
 assert.equal(await desktop.locator('.panel').evaluate(el=>getComputedStyle(el).display),'none','immersive fullscreen removes side borders/panel');
 const fullStage=await desktop.locator('.stage').boundingBox();
 assert.ok(fullStage&&Math.abs(fullStage.width-1365)<3&&Math.abs(fullStage.height-850)<3,'fullscreen stage dynamically fits desktop resolution');
 await desktop.evaluate(()=>document.querySelector('#gameShell').classList.remove('immersive-fullscreen'));
 await desktop.close();
 const mobileContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'});
 const page=await mobileContext.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8769/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#state')?.textContent==='Battle in progress',null,{timeout:45000});

 assert.ok(await page.locator('#handheldConsole').isVisible(),'handheld console appears automatically on a phone/tablet');
 await page.locator('#mode').selectOption('local');
 await page.evaluate(()=>{HTMLElement.prototype.requestFullscreen=async function(){this.dataset.fullscreenRequested='yes'}});
 await page.locator('#viewToggle').click();
 assert.ok(await page.locator('#board2d').isVisible(),'2D board is visible after toggle');
 assert.equal(await page.locator('#board2d .square2d').count(),64,'2D board renders 64 interactive squares');
 assert.equal(await page.locator('#scene').isVisible(),false,'3D scene hides in 2D mode');

 await page.locator('.square2d[data-x="4"][data-y="6"]').click();
 assert.equal(await page.locator('#gameShell').getAttribute('data-fullscreen-requested'),'yes','first handheld play input requests fullscreen');
 await page.locator('.square2d[data-x="4"][data-y="4"]').click();
 await page.waitForFunction(()=>document.querySelectorAll('#log li').length===1,null,{timeout:5000});
 assert.match(await page.locator('#log li').first().textContent(),/e4/,'2D board makes legal moves with the same chess engine');

 const audioGate=await page.evaluate(async()=>{
   const {GameAudio}=await import('./audio.js');
   const a=new GameAudio();let calls=0;a.ensure=async()=>{calls++;return false};
   a.setMode('2d');await a.move('r');await a.attack('classic','q');const twoD=calls;
   a.setMode('3d');await a.move('r');const threeD=calls;
   return {twoD,threeD};
 });
 assert.deepEqual(audioGate,{twoD:0,threeD:1},'2D suppresses movement/attack SFX while 3D enables them');

 const profiles=await page.evaluate(async()=>{const {computerProfile}=await import('./engine.js');return [1,2,3].map(computerProfile)});
 assert.deepEqual(profiles.map(p=>p.name),['Recruit','Warrior','Champion']);
 assert.deepEqual(profiles.map(p=>p.depth),[1,2,3],'computer strength maps to distinct search depths');
 await page.locator('#mode').selectOption('ai');
 await page.locator('#difficulty').selectOption('3');
 assert.match(await page.locator('#toast').textContent(),/Champion/,'strength change is acknowledged in UI');

 await page.locator('#fullscreenBtn').click();
 assert.equal(await page.locator('#gameShell').getAttribute('data-fullscreen-requested'),'yes','fullscreen control requests game-shell fullscreen');

 await page.locator('#handView').click();
 assert.ok(await page.locator('#scene').isVisible(),'handheld console switches back to 3D');
 assert.equal(await page.locator('#board2d').isVisible(),false,'2D board hides after switch back');

 await page.locator('[data-nav="up"]').click();
 await page.locator('#handSelect').click();
 assert.match(await page.locator('#handheldStatus').textContent(),/Cursor/,'handheld cursor and select controls remain active');
 assert.deepEqual(errors,[],'no uncaught browser errors');
 await mobileContext.close();
 console.log('PASS v7 UX: device-only handheld UI, keyboard-only desktop play, immersive fullscreen fit, 2D↔3D, audio gating and AI strength');
}finally{await browser?.close();server.kill();}
