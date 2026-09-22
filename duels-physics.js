import * as THREE from 'three';
import {PALETTES} from './pieces.js';
import {createDuelFighter as createCharacter,poseCharacter} from './combatants.js';
import {STEP,body,drive,jump,impulse,step,sweptHit,projectile,advanceProjectile,fragments,fightMass,ease} from './combat-physics.js';

// A staged duel with fixed-step momentum, swept weapon/projectile contact,
// mass-scaled knockback, gravity and friction. This is deliberately a small
// rigid-body model, not a claim of skeletal ragdoll or motion-captured combat.
const ROLE={
 p:{title:'SCOUT',move:'Grounded lunge',speed:2.8,windup:.66,duration:3.50},
 n:{title:'RIDER',move:'Vaulting strike',speed:3.0,windup:.72,duration:3.85,jump:3.0},
 b:{title:'MYSTIC',move:'Charged bolt',speed:0,windup:.90,duration:3.7,range:true},
 r:{title:'GUARDIAN',move:'Heavy shield rush',speed:3.45,windup:.86,duration:3.9},
 q:{title:'CHAMPION',move:'Feint and riposte',speed:3.3,windup:1.00,duration:4.1},
 k:{title:'SOVEREIGN',move:'Overhead strike',speed:2.65,windup:.84,duration:3.9}
};
const THEME={classic:'THE DUEL',arcane:'ARCANE SHOWDOWN',monsters:'MONSTER AMBUSH',brick:'BRICK BRAWL',cosmic:'COSMIC CONFLICT'};
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const material=(color,glow=0,opacity=1)=>new THREE.MeshStandardMaterial({color,metalness:.28,roughness:.48,emissive:glow,emissiveIntensity:glow?.28:0,transparent:opacity<1,opacity,depthWrite:opacity===1});

export function animateDuel({source,victim,theme='classic',role='p',fxGroup,camera,orbit,boardGroup,pieceGroup,reducedMotion=false,onImpact}){
 if(!source||!victim||reducedMotion){onImpact?.();return Promise.resolve({impacts:1,skipped:!!reducedMotion});}
 const spec=ROLE[role]||ROLE.p,palette=PALETTES[theme]||PALETTES.classic;
 const attackerData={t:source.userData.role,c:source.userData.side};
 const defenderData={t:victim.userData.role,c:victim.userData.side};
 const oldCamera=camera.position.clone(),oldTarget=orbit.target.clone(),oldOrbit=orbit.enabled;
 const oldBoard=boardGroup.visible,oldPieces=pieceGroup.visible;
 const arena=new THREE.Group();arena.name='capture-duel-arena';fxGroup.add(arena);
 const own=mesh=>{arena.add(mesh);return mesh};
 const floor=own(new THREE.Mesh(new THREE.CylinderGeometry(3.05,3.18,.18,48),material(theme==='monsters'?0x26372c:theme==='cosmic'?0x192b40:0x273849)));
 floor.position.y=-.16;floor.receiveShadow=true;
 const innerRing=own(new THREE.Mesh(new THREE.TorusGeometry(2.36,.028,6,64),material(palette.glow,palette.glow)));
 innerRing.rotation.x=Math.PI/2;innerRing.position.y=-.055;
 for(const side of [-1,1])for(const depth of [-1,1]){
  const column=own(new THREE.Mesh(new THREE.CylinderGeometry(.17,.23,.72,7),material(theme==='monsters'?0x3b4b3c:0x344658)));
  column.position.set(side*2.43,.36,depth*1.23);column.castShadow=true;
  const light=own(new THREE.Mesh(new THREE.OctahedronGeometry(.11),material(palette.glow,palette.glow)));
  light.position.set(side*2.43,.81,depth*1.23);
 }
 const fighter=createCharacter(attackerData,theme),defender=createCharacter(defenderData,theme);
 fighter.scale.setScalar(1.55);defender.scale.setScalar(1.55);arena.add(fighter,defender);
 const a=body({x:-1.24,mass:fightMass(role),radius:.46,drag:5.2});
 const d=body({x:1.24,mass:fightMass(defenderData.t),radius:.49,drag:3.4,bounce:.14});
 const ranged=!!spec.range||theme==='arcane'||theme==='cosmic';
 const shotMesh=own(new THREE.Mesh(theme==='brick'?new THREE.BoxGeometry(.23,.23,.23):new THREE.OctahedronGeometry(.20),material(palette.glow,palette.glow)));
 shotMesh.visible=false;
 const core=own(new THREE.Mesh(new THREE.SphereGeometry(.115,9,6),material(0xfff1cf,0xffcc77)));core.visible=false;
 const contactRing=own(new THREE.Mesh(new THREE.TorusGeometry(.35,.036,6,32),material(palette.glow,palette.glow,.85)));
 contactRing.visible=false;
 const strikeFlash=new THREE.PointLight(palette.glow,0,6);strikeFlash.position.set(.56,1,.12);arena.add(strikeFlash);
 const sparkGeometry=theme==='brick'?new THREE.BoxGeometry(.1,.1,.1):theme==='arcane'?new THREE.TetrahedronGeometry(.084):new THREE.OctahedronGeometry(.073);
 const sparkMaterials=[material(palette.glow,palette.glow),material(theme==='monsters'?0xff9b69:0xf9f1c9)];
 const shards=Array.from({length:theme==='brick'?24:15},(_,i)=>{
  const mesh=new THREE.Mesh(sparkGeometry,sparkMaterials[i%2]);mesh.visible=false;arena.add(mesh);return mesh;
 });
 const stage=document.querySelector('.stage'),ui=document.createElement('div');ui.className='duel-ui';
 ui.style.cssText='position:absolute;inset:0;z-index:8;pointer-events:none;color:#f5faff;font:600 13px system-ui;text-shadow:0 2px 6px #000';
 const head=document.createElement('div');head.style.cssText='position:absolute;top:8px;left:8px;right:8px;display:flex;gap:8px;justify-content:space-between;align-items:start';
 const title=document.createElement('div');title.style.cssText='background:#071724ed;border:1px solid #638caa;padding:8px 10px;border-radius:10px;max-width:65%';
 title.textContent=`${THEME[theme]} · ${spec.title}`;
 const skip=document.createElement('button');skip.type='button';skip.textContent='Skip battle';skip.setAttribute('aria-label','Skip capture animation');
 skip.style.cssText='pointer-events:auto;min-height:44px;border-radius:10px;background:#193b50;border:1px solid #94eafa;color:white;padding:7px 12px;font:600 13px system-ui';
 const caption=document.createElement('div');caption.setAttribute('aria-live','polite');caption.style.cssText='position:absolute;bottom:60px;left:50%;transform:translateX(-50%);width:max-content;max-width:calc(100% - 24px);text-align:center;background:#081824e8;border:1px solid #58778b;border-radius:10px;padding:8px 12px';
 caption.textContent='The fighters take their stance';head.append(title,skip);ui.append(head,caption);stage?.append(ui);
 if(stage&&matchMedia('(max-width:850px)').matches){stage.style.scrollMarginTop='64px';stage.scrollIntoView({block:'start',behavior:'auto'});}
 boardGroup.visible=false;pieceGroup.visible=false;orbit.enabled=false;
 const mobile=camera.aspect<.85,cameraGoal=new THREE.Vector3(0,mobile?2.2:2.42,mobile?4.8:6),targetGoal=new THREE.Vector3(0,1.17,0);
 const state={time:0,hit:false,hitAt:0,shot:null,fired:false,jumped:false,shards:[],skipped:false,done:false,phase:''};
 skip.onclick=()=>{state.skipped=true;};
 function say(text){if(state.phase!==text){state.phase=text;caption.textContent=text;}}
 function hit(){if(state.hit)return;state.hit=true;state.hitAt=state.time;onImpact?.();
  const heavy=role==='r',jumping=role==='n';
  impulse(d,{x:heavy?5.9:jumping?4.2:3.4,y:jumping?2.9:heavy?1.1:1.75,z:theme==='monsters'?.95:.38,torque:-(heavy?2.4:1.65)});
  impulse(a,{x:-.50,y:jumping?.25:0,torque:.12});
  state.shards=fragments(shards.length,{x:(a.x+d.x)/2,y:1.0,z:(a.z+d.z)/2},role.charCodeAt(0)+theme.length*251);
  for(const mesh of shards)mesh.visible=true;contactRing.visible=true;core.visible=true;
  say(theme==='brick'?'BRICKS FLY — solid hit!':theme==='arcane'?'WARD SHATTERED!':theme==='cosmic'?'ENERGY IMPACT!':'HIT! The defender loses balance');
 }
 function advance(dt){
  state.time+=dt;const t=state.time;
  if(!state.hit){
   if(t<spec.windup*.60)say('A guard, a feint…');
   else if(t<spec.windup)say(spec.move+' — winding up');
   else say(spec.move+'!');
  }else if(t-state.hitAt>.66)say('Momentum carries the defender to the ground');
  if(!state.hit&&t>=spec.windup){
   if(!state.jumped&&spec.jump){jump(a,spec.jump);state.jumped=true;}
   if(ranged){
    if(!state.fired){state.fired=true;
     const origin={x:a.x+.30,y:a.y+1.17,z:a.z},destination={x:d.x,y:d.y+1.14,z:d.z};
     const distance=Math.hypot(destination.x-origin.x,destination.z-origin.z)||1;
     state.shot=projectile({...origin,vx:5.4*(destination.x-origin.x)/distance,vy:(destination.y-origin.y)*1.5,vz:5.4*(destination.z-origin.z)/distance,gravity:theme==='monsters'?1.7:0,radius:.20});
    }
    if(state.shot?.active&&advanceProjectile(state.shot,dt,{x:d.x,y:d.y+1.12,z:d.z},.53))hit();
   }else{
    const previous={x:a.x+.22,y:a.y+1.02,z:a.z};
    const zig=role==='q'?Math.sin((t-spec.windup)*11)*.5:role==='n'?.28:0;
    drive(a,spec.speed,zig,dt,role==='r'?6.0:10.5,3.7);
    // A weapon makes contact only when its swept hit volume reaches the defender.
    const next={x:previous.x+a.vx*dt,y:previous.y+a.vy*dt,z:previous.z+a.vz*dt};
    if(sweptHit(previous,next,{x:d.x,y:d.y+1.04,z:d.z},a.radius+d.radius+.21))hit();
   }
  }else drive(a,0,0,dt,4.5);
  step(a,dt);step(d,dt);
  for(const fragment of state.shards)step(fragment,dt);
 }
 function display(){
  const t=state.time,wind=ease(t/Math.max(.2,spec.windup)),after=state.hit?Math.max(0,t-state.hitAt):0;
  const drivePose=ease((t-spec.windup)/.32)*(1-ease(after/.45));
  const guard=1-ease(Math.max(0,t-spec.windup)/.55);
  fighter.position.set(a.x,a.y+.065,a.z);defender.position.set(d.x,d.y+.065,d.z);
  fighter.rotation.set(0,Math.PI*.31,a.roll);defender.rotation.set(0,-Math.PI*.36,d.roll);
  const gait=Math.sin(t*(role==='r'?18:14))*clamp(Math.abs(a.vx)/2.8)*.48;
  poseCharacter(fighter,{lean:-.19*wind+.48*drivePose-.17*ease(after/.22),turn:role==='q'?Math.sin(t*10)*.18*drivePose:0,guard:-.66*guard,left:.22*drivePose,swing:-1.2*wind+2.3*drivePose-.8*ease(after/.22),step:gait,weapon:role==='k'?-1.2*wind+1.6*drivePose:0});
  const stagger=ease(after/.21);poseCharacter(defender,{lean:.08*wind+.82*stagger,roll:-d.roll*.15,head:-.45*stagger,guard:-1.0*guard+1.6*stagger,right:.62*stagger,left:-.20*guard,step:.48*stagger});
  if(state.shot?.active){shotMesh.visible=true;shotMesh.position.set(state.shot.x,state.shot.y,state.shot.z);shotMesh.rotation.set(t*4,t*5,t*3);}else shotMesh.visible=false;
  const blast=state.hit?ease(after/.43):0;contactRing.visible=state.hit&&after<.43;core.visible=state.hit&&after<.15;
  if(state.hit){contactRing.position.set((a.x+d.x)/2,1.02,(a.z+d.z)/2);contactRing.rotation.y=Math.PI/2;contactRing.scale.setScalar(1+blast*2.3);contactRing.material.opacity=.85*(1-blast);core.position.copy(contactRing.position);core.scale.setScalar(1+blast*2);strikeFlash.position.copy(contactRing.position);strikeFlash.intensity=3.5*(1-ease(after/.22));}
  for(let i=0;i<state.shards.length;i++){
   const b=state.shards[i],mesh=shards[i];mesh.position.set(b.x,b.y,b.z);mesh.rotation.set(t*3+i,t*(2+i%3),t*5);mesh.scale.setScalar(Math.max(.25,1-ease((after-.4)/1.5)*.7));
  }
  const cam=ease(t/.33);camera.position.copy(oldCamera).lerp(cameraGoal,cam);
  // Camera stays readable and never swings wildly on a touch screen.
  camera.position.x+=state.hit?.04*Math.sin(after*29)*(1-ease(after/.22)):0;
  orbit.target.copy(oldTarget).lerp(targetGoal,cam);camera.lookAt(orbit.target);
 }
 function cleanup(){if(state.done)return;state.done=true;
  boardGroup.visible=oldBoard;pieceGroup.visible=oldPieces;orbit.enabled=oldOrbit;
  camera.position.copy(oldCamera);orbit.target.copy(oldTarget);orbit.update();
  ui.remove();fxGroup.remove(arena);
  const geometries=new Set(),materials=new Set();arena.traverse(obj=>{
   if(obj.geometry)geometries.add(obj.geometry);
   if(obj.material)(Array.isArray(obj.material)?obj.material:[obj.material]).forEach(m=>materials.add(m));
  });for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
 }
 return new Promise(resolve=>{
  let last=null,accumulator=0;
  function frame(now){if(state.done)return;if(last===null)last=now;
   const elapsed=Math.min(.09,Math.max(0,(now-last)/1000));last=now;
   if(state.skipped){if(!state.hit)hit();cleanup();resolve({impacts:1,skipped:true});return;}
   accumulator=Math.min(.16,accumulator+elapsed);
   let substeps=0;while(accumulator>=STEP&&substeps<12){advance(STEP);accumulator-=STEP;substeps++;}
   display();
   if(state.hit&&state.time>=Math.max(spec.duration,state.hitAt+1.8)){
    cleanup();resolve({impacts:1,skipped:false});return;
   }
   // A missed projectile must not hold chess hostage; it is recorded as a miss.
   if(state.time>5.4&&!state.hit){cleanup();resolve({impacts:0,skipped:false});return;}
   requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
 });
}
