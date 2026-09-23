import {getAttack} from './attacks.js';
import {sweptSphereHit,hitAgainstVolumes,impulseFromStrike} from './collision.js';

const centerOf=volumes=>{
 const torso=(volumes||[]).find(v=>v.name==='torso')||(volumes||[])[0];
 return torso?.center||{x:0,y:1,z:0};
};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const norm=(a,b)=>{
 const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,l=Math.hypot(dx,dy,dz)||1;
 return {x:dx/l,y:dy/l,z:dz/l};
};

export class AttackExecutorV8{
 constructor(attackId){
  this.attack=getAttack(attackId);this.fired=false;this.resolved=false;this.projectile=null;this.areaRadius=0;this.previousTip=null;
 }
 reset(){this.fired=false;this.resolved=false;this.projectile=null;this.areaRadius=0;this.previousTip=null;}
 resolve(hit,previous,current,mass=1){
  if(this.resolved)return null;this.resolved=true;
  const style=this.attack.style||{};
  const multiplier=style.heavy?2.2:style.multiHit?1.35:1.25;
  return {attack:this.attack,hit,impulse:impulseFromStrike({previous,current,mass,multiplier,lift:style.leap?.18:.10})};
 }
 update({dt,state,attackerPosition,weaponTip,defenderVolumes,mass=1}){
  if(this.resolved)return null;
  const kind=this.attack.kind,style=this.attack.style||{},target=centerOf(defenderVolumes);

  if(kind==='melee'){
   if((state==='commit'||state==='follow-through')&&this.previousTip){
    const hit=hitAgainstVolumes(this.previousTip,weaponTip,defenderVolumes,this.attack.contact.radius||.14);
    if(hit)return this.resolve(hit,this.previousTip,weaponTip,mass);
   }
   this.previousTip={...weaponTip};return null;
  }

  if(kind==='body'||kind==='teleport-melee'){
   if(state==='commit'){
    const radius=this.attack.contact.radius||.35;
    const previous=this.previousTip||attackerPosition;
    const current=kind==='teleport-melee'?{x:target.x-.08,y:target.y,z:target.z}:attackerPosition;
    const hit=sweptSphereHit(previous,current,target,radius+(defenderVolumes?.[0]?.radius||.25));
    this.previousTip={...current};
    if(hit)return this.resolve({volume:{name:'torso',center:target,radius}},previous,current,mass);
   }
   this.previousTip={...attackerPosition};return null;
  }

  if(kind==='projectile'){
   if(!this.fired&&state==='commit'){
    this.fired=true;const direction=norm(weaponTip,target),speed=style.projectileSpeed||6;
    this.projectile={x:weaponTip.x,y:weaponTip.y,z:weaponTip.z,previous:{...weaponTip},vx:direction.x*speed,vy:direction.y*speed,vz:direction.z*speed};
   }
   if(this.projectile){
    const p=this.projectile;p.previous={x:p.x,y:p.y,z:p.z};p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;
    const hit=hitAgainstVolumes(p.previous,p,defenderVolumes,this.attack.contact.radius||.18);
    if(hit)return this.resolve(hit,p.previous,p,mass);
    if(dist(p,target)>12)this.projectile=null;
   }
   return null;
  }

  if(kind==='beam'){
   if(state==='commit'){
    const hit=hitAgainstVolumes(weaponTip,target,defenderVolumes,this.attack.contact.radius||.18);
    if(hit)return this.resolve(hit,weaponTip,target,mass);
   }
   return null;
  }

  if(kind==='area'){
   if(state==='commit'||state==='follow-through'){
    this.areaRadius+=dt*(style.gravity?5.2:4.4);
    const flat=Math.hypot(target.x-attackerPosition.x,target.z-attackerPosition.z);
    const hitRadius=this.attack.contact.radius||.6;
    if(Math.abs(this.areaRadius-flat)<=hitRadius)return this.resolve({volume:{name:'torso',center:target,radius:hitRadius}},attackerPosition,target,mass);
   }
   return null;
  }
  return null;
 }
}
