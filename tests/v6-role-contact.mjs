import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright';
const server=spawn('python3',['-m','http.server','8768','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 await delay(1100);
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.goto('http://127.0.0.1:8768/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#state')?.textContent==='Battle in progress',null,{timeout:45000});
 const results=await page.evaluate(async()=>{
  const THREE=await import('three'),{animateDuel}=await import('./duels-v6.js');
  const original=window.requestAnimationFrame;let virtual=0;
  window.requestAnimationFrame=callback=>original(()=>{virtual+=90;callback(virtual);});
  const attempts=[];
  try{
   for(const theme of ['classic','arcane','monsters','brick','cosmic'])for(const role of ['p','n','b','r','q','k']){
    const camera=new THREE.PerspectiveCamera(62,.68,.1,100);camera.position.set(8.5,10,9.5);
    const orbit={target:new THREE.Vector3(0,.25,0),enabled:true,update(){}};
    const stage=new THREE.Group(),board=new THREE.Group(),pieces=new THREE.Group();
    let impacts=0;
    const result=await animateDuel({source:{userData:{role,side:'w'}},victim:{userData:{role:'p',side:'b'}},theme,role,fxGroup:stage,camera,orbit,boardGroup:board,pieceGroup:pieces,onImpact:()=>impacts++});
    attempts.push({theme,role,...result,impacts,clean:stage.children.length===0&&board.visible&&pieces.visible&&orbit.enabled});
   }
  }finally{window.requestAnimationFrame=original;}
  return attempts;
 });
 console.log('CONTACT RESULTS',JSON.stringify(results));
 assert.equal(results.length,30);
 for(const value of results){
  assert.equal(value.impacts,1,`${value.theme} ${value.role} missed the target: ${JSON.stringify(value)}`);
  assert.equal(value.skipped,false,`${value.theme} ${value.role} was skipped`);
  assert.equal(value.clean,true,`${value.theme} ${value.role} did not clean up`);
 }
 console.log('PASS: 30/30 physically confirmed unskipped role/theme contacts and scene cleanups');
}finally{await browser?.close();server.kill();}
