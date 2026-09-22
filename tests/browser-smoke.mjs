import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright';
const server=spawn('python3',['-m','http.server','8765','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
  await delay(1200);
  browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const page=await browser.newPage({viewport:{width:1365,height:850}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>document.querySelector('#scene canvas')&&document.querySelector('#state')?.textContent==='Battle in progress',{timeout:45000});
  assert.equal(await page.locator('#scene canvas').count(),1,'WebGL chessboard canvas exists');
  await page.locator('#moveInput').fill('e2e4');await page.locator('#moveForm button').click();
  await page.waitForFunction(()=>document.querySelectorAll('#log li').length>=2,{timeout:45000});
  assert.match(await page.locator('#log li').first().textContent(),/e4/);
  await page.locator('#theme').selectOption('arcane');
  assert.equal(await page.locator('#theme').inputValue(),'arcane');
  await page.setViewportSize({width:390,height:844});
  await page.locator('#menuBtn').click();
  assert.match(await page.locator('#controls').getAttribute('class'),/open/);
  assert.deepEqual(errors,[],'no uncaught browser exceptions');
  console.log('PASS: WebGL render, computer turn, theme switching, mobile controls and browser console');
}finally{await browser?.close();server.kill();}
