import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright';
const server=spawn('python3',['-m','http.server','8772','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 await delay(1200);browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:1365,height:850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8772/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('#state')?.textContent==='Battle in progress',null,{timeout:45000});
 assert.equal(await page.locator('#board2d .chess-square').count(),64);
 await page.locator('.switch-board').click();assert.ok(await page.locator('#board2d').isVisible());assert.match(await page.locator('.switch-board').innerText(),/3D/);
 await page.locator('#mode').selectOption('local');await page.locator('[data-square="e2"]').click();assert.match(await page.locator('[data-square="e4"]').getAttribute('class'),/legal/);await page.locator('[data-square="e4"]').click();await page.waitForFunction(()=>document.querySelectorAll('#log li').length===1);
 await page.locator('.switch-board').click();assert.ok(!(await page.locator('#board2d').isVisible()));assert.match(await page.locator('.switch-board').innerText(),/2D/);
 await page.locator('.screen-toggle').click();await page.waitForFunction(()=>!!document.fullscreenElement,{timeout:5000});await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.fullscreenElement,{timeout:5000});
 const ai=await page.evaluate(async()=>{const {ChessGame}=await import('./engine.js'),{chooseComputerMoveV7}=await import('./computer-v7.js');const g=new ChessGame();g.move(4,6,4,4);const key=g.positionKey(),moves=[];for(const level of [1,2,3]){const m=chooseComputerMoveV7(g,level);if(!g.legalMoves(m.x,m.y).some(v=>v.nx===m.nx&&v.ny===m.ny))throw Error('illegal move '+level);moves.push(m);if(g.positionKey()!==key||g.moves.length!==1)throw Error('AI mutated board '+level)}return moves});assert.equal(ai.length,3);
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),mobileErrors=[];mobile.on('pageerror',e=>mobileErrors.push(e.message));
 await mobile.goto('http://127.0.0.1:8772/handheld.html',{waitUntil:'domcontentloaded'});await mobile.waitForFunction(()=>document.querySelector('#state')?.textContent==='Battle in progress',null,{timeout:45000});assert.ok(await mobile.locator('.chess-handheld-console').isVisible());
 await mobile.locator('.switch-board').click();await mobile.locator('.hand-primary').click();await mobile.locator('.dpad-up').click();await mobile.locator('.dpad-up').click();await mobile.locator('.hand-primary').click();await mobile.waitForFunction(()=>document.querySelectorAll('#log li').length===1,{timeout:5000});assert.match(await mobile.locator('#log').innerText(),/e4/);
 assert.deepEqual(errors,[]);assert.deepEqual(mobileErrors,[]);console.log('PASS v7: 2D/3D state, legal moves, fullscreen + Escape, 3 AI levels, working handheld console');
}finally{await browser?.close();server.kill()}
