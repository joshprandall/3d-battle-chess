import * as THREE from 'three';
import {CombatDirectorV8} from './combat-v8/combat-director.js';
import {getCharacterDefinition} from './combat-v8/character-definitions.js';
import {PALETTES} from './pieces.js';

const STEP=1/120;
const material=(color,emissive=0)=>new THREE.MeshStandardMaterial({color,roughness:.56,metalness:.24,emissive,emissiveIntensity:emissive?.30:0});

export function animateDuelV8({source,victim,theme='classic',role='p',fxGroup,camera,orbit,boardGroup,pieceGroup,reducedMotion=false,onImpact}){
 if(!source||!victim||reducedMotion){onImpact?.();return Promise.resolve({impacts:1,skipped:!!reducedMotion,v8:true});}
 const attacker={t:source.userData.role||role,c:source.userData.side||'w'};
 const defender={t:victim.userData.role||'p',c:victim.userData.side||'b'};
 const attackDef=getCharacterDefinition(theme,attacker.t),defenderDef=getCharacterDefinition(theme,defender.t);
 const oldCamera=camera.position.clone(),oldTarget=orbit.target.clone(),oldOrbit=orbit.enabled,oldBoard=boardGroup.visible,oldPieces=pieceGroup.visible;
 const arena=new THREE.Group();arena.name='capture-duel-v8';fxGroup.add(arena);
 const palette=PALETTES[theme]||PALETTES.classic;
 const floor=new THREE.Mesh(new THREE.CylinderGeometry(3.25,3.42,.19,48),material(theme==='monsters'?0x25352a:theme==='cosmic'?0x172b42:0x283949));floor.position.y=-.15;floor.receiveShadow=true;arena.add(floor);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(2.55,.03,7,72),material(palette.glow,palette.glow));ring.rotation.x=Math.PI/2;ring.position.y=-.045;arena.add(ring);
 const director=new CombatDirectorV8({attacker,defender,theme,onContact:()=>{onImpact?.();}});
 director.attacker.scale.setScalar(1.48);director.defender.scale.setScalar(1.48);director.effectsGroup.scale.setScalar(1.48);
 arena.add(director.attacker,director.defender,director.effectsGroup);

 const stage=document.querySelector('.stage'),ui=document.createElement('div');ui.className='duel-ui v8-duel-ui';
 ui.style.cssText='position:absolute;inset:0;z-index:8;pointer-events:none;color:#f5faff;font:600 13px system-ui;text-shadow:0 2px 6px #000';
 const head=document.createElement('div');head.style.cssText='position:absolute;top:8px;left:8px;right:8px;display:flex;gap:8px;justify-content:space-between;align-items:start';
 const title=document.createElement('div');title.style.cssText='background:#071724ed;border:1px solid #638caa;padding:8px 10px;border-radius:10px;max-width:70%';
 title.textContent=`${attackDef.setLabel} · ${attackDef.name} vs ${defenderDef.name}`;
 const skip=document.createElement('button');skip.type='button';skip.textContent='Skip battle';skip.style.cssText='pointer-events:auto;min-height:44px;border-radius:10px;background:#193b50;border:1px solid #94eafa;color:white;padding:7px 12px;font:600 13px system-ui';
 const caption=document.createElement('div');caption.style.cssText='position:absolute;bottom:60px;left:50%;transform:translateX(-50%);width:max-content;max-width:calc(100% - 24px);text-align:center;background:#081824e8;border:1px solid #58778b;border-radius:10px;padding:8px 12px';
 caption.textContent=`${attackDef.name} takes position`;head.append(title,skip);ui.append(head,caption);stage?.append(ui);
 boardGroup.visible=false;pieceGroup.visible=false;orbit.enabled=false;
 const mobile=camera.aspect<.85,cameraGoal=new THREE.Vector3(0,mobile?2.25:2.5,mobile?5.0:6.15),targetGoal=new THREE.Vector3(0,1.05,0);
 const state={done:false,skipped:false,impactCalled:false,time:0,phase:''};skip.onclick=()=>{state.skipped=true;};
 const oldOnImpact=onImpact;
 // Director owns the physical contact event. We track it from the result to avoid
 // making chess state depend on whether a visual effect or collision callback fires.
 function say(text){if(state.phase!==text){state.phase=text;caption.textContent=text;}}
 function cleanup(){
  if(state.done)return;state.done=true;boardGroup.visible=oldBoard;pieceGroup.visible=oldPieces;orbit.enabled=oldOrbit;
  camera.position.copy(oldCamera);orbit.target.copy(oldTarget);orbit.update();ui.remove();director.dispose();fxGroup.remove(arena);
  const geometries=new Set(),materials=new Set();arena.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});
  for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
 }
 return new Promise(resolve=>{
  let last=null,acc=0,lastResult=null;
  function frame(now){
   if(state.done)return;if(last===null)last=now;
   const elapsed=Math.min(.08,Math.max(0,(now-last)/1000));last=now;state.time+=elapsed;
   if(state.skipped){if(!state.impactCalled){state.impactCalled=true;oldOnImpact?.();}cleanup();resolve({impacts:1,skipped:true,v8:true});return;}
   acc=Math.min(.15,acc+elapsed);let loops=0;
   while(acc>=STEP&&loops<14){lastResult=director.update(STEP);acc-=STEP;loops++;}
   const pose=lastResult?.pose;
   if(pose){
    if(lastResult.contact&&!state.impactCalled)state.impactCalled=true;
    say(lastResult.contact?`${attackDef.name} connects — ${lastResult.contact.hit?.volume?.name||'impact'}`:
      pose.state==='anticipate'?`${attackDef.name} — winding up`:
      pose.state==='commit'?`${attackDef.name}!`:
      pose.state==='follow-through'?'Following through':pose.state.replace('-', ' '));
   }
   const cam=Math.min(1,state.time/.32);camera.position.lerpVectors(oldCamera,cameraGoal,cam);orbit.target.lerpVectors(oldTarget,targetGoal,cam);camera.lookAt(orbit.target);
   if(lastResult?.complete||state.time>6){
    if(!state.impactCalled){state.impactCalled=true;oldOnImpact?.();}
    const impacts=lastResult?.contact?1:0;cleanup();resolve({impacts,skipped:false,v8:true,attack:attackDef.attack});return;
   }
   requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
 });
}
