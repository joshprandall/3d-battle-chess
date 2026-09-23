import * as THREE from 'three';
import {getCharacterDefinition} from './character-definitions.js';
import {CombatAnimationRuntime} from './animation-runtime.js';
import {createV8Character} from './character-factory.js';
import {poseRig,weaponWorldPoint,hitVolumes} from './rig-types.js';
import {hitAgainstVolumes,impulseFromStrike} from './collision.js';
import {impactResponse} from './reactions.js';
import {body,applyImpulse,integrate,driveToward} from './physics.js';

const roleMass=role=>({p:.85,n:1.08,b:.96,r:2.45,q:1.20,k:1.58})[role]||1;

export class CombatDirectorV8{
 constructor({attacker,defender,theme='classic',onContact=()=>{}}){
  this.theme=theme;this.onContact=onContact;
  this.attackerDef=getCharacterDefinition(theme,attacker.t);
  this.defenderDef=getCharacterDefinition(theme,defender.t);
  this.attacker=createV8Character(attacker,theme);
  this.defender=createV8Character(defender,theme);
  this.runtime=new CombatAnimationRuntime(this.attackerDef);
  this.aBody=body({x:-1.35,mass:this.attackerDef.mass||roleMass(attacker.t),drag:4.8});
  this.dBody=body({x:1.35,mass:this.defenderDef.mass||roleMass(defender.t),drag:3.5});
  this.previousTip=null;this.contact=null;this.elapsed=0;
 }
 update(dt){
  this.elapsed+=dt;
  const pose=this.runtime.update(dt),style=this.runtime.attack.style||{};
  if(pose.state==='approach')driveToward(this.aBody,.60,1.8+(style.drive||0)*1.2,8,dt);
  if(pose.blink&&pose.state==='commit')this.aBody.x=Math.max(this.aBody.x,this.dBody.x-.72);
  if(pose.lift>0&&!this.aBody.grounded)this.aBody.y+=pose.lift*dt;
  integrate(this.aBody,dt);integrate(this.dBody,dt);
  this.attacker.position.set(this.aBody.x,this.aBody.y,this.aBody.z);
  this.defender.position.set(this.dBody.x,this.dBody.y,this.dBody.z);
  poseRig(this.attacker,{gait:Math.sin(this.elapsed*9)*Math.min(1,Math.abs(this.aBody.vx)),windup:pose.windup,attack:pose.attack,follow:pose.follow,recover:pose.recover,crouch:pose.crouch,spin:pose.spin,lean:pose.rootDrive*.12,brace:.3,weaponArc:style.weaponArc});
  poseRig(this.defender,{brace:.55,lean:this.contact?.reaction?.stagger*.28||0,crouch:this.contact?.reaction?.fall?.22:0});
  const tip=new THREE.Vector3();weaponWorldPoint(this.attacker,tip);
  if(!this.contact&&this.previousTip&&(pose.state==='commit'||pose.state==='follow-through')){
   const hit=hitAgainstVolumes(this.previousTip,tip,hitVolumes(this.defender),this.runtime.attack.contact.radius||.15);
   if(hit){
    const impulse=impulseFromStrike({previous:this.previousTip,current:tip,mass:this.aBody.mass,multiplier:style.heavy?2.1:1.2,lift:style.leap?.18:.10});
    const reaction=impactResponse({role:this.defenderDef.role,theme:this.theme,mass:this.dBody.mass,impulse});
    applyImpulse(this.dBody,reaction.velocity);
    this.contact={hit,impulse,reaction,time:this.elapsed};
    this.onContact(this.contact);
   }
  }
  this.previousTip={x:tip.x,y:tip.y,z:tip.z};
  return {pose,contact:this.contact,complete:this.runtime.complete,attacker:this.attacker,defender:this.defender};
 }
}
