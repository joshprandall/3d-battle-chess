import * as THREE from 'three';
import {PALETTES} from '../pieces.js';
import {getAttack} from './attacks.js';

const PROFILE={
 'classic-p-shield-thrust':{trail:'spear',impact:'sparks',scale:.75},
 'classic-n-cavalier-charge':{trail:'lance',impact:'sparks',scale:1.0},
 'classic-b-cleric-sweep':{trail:'arc',impact:'holy-ring',scale:1.0},
 'classic-r-hammer-bash':{trail:'heavy',impact:'dust-ring',scale:1.35},
 'classic-q-feint-riposte':{trail:'thin-arc',impact:'sparks',scale:.9},
 'classic-k-royal-cleave':{trail:'great-arc',impact:'dust-ring',scale:1.25},

 'arcane-p-rune-dart':{projectile:'rune',impact:'rune-burst',scale:.85},
 'arcane-n-blink-strike':{trail:'blink',impact:'rune-burst',portal:true,scale:.9},
 'arcane-b-spell-beam':{beam:'arcane',impact:'ward-shatter',scale:1.0},
 'arcane-r-golem-slam':{trail:'heavy',impact:'stone-burst',scale:1.5},
 'arcane-q-void-vortex':{area:'vortex',impact:'void-burst',scale:1.35},
 'arcane-k-archmage-shockwave':{area:'runes',impact:'rune-burst',scale:1.6},

 'monsters-p-goblin-rush':{trail:'claw',impact:'slash',scale:.75},
 'monsters-n-dire-pounce':{trail:'claw',impact:'slash',scale:1.2},
 'monsters-b-shaman-curse':{projectile:'curse',impact:'curse-smoke',scale:1.0},
 'monsters-r-ogre-body-slam':{trail:'body',impact:'dust-ring',scale:1.55},
 'monsters-q-demon-rake':{trail:'triple-claw',impact:'slash',scale:1.2},
 'monsters-k-tyrant-gore':{trail:'horn',impact:'dust-ring',scale:1.4},

 'brick-p-block-jab':{trail:'block-line',impact:'bricks',scale:.8},
 'brick-n-spring-vault':{trail:'spring',impact:'bricks',scale:1.0},
 'brick-b-gear-bolt':{projectile:'gear',impact:'bricks',scale:1.0},
 'brick-r-block-topple':{trail:'body',impact:'bricks',scale:1.5},
 'brick-q-spinner-combo':{trail:'spin-ring',impact:'bricks',scale:1.25},
 'brick-k-builder-hammer':{trail:'heavy',impact:'bricks',scale:1.4},

 'cosmic-p-pulse-shot':{projectile:'pulse',impact:'plasma',scale:.85},
 'cosmic-n-jet-lance':{trail:'ion-lance',impact:'plasma',jets:true,scale:1.0},
 'cosmic-b-psionic-lance':{beam:'psionic',impact:'plasma',scale:1.0},
 'cosmic-r-siege-cannon':{projectile:'cannon',impact:'plasma-heavy',recoil:true,scale:1.45},
 'cosmic-q-plasma-orbit':{projectile:'plasma-orbs',impact:'plasma',orbit:true,scale:1.2},
 'cosmic-k-gravity-wave':{area:'gravity',impact:'gravity',scale:1.7}
};

const mat=(color,opacity=1)=>new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity===1,blending:THREE.AdditiveBlending});
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const setLine=(mesh,a,b,thickness=.025)=>{
 const av=new THREE.Vector3(a.x,a.y,a.z),bv=new THREE.Vector3(b.x,b.y,b.z),delta=bv.clone().sub(av),len=delta.length();
 mesh.position.copy(av).add(bv).multiplyScalar(.5);mesh.scale.set(1,len,1);
 mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());mesh.userData.length=len;mesh.visible=len>.01;mesh.material.opacity=Math.min(.9,.3+len*1.2);
};
function piecesForImpact(group,profile,palette){
 const count=profile.impact==='bricks'?18:profile.impact==='stone-burst'?13:12,out=[];
 for(let i=0;i<count;i++){
  const geo=profile.impact==='bricks'?new THREE.BoxGeometry(.10,.10,.10):profile.impact==='stone-burst'?new THREE.DodecahedronGeometry(.07,0):new THREE.OctahedronGeometry(.055);
  const m=new THREE.Mesh(geo,mat(i%3?palette.glow:0xf8f2de,.9));m.visible=false;group.add(m);
  out.push({mesh:m,angle:i*2.39996,speed:.7+(i%5)*.13});
 }
 return out;
}

export function effectProfile(attackId){return PROFILE[attackId]||{trail:'arc',impact:'sparks',scale:1};}
export function effectProfileIds(){return Object.keys(PROFILE);}

export class CombatEffectsV8{
 constructor(theme,attackId){
  this.theme=theme;this.attack=getAttack(attackId);this.profile=effectProfile(attackId);this.group=new THREE.Group();this.group.name=`v8-fx-${attackId}`;
  this.palette=PALETTES[theme]||PALETTES.classic;this.previousTip=null;this.impactTime=null;
  this.trail=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1,7),mat(this.palette.glow,.72));this.trail.visible=false;this.group.add(this.trail);
  this.projectile=new THREE.Mesh(this.projectileGeometry(),mat(this.palette.glow,.96));this.projectile.visible=false;this.group.add(this.projectile);
  this.beam=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,1,8),mat(this.palette.glow,.78));this.beam.visible=false;this.group.add(this.beam);
  this.area=new THREE.Mesh(new THREE.TorusGeometry(.34,.035,7,42),mat(this.palette.glow,.72));this.area.rotation.x=Math.PI/2;this.area.visible=false;this.group.add(this.area);
  this.portalA=new THREE.Mesh(new THREE.TorusGeometry(.40,.025,7,40),mat(this.palette.glow,.72));this.portalB=this.portalA.clone();this.portalA.visible=this.portalB.visible=false;this.group.add(this.portalA,this.portalB);
  this.flash=new THREE.Mesh(new THREE.SphereGeometry(.11,10,7),mat(0xfff0c8,.95));this.flash.visible=false;this.group.add(this.flash);
  this.fragments=piecesForImpact(this.group,this.profile,this.palette);
 }
 projectileGeometry(){
  const p=this.profile.projectile;
  if(p==='gear')return new THREE.TorusGeometry(.13,.045,6,12);
  if(p==='cannon')return new THREE.SphereGeometry(.16,10,7);
  if(p==='curse')return new THREE.TetrahedronGeometry(.14);
  if(p==='rune')return new THREE.OctahedronGeometry(.13);
  if(p==='plasma-orbs')return new THREE.SphereGeometry(.11,10,7);
  return new THREE.SphereGeometry(.10,9,6);
 }
 update({pose,executor,attackerPosition,weaponTip,defenderPosition,contact,elapsed}){
  const profile=this.profile,kind=this.attack.kind;
  this.trail.visible=false;this.projectile.visible=false;this.beam.visible=false;this.area.visible=false;this.portalA.visible=this.portalB.visible=false;
  if((kind==='melee'||kind==='body'||kind==='teleport-melee')&&this.previousTip&&(pose.state==='commit'||pose.state==='follow-through')){
   setLine(this.trail,this.previousTip,weaponTip,(profile.trail==='great-arc'||profile.trail==='heavy') ? .055 : (profile.trail==='triple-claw' ? .045 : .027));
   if(profile.trail==='spin-ring'){this.area.visible=true;this.area.position.set(attackerPosition.x,attackerPosition.y+.75,attackerPosition.z);this.area.scale.setScalar(.8+pose.attack*.8);this.area.rotation.z+=.12;}
  }
  if(profile.portal&&pose.state==='commit'){
   this.portalA.visible=this.portalB.visible=true;this.portalA.position.set(attackerPosition.x,.85,attackerPosition.z);this.portalB.position.set(defenderPosition.x,.85,defenderPosition.z);
   this.portalA.rotation.y+=.14;this.portalB.rotation.y-=.14;this.portalA.scale.setScalar(.7+pose.attack*.5);this.portalB.scale.copy(this.portalA.scale);
  }
  if(kind==='projectile'&&executor.projectile){
   this.projectile.visible=true;this.projectile.position.set(executor.projectile.x,executor.projectile.y,executor.projectile.z);
   this.projectile.rotation.x+=.15;this.projectile.rotation.y+=.20;
   if(profile.projectile==='plasma-orbs'){this.projectile.scale.setScalar(1+.22*Math.sin(elapsed*16));}
  }
  if(kind==='beam'&&(pose.state==='commit'||pose.state==='follow-through')){
   this.beam.visible=true;setLine(this.beam,weaponTip,defenderPosition,profile.beam==='psionic' ? .055 : .045);
  }
  if(kind==='area'&&(pose.state==='commit'||pose.state==='follow-through')){
   this.area.visible=true;this.area.position.set(attackerPosition.x,.06,attackerPosition.z);
   const radius=Math.max(.15,executor.areaRadius||pose.attack*.8);this.area.scale.setScalar(radius/.34);this.area.material.opacity=Math.max(.18,.8-pose.follow*.5);
   if(profile.area==='vortex'){this.area.rotation.z+=.20;this.area.rotation.x=Math.PI/2+.15*Math.sin(elapsed*9);}
  }
  if(profile.jets&&(pose.state==='approach'||pose.state==='commit')){
   this.flash.visible=true;this.flash.position.set(attackerPosition.x,attackerPosition.y+.58,attackerPosition.z-.30);this.flash.scale.set(.55,.55,1.5);
  }else if(!contact)this.flash.visible=false;
  if(contact&&this.impactTime===null){
   this.impactTime=elapsed;this.flash.visible=true;const c=contact.hit?.volume?.center||defenderPosition;this.flash.position.set(c.x,c.y,c.z);
   for(let i=0;i<this.fragments.length;i++){const f=this.fragments[i];f.mesh.visible=true;f.mesh.position.copy(this.flash.position);f.mesh.userData.origin=this.flash.position.clone();}
  }
  if(this.impactTime!==null){
   const t=elapsed-this.impactTime;this.flash.visible=t<.16;this.flash.scale.setScalar(1+t*8);
   for(const f of this.fragments){
    if(t>1.25){f.mesh.visible=false;continue}
    f.mesh.visible=true;const r=t*f.speed,origin=f.mesh.userData.origin||new THREE.Vector3();
    f.mesh.position.set(origin.x+Math.cos(f.angle)*r,origin.y+.35+t*(1.1-f.speed*.2)-4.0*t*t,origin.z+Math.sin(f.angle)*r);
    f.mesh.rotation.set(t*7+f.angle,t*5,t*8);f.mesh.scale.setScalar(Math.max(.1,1-t*.65));
   }
  }
  this.previousTip={...weaponTip};
 }
 dispose(){
  const geometries=new Set(),materials=new Set();this.group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});
  for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
 }
}
