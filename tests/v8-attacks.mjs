import assert from 'node:assert/strict';
import {allAttacks} from '../combat-v8/attacks.js';
import {AttackExecutorV8} from '../combat-v8/attack-executor.js';

const target=[{name:'torso',center:{x:1,y:1,z:0},radius:.30}];

function resolveAttack(attack){
 const ex=new AttackExecutorV8(attack.id);
 let event=null;
 ex.update({dt:1/60,state:'approach',attackerPosition:{x:0,y:1,z:0},weaponTip:{x:0,y:1,z:0},defenderVolumes:target,mass:1.2});
 if(attack.kind==='melee'){
  event=ex.update({dt:1/60,state:'commit',attackerPosition:{x:.4,y:1,z:0},weaponTip:{x:1.05,y:1,z:0},defenderVolumes:target,mass:1.2});
 }else if(attack.kind==='body'||attack.kind==='teleport-melee'){
  event=ex.update({dt:1/60,state:'commit',attackerPosition:{x:.88,y:1,z:0},weaponTip:{x:.8,y:1,z:0},defenderVolumes:target,mass:1.2});
 }else{
  for(let i=0;i<240&&!event;i++){
   event=ex.update({dt:1/60,state:i<150?'commit':'follow-through',attackerPosition:{x:0,y:1,z:0},weaponTip:{x:0,y:1,z:0},defenderVolumes:target,mass:1.2});
  }
 }
 return event;
}

const attacks=allAttacks();
assert.equal(attacks.length,30);
for(const attack of attacks){
 const event=resolveAttack(attack);
 assert.ok(event,`${attack.id} resolves a physical contact event`);
 assert.ok(Number.isFinite(event.impulse.x)&&Number.isFinite(event.impulse.y)&&Number.isFinite(event.impulse.z),`${attack.id} returns finite impulse`);
}
for(const kind of ['melee','body','projectile','beam','area','teleport-melee']){
 assert.ok(attacks.some(a=>a.kind===kind),`v8 includes ${kind} executor path`);
}
console.log('PASS v8 attacks: all 30 signature attacks resolve through attack-kind mechanics');
