import * as THREE from 'three';
import {PALETTES} from './pieces.js';
import {poseCharacter} from './characters.js';

const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const ease=t=>{t=clamp(t);return t*t*(3-2*t)};
const ROLE_NAMES={p:'Scout',n:'Rider',b:'Mystic',r:'Guardian',q:'Champion',k:'Sovereign'};
const MOVES={p:'lunges',n:'leaps',b:'casts',r:'charges',q:'unleashes a finishing strike',k:'delivers a royal blow'};

// Both fighters act in a single three-dimensional encounter. Rules are applied by the caller afterwards.
export function animateDuel({source,victim,x,y,theme,role,fxGroup,reducedMotion,onImpact,camera,orbit}){
 if(!source||reducedMotion){onImpact?.();return Promise.resolve();}
 const start=source.position.clone(),end=new THREE.Vector3(x-3.5,.08,y-3.5),victimAt=victim?.position.clone()||end.clone();
 const savedCamera=camera?.position.clone(),savedTarget=orbit?.target.clone();
 const focus=end.clone().add(victimAt).multiplyScalar(.5).add(new THREE.Vector3(0,.8,0));
 const camGoal=focus.clone().add(new THREE.Vector3(2.8,3.7,4.1));
 const palette=PALETTES[theme],fx=[],materials=[];
 const glow=new THREE.MeshStandardMaterial({color:palette.glow,emissive:palette.glow,emissiveIntensity:1.7,transparent:true,opacity:1,depthWrite:false});
 const contrast=new THREE.MeshStandardMaterial({color:theme==='monsters'?0xff5f75:theme==='brick'?0xffd69b:0xe7faff,emissive:palette.glow,emissiveIntensity:.55,transparent:true,opacity:1,depthWrite:false});
 materials.push(glow,contrast);
 const add=(geo,mat=glow)=>{const mesh=new THREE.Mesh(geo,mat);fxGroup.add(mesh);fx.push(mesh);return mesh};
 const glyph=add(new THREE.TorusGeometry(.31,.027,6,28));glyph.visible=false;
 const orb=add(theme==='brick'?new THREE.BoxGeometry(.20,.20,.20):new THREE.OctahedronGeometry(.14));orb.visible=false;
 const beam=add(new THREE.CylinderGeometry(.038,.038,1,7),contrast);beam.visible=false;
 const slash=add(new THREE.TorusGeometry(.40,.036,5,22,Math.PI*.78),contrast);slash.visible=false;
 const shards=[];let struck=false,finished=false,skip=false,impactCount=0;
 const distance=start.distanceTo(end),range=role==='b'?.19:role==='q'?.77:role==='k'?.81:.88;
 const advance=role==='b'?range:distance>2.1?Math.max(.82,1-1.0/distance):range;
 const ui=document.createElement('div');ui.className='duel-ui';ui.setAttribute('role','status');
 ui.style.cssText='position:absolute;z-index:4;left:50%;top:8px;transform:translateX(-50%);max-width:calc(100% - 16px);width:max-content;display:flex;align-items:center;gap:9px;border:1px solid #8deeff;background:#071827ee;color:#f2fcff;border-radius:12px;padding:6px 9px;box-shadow:0 10px 35px #0009;font:600 12px system-ui';
 const text=document.createElement('span');text.textContent=`${ROLE_NAMES[role]} ${MOVES[role]} · ${theme==='brick'?'Brick Battle':theme==='cosmic'?'Cosmic War':theme==='arcane'?'Arcane':theme==='monsters'?'Monsters':'Classic'}`;
 const button=document.createElement('button');button.type='button';button.textContent='Skip battle';button.setAttribute('aria-label','Skip capture animation');button.style.cssText='white-space:nowrap;min-height:40px;padding:6px 9px;background:#20465f;border:1px solid #80eaff;border-radius:8px;color:white;font:inherit;cursor:pointer';button.onclick=()=>{skip=true};
 ui.append(text,button);document.querySelector('.stage')?.append(ui);
 const duration=role==='q'?2250:role==='n'?2080:role==='b'?2070:1950;
 if(orbit)orbit.enabled=false;
 function hit(){if(struck)return;struck=true;impactCount++;onImpact?.();
  glyph.visible=true;glyph.position.copy(victimAt).add(new THREE.Vector3(0,.82,0));glyph.rotation.x=Math.PI/2;
  slash.visible=theme==='monsters'||theme==='classic';slash.position.copy(victimAt).add(new THREE.Vector3(0,1.05,.12));
  for(let i=0;i<(theme==='brick'?22:13);i++){
   const size=.045+Math.random()*.08;
   const geo=theme==='brick'?new THREE.BoxGeometry(size*1.8,size*1.8,size*1.8):theme==='cosmic'?new THREE.OctahedronGeometry(size):theme==='arcane'?new THREE.TetrahedronGeometry(size):new THREE.SphereGeometry(size,5,4);
   const part=add(geo,i%3?glow:contrast);part.position.copy(victimAt).add(new THREE.Vector3(0,.77,0));
   shards.push({part,velocity:new THREE.Vector3((Math.random()-.5)*.13,.06+Math.random()*.12,(Math.random()-.5)*.13)});
  }
 }
 function restore(){if(finished)return;finished=true;
  if(!struck)hit();
  source.position.copy(start);source.scale.setScalar(1);source.rotation.set(0,source.userData.side==='w'?0:Math.PI,0);
  if(victim){victim.position.copy(victimAt);victim.rotation.set(0,victim.userData.side==='w'?0:Math.PI,0);victim.scale.setScalar(1)}
  poseCharacter(source);poseCharacter(victim);
  if(camera&&savedCamera)camera.position.copy(savedCamera);
  if(orbit){if(savedTarget)orbit.target.copy(savedTarget);orbit.enabled=true;orbit.update()}
  for(const mesh of fx){fxGroup.remove(mesh);mesh.geometry.dispose()}
  for(const mat of materials)mat.dispose();ui.remove();
 }
 return new Promise(resolve=>{
  let startTime=null;
  const frame=now=>{
   if(startTime===null)startTime=now;
   const t=skip?1:clamp((now-startTime)/duration),charge=ease((t-.16)/.40),reaction=ease((t-.53)/.27),back=ease((t-.76)/.24),wind=ease(t/.20);
   source.position.copy(start).lerp(end,charge*advance);
   source.position.y+=role==='n'?Math.sin(charge*Math.PI)*1.02:role==='q'?Math.sin(charge*Math.PI)*.37:role==='r'?Math.sin(charge*Math.PI)*.14:Math.sin(charge*Math.PI)*.19;
   source.rotation.y=(source.userData.side==='w'?0:Math.PI)+(role==='q'?charge*Math.PI*.64:0);
   source.rotation.z=(role==='r'?-.15:role==='p'?-.13:0)*Math.sin(charge*Math.PI);
   poseCharacter(source,{lean:-.23*wind+.59*charge-.35*back,head:-.09*wind,guard:-.62*wind+.85*reaction,left:.25*wind,swing:-1.45*wind+2.18*charge-.73*reaction,step:Math.sin(charge*Math.PI*3)*.43,weapon:role==='n'?-.5*charge:0});
   if(victim){
    victim.position.copy(victimAt);victim.position.y+=Math.sin(wind*Math.PI)*.045-reaction*.23;
    victim.position.addScaledVector(new THREE.Vector3(end.x-start.x,0,end.z-start.z).normalize(),reaction*.12);
    victim.rotation.z=reaction*.42;
    victim.scale.setScalar(Math.max(.08,1-ease((t-.70)/.22)*.92));
    poseCharacter(victim,{lean:.24*wind+.58*reaction,head:-.26*reaction,guard:-1.0*wind+1.4*reaction,left:-.28*wind,right:.4*reaction,step:reaction*.48});
   }
   // A staged camera starts wide, moves to the clash, then returns to the exact previous view.
   if(camera&&orbit&&savedCamera&&savedTarget){
    const push=ease(t/.33)*(1-ease((t-.72)/.28));
    camera.position.copy(savedCamera).lerp(camGoal,push);
    orbit.target.copy(savedTarget).lerp(focus,push);
    camera.lookAt(orbit.target);
   }
   const magic=role==='b'||theme==='arcane'||theme==='cosmic';
   orb.visible=magic&&t>.18&&t<.60;
   if(orb.visible){orb.position.copy(start).lerp(victimAt,ease((t-.18)/.42)).add(new THREE.Vector3(0,.95+Math.sin(t*Math.PI)*.22,0));orb.rotation.x+=.17;orb.rotation.z+=.11;}
   beam.visible=(role==='b'||theme==='cosmic')&&t>.31&&t<.57;
   if(beam.visible){const a=source.position.clone().add(new THREE.Vector3(0,1,.2)),b=victimAt.clone().add(new THREE.Vector3(0,.95,0)),v=b.clone().sub(a);beam.position.copy(a).addScaledVector(v,.5);beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.clone().normalize());beam.scale.y=v.length();}
   if(t>=.56)hit();
   if(struck){glyph.scale.setScalar(1+reaction*1.8);glow.opacity=Math.max(.04,1-reaction*.85);contrast.opacity=Math.max(.04,1-reaction*.8);slash.rotation.z+=.15;
    for(const f of shards){f.part.position.addScaledVector(f.velocity,skip?4:1);f.velocity.y-=theme==='brick'?.009:.006;f.part.rotation.x+=.15;f.part.scale.multiplyScalar(.98)}
   }
   if(t<1)requestAnimationFrame(frame);else{restore();resolve({impacts:impactCount,skipped:skip})}
  };
  requestAnimationFrame(frame);
 });
}
