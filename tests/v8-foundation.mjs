import assert from 'node:assert/strict';
import {allCharacterDefinitions,CHARACTER_SETS,ROLE_ORDER} from '../combat-v8/character-definitions.js';
import {allAttacks,getAttack} from '../combat-v8/attacks.js';
import {CombatAnimationRuntime,STATES} from '../combat-v8/animation-runtime.js';
import {impactResponse} from '../combat-v8/reactions.js';
import {sweptSphereHit,impulseFromStrike} from '../combat-v8/collision.js';

const defs=allCharacterDefinitions();
assert.equal(defs.length,30,'five sets x six roles');
assert.equal(new Set(defs.map(d=>d.id)).size,30,'30 unique character ids');
assert.equal(new Set(defs.map(d=>d.name)).size,30,'30 unique character names');
assert.equal(new Set(defs.map(d=>d.attack)).size,30,'30 unique signature attack ids');
assert.equal(allAttacks().length,30,'30 attack definitions');
for(const d of defs){
 assert.ok(getAttack(d.attack)?.id===d.attack,`attack exists for ${d.id}`);
 assert.ok(d.rig&&d.silhouette&&d.weapon&&d.defeat,`complete character data for ${d.id}`);
}
for(const [theme,set] of Object.entries(CHARACTER_SETS)){
 assert.deepEqual(ROLE_ORDER.filter(r=>!!set[r]),ROLE_ORDER,`${theme} defines six chess roles`);
 assert.equal(new Set(ROLE_ORDER.map(r=>set[r].silhouette)).size,6,`${theme} has six distinct silhouettes`);
}
const runtime=new CombatAnimationRuntime(defs[0]);
let visited=new Set([runtime.state]);
for(let i=0;i<600&&!runtime.complete;i++){runtime.update(1/60);visited.add(runtime.state);}
for(const s of ['engage','approach','anticipate','commit','follow-through','recover','complete'])assert.ok(visited.has(s),`runtime visits ${s}`);
const hit=sweptSphereHit({x:-1,y:0,z:0},{x:1,y:0,z:0},{x:0,y:0,z:0},.2);assert.equal(hit,true,'swept collision catches fast strike');
const impulse=impulseFromStrike({previous:{x:0,y:0,z:0},current:{x:1,y:0,z:0},mass:2,multiplier:1.5});
const light=impactResponse({role:'p',theme:'classic',mass:.8,impulse}),heavy=impactResponse({role:'r',theme:'classic',mass:2.5,impulse});
assert.ok(light.severity>heavy.severity,'light defender reacts more strongly than heavy defender');
assert.ok(STATES.includes('contact')&&STATES.includes('recover'));
console.log('PASS v8 foundation: 30 characters, 30 attacks, state machine, collision and reaction model');
