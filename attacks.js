import * as THREE from 'three';
import {PALETTES} from './pieces.js';

export const ATTACK_NAMES={
 classic:{p:'strikes',n:'charges',b:'cuts across the board',r:'crushes',q:'sweeps',k:'delivers a royal strike'},
 arcane:{p:'fires a rune dart',n:'pounces through a portal',b:'channels a spell beam',r:'summons a tower slam',q:'casts a vortex',k:'releases a royal shockwave'},
 monsters:{p:'bites',n:'leaps and mauls',b:'casts a shaman curse',r:'body-slams',q:'rakes with claws',k:'roars and strikes'},
 brick:{p:'jabs',n:'jumps onto',b:'fires a brick bolt',r:'topples onto',q:'spins into',k:'smashes'},
 cosmic:{p:'fires a pulse',n:'dives onto',b:'fires a laser',r:'launches a cannon strike',q:'spins up a plasma storm',k:'unleashes an energy wave'}
};
const smooth=t=>t*t*(3-2*t),mix=(a,b,t)=>a+(b-a)*t;

// Render-only combat: chess state changes only after the animation returns.
export function animateCapture({source,victim,x,y,theme,role,fxGroup,reducedMotion,onImpact}){
 if(reducedMotion||!source){onImpact?.();return Promise.resolve()}
 const dest=new THREE.Vector3(x-3.5,.08,y-3.5),origin=source.position.clone(),enemy=victim?.position.clone()||dest.clone(),pieces=[];
 const palette=PALETTES[theme],shade=new THREE.MeshStandardMaterial({color:palette.glow,emissive:palette.glow,emissiveIntensity:1.4,metalness:.1});
 const pale=new THREE.MeshStandardMaterial({color:theme==='brick'?0xffd7a7:0xe5f9ff,emissive:palette.glow,emissiveIntensity:.8});
 const make=(geo,mat=shade)=>{const m=new THREE.Mesh(geo,mat);fxGroup.add(m);pieces.push(m);return m};
 const glyph=make(new THREE.TorusGeometry(.25,.025,6,28));glyph.position.set(origin.x,.85,origin.z);glyph.visible=false;
 const beam=make(new THREE.CylinderGeometry(.035,.035,1,8));beam.visible=false;
 const orb=make(theme==='brick'?new THREE.BoxGeometry(.2,.2,.2):theme==='monsters'?new THREE.ConeGeometry(.16,.42,5):new THREE.OctahedronGeometry(.13));orb.visible=false;
 let fragments=[],struck=false;const duration=role==='q'?950:role==='b'?820:role==='n'?920:790;
 function impact(){if(struck)return;struck=true;onImpact?.();glyph.visible=true;glyph.position.set(dest.x,.72,dest.z);glyph.rotation.x=Math.PI/2;
  const n=theme==='brick'?19:theme==='cosmic'?14:theme==='arcane'?13:theme==='monsters'?10:9;
  for(let i=0;i<n;i++){const size=.05+Math.random()*.075,m=make(theme==='brick'?new THREE.BoxGeometry(size*2,size*2,size*2):theme==='arcane'?new THREE.TetrahedronGeometry(size):theme==='cosmic'?new THREE.OctahedronGeometry(size):new THREE.SphereGeometry(size,6,5),i%3===0?pale:shade);m.position.copy(dest).add(new THREE.Vector3(0,.65,0));fragments.push({mesh:m,velocity:new THREE.Vector3((Math.random()-.5)*.115,Math.random()*.11+.03,(Math.random()-.5)*.115)})}
 }
 return new Promise(resolve=>{let start=null;const direction=dest.clone().sub(origin),distance=direction.length();
  function frame(now){if(start===null)start=now;const t=Math.min(1,(now-start)/duration),wind=smooth(Math.min(t/.62,1)),fall=Math.max(0,(t-.57)/.43);
   source.position.copy(origin);source.rotation.y=source.userData.side==='w'?0:Math.PI;source.rotation.z=0;source.scale.setScalar(1);
   // Six genuinely different movement signatures, independent of visual theme.
   if(role==='p'){source.position.addScaledVector(direction,wind*.83);source.position.y+=Math.sin(wind*Math.PI)*.11;source.rotation.z=Math.sin(wind*Math.PI)*-.17}
   if(role==='n'){source.position.addScaledVector(direction,wind);source.position.y+=Math.sin(wind*Math.PI)*1.08;source.rotation.x=-Math.sin(wind*Math.PI)*.40}
   if(role==='b'){source.position.addScaledVector(direction,wind*.15);source.position.y+=Math.sin(wind*Math.PI)*.21;glyph.visible=true;glyph.position.copy(origin).add(new THREE.Vector3(0,.87,0));glyph.rotation.y+=.11;glyph.rotation.x=Math.PI/2;beam.visible=t>.18&&t<.64}
   if(role==='r'){source.position.addScaledVector(direction,wind*.88);source.position.y+=Math.sin(wind*Math.PI)*.29;source.scale.setScalar(1+Math.sin(wind*Math.PI)*.18)}
   if(role==='q'){source.position.addScaledVector(direction,wind*.66);source.position.x+=Math.sin(wind*Math.PI*2)*.27;source.position.y+=Math.sin(wind*Math.PI)*.50;source.rotation.y+=wind*Math.PI*2;glyph.visible=true;glyph.position.copy(dest).add(new THREE.Vector3(0,.76,0));glyph.rotation.x=Math.PI/2;glyph.rotation.z+=.14}
   if(role==='k'){source.position.addScaledVector(direction,wind*.58);source.position.y+=Math.sin(wind*Math.PI)*.31;glyph.visible=t>.23;glyph.position.copy(dest).add(new THREE.Vector3(0,.65,0));glyph.rotation.x=Math.PI/2;glyph.scale.setScalar(.2+Math.max(0,t-.3)*2)}
   if(t>.12&&t<.63&&(role==='b'||theme==='cosmic'||theme==='arcane')){orb.visible=true;orb.position.copy(origin).lerp(dest,smooth(Math.max(0,(t-.12)/.51))).add(new THREE.Vector3(0,.8+Math.sin(t*Math.PI)*.2,0));orb.rotation.x+=.14}
   if(beam.visible){const point=new THREE.Vector3().copy(origin).lerp(dest,.4).add(new THREE.Vector3(0,.87,0)),end=dest.clone().add(new THREE.Vector3(0,.75,0));beam.position.copy(point).lerp(end,.5);const delta=end.sub(point);beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());beam.scale.y=delta.length()}
   if(t>=.62)impact();
   if(victim&&struck){victim.position.copy(enemy);victim.position.y-=fall*.35;victim.rotation.z=fall*.5;victim.scale.setScalar(Math.max(.025,1-fall*.92))}
   if(struck){glyph.scale.setScalar(1+fall*(role==='k'?2.7:1.2));glyph.material.transparent=true;glyph.material.opacity=1-fall;for(const f of fragments){f.mesh.position.add(f.velocity);f.velocity.y-=theme==='brick'?.008:.004;f.mesh.rotation.x+=.14;f.mesh.scale.multiplyScalar(.97)}}
   if(t<1)requestAnimationFrame(frame);else{source.position.copy(origin);source.scale.setScalar(1);source.rotation.set(0,source.userData.side==='w'?0:Math.PI,0);if(victim){victim.position.copy(enemy);victim.scale.setScalar(1);victim.rotation.z=0}for(const m of pieces){fxGroup.remove(m);m.geometry.dispose()}shade.dispose();pale.dispose();resolve()}
  }requestAnimationFrame(frame)
 });
}
