import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright';

const server=spawn('python3',['-m','http.server','8770','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 await delay(900);
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 await page.goto('http://127.0.0.1:8770/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#state')?.textContent==='Battle in progress',null,{timeout:45000});
 const result=await page.evaluate(async()=>{
  const THREE=await import('three');
  const {createV8Character}=await import('./combat-v8/character-factory.js');
  const {poseRig,weaponWorldPoint,hitVolumes}=await import('./combat-v8/rig-types.js');
  const {CHARACTER_SETS,ROLE_ORDER}=await import('./combat-v8/character-definitions.js');
  const signatures=[];
  for(const theme of Object.keys(CHARACTER_SETS))for(const role of ROLE_ORDER){
   const root=createV8Character({t:role,c:'w'},theme);
   poseRig(root,{gait:.35,windup:.6,attack:.4,brace:.2});
   root.updateMatrixWorld(true);
   const tip=weaponWorldPoint(root,new THREE.Vector3());
   const vols=hitVolumes(root);
   let meshes=0;root.traverse(o=>{if(o.isMesh)meshes++});
   const box=new THREE.Box3().setFromObject(root),size=new THREE.Vector3();box.getSize(size);
   if(!Number.isFinite(tip.x)||vols.length<3||meshes<12)throw Error(`Bad v8 model ${theme}:${role}`);
   signatures.push({theme,role,name:root.userData.definition.name,rig:root.userData.definition.rig,meshes,size:[size.x,size.y,size.z].map(v=>Number(v.toFixed(3)))});
   root.traverse(o=>{o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose())});
  }
  return signatures;
 });
 assert.equal(result.length,30);
 assert.equal(new Set(result.map(x=>x.name)).size,30);
 for(const theme of ['classic','arcane','monsters','brick','cosmic']){
   const set=result.filter(x=>x.theme===theme);
   assert.equal(set.length,6);
   assert.ok(new Set(set.map(x=>x.rig)).size>=3,`${theme} uses multiple rig families`);
 }
 console.log('PASS v8 browser: 30 renderable themed characters with articulated rigs and hit volumes');
}finally{await browser?.close();server.kill();}
