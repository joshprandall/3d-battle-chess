import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
const server=spawn('python3',['-m','http.server','8765','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 await delay(1200);
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:1365,height:850}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>document.querySelector('#scene canvas')&&document.querySelector('#state')?.textContent==='Battle in progress',null,{timeout:45000});
 assert.equal(await page.locator('#scene canvas').count(),1,'WebGL board canvas exists');
 assert.equal(await page.locator('#backToProjects').getAttribute('href'),'https://web.engr.oregonstate.edu/~randjosh/projects.html');
 assert.ok(await page.locator('#backToHome').isVisible(),'website exit is visible');
 const designs=await page.evaluate(async()=>{const {createPiece,PALETTES}=await import('./pieces.js');const {ATTACK_NAMES}=await import('./attacks.js');const result={};for(const theme of Object.keys(PALETTES)){result[theme]={};for(const role of ['p','n','b','r','q','k']){const obj=createPiece({t:role,c:'b'},0,0,theme);result[theme][role]=obj.children.map(m=>m.geometry.type+':'+m.position.toArray().map(n=>n.toFixed(2)).join(',')).join('|');obj.traverse(m=>{m.geometry?.dispose();m.material?.dispose()})}if(Object.keys(ATTACK_NAMES[theme]).length!==6)throw Error('Missing attack '+theme)}return result});
 assert.equal(Object.keys(designs).length,5,'all five themed sets exist');
 for(const role of ['p','n','b','r','q','k'])assert.ok(new Set(Object.values(designs).map(d=>d[role])).size>=4,'unique silhouettes for '+role);
 mkdirSync('artifacts',{recursive:true});await page.screenshot({path:'artifacts/desktop.png',fullPage:true});
 await page.locator('#mode').selectOption('local');
 // Auto-fullscreen is tested in ux-v7; keep the smoke harness windowed so it can inspect the side controls.
 await page.evaluate(()=>{HTMLElement.prototype.requestFullscreen=async function(){this.dataset.fullscreenRequested='yes'}});
 async function move(coordinate){await page.locator('#moveInput').fill(coordinate);await page.locator('#moveForm button').click()}
 await move('e2e4');await move('d7d5');await move('e4d5');
 await page.waitForFunction(()=>document.querySelectorAll('#log li').length===3,{timeout:10000});
 assert.match(await page.locator('#log li').last().textContent(),/d5/,'capture resolves after the staged attack');
 for(const theme of ['arcane','monsters','brick','cosmic','classic']){await page.locator('#theme').selectOption(theme);assert.match(await page.locator('#scene').getAttribute('style'),/radial-gradient/,'arena background changes');if(theme==='monsters')await page.screenshot({path:'artifacts/monsters.png',fullPage:true});if(theme==='cosmic')await page.screenshot({path:'artifacts/cosmic.png',fullPage:true})}
 await page.setViewportSize({width:390,height:844});await page.locator('#menuBtn').click();assert.match(await page.locator('#controls').getAttribute('class'),/open/);await page.locator('#menuBtn').click();
 assert.ok(await page.locator('#backToProjects').isVisible(),'portfolio exit visible on mobile');
 assert.equal(await page.locator('.site-nav').evaluate(el=>getComputedStyle(el).position),'sticky');
 await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));const rect=await page.locator('.site-nav').boundingBox();assert.ok(rect&&rect.y>=-1&&rect.y<50,'sticky exit stays visible');
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:'artifacts/mobile.png',fullPage:true});
 assert.deepEqual(errors,[],'no uncaught browser exceptions');
 console.log('PASS: five unique themed sets, all six roles, staged capture, board colors, mobile controls and return navigation');
}finally{await browser?.close();server.kill();}
