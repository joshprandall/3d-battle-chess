import * as THREE from 'three';
import {PALETTES} from './pieces.js';
import {createCharacter,poseCharacter} from './characters.js';

const clamp=(x)=>Math.min(1,Math.max(0,x));
const smooth=(x)=>{x=clamp(x);return x*x*(3-2*x)};
const lerp=(a,b,t)=>a+(b-a)*t;
const ROLE={
 p:{name:'SCOUT',attack:'Low lunge',duration:2600,approach:.73,leap:.04},
 n:{name:'RIDER',attack:'Leaping strike',duration:2900,approach:.83,leap:.87},
 b:{name:'MYSTIC',attack:'Arcane bolt',duration:2900,approach:.10,leap:.04},
 r:{name:'GUARDIAN',attack:'Shield charge',duration:2700,approach:.84,leap:.09},
 q:{name:'CHAMPION',attack:'Feint and finishing blow',duration:3300,approach:.84,leap:.33},
 k:{name:'SOVEREIGN',attack:'Royal overhead strike',duration:3050,approach:.78,leap:.13}
};
const THEME={classic:'Classic clash',arcane:'Arcane spell',monsters:'Monster ambush',brick:'Brick explosion',cosmic:'Cosmic encounter'};

// A reusable close-up arena: the real board and the game state stay untouched
// until the entire battle completes. There is no second WebGL context on phones.
export function animateDuel({source,victim,theme='classic',role='p',fxGroup,camera,orbit,boardGroup,pieceGroup,reducedMotion=false,onImpact}){
 if(!source||!victim||reducedMotion){onImpact?.();return Promise.resolve({impacts:1,skipped:!!reducedMotion});}
 const spec=ROLE[role]||ROLE.p,palette=PALETTES[theme]||PALETTES.classic;
 const from={t:source.userData.role,c:source.userData.side};
 const to={t:victim.userData.role,c:victim.userData.side};
 const oldCamera=camera.position.clone(),oldTarget=orbit.target.clone();
 const oldOrbit=orbit.enabled,oldBoard=boardGroup.visible,oldPieces=pieceGroup.visible;
 const arena=new THREE.Group();arena.name='capture-duel-arena';fxGroup.add(arena);
 const owned=[];const own=(mesh)=>{arena.add(mesh);owned.push(mesh);return mesh};
 const mat=(color,emissive=0,alpha=1)=>new THREE.MeshStandardMaterial({color,roughness:.55,metalness:.19,emissive,emissiveIntensity:emissive?.8:0,transparent:alpha<1,opacity:alpha,depthWrite:alpha===1});
 const floor=own(new THREE.Mesh(new THREE.CylinderGeometry(2.95,3.03,.13,48),mat(theme==='monsters'?0x243529:theme==='cosmic'?0x15263b:0x263542)));
 floor.position.y=-.12;floor.receiveShadow=true;
 const ring=own(new THREE.Mesh(new THREE.TorusGeometry(2.62,.035,6,72),mat(palette.glow,palette.glow)));
 ring.rotation.x=Math.PI/2;ring.position.y=-.035;
 const fighter=createCharacter(from,0,0,theme),defender=createCharacter(to,0,0,theme);
 fighter.scale.setScalar(1.65);defender.scale.setScalar(1.65);
 arena.add(fighter,defender);
 const LEFT=new THREE.Vector3(-1.18,.09,0),RIGHT=new THREE.Vector3(1.18,.09,0);
 const flash=new THREE.PointLight(palette.glow,0,6);flash.position.set(.55,1.05,.3);arena.add(flash);
 const fxMat=mat(palette.glow,palette.glow,.95),accentMat=mat(theme==='monsters'?0xff8c75:theme==='brick'?0xf9c577:0xdaf7ff,palette.glow,.95);
 const impactRing=own(new THREE.Mesh(new THREE.TorusGeometry(.52,.039,7,36),accentMat));impactRing.position.set(.63,1,.2);impactRing.visible=false;
 const projectile=own(new THREE.Mesh(theme==='brick'?new THREE.BoxGeometry(.20,.20,.20):new THREE.OctahedronGeometry(.16),fxMat));projectile.visible=false;
 const beam=own(new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,1,8),accentMat));beam.visible=false;
 const particleGeometry=theme==='brick'?new THREE.BoxGeometry(.11,.11,.11):theme==='arcane'?new THREE.TetrahedronGeometry(.075):theme==='cosmic'?new THREE.OctahedronGeometry(.085):new THREE.SphereGeometry(.075,5,4);
 const bits=[];
 for(let i=0;i<(theme==='brick'?24:16);i++){
  const mesh=new THREE.Mesh(particleGeometry,i%3?fxMat:accentMat);mesh.visible=false;arena.add(mesh);const angle=(i*2.39996)%(Math.PI*2);
  bits.push({mesh,dir:new THREE.Vector3(Math.cos(angle),.32+((i*7)%9)/16,Math.sin(angle))});
 }
 const stage=document.querySelector('.stage');const ui=document.createElement('div');ui.className='duel-ui';
 ui.style.cssText='position:absolute;inset:0;z-index:8;pointer-events:none;color:#f4f7ff;font:600 14px system-ui;text-shadow:0 2px 5px #000;';
 const header=document.createElement('div');header.style.cssText='position:absolute;top:9px;left:9px;right:9px;display:flex;align-items:center;gap:8px;justify-content:space-between';
 const label=document.createElement('span');label.textContent=`${THEME[theme]} · ${spec.name}`;label.style.cssText='background:#091723f0;border:1px solid #7399b6;padding:9px 10px;border-radius:10px';
 const skip=document.createElement('button');skip.type='button';skip.textContent='Skip battle';skip.setAttribute('aria-label','Skip capture animation');skip.style.cssText='pointer-events:auto;min-height:44px;padding:8px 12px;border-radius:10px;border:1px solid #9be4fb;background:#16364e;color:white;font:600 13px system-ui';
 header.append(label,skip);ui.append(header);
 const caption=document.createElement('div');caption.setAttribute('aria-live','polite');caption.style.cssText='position:absolute;bottom:62px;left:50%;transform:translateX(-50%);max-width:calc(100% - 24px);min-width:min(260px,90%);text-align:center;background:#081623e8;border:1px solid #496c84;border-radius:10px;padding:9px';caption.textContent='The defenders prepare…';ui.append(caption);stage?.append(ui);
 if(stage&&matchMedia('(max-width:850px)').matches){stage.style.scrollMarginTop='64px';stage.scrollIntoView({block:'start',behavior:'auto'});}
 let skipped=false,hit=false,done=false;skip.onclick=()=>{skipped=true};
 boardGroup.visible=false;pieceGroup.visible=false;orbit.enabled=false;
 const cameraGoal=new THREE.Vector3(0,2.55,5.25),targetGoal=new THREE.Vector3(0,.98,0);
 function impact(){if(hit)return;hit=true;onImpact?.();impactRing.visible=true;for(const bit of bits)bit.mesh.visible=true;caption.textContent=theme==='brick'?'Pieces scatter across the arena!':theme==='arcane'?'The spell breaks the defense!':theme==='cosmic'?'Direct hit!':'The defender falls!';}
 function cleanup(){if(done)return;done=true;if(!hit)impact();
  boardGroup.visible=oldBoard;pieceGroup.visible=oldPieces;orbit.enabled=oldOrbit;
  camera.position.copy(oldCamera);orbit.target.copy(oldTarget);orbit.update();
  fxGroup.remove(arena);ui.remove();const geometries=new Set(),materials=new Set();
  arena.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m))});
  for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
 }
 return new Promise(resolve=>{
  let start=null,lastPhase='';
  function frame(now){if(start===null)start=now;const t=skipped?1:clamp((now-start)/spec.duration);
   const anticipation=smooth(t/.19),drive=smooth((t-.21)/.29),reaction=smooth((t-.55)/.19),fall=smooth((t-.72)/.17);
   if(t<.21&&lastPhase!=='guard'){caption.textContent='The defender raises a guard…';lastPhase='guard'}
   else if(t>=.21&&t<.55&&lastPhase!=='attack'){caption.textContent=spec.attack+'!';lastPhase='attack'}
   fighter.position.copy(LEFT);defender.position.copy(RIGHT);
   fighter.rotation.set(0,Math.PI*.36,0);defender.rotation.set(0,-Math.PI*.36,0);
   if(role==='b'){fighter.position.x+=drive*.14;fighter.position.y+=Math.sin(drive*Math.PI)*.09;}
   else if(role==='q'){fighter.position.x+=drive*spec.approach*2.15;fighter.position.z=Math.sin(drive*Math.PI*2)*.27;fighter.position.y+=Math.sin(drive*Math.PI)*spec.leap;fighter.rotation.y+=Math.sin(drive*Math.PI*1.3)*.65;}
   else {fighter.position.x+=drive*spec.approach*2.1;fighter.position.y+=Math.sin(drive*Math.PI)*spec.leap;}
   fighter.rotation.z=role==='r'?-drive*.17:role==='p'?drive*.12:0;
   poseCharacter(fighter,{lean:-.24*anticipation+.48*drive-.24*reaction,head:-.15*anticipation,guard:-.65*anticipation,left:.25*drive,swing:-1.45*anticipation+2.45*drive-.8*reaction,step:Math.sin(drive*Math.PI*3)*.56,weapon:role==='k'?-1.1*anticipation+1.6*drive:role==='n'?-.62*drive:0});
   defender.position.x+=reaction*.20;defender.position.y-=fall*.28;
   defender.rotation.z=-reaction*.18-fall*.77;
   defender.scale.set(1.65*(1+.10*reaction),1.65*(1-.27*reaction),1.65);
   if(fall>.65)defender.scale.multiplyScalar(Math.max(.06,1-smooth((t-.83)/.13)*.92));
   poseCharacter(defender,{lean:.15*anticipation+.69*reaction,head:-.34*reaction,guard:-1.2*anticipation+1.6*reaction,left:-.32*anticipation,right:.55*reaction,step:reaction*.42});
   camera.position.copy(oldCamera).lerp(cameraGoal,smooth(t/.20));
   camera.position.x+=Math.sin(t*1.9)*.20+Math.sin(t*83)*(.045*(1-smooth((t-.62)/.12))*reaction);
   camera.position.z-=smooth((t-.23)/.36)*.36;
   orbit.target.copy(oldTarget).lerp(targetGoal,smooth(t/.20));camera.lookAt(orbit.target);
   const ranged=role==='b'||theme==='cosmic'||theme==='arcane';
   projectile.visible=ranged&&t>.24&&t<.55;
   if(projectile.visible){projectile.position.set(lerp(-.83,.68,smooth((t-.27)/.28)),1.06+Math.sin(t*28)*.07,.20);projectile.rotation.y+=.10;projectile.rotation.z+=.08;}
   beam.visible=(role==='b'||theme==='cosmic')&&t>.40&&t<.56;
   if(beam.visible){beam.position.set(-.07,1.02,.21);beam.rotation.z=Math.PI/2;beam.scale.y=1.64;}
   if(t>=.55)impact();
   flash.intensity=hit?4.2*(1-smooth((t-.55)/.14)):0;
   if(hit){const spread=smooth((t-.55)/.41);impactRing.scale.setScalar(1+spread*2.5);impactRing.material.opacity=Math.max(.02,1-spread);
    for(const bit of bits){bit.mesh.position.set(.67+bit.dir.x*spread*1.45,1.02+bit.dir.y*spread*1.45-spread*spread*1.8,.10+bit.dir.z*spread*1.15);bit.mesh.rotation.set(spread*7,spread*11,spread*5);bit.mesh.scale.setScalar(1-spread*.7);}
   }
   if(t<1)requestAnimationFrame(frame);else{cleanup();resolve({impacts:1,skipped})}
  }
  requestAnimationFrame(frame);
 });
}
