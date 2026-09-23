import * as THREE from 'three';
import {getCharacterDefinition} from './character-definitions.js';
import {CombatAnimationRuntime} from './animation-runtime.js';
import {createV8Character} from './character-factory.js';
import {poseRig,weaponWorldPoint,hitVolumes} from './rig-types.js';
import {impactResponse} from './reactions.js';
import {body,applyImpulse,integrate,driveToward} from './physics.js';
import {AttackExecutorV8} from './attack-executor.js';
import {choreographyPose} from './choreography.js';
import {defeatPose} from './defeat-choreography.js';
import {CombatEffectsV8} from './effects.js';

const roleMass=role=>({p:.85,n:1.08,b:.96,r:2.45,q:1.20,k:1.58})[role]||1;

export class CombatDirectorV8{
 constructor({attacker,defender,theme='classic',onContact=()=>{}}){
  this.theme=theme;this.onContact=onContact;
  this.attackerDef=getCharacterDefinition(theme,attacker.t);
  this.defenderDef=getCharacterDefinition(theme,defender.t);
  this.attacker=createV8Character(attacker,theme);
  this.defender=createV8Character(defender,theme);
  this.runtime=new CombatAnimationRuntime(this.attackerDef);
  this.executor=new AttackExecutorV8(this.attackerDef.attack);
  this.effects=new CombatEffectsV8(theme,this.attackerDef.attack);this.effectsGroup=this.effects.group;
  this.aBody=body({x:-1.35,mass:this.attackerDef.mass||roleMass(attacker.t),drag:4.8});
  this.dBody=body({x:1.35,mass:this.defenderDef.mass||roleMass(defender.t),drag:3.5});
  this.contact=null;this.elapsed=0;
 }
 update(dt){
  this.elapsed+=dt;
  const pose=this.runtime.update(dt),style=this.runtime.attack.style||{},kind=this.runtime.attack.kind;
  const ranged=kind==='projectile'||kind==='beam'||kind==='area';
  if(pose.state==='approach')driveToward(this.aBody,ranged?-0.35:.60,ranged?.75:1.8+(style.drive||0)*1.2,ranged?4.2:8,dt);
  if(pose.blink&&pose.state==='commit')this.aBody.x=Math.max(this.aBody.x,this.dBody.x-.72);
  integrate(this.aBody,dt);integrate(this.dBody,dt);
  this.attacker.position.set(this.aBody.x,this.aBody.y+pose.lift,this.aBody.z);
  this.defender.position.set(this.dBody.x,this.dBody.y,this.dBody.z);
  const signature=choreographyPose(this.attackerDef.attack,pose);
  poseRig(this.attacker,{
   gait:Math.sin(this.elapsed*(this.attackerDef.locomotion==='ponderous'?5.2:this.attackerDef.locomotion==='skittering'?12.5:9))*Math.min(1,Math.abs(this.aBody.vx)),
   windup:pose.windup,attack:pose.attack,follow:pose.follow,recover:pose.recover,crouch:pose.crouch+(signature.crouch||0),spin:pose.spin,
   lean:pose.rootDrive*.12+(signature.lean||0),brace:.3,weaponArc:style.weaponArc,...signature,
   wingBeat:this.attackerDef.wings?Math.sin(this.elapsed*9)*.34:0,orbitAngle:this.elapsed*2.4
  });
  const defeated=defeatPose(this.defenderDef,this.contact?.reaction,this.contact?this.elapsed-this.contact.time:0);
  poseRig(this.defender,{brace:this.contact?.reaction?.fall?.15:.55,...defeated});
  const tip=new THREE.Vector3();weaponWorldPoint(this.attacker,tip);
  if(!this.contact){
   const event=this.executor.update({
    dt,state:pose.state,
    attackerPosition:{x:this.attacker.position.x,y:this.attacker.position.y+1,z:this.attacker.position.z},
    weaponTip:{x:tip.x,y:tip.y,z:tip.z},
    defenderVolumes:hitVolumes(this.defender),
    mass:this.aBody.mass
   });
   if(event){
    const reaction=impactResponse({role:this.defenderDef.role,theme:this.theme,mass:this.dBody.mass,impulse:event.impulse});
    applyImpulse(this.dBody,reaction.velocity);
    this.contact={...event,reaction,time:this.elapsed};
    this.onContact(this.contact);
   }
  }
  this.effects.update({
   pose,executor:this.executor,
   attackerPosition:{x:this.attacker.position.x,y:this.attacker.position.y,z:this.attacker.position.z},
   weaponTip:{x:tip.x,y:tip.y,z:tip.z},
   defenderPosition:{x:this.defender.position.x,y:this.defender.position.y+1,z:this.defender.position.z},
   contact:this.contact,elapsed:this.elapsed
  });
  return {pose,contact:this.contact,complete:this.runtime.complete,attacker:this.attacker,defender:this.defender,attack:this.runtime.attack,effects:this.effectsGroup};
 }
 dispose(){this.effects?.dispose();}
}
 }
}
